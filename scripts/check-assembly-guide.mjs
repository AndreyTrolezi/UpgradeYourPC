import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const file=path.resolve("app/lib/assembly-guide.ts");
const src=fs.readFileSync(file,"utf8");
const {outputText,diagnostics}=ts.transpileModule(src,{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
  reportDiagnostics:true,
});
assert.equal((diagnostics??[]).filter(d=>d.category===ts.DiagnosticCategory.Error).length,0);
const mod={exports:{}};
new Function("module","exports",outputText)(mod,mod.exports);
const {assemblyGuideSteps,visibleAssemblyPart,assemblyGuideProgress}=mod.exports;

const withGpu=assemblyGuideSteps(true);
const withoutGpu=assemblyGuideSteps(false);
assert.equal(withGpu.length,9);
assert.equal(withoutGpu.length,8);
assert.equal(withGpu[0].id,"safety");
assert.equal(withGpu.at(-1).id,"boot");
assert.equal(withoutGpu.some(s=>s.id==="gpu"),false);
assert.equal(withoutGpu.every(s=>!s.installed.includes("gpu")),true);
assert.equal(new Set(withGpu.map(s=>s.id)).size,withGpu.length);

const parts=["case","motherboard","ram","cooler","psu","gpu"];
for(const guide of [withGpu,withoutGpu]) {
  let prior=new Set();
  for(const entry of guide) {
    assert.ok(entry.instruction.length>40,entry.id+": instruction");
    assert.ok(entry.caution.length>40,entry.id+": caution");
    assert.ok(entry.verification.length>15,entry.id+": verification");
    assert.ok(parts.includes(entry.focus),entry.id+": valid focus");
    assert.equal(entry.installed.includes("case"),true,entry.id+": chassis");
    for(const part of prior)assert.ok(entry.installed.includes(part),entry.id+": installed components cannot disappear");
    if(entry.arriving) assert.ok(entry.installed.includes(entry.arriving),entry.id+": animated item must be installed");
    for(const part of parts) assert.equal(visibleAssemblyPart(entry,part,guide===withGpu),entry.installed.includes(part),entry.id+": visibility");
    prior=new Set(entry.installed);
  }
  assert.equal(assemblyGuideProgress(guide,new Set()),0);
  assert.equal(assemblyGuideProgress(guide,new Set(guide.map(s=>s.id))),100);
  const first=new Set([guide[0].id]);
  assert.equal(assemblyGuideProgress(guide,first),Math.round(100/guide.length));
}
assert.equal(visibleAssemblyPart(withGpu.find(s=>s.id==="gpu"),"gpu",true),true);
assert.equal(visibleAssemblyPart(withGpu[0],"gpu",true),false);
console.log("Assembly guide: stage ordering, optional GPU, safety copy, progressive rendering and progress passed.");
