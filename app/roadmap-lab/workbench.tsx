"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { catalog, defaultCurrentBuild } from "@/app/data/catalog";
import { analyzeBuild } from "@/app/lib/compatibility";
import { answerUpgradeQuestion } from "@/app/lib/upgrade-assistant";
import { gpuInstallationManual } from "@/app/lib/assembly-manual";
import { VisualEngine3D } from "@/app/roadmap-lab/visual-engine-3d";

export function RoadmapLab() {
  const [question, setQuestion] = useState("Minha configuração é compatível?");
  const [selectedGpu, setSelectedGpu] = useState(defaultCurrentBuild.parts.gpu?.[0] ?? "");
  const build = useMemo(() => ({ ...defaultCurrentBuild, parts: { ...defaultCurrentBuild.parts, gpu: selectedGpu ? [selectedGpu] : [] } }), [selectedGpu]);
  const answer = useMemo(() => answerUpgradeQuestion(question, build), [question, build]);
  const compatibility = useMemo(() => analyzeBuild(build), [build]);
  const gpu = catalog.find(p => p.id === selectedGpu && p.category === "gpu");
  const steps = gpuInstallationManual(gpu);
  return <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
    <div className="mx-auto max-w-5xl space-y-8">
      <div><Link href="/meu-pc" className="text-cyan-300 text-sm">← Voltar ao Meu PC</Link><h1 className="text-3xl font-bold mt-3">Laboratório de upgrades</h1><p className="text-slate-400 mt-2">Protótipo local e experimental. Não utiliza IA externa nem consulta preços ao vivo.</p></div>
      <section className="rounded-2xl border border-slate-700 p-5 space-y-4"><h2 className="text-xl font-semibold">1. Compatibilidade</h2><label className="block text-sm" htmlFor="gpu">Simular placa de vídeo</label><select id="gpu" className="w-full rounded-lg bg-slate-900 border border-slate-600 p-3" value={selectedGpu} onChange={e => setSelectedGpu(e.target.value)}><option value="">Sem GPU</option>{catalog.filter(p => p.category === "gpu").map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select><p className="text-sm text-slate-400">Dados do PC de exemplo. Medidas e conectores desconhecidos exigem conferência no fabricante.</p><div className="space-y-2">{compatibility.checks.map(c => <div key={c.id} className="rounded-lg border border-slate-800 p-3"><span className={c.severity === "error" ? "text-red-300" : c.severity === "warning" ? "text-amber-300" : c.severity === "ok" ? "text-emerald-300" : "text-slate-300"}>{c.severity.toUpperCase()}</span><strong className="ml-2">{c.title}</strong><p className="text-sm text-slate-400">{c.detail}</p></div>)}</div></section>
      <section className="rounded-2xl border border-slate-700 p-5 space-y-4"><h2 className="text-xl font-semibold">2. Assistente de upgrades — versão local</h2><label htmlFor="question" className="block text-sm">Pergunta</label><input id="question" value={question} onChange={e => setQuestion(e.target.value)} className="w-full rounded-lg bg-slate-900 border border-slate-600 p-3"/><p>{answer.text}</p>{answer.checks.length > 0 && <ul className="list-disc pl-5 text-amber-200 text-sm">{answer.checks.map((c,i) => <li key={i}>{c}</li>)}</ul>}</section>
      <VisualEngine3D gpu={gpu} clearance={{ length: typeof gpu?.specs.length === "number" ? gpu.specs.length : 0, limit: (() => { const c = catalog.find(p => p.id === build.parts.case?.[0]); return typeof c?.specs.gpuLength === "number" ? c.specs.gpuLength : 0; })() }} />
      <section className="rounded-2xl border border-slate-700 p-5 space-y-4"><h2 className="text-xl font-semibold">3. Guia de montagem: instalar GPU</h2><p className="text-sm text-slate-400">Sequência técnica genérica. Confirme o manual específico da GPU, gabinete e fonte antes de executar.</p><div className="grid gap-3">{steps.map((s,i) => <article key={s.title} className="rounded-lg bg-slate-900 p-4"><h3 className="font-semibold text-cyan-300">Etapa {i+1}: {s.title}</h3><p className="mt-2">{s.instruction}</p><p className="text-amber-200 text-sm mt-2">{s.caution}</p></article>)}</div></section>
    </div>
  </main>;
}
