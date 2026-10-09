"use client";

import { CheckCircle2, ChevronLeft, ChevronRight, CircleAlert, RotateCcw, ShieldCheck, X } from "lucide-react";
import {
  assemblyGuideProgress,
  type AssemblyGuideStep,
  type AssemblyStepId,
} from "@/app/lib/assembly-guide";

export function AssemblyGuideControls({
  steps, index, checked, onIndex, onToggle, onReplay, onClose,
}: {
  steps: AssemblyGuideStep[];
  index: number;
  checked: ReadonlySet<AssemblyStepId>;
  onIndex: (next: number) => void;
  onToggle: (id: AssemblyStepId) => void;
  onReplay: () => void;
  onClose: () => void;
}) {
  const current = steps[index];
  if (!current) return null;
  const progress = assemblyGuideProgress(steps,checked);
  const verifiedCount = steps.filter(item=>checked.has(item.id)).length;
  const completed = checked.has(current.id);

  return <section className="rounded-xl border border-cyan-900 bg-cyan-950/20 p-4 md:p-5 space-y-4 lg:max-h-[590px] lg:overflow-y-auto" aria-label="Montagem guiada">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2 text-cyan-200 font-semibold"><ShieldCheck size={18}/> Tutorial interativo de montagem</div>
      <button type="button" onClick={onClose}
        className="inline-flex items-center gap-1 rounded-md border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:bg-white/10">
        <X size={15}/> Encerrar tutorial
      </button>
    </div>

    <div className="space-y-1">
      <div className="flex items-center justify-between gap-3 text-xs text-slate-300">
        <span>Etapa {index+1} de {steps.length}</span>
        <span>{verifiedCount} verificadas nesta sessão • {progress}%</span>
      </div>
      <div role="progressbar" aria-label="Progresso do tutorial" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}
        className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
        <div className="h-full rounded-full bg-cyan-400 transition-all" style={{width:progress+"%"}}/>
      </div>
    </div>

    <div className="flex flex-wrap gap-1.5" aria-label="Navegar pelas etapas">
      {steps.map((item,i)=><button key={item.id} type="button"
        onClick={()=>onIndex(i)} aria-current={i===index?"step":undefined} title={item.title}
        className={"min-w-9 rounded-md border px-2.5 py-1.5 text-xs "+(
          i===index?"border-cyan-300 bg-cyan-300/15 text-cyan-100":
          checked.has(item.id)?"border-emerald-800 text-emerald-200":"border-slate-700 text-slate-300 hover:border-slate-500"
        )}>
        {checked.has(item.id)?"✓":i+1}
      </button>)}
    </div>

    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{current.title}</h3>
        <p className="text-sm leading-relaxed text-slate-200">{current.instruction}</p>
        {current.visualizationNote && <p className="text-xs text-sky-200">
          <strong>Sobre a visualização:</strong> {current.visualizationNote}
        </p>}
      </div>
      <div className="space-y-3">
        <div className="rounded-lg border border-amber-900/70 bg-amber-950/20 p-3">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-amber-200"><CircleAlert size={15}/> Atenção</div>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-200">{current.caution}</p>
        </div>
        <div className="rounded-lg border border-slate-700 p-3">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-cyan-200"><CheckCircle2 size={15}/> O que conferir</div>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-200">{current.verification}</p>
        </div>
      </div>
    </div>

    {current.arriving && <button type="button" onClick={onReplay}
      className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-800 px-3 py-2 text-sm text-cyan-200 hover:bg-cyan-950/40">
      <RotateCcw size={15}/> Reproduzir encaixe ilustrativo
    </button>}
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-3">
      <button type="button" onClick={()=>onIndex(Math.max(0,index-1))} disabled={index===0}
        className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-2 text-sm disabled:opacity-40">
        <ChevronLeft size={16}/> Anterior
      </button>
      <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-200">
        <input type="checkbox" checked={completed} onChange={()=>onToggle(current.id)} className="accent-cyan-400"/>
        Marcar como verificada
      </label>
      <button type="button" onClick={()=> index===steps.length-1 ? onClose() : onIndex(index+1)}
        className="inline-flex items-center gap-1 rounded-lg bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-200">
        {index===steps.length-1?"Encerrar":"Próxima"} <ChevronRight size={16}/>
      </button>
    </div>
    <p className="text-xs text-slate-400">A marcação registra somente sua conferência no tutorial desta sessão. Não valida automaticamente uma montagem real.</p>
  </section>;
}
