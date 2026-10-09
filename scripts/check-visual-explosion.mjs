import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const source=fs.readFileSync(path.resolve("app/roadmap-lab/scene-layout.ts"),"utf8");
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const module={exports:{}};
new Function("module","exports",js)(module,module.exports);
const {ANCHORS,EXPLODED,placed}=module.exports;

// Conservative axis-aligned envelopes of the illustrative parts, not manufacturer
// clearance specifications. Prevents the exploded diagram from overlapping itself.
const entries=[
  {name:"motherboard",anchor:ANCHORS.motherboard,delta:EXPLODED.motherboard,local:[0,0,.08],half:[1.15,1.32,.27]},
  {name:"cooler",anchor:ANCHORS.cpuSocket,delta:EXPLODED.cpu,local:[0,0,.4],half:[.44,.50,.48]},
  {name:"memory",anchor:[(ANCHORS.ramA2[0]+ANCHORS.ramB2[0])/2,ANCHORS.ramA2[1],ANCHORS.ramA2[2]],delta:EXPLODED.memory,local:[0,0,.1],half:[.25,.65,.24]},
  {name:"gpu",anchor:ANCHORS.pcieX16,delta:EXPLODED.gpu,local:[1.08,-.3,.53],half:[1.27,.60,.61]},
  {name:"psu",anchor:ANCHORS.psuBay,delta:EXPLODED.psu,local:[0,0,0],half:[.69,.40,.61]},
];

function bounds(item,strength) {
  const position=placed(item.anchor,true,item.delta,strength);
  const center=position.map((value,i)=>value+item.local[i]);
  return {min:center.map((n,i)=>n-item.half[i]),max:center.map((n,i)=>n+item.half[i])};
}
function overlaps(a,b) {
  return a.min.every((min,i)=>min < b.max[i] && b.min[i] < a.max[i]);
}
for(const strength of [1,1.2,1.4,1.6]) {
  const boxes=entries.map(item=>({...item,...bounds(item,strength)}));
  for(let a=0;a<boxes.length;a++) {
    for(let b=a+1;b<boxes.length;b++) {
      assert.equal(overlaps(boxes[a],boxes[b]),false,
        `Exploded parts must not intersect at ${strength*100}%: ${boxes[a].name} and ${boxes[b].name}`);
    }
  }
  for(const item of entries) {
    assert.deepEqual(placed(item.anchor,false,item.delta,strength),item.anchor,
      "Exploded slider must never move the assembled part");
  }
}
console.log("Visual Engine exploded geometry: no inter-part bounding-box overlaps at 100–160%.");
