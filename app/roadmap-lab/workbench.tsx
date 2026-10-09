"use client";
import { lazy, Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { catalog, defaultCurrentBuild } from "@/app/data/catalog";
import { analyzeBuild } from "@/app/lib/compatibility";
import { answerUpgradeQuestion } from "@/app/lib/upgrade-assistant";
import { gpuInstallationManual } from "@/app/lib/assembly-manual";
import type { BuildConfig, Part } from "@/app/lib/types";
import { simulateLabGpu } from "@/app/lib/visual-lab";
const VisualEnginePro = lazy(() => import("@/app/roadmap-lab/visual-engine-pro").then(m => ({ default: m.VisualEnginePro })));

export function RoadmapLab({ sourceBuild = defaultCurrentBuild, availableParts = catalog, embedded = false }: {
  sourceBuild?: BuildConfig;
  availableParts?: Part[];
  embedded?: boolean;
}) {
  const [question, setQuestion] = useState("Minha configuração é compatível?");
  const [selectedGpu, setSelectedGpu] = useState(sourceBuild.parts.gpu?.[0] ?? "");
  // A sandbox simulation: selecting a GPU must never edit the user's saved PC.
  const build = useMemo<BuildConfig>(
    () => simulateLabGpu(sourceBuild, selectedGpu || null),
    [sourceBuild, selectedGpu],
  );
  const answer = useMemo(() => answerUpgradeQuestion(question, build, availableParts), [question, build, availableParts]);
  const compatibility = useMemo(() => analyzeBuild(build, availableParts), [build, availableParts]);
  const gpu = availableParts.find(p => p.id === selectedGpu && p.category === "gpu");
  const chassis = availableParts.find(p => p.id === build.parts.case?.[0] && p.category === "case");
  const gpuLength = typeof gpu?.specs.length === "number" && gpu.specs.length > 0 ? gpu.specs.length : 0;
  const maxLength = typeof chassis?.specs.gpuLength === "number" && chassis.specs.gpuLength > 0 ? chassis.specs.gpuLength : 0;
  const steps = gpuInstallationManual(gpu);
  return <main className={embedded ? "text-slate-100" : "min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10"}>
    <div className={"space-y-8 "+(embedded ? "" : "mx-auto max-w-5xl")}>
      <div>
        {!embedded && <Link href="/meu-pc" className="text-cyan-300 text-sm">← Voltar ao Meu PC</Link>}
        <h1 className="text-2xl font-bold mt-3">{embedded ? "Laboratório 3D · "+sourceBuild.name : "Laboratório de upgrades"}</h1>
        <p className="text-slate-400 mt-2">Experimente visualizações, tutoriais e trocas de GPU sem alterar sua configuração salva. O 3D é ilustrativo e não consulta preços ao vivo.</p>
        {embedded && <p className="mt-2 text-xs text-cyan-200">Visualizando {sourceBuild.name}. Alterações nesta tela são apenas simulações e não são salvas automaticamente.</p>}
      </div>
      <section className="rounded-2xl border border-slate-700 p-5 space-y-4"><h2 className="text-xl font-semibold">1. Compatibilidade</h2><label className="block text-sm" htmlFor="gpu">Simular placa de vídeo</label><select id="gpu" className="w-full rounded-lg bg-slate-900 border border-slate-600 p-3" value={selectedGpu} onChange={e => setSelectedGpu(e.target.value)}><option value="">Sem GPU</option>{availableParts.filter(p => p.category === "gpu").map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select><p className="text-sm text-slate-400">Configuração: {sourceBuild.name}. O motor confere dados cadastrados; BIOS, dimensões internas e conectores desconhecidos exigem conferência no fabricante.</p><div className="space-y-2">{compatibility.checks.map(c => <div key={c.id} className="rounded-lg border border-slate-800 p-3"><span className={c.severity === "error" ? "text-red-300" : c.severity === "warning" ? "text-amber-300" : c.severity === "ok" ? "text-emerald-300" : "text-slate-300"}>{c.severity.toUpperCase()}</span><strong className="ml-2">{c.title}</strong><p className="text-sm text-slate-400">{c.detail}</p></div>)}</div></section>
      <section className="rounded-2xl border border-slate-700 p-5 space-y-4"><h2 className="text-xl font-semibold">2. Assistente de upgrades — versão local</h2><label htmlFor="question" className="block text-sm">Pergunta</label><input id="question" value={question} onChange={e => setQuestion(e.target.value)} className="w-full rounded-lg bg-slate-900 border border-slate-600 p-3"/><p>{answer.text}</p>{answer.checks.length > 0 && <ul className="list-disc pl-5 text-amber-200 text-sm">{answer.checks.map((c,i) => <li key={i}>{c}</li>)}</ul>}</section>
      <Suspense fallback={<div className="rounded-xl border border-slate-700 p-8 text-slate-300">Carregando Visual Engine 3D...</div>}><VisualEnginePro gpu={gpu} clearance={{ length: gpuLength, limit: maxLength }} /></Suspense>
      <details className="rounded-2xl border border-slate-700 p-5 group">
        <summary className="cursor-pointer font-semibold text-lg text-slate-200">
          Manual complementar: instalação de GPU (somente texto)
        </summary>
        <p className="mt-3 text-sm text-slate-400">O tutorial interativo fica dentro do Visual Engine 3D, no botão “Iniciar montagem guiada”. Este manual complementar preserva instruções específicas para a GPU. Confira a documentação do fabricante antes da instalação.</p>
        <div className="mt-4 grid gap-3">{steps.map((s,i) => <article key={s.title} className="rounded-lg bg-slate-900 p-4">
          <h3 className="font-semibold text-cyan-300">Etapa {i+1}: {s.title}</h3>
          <p className="mt-2">{s.instruction}</p>
          <p className="text-amber-200 text-sm mt-2">{s.caution}</p>
        </article>)}</div>
      </details>
    </div>
  </main>;
}
