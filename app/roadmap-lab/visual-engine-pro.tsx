"use client";

import { Canvas, ThreeEvent } from "@react-three/fiber";
import { Edges, OrbitControls } from "@react-three/drei";
import { Suspense, useState } from "react";
import { ANCHORS, EXPLODED, SHOWCASE, placed, type Point3 } from "@/app/roadmap-lab/scene-layout";
import type { Part } from "@/app/lib/types";

type PartId = "case" | "motherboard" | "gpu" | "cooler" | "ram" | "psu";
type Mode = "assembled" | "exploded" | "xray" | "airflow";

const PARTS: Record<PartId, { name: string; description: string; attachment: string }> = {
  case: { name: "Gabinete", description: "Estrutura, bandeja da placa-mãe, suporte frontal de fans, slots traseiros e compartimento da fonte.", attachment: "Chassi e suportes de instalação" },
  motherboard: { name: "Placa-mãe", description: "PCB, socket, VRM, slots de memória, PCIe x16 e conectores ilustrativos.", attachment: "Bandeja e espaçadores do gabinete" },
  gpu: { name: "Placa de vídeo", description: "Modelo genérico dual-fan: PCB horizontal, ventoinhas voltadas para baixo, bracket traseiro e contato PCIe.", attachment: "Slot PCIe x16 e bracket traseiro" },
  cooler: { name: "Cooler", description: "Conjunto tower com aletas, heatpipes e ventoinha alinhado ao socket do processador.", attachment: "Socket da CPU e kit de fixação" },
  ram: { name: "Memória RAM", description: "Dois módulos DIMM verticais em posições de slots da placa-mãe.", attachment: "Slots DIMM A2 e B2" },
  psu: { name: "Fonte", description: "Fonte ATX no compartimento inferior, com ventoinha voltada para a entrada de ar inferior.", attachment: "Compartimento inferior da fonte" },
};

type VisualProps = { selected: PartId; isolate: boolean; xray: boolean; onPick: (id: PartId) => void };
type BoxProps = VisualProps & {
  id: PartId; position: Point3; size: Point3; color: string;
  opacity?: number; metallic?: number; outline?: boolean;
};
function BoxPart({ id, position, size, color, selected, isolate, xray, onPick, opacity = 1, metallic = .3, outline = false }: BoxProps) {
  const alpha = isolate && selected !== id ? .10 : Math.min(opacity, xray ? .30 : 1);
  return <mesh position={position} castShadow receiveShadow onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onPick(id); }}>
    <boxGeometry args={size}/>
    <meshStandardMaterial color={color} metalness={metallic} roughness={.52} transparent={alpha < 1} opacity={alpha} depthWrite={alpha >= 1}/>
    {selected === id && outline && <Edges color="#67e8f9" threshold={18}/>}
  </mesh>;
}
function PartBox({ id, position, size, color, opacity, metallic, outline, ...visual }: Omit<BoxProps, "selected" | "isolate" | "xray" | "onPick"> & { visual: VisualProps }) {
  return <BoxPart {...visual} id={id} position={position} size={size} color={color} opacity={opacity} metallic={metallic} outline={outline}/>;
}
function Fan({ id, position, rotation = [0,0,0], scale = 1, visual }: {
  id: PartId; position: Point3; rotation?: Point3; scale?: number; visual: VisualProps;
}) {
  const faded = visual.isolate && visual.selected !== id;
  const opacity = faded ? .10 : visual.xray ? .38 : 1;
  const material = (color: string) => <meshStandardMaterial color={color} metalness={.45} roughness={.35} transparent={opacity < 1} opacity={opacity}/>;
  return <group position={position} rotation={rotation} scale={scale} onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); visual.onPick(id); }}>
    {([[-.37,0,.07,.76],[.37,0,.07,.76],[0,.37,.76,.07],[0,-.37,.76,.07]] as const).map(([x,y,w,h],i)=>
      <mesh position={[x,y,0]} key={i}><boxGeometry args={[w,h,.09]}/>{material(visual.selected === id ? "#67e8f9" : "#334155")}</mesh>)}
    <mesh><torusGeometry args={[.29,.025,10,36]}/>{material("#64748b")}</mesh>
    {Array.from({ length: 7 },(_,i) => {
      const a = i * Math.PI * 2 / 7;
      return <mesh key={i} position={[Math.cos(a)*.17,Math.sin(a)*.17,.02]} rotation={[0,0,a+.55]}>
        <boxGeometry args={[.26,.10,.026]}/>{material("#94a3b8")}
      </mesh>;
    })}
    <mesh rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.085,.085,.09,20]}/>{material("#0f172a")}</mesh>
  </group>;
}
function add(a: Point3,b: Point3): Point3 { return [a[0]+b[0],a[1]+b[1],a[2]+b[2]]; }

function CaseGeometry({ visual, panel, shroud }: { visual: VisualProps; panel: boolean; shroud: boolean }) {
  const b = (position: Point3,size: Point3,color="#283649", opacity=1, outline=false) =>
    <BoxPart {...visual} id="case" position={position} size={size} color={color} opacity={opacity} metallic={.72} outline={outline}/>;
  return <group>
    {b([0,-2.03,0],[3.6,.13,2.15],"#48566b",1,true)}
    {b([0,2.03,0],[3.6,.12,2.15],"#48566b",1,true)}
    {b([0,0,-1.03],[3.6,4.1,.10],"#1e293b")}
    {b([-1.74,0,-.99],[.12,4.15,.13],"#64748b")}
    {b([-1.74,0,1.02],[.12,4.15,.13],"#64748b")}
    {b([1.74,0,-.99],[.12,4.15,.13],"#64748b")}
    {b([1.74,0,1.02],[.12,4.15,.13],"#64748b")}
    {b([0,2.02,1.02],[3.6,.10,.12],"#64748b")}
    {b([0,-2.02,1.02],[3.6,.10,.12],"#64748b")}
    {b([-1.75,-.6,.28],[.11,.66,1.35],"#64748b")}
    {[-1.1,-1.32,-1.54,-1.76].map(y=>b([-1.74,y,.29],[.10,.045,1.30],"#94a3b8"))}
    {[[-1.28,-2.15,-.64],[1.28,-2.15,-.64],[-1.28,-2.15,.64],[1.28,-2.15,.64]].map((p,i)=>b(p as Point3,[.30,.16,.32],"#0f172a"))}
    {shroud && <group>
      {b([0,SHOWCASE.shroudY,0],[3.28,.085,1.8],"#334155",visual.selected==="psu" ? .25 : .75)}
      {b([0,-1.50,.89],[3.28,.83,.08],"#1e293b",visual.selected==="psu" ? .12 : .36)}
    </group>}
    {b([1.73,0,-.72],[.08,3.62,.09],"#64748b")}
    {b([1.73,0,.69],[.08,3.62,.09],"#64748b")}
    {b([1.73,1.82,-.02],[.08,.09,1.54],"#64748b")}
    {b([1.73,-1.82,-.02],[.08,.09,1.54],"#64748b")}
    {[-.02,.82,-.85].map(y=>b([1.72,y,-.02],[.055,.045,1.51],"#475569",.7))}
    {panel && b([0,0,1.08],[3.56,4.06,.045],"#93c5fd",.13)}
  </group>;
}

function Motherboard({ visual, exploded }: { visual: VisualProps; exploded: boolean }) {
  const b = (pos: Point3, size: Point3, color: string, outline=false) =>
    <BoxPart {...visual} id="motherboard" position={pos} size={size} color={color} metallic={.48} outline={outline}/>;
  return <group position={placed(ANCHORS.motherboard,exploded,EXPLODED.motherboard)}>
    {b([0,0,0],[2.25,2.6,.085],"#07504c",true)}
    {b([-.27,.18,.066],[.72,.72,.09],"#1e293b",true)}
    {b([-.27,.18,.124],[.54,.54,.018],"#94a3b8")}
    {b([-1.02,.11,.12],[.16,1.65,.25],"#64748b")}
    {b([-.51,1.15,.14],[1.32,.20,.25],"#64748b")}
    {b([.78,-.62,.14],[.33,.34,.19],"#334155")}
    {b([.86,.94,.13],[.14,.38,.19],"#0f172a")}
    {Array.from({length:8},(_,i)=>b([-.89+i*.19,1.13,.23],[.06,.15,.06],"#94a3b8"))}
    {[.70,.90].map(x=>b([x,.36,.12],[.07,1.27,.14],"#0f172a"))}
    {[-.75,-.95].map(y=>b([-.18,y,.10],[1.63,.07,.14],"#0f172a"))}
    {b([-.18,-.83,.18],[1.61,.02,.04],"#d6b250")}
    {Array.from({length:4},(_,i)=>b([.90,-.19+i*.13,.14],[.25,.065,.14],"#0f172a"))}
    {Array.from({length:9},(_,i)=>b([-.95+(i%3)*.18,-1.18+Math.floor(i/3)*.14,.09],[.06,.065,.08],"#0f172a"))}
  </group>;
}

function Cooler({ visual, exploded }: { visual: VisualProps; exploded: boolean }) {
  const b = (pos: Point3,size: Point3,color: string) => <BoxPart {...visual} id="cooler" position={pos} size={size} color={color} metallic={.84}/>;
  return <group position={placed(ANCHORS.cpuSocket,exploded,EXPLODED.cpu)}>
    {b([0,0,.18],[.70,.76,.31],"#475569")}
    {Array.from({length:13},(_,i)=>b([0,0,.19+i*.031],[.80,.86,.016],"#94a3b8"))}
    {[-.25,0,.25].map(x=>b([x,0,.44],[.042,.98,.042],"#d6aa65"))}
    <Fan id="cooler" position={[0,0,.69]} scale={.90} visual={visual}/>
  </group>;
}
function Memory({ visual, exploded }: { visual: VisualProps; exploded: boolean }) {
  const b=(pos:Point3,size:Point3,color:string,outline=false)=><BoxPart {...visual} id="ram" position={pos} size={size} color={color} metallic={.38} outline={outline}/>;
  return <group position={exploded ? EXPLODED.memory : [0,0,0]}>
    {[ANCHORS.ramA2,ANCHORS.ramB2].map((p,i)=><group key={i} position={p}>
      {b([0,0,.09],[.115,1.12,.16],"#0f766e",true)}
      {b([0,.61,.09],[.13,.10,.18],"#94a3b8")}
      {Array.from({length:5},(_,j)=>b([0,-.37+j*.18,.19],[.09,.10,.018],"#0f172a"))}
    </group>)}
  </group>;
}

function GPU({ gpu, visual, exploded }: { gpu?: Part; visual: VisualProps; exploded: boolean }) {
  if(!gpu)return null;
  const b = (pos:Point3,size:Point3,color:string,outline=false)=>
    <BoxPart {...visual} id="gpu" position={pos} size={size} color={color} metallic={.72} outline={outline}/>;
  return <group position={placed(ANCHORS.pcieX16,exploded,EXPLODED.gpu)}>
    {b([1.08,-.24,.53],[2.46,.37,.96],"#111827",true)}
    {b([1.08,-.02,.53],[2.42,.065,.92],"#475569")}
    {b([1.08,.02,.09],[1.70,.05,.18],"#0e7490")}
    {b([1.08,.06,.02],[1.53,.035,.06],"#d6b250")}
    {b([-.18,-.21,.52],[.09,.55,1.10],"#94a3b8",true)}
    {[-.19,-.42,-.65].map(y=>b([-.24,y,.52],[.09,.05,.99],"#64748b"))}
    {[.52,1.65].map(x=>
      <Fan key={x} id="gpu" position={[x,-.465,.52]} rotation={[Math.PI/2,0,0]} scale={.93} visual={visual}/>)}
    {b([1.06,-.25,1.04],[2.38,.18,.045],"#334155")}
    {b([1.61,-.01,.71],[.23,.10,.16],"#0f172a")}
  </group>;
}
function PSU({ visual, exploded }: { visual: VisualProps; exploded: boolean }) {
  const b=(pos:Point3,size:Point3,color:string,outline=false)=>
    <BoxPart {...visual} id="psu" position={pos} size={size} color={color} metallic={.77} outline={outline}/>;
  return <group position={placed(ANCHORS.psuBay,exploded,EXPLODED.psu)}>
    {b([0,0,0],[1.34,.70,1.18],"#334155",true)}
    {b([0,.36,0],[1.31,.028,1.12],"#64748b")}
    <Fan id="psu" position={[0,-.365,0]} rotation={[Math.PI/2,0,0]} scale={.74} visual={visual}/>
    {Array.from({length:5},(_,i)=>b([.64,-.18+i*.09,0],[.025,.035,.81],"#0f172a"))}
  </group>;
}

function FlowArrow({ position, direction, color }: { position: Point3; direction: "left" | "up"; color: string }) {
  const rotation: Point3 = direction === "left" ? [0,0,Math.PI/2] : [0,0,0];
  return <group position={position} rotation={rotation}>
    <mesh position={[0,-.12,0]}><cylinderGeometry args={[.028,.028,.45,8]}/><meshBasicMaterial color={color} transparent opacity={.9}/></mesh>
    <mesh position={[0,.17,0]}><coneGeometry args={[.095,.23,12]}/><meshBasicMaterial color={color}/></mesh>
  </group>;
}
function Airflow() {
  return <group>
    {[-.60,.30,1.12].map(y=>[-.15,.52].map(z=><FlowArrow key={y+":"+z} position={[1.18,y,z]} direction="left" color="#38bdf8"/>))}
    <FlowArrow position={[-1.20,1.20,.35]} direction="left" color="#fb923c"/>
    {[.65,1.10].map(x=><FlowArrow key={x} position={[x,1.73,.3]} direction="up" color="#fb923c"/>)}
  </group>;
}

function Scene({ selected, onPick, mode, isolate, panel, shroud, gpu }: {
  selected:PartId; onPick:(id:PartId)=>void; mode:Mode; isolate:boolean; panel:boolean; shroud:boolean; gpu?:Part;
}) {
  const exploded=mode==="exploded";
  const visual:VisualProps={selected,isolate,xray:mode==="xray",onPick};
  return <>
    <ambientLight intensity={1.15}/>
    <hemisphereLight args={["#a5d8ff","#172033",1.05]}/>
    <directionalLight position={[4,8,7]} intensity={2.0} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024}/>
    <pointLight position={[-1.3,1.5,2.0]} intensity={16} distance={8} color="#38bdf8"/>
    <CaseGeometry visual={visual} panel={panel} shroud={shroud}/>
    <Motherboard visual={visual} exploded={exploded}/>
    <Cooler visual={visual} exploded={exploded}/>
    <Memory visual={visual} exploded={exploded}/>
    <GPU gpu={gpu} visual={visual} exploded={exploded}/>
    <PSU visual={visual} exploded={exploded}/>
    {ANCHORS.frontFans.map((p,i)=><Fan key={i} id="case" position={p} rotation={[0,-Math.PI/2,0]} scale={.90} visual={visual}/>)}
    <Fan id="case" position={ANCHORS.rearFan} rotation={[0,Math.PI/2,0]} scale={.78} visual={visual}/>
    {mode==="airflow"&&<Airflow/>}
    <gridHelper args={[12,12,"#475569","#1e293b"]} position={[0,-2.26,0]}/>
  </>;
}

export function VisualEnginePro({ gpu, clearance }: { gpu?: Part; clearance?: { length: number; limit: number } }) {
  const [selected,setSelected]=useState<PartId>("gpu");
  const [mode,setMode]=useState<Mode>("assembled");
  const [isolate,setIsolate]=useState(false);
  const [panel,setPanel]=useState(false);
  const [shroud,setShroud]=useState(true);
  const length=clearance?.length??0;
  const limit=clearance?.limit??0;
  const status=!gpu ? "Nenhuma placa de vídeo selecionada." :
    !length || !limit ? "Encaixe físico não confirmado: faltam medidas oficiais." :
    length>limit ? "A GPU excede o comprimento máximo cadastrado para o gabinete." :
    "Folga nominal cadastrada: "+(limit-length)+" mm. Não considera obstruções internas.";
  const current=PARTS[selected];
  return <section className="rounded-2xl border border-slate-700 bg-slate-950 p-5 md:p-6 space-y-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 className="text-xl font-semibold">4. Visual Engine — montagem estrutural</h2>
        <p className="text-sm text-slate-400 mt-1">Three.js: encaixes por âncoras, gabinete detalhado e controles de inspeção.</p></div>
      <span className="rounded-full border border-cyan-900 px-3 py-1 text-xs text-cyan-300">Protótipo 3D • dimensões ilustrativas</span>
    </div>
    <div className="flex flex-wrap gap-2">
      {(["assembled","exploded","xray","airflow"] as Mode[]).map(id=>
        <button key={id} type="button" onClick={()=>setMode(id)} aria-pressed={mode===id}
          className={"rounded-lg border px-3 py-2 text-sm "+(mode===id?"border-cyan-400 bg-cyan-300/10 text-cyan-200":"border-slate-700 text-slate-300 hover:border-slate-500")}>
          {({assembled:"Montado",exploded:"Vista explodida",xray:"Raio-X",airflow:"Fluxo de ar"} as Record<Mode,string>)[id]}
        </button>)}
    </div>
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#0d1629] h-[470px] md:h-[590px]">
      <Canvas shadows camera={{position:[5.8,3.3,7.2],fov:40}} dpr={[1,1.6]} gl={{antialias:true}}>
        <Suspense fallback={null}>
          <Scene selected={selected} onPick={setSelected} mode={mode} isolate={isolate} panel={panel} shroud={shroud} gpu={gpu}/>
          <OrbitControls makeDefault target={[0,0,0]} enableDamping minDistance={4.0} maxDistance={17} maxPolarAngle={Math.PI*.90}/>
        </Suspense>
      </Canvas>
    </div>
    <div className="flex flex-wrap gap-2">
      {(["case","motherboard","gpu","cooler","ram","psu"] as PartId[]).map(id=>
        <button key={id} type="button" onClick={()=>setSelected(id)} aria-pressed={selected===id}
          className={"rounded-lg border px-3 py-2 text-sm "+(selected===id?"border-cyan-400 bg-cyan-300/10 text-cyan-200":"border-slate-700 hover:border-slate-500")}>{PARTS[id].name}</button>)}
    </div>
    <div className="flex flex-wrap gap-3 text-sm">
      <label className="inline-flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={isolate} onChange={e=>setIsolate(e.target.checked)}/> Isolar peça selecionada</label>
      <label className="inline-flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={panel} onChange={e=>setPanel(e.target.checked)}/> Painel lateral</label>
      <label className="inline-flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={shroud} onChange={e=>setShroud(e.target.checked)}/> Cobertura da fonte</label>
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">Componente selecionado</p>
        <h3 className="font-semibold mt-1">{current.name}{selected==="gpu"&&gpu?" — "+gpu.name:""}</h3>
        <p className="text-sm text-slate-300 mt-2">{current.description}</p>
        <p className="text-xs text-slate-400 mt-2">Montagem: {current.attachment}</p>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">Verificação dimensional</p>
        <p className="text-sm mt-2">{status}</p>
        {mode==="airflow" && <p className="text-xs text-slate-400 mt-2">Azul: entrada frontal. Laranja: saída traseira e superior. É um esquema de fluxo, não uma simulação CFD.</p>}
        <p className="text-xs text-amber-200 mt-2">A geometria é genérica e não prova compatibilidade física, elétrica ou térmica. Consulte medidas oficiais.</p>
      </div>
    </div>
    <p className="text-xs text-slate-400">Mouse: arrastar para girar • roda para zoom • clicar nas peças para inspecionar. Ventoinhas da GPU voltadas para baixo; fonte no compartimento inferior.</p>
  </section>;
}
