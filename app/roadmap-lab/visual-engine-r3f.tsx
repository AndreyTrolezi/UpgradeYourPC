"use client";
import { Canvas, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Edges } from "@react-three/drei";
import { Suspense, useState } from "react";
import type { Part } from "@/app/lib/types";

type Id = "case" | "motherboard" | "gpu" | "cooler" | "ram" | "psu";
const names: Record<Id,string>={case:"Gabinete",motherboard:"Placa-mãe",gpu:"Placa de vídeo",cooler:"Cooler",ram:"Memória RAM",psu:"Fonte"};
function Solid({position,size,color,id,selected,onPick,metalness=.3,transparent=false,opacity=1}:{position:[number,number,number];size:[number,number,number];color:string;id:Id;selected:Id;onPick:(id:Id)=>void;metalness?:number;transparent?:boolean;opacity?:number}) {
  return <mesh position={position} onClick={(e:ThreeEvent<MouseEvent>)=>{e.stopPropagation();onPick(id);}}>
    <boxGeometry args={size}/><meshStandardMaterial color={color} metalness={metalness} roughness={.45} transparent={transparent} opacity={opacity}/>
    {selected===id&&<Edges color="#67e8f9" threshold={15}/>}
  </mesh>;
}
function Fan({position,id,selected,onPick,scale=1}:{position:[number,number,number];id:Id;selected:Id;onPick:(id:Id)=>void;scale?:number}) {
  return <group position={position} scale={scale} onClick={(e)=>{e.stopPropagation();onPick(id);}}>
    <mesh rotation={[Math.PI/2,0,0]}><torusGeometry args={[.32,.055,10,32]}/><meshStandardMaterial color={selected===id?"#67e8f9":"#64748b"} metalness={.7}/></mesh>
    <mesh rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.10,.10,.06,20]}/><meshStandardMaterial color="#111827"/></mesh>
    {[0,1,2,3,4,5,6].map(i=><mesh key={i} rotation={[Math.PI/2,0,i*Math.PI*2/7]} position={[Math.cos(i*Math.PI*2/7)*.17,0,Math.sin(i*Math.PI*2/7)*.17]}><boxGeometry args={[.24,.04,.10]}/><meshStandardMaterial color="#94a3b8" metalness={.45}/></mesh>)}
  </group>;
}
function Scene({selected,onPick,exploded,panel,gpu}:{selected:Id;onPick:(id:Id)=>void;exploded:boolean;panel:boolean;gpu?:Part}) {
  const offset=exploded?1:0;
  const part=(id:Id,position:[number,number,number],size:[number,number,number],color:string,metalness?:number)=> <Solid id={id} selected={selected} onPick={onPick} position={position} size={size} color={color} metalness={metalness}/>;
  return <group>
    <ambientLight intensity={1.1}/><directionalLight position={[5,8,7]} intensity={2.6}/><pointLight position={[-3,2,4]} intensity={40} distance={10} color="#67e8f9"/>
    {part("case",[0,-2,0],[3.5,.12,1.9],"#64748b",.8)}
    {part("case",[0,2,0],[3.5,.12,1.9],"#64748b",.8)}
    {part("case",[-1.75,0,0],[.12,4.1,1.9],"#475569",.8)}
    {part("case",[1.75,0,0],[.12,4.1,1.9],"#475569",.8)}
    {part("case",[0,0,-.95],[3.5,4.1,.1],"#334155",.8)}
    {panel&&<Solid id="case" selected={selected} onPick={onPick} position={[0,0,.99]} size={[3.5,4.1,.06]} color="#64748b" transparent opacity={.16}/>}
    <group position={exploded?[-.5,.3,.7]:[0,0,0]}>
      {part("motherboard",[-.45,.25,-.79],[2.25,2.65,.13],"#115e59")}
      {part("motherboard",[-.45,.25,-.70],[.76,.78,.045],"#334155",.7)}
      {Array.from({length:4},(_,i)=>part("motherboard",[.20+i*.17,.78,-.66],[.075,1.1,.08],"#0f172a"))}
      {Array.from({length:3},(_,i)=>part("motherboard",[-.45,-.43+i*.17,-.65],[1.7,.07,.09],"#0f172a"))}
      {part("motherboard",[-1.35,.45,-.63],[.19,1.7,.18],"#94a3b8",.75)}
      {part("motherboard",[-.55,1.43,-.63],[1.55,.18,.18],"#94a3b8",.75)}
    </group>
    <group position={exploded?[-.7,.2,1.6]:[0,0,0]}>
      {part("cooler",[-.65,.38,-.33],[.92,.96,.58],"#475569",.8)}
      {Array.from({length:7},(_,i)=>part("cooler",[-.65,.38,-.05+i*.025],[.85,.85,.014],"#94a3b8",.9))}
      <Fan position={[-.65,.38,.15]} id="cooler" selected={selected} onPick={onPick} scale={.95}/>
    </group>
    <group position={exploded?[.55,.45,1.4]:[0,0,0]}>
      {[0,.20].map(i=><group key={i}>
        {part("ram",[.35+i,.76,-.48],[.13,1.22,.12],"#0f766e")}
        {Array.from({length:4},(_,j)=>part("ram",[.35+i,.39+j*.23,-.39],[.09,.12,.025],"#0f172a"))}
      </group>)}
    </group>
    {gpu&&<group position={exploded?[.4,-.3,1.5]:[0,0,0]}>
      {part("gpu",[.05,-.8,.18],[2.65,.23,.76],"#1e293b",.7)}
      {part("gpu",[.05,-.65,.18],[2.5,.06,.67],"#334155",.7)}
      {[-.67,.75].map(x=><Fan key={x} position={[x,-.55,.22]} id="gpu" selected={selected} onPick={onPick} scale={.72}/>)}
      {part("gpu",[-1.28,-.72,.19],[.08,.48,.82],"#94a3b8",.9)}
    </group>}
    <group position={exploded?[.6,-.7,1.4]:[0,0,0]}>
      {part("psu",[.91,-1.49,-.29],[1.38,.75,1.10],"#334155",.8)}
      <Fan position={[.91,-1.05,-.29]} id="psu" selected={selected} onPick={onPick} scale={.65}/>
    </group>
    <group position={[1.48,.45,-.63]}>{[1.15,.32,-.51].map(y=><Fan key={y} position={[0,y,0]} id="case" selected={selected} onPick={onPick} scale={.8}/>)}</group>
    <gridHelper args={[12,12,"#334155","#1e293b"]} position={[0,-2.2,0]}/>
  </group>;
}
export function VisualEngineR3F({gpu,clearance}:{gpu?:Part;clearance?:{length:number;limit:number}}){
  const [selected,setSelected]=useState<Id>("gpu"),[exploded,setExploded]=useState(false),[panel,setPanel]=useState(false);
  const length=clearance?.length??0,limit=clearance?.limit??0;
  return <section className="rounded-2xl border border-slate-700 p-5 space-y-4">
    <div><h2 className="text-xl font-semibold">4. Visual Engine — laboratório Three.js</h2><p className="text-sm text-slate-400">Gire, aproxime e selecione componentes diretamente na cena. Modelos genéricos, sem escala certificada.</p></div>
    <div className="flex flex-wrap gap-2">{(Object.keys(names) as Id[]).map(id=><button key={id} onClick={()=>setSelected(id)} aria-pressed={selected===id} className={`rounded-lg border px-3 py-2 text-sm ${selected===id?"border-cyan-300 bg-cyan-300/10 text-cyan-200":"border-slate-700"}`}>{names[id]}</button>)}</div>
    <div className="h-[520px] md:h-[620px] overflow-hidden rounded-xl border border-slate-800 bg-slate-900"><Canvas camera={{position:[6,4,7],fov:42}} dpr={[1,1.75]} gl={{antialias:true}}><Suspense fallback={null}><Scene selected={selected} onPick={setSelected} exploded={exploded} panel={panel} gpu={gpu}/><OrbitControls makeDefault minDistance={4} maxDistance={16} enableDamping target={[0,0,0]}/></Suspense></Canvas></div>
    <div className="flex flex-wrap gap-2"><button className="rounded-lg border border-slate-600 px-3 py-2" onClick={()=>setExploded(v=>!v)}>{exploded?"Reunir peças":"Vista explodida"}</button><button className="rounded-lg border border-slate-600 px-3 py-2" onClick={()=>setPanel(v=>!v)}>{panel?"Ocultar painel":"Mostrar painel"}</button></div>
    <p className="text-sm">{gpu?.name??"GPU não selecionada"} — {!gpu?"Sem GPU":!length||!limit?"Encaixe físico não confirmado: faltam medidas oficiais":length>limit?"GPU excede o limite de comprimento informado":"Folga nominal informada: "+(limit-length)+" mm"}</p>
    <p className="text-xs text-amber-200">Geometria ilustrativa. Não use a cena para confirmar dimensões, conectores ou compatibilidade física.</p>
  </section>;
}
