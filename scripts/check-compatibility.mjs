import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import assert from "node:assert/strict";

const cache = new Map();
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file).exports;
  const mod = { exports: {} };
  cache.set(file, mod);
  const source = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const require = (id) => load((id.startsWith("@/") ? path.resolve(id.slice(2)) : path.resolve(path.dirname(file), id)) + ".ts");
  new Function("require", "module", "exports", source)(require, mod, mod.exports);
  return mod.exports;
}
const { analyzeBuild } = load("app/lib/compatibility.ts");
const base = { id: "test", name: "Test", goal: "balanced", budget: 0, notes: "", parts: { cpu: ["cpu"], motherboard: ["board"], memory: ["ram"], gpu: ["gpu"], case: ["case"], cooler: ["cooler"], psu: ["psu"] } };
const part = (id, category, specs) => ({ id, category, brand: "Test", name: id, specs, price: 100, tags: [], quality: "boa", qualityNote: "", summary: "" });
const parts = [
  part("cpu", "cpu", { socket: "AM4", maxPower: 90 }),
  part("board", "motherboard", { socket: "AM4", memoryType: "DDR4", formFactor: "mATX" }),
  part("ram", "memory", { memoryType: "DDR4", capacity: 16 }),
  part("gpu", "gpu", { length: 300, tgp: 200 }),
  part("case", "case", { formFactors: ["mATX"], gpuLength: 320, coolerHeight: 160 }),
  part("cooler", "cooler", { height: 155, sockets: ["AM4"], tdpCapacity: 150 }),
  part("psu", "psu", { wattage: 750 }),
];
const check = (result, id) => {
  const found = result.checks.find(c => c.id === id);
  assert.ok(found, "Missing check: " + id);
  return found;
};
let result = analyzeBuild(base, parts);
for (const id of ["socket", "memory-type", "form-factor", "gpu-length", "cooler-height", "cooler-socket", "cooling", "psu-power"]) assert.equal(check(result, id).severity, "ok", id);
const without = (id, key) => parts.map(p => p.id === id ? { ...p, specs: Object.fromEntries(Object.entries(p.specs).filter(([k]) => k !== key)) } : p);
for (const [id, key, checkId] of [["gpu", "length", "gpu-length"], ["case", "gpuLength", "gpu-length"], ["cooler", "height", "cooler-height"], ["case", "coolerHeight", "cooler-height"], ["psu", "wattage", "psu-power"], ["cooler", "tdpCapacity", "cooling"], ["cpu", "socket", "socket"], ["board", "memoryType", "memory-type"], ["case", "formFactors", "form-factor"]]) {
  result = analyzeBuild(base, without(id, key));
  assert.equal(check(result, checkId).severity, "info", id + "." + key);
}
result = analyzeBuild(base, parts.map(p => p.id === "gpu" ? { ...p, specs: { ...p.specs, length: 400 } } : p));
assert.equal(check(result, "gpu-length").severity, "error");
result = analyzeBuild(base, parts.map(p => p.id === "cpu" ? { ...p, specs: { ...p.specs, socket: "AM5" } } : p));
assert.equal(check(result, "socket").severity, "error");
console.log("Compatibility: valid, missing-data, and incompatible-build scenarios passed.");
