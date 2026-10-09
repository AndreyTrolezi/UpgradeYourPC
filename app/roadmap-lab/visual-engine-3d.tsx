"use client";
import { useEffect, useRef, useState } from "react";
import type { Part } from "@/app/lib/types";

type ComponentId = "case" | "motherboard" | "gpu" | "cooler" | "ram" | "psu";
type Vec3 = [number, number, number];
type Box3D = { center: Vec3; size: Vec3; color: string; id: ComponentId; opacity?: number };
const names: Record<ComponentId, string> = { case: "Gabinete", motherboard: "Placa-mãe", gpu: "Placa de vídeo", cooler: "Cooler", ram: "Memória RAM", psu: "Fonte" };
const boxes: Box3D[] = [
  { center: [0,0,0], size: [3.8,4.1,2.0], color: "#263549", id: "case", opacity: .12 },
  { center: [-.72,.05,-.65], size: [2.1,2.6,.12], color: "#176a75", id: "motherboard" },
  { center: [-.6,-.2,-.38], size: [.8,.8,.52], color: "#8995a8", id: "cooler" },
  { center: [.25,.55,-.39], size: [.14,1.3,.22], color: "#14b8a6", id: "ram" },
  { center: [.5,.55,-.39], size: [.14,1.3,.22], color: "#14b8a6", id: "ram" },
  { center: [0,-.7,.25], size: [2.6,.36,.8], color: "#334155", id: "gpu" },
  { center: [1.05,-1.45,-.25], size: [1.25,.65,1.25], color: "#64748b", id: "psu" },
];
function rgb(hex: string) { const v = parseInt(hex.slice(1),16); return [(v>>16)&255,(v>>8)&255,v&255] as Vec3; }
function rotate(p: Vec3, yaw: number, pitch: number): Vec3 {
  const [x,y,z]=p; const xx=x*Math.cos(yaw)+z*Math.sin(yaw); const zz=-x*Math.sin(yaw)+z*Math.cos(yaw);
  return [xx, y*Math.cos(pitch)-zz*Math.sin(pitch), y*Math.sin(pitch)+zz*Math.cos(pitch)];
}
function project(p: Vec3, yaw: number, pitch: number, zoom: number, w: number, h: number) {
  const [x,y,z]=rotate(p,yaw,pitch); const d=9+z;
  return { x:w/2+x*zoom*5/d, y:h/2-y*zoom*5/d, depth:z };
}
function faces(b: Box3D) {
  const [x,y,z]=b.center, [w,h,d]=b.size;
  const v: Vec3[] = [[x-w/2,y-h/2,z-d/2],[x+w/2,y-h/2,z-d/2],[x+w/2,y+h/2,z-d/2],[x-w/2,y+h/2,z-d/2],[x-w/2,y-h/2,z+d/2],[x+w/2,y-h/2,z+d/2],[x+w/2,y+h/2,z+d/2],[x-w/2,y+h/2,z+d/2]];
  return [[0,1,2,3],[4,5,6,7],[0,4,7,3],[1,5,6,2],[3,2,6,7],[0,1,5,4]].map((indices,i)=>({ points:indices.map(j=>v[j]), id:b.id, color:b.color, alpha:b.opacity??1, face:i }));
}
export function VisualEngine3D({ gpu, clearance }: { gpu?: Part; clearance?: { length: number; limit: number } }) {
  const canvas=useRef<HTMLCanvasElement>(null), drag=useRef<{x:number;y:number}|null>(null);
  const [yaw,setYaw]=useState(-.55), [pitch,setPitch]=useState(.27), [zoom,setZoom]=useState(190), [selected,setSelected]=useState<ComponentId>("gpu"), [exploded,setExploded]=useState(false), [open,setOpen]=useState(true);
  useEffect(()=>{
    const el=canvas.current; if(!el) return; const ctx=el.getContext("2d"); if(!ctx)return;
    const ratio=Math.min(2,window.devicePixelRatio||1), w=el.clientWidth,h=el.clientHeight;
    el.width=Math.round(w*ratio);el.height=Math.round(h*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);
    ctx.clearRect(0,0,w,h);
    const objects=boxes.filter(b=>(b.id!=="gpu"||!!gpu)&&(b.id!=="case"||!open));
    const expanded=objects.map(b=>({...b,center: exploded && b.id!=="case" ? [b.center[0]+(b.center[0]>.1?.6:-.45),b.center[1]+(b.id==="gpu"?.65:0),b.center[2]+(b.id==="motherboard"?.2:.8)] as Vec3 : b.center}));
    const polygons=expanded.flatMap(faces).map(f=>({...f, projected:f.points.map(p=>project(p,yaw,pitch,zoom,w,h))}));
    polygons.sort((a,b)=>b.projected.reduce((s,p)=>s+p.depth,0)/4-a.projected.reduce((s,p)=>s+p.depth,0)/4);
    for(const p of polygons){
      const [r,g,b]=rgb(p.color);const shade=[.64,.92,.75,.85,1,.56][p.face];const alpha=p.id===selected?1:p.alpha;
      ctx.beginPath();p.projected.forEach((v,i)=>i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y));ctx.closePath();
      ctx.fillStyle=`rgba(${Math.round(r*shade)},${Math.round(g*shade)},${Math.round(b*shade)},${alpha})`;ctx.fill();
      ctx.strokeStyle=p.id===selected?"#67e8f9":"rgba(148,163,184,.3)";ctx.lineWidth=p.id===selected?2.5:1;ctx.stroke();
    }
    if(open) {
      const corners: Vec3[]=[[-1.9,-2.05,-1],[1.9,-2.05,-1],[1.9,2.05,-1],[-1.9,2.05,-1],[-1.9,-2.05,1],[1.9,-2.05,1],[1.9,2.05,1],[-1.9,2.05,1]];
      ctx.strokeStyle="rgba(148,163,184,.38)";ctx.lineWidth=1.5;
      for(const [a,b] of [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]]){const p=project(corners[a],yaw,pitch,zoom,w,h),q=project(corners[b],yaw,pitch,zoom,w,h);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();}
    }
  },[yaw,pitch,zoom,selected,exploded,open,gpu]);
  const length=clearance?.length||0,limit=clearance?.limit||0;
  return <section className="rounded-2xl border border-slate-700 p-5 space-y-4">
    <div><h2 className="text-xl font-semibold">4. Visual Engine — protótipo 3D navegável</h2><p className="text-sm text-slate-400">Arraste para girar, use a roda do mouse para aproximar. Geometria volumétrica genérica, sem escala certificada.</p></div>
    <div className="flex flex-wrap gap-2">{(Object.keys(names) as ComponentId[]).map(id=><button key={id} type="button" onClick={()=>setSelected(id)} aria-pressed={selected===id} className={`rounded-lg border px-3 py-2 text-sm ${selected===id?"border-cyan-300 bg-cyan-300/10 text-cyan-200":"border-slate-700"}`}>{names[id]}</button>)}</div>
    <canvas ref={canvas} aria-label="Visualização 3D navegável dos componentes de um computador" className="w-full h-[430px] md:h-[550px] rounded-xl bg-slate-900 border border-slate-800 cursor-grab touch-none" onPointerDown={e=>{drag.current={x:e.clientX,y:e.clientY};e.currentTarget.setPointerCapture(e.pointerId);}} onPointerMove={e=>{if(!drag.current)return;setYaw(v=>v+(e.clientX-drag.current!.x)*.008);setPitch(v=>Math.max(-1.3,Math.min(1.3,v+(e.clientY-drag.current!.y)*.006)));drag.current={x:e.clientX,y:e.clientY};}} onPointerUp={()=>drag.current=null} onPointerCancel={()=>drag.current=null} onWheel={e=>setZoom(v=>Math.max(100,Math.min(400,v-e.deltaY*.15)))}/>
    <div className="flex flex-wrap gap-2"><button className="rounded-lg border border-slate-600 px-3 py-2" onClick={()=>setExploded(v=>!v)}>{exploded?"Reunir peças":"Vista explodida"}</button><button className="rounded-lg border border-slate-600 px-3 py-2" onClick={()=>setOpen(v=>!v)}>{open?"Mostrar painel":"Ocultar painel"}</button><button className="rounded-lg border border-slate-600 px-3 py-2" onClick={()=>{setYaw(-.55);setPitch(.27);setZoom(190)}}>Redefinir câmera</button></div>
    <p className="text-sm">{gpu?.name??"GPU não selecionada"} — {!gpu?"Sem GPU":!length||!limit?"Encaixe físico não confirmado: faltam medidas oficiais":length>limit?"GPU excede o comprimento informado":"Folga nominal: "+(limit-length)+" mm"}</p>
    <p className="text-xs text-amber-200">Protótipo geométrico: não representa o modelo exato nem valida conectores, espessura, radiadores ou obstruções.</p>
  </section>;
}
