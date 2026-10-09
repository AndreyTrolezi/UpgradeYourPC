import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const source=fs.readFileSync(path.resolve("app/lib/visual-lab.ts"),"utf8");
const { outputText, diagnostics }=ts.transpileModule(source,{
  compilerOptions:{ module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022 },
  reportDiagnostics:true,
});
assert.equal((diagnostics??[]).filter(d=>d.category===ts.DiagnosticCategory.Error).length,0);
const mod={exports:{}};
new Function("module","exports",outputText)(mod,mod.exports);
const { simulateLabGpu,labBuildLabel }=mod.exports;

const current={
  id:"my-pc",name:"Meu PC",goal:"balanced",budget:0,notes:"não modificar",
  parts:{cpu:["r5-3600"],motherboard:["asus-prime-b550ma"],gpu:["rtx-3050"],memory:["xpg-16-ddr4-3200"],case:["test-chassis"]},
};
const draft={
  ...current,id:"draft",name:"Montagem de teste",
  parts:{...current.parts,cpu:["r7-5700x"],gpu:["rx-9060xt"]},
};
const original=JSON.stringify({current,draft});
assert.equal(labBuildLabel("current"),"Meu PC atual");
assert.equal(labBuildLabel("draft"),"Montagem do Montador");

const upgraded=simulateLabGpu(current,"rtx-5070");
assert.equal(upgraded.parts.gpu[0],"rtx-5070");
assert.deepEqual(upgraded.parts.cpu,current.parts.cpu);
assert.deepEqual(upgraded.parts.motherboard,current.parts.motherboard);
assert.deepEqual(upgraded.parts.memory,current.parts.memory);
assert.notStrictEqual(upgraded.parts,current.parts,"Parts map must not be reused");
assert.equal(upgraded.name,current.name);
const noGpu=simulateLabGpu(current,null);
assert.deepEqual(noGpu.parts.gpu,[],"Removing GPU in lab should only change scenario");
const custom=simulateLabGpu(draft,"custom-gpu-1");
assert.deepEqual(custom.parts.gpu,["custom-gpu-1"],"Custom GPU IDs remain supported");
assert.equal(custom.parts.cpu[0],"r7-5700x");
assert.equal(JSON.stringify({current,draft}),original,"Lab simulations must never mutate stored profiles");

const application=fs.readFileSync(path.resolve("app/lab-app.tsx"),"utf8");
const routes=fs.readFileSync(path.resolve("app/meu-pc/page.tsx"),"utf8");
const laboratory=fs.readFileSync(path.resolve("app/roadmap-lab/workbench.tsx"),"utf8");
assert.ok(application.includes('id: "visual-lab"'),"Visual lab must appear in signed-in nav");
assert.ok(application.includes('view === "visual-lab"'),"Visual lab should be mounted in LabApp");
assert.ok(application.includes('sourceBuild={visualLabBuildSource==="current"?profile.currentBuild:profile.draftBuild}'),"Lab must use live profile builds");
assert.ok(application.includes('availableParts={allParts}'),"Custom profile parts must be supplied");
assert.ok(application.includes('const RoadmapLab = lazy('),"Standalone 3D lab must be lazy-loaded");
assert.ok(routes.includes('"visual-lab"'),"Deep link must support visual-lab view");
assert.ok(laboratory.includes('simulateLabGpu(sourceBuild, selectedGpu || null)'),"Lab must use immutable simulation helper");
assert.ok(laboratory.includes('analyzeBuild(build, availableParts)'),"Lab compatibility should include custom parts");
assert.ok(laboratory.includes('answerUpgradeQuestion(question, build, availableParts)'),"Lab assistant should include custom parts");
assert.ok(laboratory.includes('<VisualEnginePro gpu={gpu}'),"3D experience must remain wired");
console.log("Visual lab integration: signed-in routing, profile selection, custom parts and read-only GPU scenarios passed.");
