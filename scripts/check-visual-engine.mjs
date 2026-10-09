import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const file = path.resolve("app/roadmap-lab/scene-layout.ts");
const code = fs.readFileSync(file, "utf8");
const { outputText, diagnostics } = ts.transpileModule(code, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  reportDiagnostics: true,
});
assert.equal((diagnostics ?? []).filter(d => d.category === ts.DiagnosticCategory.Error).length, 0);
const m = { exports: {} };
new Function("module", "exports", outputText)(m, m.exports);
const { ANCHORS, EXPLODED, SHOWCASE, inBounds, placed } = m.exports;

for (const [name, point] of Object.entries(ANCHORS)) {
  const points = name === "frontFans" ? point : [point];
  for (const p of points) assert.equal(inBounds(p), true, name + " must be in chassis");
}
assert.equal(SHOWCASE.frontX > SHOWCASE.rearX, true);
assert.equal(ANCHORS.cpuSocket[0] < ANCHORS.ramA2[0], true);
assert.equal(ANCHORS.ramA2[0] < ANCHORS.ramB2[0], true);
assert.ok(Math.abs(ANCHORS.cpuSocket[1] - (ANCHORS.motherboard[1] + .18)) < .02);
assert.ok(Math.abs(ANCHORS.cpuSocket[0] - (ANCHORS.motherboard[0] - .28)) < .02);
assert.ok(ANCHORS.pcieX16[1] < ANCHORS.cpuSocket[1]);
assert.ok(ANCHORS.psuBay[1] + .35 < SHOWCASE.shroudY - .03, "PSU must remain below shroud");
assert.ok(ANCHORS.pcieX16[1] - .52 > SHOWCASE.shroudY + .03, "GPU fans must not collide with PSU shroud");
assert.ok(ANCHORS.frontFans.every(p => p[1] - .36 > SHOWCASE.shroudY), "Front fans must clear shroud");
assert.ok(ANCHORS.rearFan[0] < ANCHORS.motherboard[0]);
for (const [key, delta] of Object.entries(EXPLODED)) {
  assert.ok(delta.some(x => x !== 0), key + " must have nonzero exploded displacement");
}
const p = ANCHORS.pcieX16;
assert.deepEqual(placed(p, false, EXPLODED.gpu), p);
assert.notDeepEqual(placed(p, true, EXPLODED.gpu), p);
assert.deepEqual(placed(p, true, EXPLODED.gpu),
  p.map((value, index) => value + EXPLODED.gpu[index]));
console.log("Visual Engine mounts: coordinate, fit-envelope, and exploded-placement checks passed.");
