"use client";
import { useState } from "react";
import type { Part } from "@/app/lib/types";
type Layer = "case" | "motherboard" | "gpu" | "cooler";
export function VisualEngine({ gpu, clearance }: { gpu?: Part; clearance?: { length: number; limit: number } }) {
  const [selected, setSelected] = useState<Layer>("gpu");
  const status = !gpu ? "Nenhuma GPU selecionada" : !clearance?.length || !clearance.limit ? "Medidas insuficientes: encaixe não confirmado" : clearance.length > clearance.limit ? "GPU excede o limite informado do gabinete" : `Folga nominal informada: ${clearance.limit - clearance.length} mm`;
  const highlight = (layer: Layer) => selected === layer ? "#67e8f9" : "#64748b";
  return <section className="rounded-2xl border border-slate-700 p-5 space-y-4">
    <div><h2 className="text-xl font-semibold">4. Visual Engine — vista esquemática</h2><p className="text-sm text-slate-400 mt-1">Ilustração isométrica, sem escala física. Clique em uma peça para destacá-la.</p></div>
    <div className="flex flex-wrap gap-2">{(["case","motherboard","gpu","cooler"] as const).map(layer => <button key={layer} type="button" onClick={() => setSelected(layer)} aria-pressed={selected===layer} className={`rounded-lg px-3 py-2 text-sm border ${selected===layer ? "border-cyan-300 bg-cyan-300/10 text-cyan-200" : "border-slate-700 text-slate-300"}`}>{({case:"Gabinete",motherboard:"Placa-mãe",gpu:"GPU",cooler:"Cooler"} as const)[layer]}</button>)}</div>
    <svg viewBox="0 0 640 430" role="img" aria-label="Diagrama isométrico esquemático de gabinete, placa-mãe, cooler e placa de vídeo" className="w-full max-w-3xl rounded-xl bg-slate-900 border border-slate-800">
      <defs><linearGradient id="cabinet" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#334155"/><stop offset="1" stopColor="#0f172a"/></linearGradient></defs>
      <g stroke={highlight("case")} strokeWidth={selected==="case"?4:2} fill="url(#cabinet)">
        <path d="M125 95 L365 35 L535 115 L295 180 Z" opacity=".7"/>
        <path d="M125 95 L295 180 L295 390 L125 305 Z" opacity=".85"/>
        <path d="M295 180 L535 115 L535 325 L295 390 Z" opacity=".3"/>
      </g>
      <g stroke={highlight("motherboard")} strokeWidth={selected==="motherboard"?4:2} fill="#164e63">
        <path d="M155 127 L305 172 L305 336 L155 287 Z"/>
        <path d="M171 153 L278 187 L278 300 L171 265 Z" fill="#155e75" stroke="#0e7490"/>
      </g>
      <g stroke={highlight("cooler")} strokeWidth={selected==="cooler"?4:2}>
        <path d="M190 172 L248 189 L248 250 L190 232 Z" fill="#475569"/>
        <ellipse cx="220" cy="211" rx="22" ry="28" fill="#0f172a"/>
        <ellipse cx="220" cy="211" rx="9" ry="12" fill="#67e8f9"/>
      </g>
      {gpu && <g stroke={highlight("gpu")} strokeWidth={selected==="gpu"?4:2}>
        <path d="M214 258 L431 201 L465 220 L247 282 Z" fill="#1e293b"/>
        <path d="M247 282 L465 220 L465 255 L247 319 Z" fill="#334155"/>
        <ellipse cx="320" cy="253" rx="23" ry="13" fill="#020617" stroke="#94a3b8"/>
        <ellipse cx="402" cy="231" rx="23" ry="13" fill="#020617" stroke="#94a3b8"/>
      </g>}
      <g fontSize="14" fill="#e2e8f0"><text x="350" y="62">Gabinete</text><text x="48" y="208">Placa-mãe</text><text x="55" y="258">Cooler</text>{gpu && <text x="440" y="290">GPU</text>}</g>
    </svg>
    <p className="text-sm text-slate-200">{gpu?.name ?? "GPU não selecionada"} — {status}</p>
    <p className="text-xs text-amber-200">A folga nominal não considera radiador frontal, cabos, espessura da GPU ou outras obstruções. Confira o manual do gabinete.</p>
  </section>;
}
