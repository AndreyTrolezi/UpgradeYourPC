import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const tests = [
  "scripts/check-smart-builder.mjs",
  "scripts/check-compatibility.mjs",
  "scripts/check-visual-engine.mjs",
  "scripts/check-visual-inspection.mjs",
  "scripts/check-visual-explosion.mjs",
  "scripts/check-assembly-guide.mjs",
  "scripts/check-visual-lab-integration.mjs",
];

let count = 0;
for (const script of tests) {
  console.log("\n=== "+script+" ===");
  const run = spawnSync(process.execPath, [script], {cwd:root,stdio:"inherit"});
  if (run.error) throw run.error;
  if (run.status !== 0) {
    console.error("Validation stopped at "+script+" (exit "+run.status+")");
    process.exit(run.status || 1);
  }
  count++;
}
console.log("\nRoadmap validation passed: "+count+" test suites.");
