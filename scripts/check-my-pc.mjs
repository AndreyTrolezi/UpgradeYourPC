import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import ts from "typescript";

const cache = new Map();
let signedIn = { userId: "alice", email: "alice@example.test", displayName: "Alice" };
let failHistory = false;
const sql = new DatabaseSync(":memory:");
for (const file of fs.readdirSync("drizzle").filter(name => name.endsWith(".sql")).sort()) sql.exec(fs.readFileSync(path.join("drizzle", file), "utf8"));
const db = {
  prepare(query) {
    let values = [];
    return {
      bind(...args) { values = args; return this; },
      async first() { return sql.prepare(query).get(...values) ?? null; },
      async all() { return { results: sql.prepare(query).all(...values) }; },
      execute() {
        if (failHistory && query.includes("INSERT INTO pc_history")) throw Error("snapshot unavailable");
        const result = sql.prepare(query).run(...values);
        return { success: true, meta: { changes: Number(result.changes) } };
      },
    };
  },
  async batch(statements) {
    sql.exec("BEGIN");
    try { const results = statements.map(statement => statement.execute()); sql.exec("COMMIT"); return results; }
    catch (error) { sql.exec("ROLLBACK"); throw error; }
  },
};
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file).exports;
  const mod = { exports: {} }; cache.set(file, mod);
  const source = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const require = id => {
    if (id === "@/app/chatgpt-auth") return { getChatGPTUser: async () => signedIn };
    if (id === "@/db") return { getD1: () => db };
    if (id === "next/server") return { NextResponse: { json: (body, init) => Response.json(body, init) } };
    return load((id.startsWith("@/") ? path.resolve(id.slice(2)) : path.resolve(path.dirname(file), id)) + ".ts");
  };
  new Function("require", "module", "exports", source)(require, mod, mod.exports);
  return mod.exports;
}
const { emptyBuild, makeDefaultProfile, normalizeProfile } = load("app/lib/profile.ts");
const { catalog, defaultCurrentBuild } = load("app/data/catalog.ts");
const { diagnosePc, changePcPart, changedCategories } = load("app/lib/my-pc.ts");
const { writeProfile, readPcHistory } = load("app/lib/pc-history.ts");
const api = load("app/api/profile/route.ts");

assert.deepEqual(makeDefaultProfile("Nova conta").currentBuild.parts, {});
assert.deepEqual(makeDefaultProfile("Nova conta").draftBuild.parts, {});
const existing = { ...makeDefaultProfile("Existente"), currentBuild: structuredClone(defaultCurrentBuild), customParts: [{ id: "personal-piece", name: "Peça pessoal" }] };
assert.deepEqual(normalizeProfile(existing, "Outro nome"), existing);
const original = structuredClone(defaultCurrentBuild);
const simulated = changePcPart(original, "cpu", 0, "i5-13400f");
assert.deepEqual(original, defaultCurrentBuild, "simulation must not mutate current PC");
assert.deepEqual(changedCategories(original, simulated), ["cpu"]);
assert.equal(diagnosePc(simulated, catalog).find(c => c.id === "socket").status, "attention");
assert.equal(diagnosePc(emptyBuild(), catalog).some(c => c.status === "ok"), false, "missing specs cannot pass");
const doubleRam = changePcPart(original, "memory", 1, original.parts.memory[0]);
assert.equal(doubleRam.parts.memory.length, 2, "identical kits must remain separate");
const tripleRam = changePcPart(doubleRam, "memory", 2, original.parts.memory[0]);
assert.equal(diagnosePc(tripleRam, catalog).find(c => c.id === "slots").status, "attention");
const mixedRam = changePcPart(original, "memory", 1, "ddr5-32-6000");
assert.equal(diagnosePc(mixedRam, catalog).find(c => c.id === "ram").status, "attention", "check every kit, not only first");
assert.equal(changePcPart(doubleRam, "memory", 0, null).parts.memory.length, 1);
const complete = diagnosePc(original, catalog);
assert.equal(complete.find(c => c.id === "form").status, "ok", "case form-factor field must match catalog");
assert.equal(complete.find(c => c.id === "gpu-length").status, "ok");
assert.equal(complete.find(c => c.id === "bios").status, "pending");

let profile = makeDefaultProfile("Alice"); profile.currentBuild = original;
const initial = await writeProfile(db, signedIn, profile, null);
assert(initial?.revision);
assert.equal(initial.history.length, 1);
assert.equal((await readPcHistory(db, "bob")).length, 0);
assert.equal(await writeProfile(db, signedIn, profile, null), null, "cannot overwrite profile with new-user state");
profile = { ...profile, currentBuild: simulated };
const saved = await writeProfile(db, signedIn, profile, initial.revision);
assert.equal(saved.history.length, 2);
assert.equal(await writeProfile(db, signedIn, { ...profile, currentBuild: original }, initial.revision), null);
assert.equal((await readPcHistory(db, "alice")).length, 2, "stale save cannot create snapshots");
const draftOnly = await writeProfile(db, signedIn, { ...profile, draftBuild: simulated }, saved.revision);
assert.equal(draftOnly.history.length, 2, "unrelated profile edit cannot add PC snapshot");
const races = await Promise.all([
  writeProfile(db, signedIn, { ...profile, currentBuild: original }, draftOnly.revision),
  writeProfile(db, signedIn, { ...profile, currentBuild: { ...original, name: "Another tab" } }, draftOnly.revision),
]);
assert.equal(races.filter(Boolean).length, 1, "only one concurrent tab may win");
assert.equal((await readPcHistory(db, "alice")).length, 3);
const rowBeforeFailure = sql.prepare("SELECT * FROM user_profiles WHERE user_id = ?").get("alice");
failHistory = true;
await assert.rejects(writeProfile(db, signedIn, profile, rowBeforeFailure.revision));
assert.deepEqual(sql.prepare("SELECT * FROM user_profiles WHERE user_id = ?").get("alice"), rowBeforeFailure, "snapshot failure must roll back profile");
failHistory = false;

// An existing profile without history retains its pre-migration configuration.
const legacy = { userId: "legacy", email: "legacy@example.test", displayName: "Legacy" };
sql.prepare("INSERT INTO user_profiles (user_id,email,display_name,profile_json,created_at,updated_at) VALUES (?,?,?,?,?,?)").run(legacy.userId, legacy.email, legacy.displayName, JSON.stringify(existing), "2026-01-01", "2026-01-02");
const migrated = await writeProfile(db, legacy, { ...existing, currentBuild: simulated }, "");
assert.equal(migrated.history.length, 2);
assert.deepEqual(migrated.history[1].build, existing.currentBuild);
assert.deepEqual((await api.GET()).status, 200);
signedIn = { userId: "bob", email: "bob@example.test", displayName: "Bob" };
const bob = await (await api.GET()).json();
assert.deepEqual(bob.profile.currentBuild.parts, {});
assert.equal(bob.history.length, 0);
const request = body => new Request("https://local.test/api/profile", { method: "PUT", body: JSON.stringify(body) });
assert.equal((await api.PUT(request({ profile: {}, expectedRevision: null }))).status, 400);
assert.equal((await api.PUT(request({ profile, expectedRevision: initial.revision }))).status, 409);
signedIn = null;
assert.equal((await api.GET()).status, 401);
assert.equal((await api.PUT(request({ profile, expectedRevision: null }))).status, 401);
console.log("Meu PC: defaults, legacy data, simulation, compatibility, history, isolation, rollback and concurrent saves passed.");
