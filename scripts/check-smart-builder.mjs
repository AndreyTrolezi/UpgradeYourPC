import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import assert from 'node:assert/strict';
const cache = new Map();
function load(file) {
  file = path.resolve(file);
  if(cache.has(file)) return cache.get(file).exports;
  const mod = {exports:{}}; cache.set(file,mod);
  const source=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const require = id => load((id.startsWith('@/') ? path.resolve(id.slice(2)) : path.resolve(path.dirname(file),id)) + '.ts');
  new Function('require','module','exports',source)(require,mod,mod.exports);
  return mod.exports;
}
const {parseBrief,recommendBuild}=load('app/lib/smart-builder.ts');
const {catalog}=load('app/data/catalog.ts');
assert.equal(new Set(catalog.map(p=>p.id)).size,catalog.length);
for(const [prompt,budget] of [['AutoCAD e SketchUp na faixa de 2000 reais',2000],['PC até 2 mil',2000],['PC de R$ 2.000',2000],['PC até 2,5k',2500],['PC gamer até 5000 reais com monitor',5000]]) {
  const brief=parseBrief(prompt); assert.equal(brief.budget,budget);
  const result=recommendBuild(brief);
  for(const id of Object.values(result.primary.build.parts).flat()) assert(!catalog.find(p=>p.id===id).tags.includes('atual'));
  assert.equal(result.primary.fit==='dentro',result.primary.total<=budget);
  console.log(prompt, result.primary.title, result.primary.total);
}
console.log('Catalog:',catalog.length,'entries; smoke checks passed');
