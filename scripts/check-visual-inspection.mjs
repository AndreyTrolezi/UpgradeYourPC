import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

function load(relative) {
  const file = path.resolve(relative);
  const source = fs.readFileSync(file,"utf8");
  const {outputText,diagnostics} = ts.transpileModule(source,{
    compilerOptions: {module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
    reportDiagnostics: true,
  });
  const errors=(diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error);
  assert.equal(errors.length,0,"TypeScript syntax checks must pass");
  const module={exports:{}};
  new Function("module","exports",outputText)(module,module.exports);
  return module.exports;
}
const {presentPart,canDisplayPanel,modeDescription}=load("app/roadmap-lab/visual-mode-rules.ts");
const parts=["case","motherboard","gpu","cooler","ram","psu"];
const modes=["assembled","exploded","xray","airflow"];
for(const mode of modes) {
  for(const selected of parts) {
    for(const id of parts) {
      const normal=presentPart(id,selected,mode,false);
      assert.equal(normal.visible,true,`${mode}/${id}: visible in unisolated scene`);
      assert.equal(normal.opacity>0,true);
      const isolated=presentPart(id,selected,mode,true);
      assert.equal(isolated.visible,id===selected,`${mode}/${selected}/${id}: proper isolation`);
      assert.equal(isolated.pickable,id===selected && !(mode==="xray"&&id==="case"),"hidden or transparent pieces cannot intercept clicks");
    }
  }
}
const shell=presentPart("case","gpu","xray",false);
assert.ok(shell.opacity < .2,"X-ray casing must be highly transparent");
assert.equal(shell.pickable,false,"X-ray shell must allow selecting internal hardware");
for(const id of parts.filter(p=>p!=="case")) {
  const state=presentPart(id,"gpu","xray",false);
  assert.equal(state.opacity,id==="gpu"?1:.20,"Only selected X-ray part stays opaque");
  assert.equal(state.pickable,id==="gpu","X-ray ghost components must not block selecting the focus");
}
assert.equal(presentPart("cooler","cooler","xray",false).opacity,1);
assert.equal(presentPart("gpu","cooler","xray",false).opacity,.20);
const glass=presentPart("case","gpu","assembled",false,.36);
assert.equal(glass.visible,true);
assert.equal(glass.pickable,false,"Glass should not intercept raycasts");
assert.equal(glass.depthWrite,false,"Glass should not hide parts behind it");
assert.equal(canDisplayPanel("assembled",false,"gpu",true),true);
assert.equal(canDisplayPanel("assembled",false,"gpu",false),false);
assert.equal(canDisplayPanel("xray",false,"gpu",true),false);
assert.equal(canDisplayPanel("assembled",true,"gpu",true),false);
assert.equal(canDisplayPanel("assembled",true,"case",true),true);
for(const mode of modes) assert.ok(modeDescription(mode,false).length>20);
assert.ok(modeDescription("assembled",true).includes("Isolamento"));
console.log("Visual Engine inspection controls: isolation, X-ray, glass picking, and panel cases passed.");
