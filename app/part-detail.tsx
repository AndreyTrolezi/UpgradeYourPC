"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CircleAlert, CircleHelp, ExternalLink, FlaskConical, ImageOff, Layers, Loader2, ShieldCheck, SquareStack } from "lucide-react";
import { catalog, categoryMeta } from "@/app/data/catalog";
import { productMediaFor } from "@/app/data/product-media";
import { compareMetrics, glossaryById } from "@/app/data/glossary";
import { formatSpecValue } from "@/app/lib/compatibility";
import { changePcPart, diagnosePc, multipleSlots } from "@/app/lib/my-pc";
import { partAnalysis, partHierarchy, partIdentity, relatedParts } from "@/app/lib/part-insights";
import type { Part, UserProfile } from "@/app/lib/types";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function PartDetail({ part, signedIn }: { part: Part; signedIn: boolean }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(signedIn);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [slot, setSlot] = useState("0");
  const [term, setTerm] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState(false);

  const identity = partIdentity(part);
  const hierarchy = partHierarchy(part);
  const analysis = partAnalysis(part);
  const alternatives = relatedParts(part, catalog);
  const media = productMediaFor(part);
  const family = part.category === "gpu" ? catalog.filter(item => item.id !== part.id && partIdentity(item).family === identity.family) : [];
  const allParts = [...catalog, ...(profile?.customParts ?? [])];
  const build = profile?.currentBuild;
  const candidate = build ? changePcPart(build, part.category, Number(slot), part.id) : null;
  const checks = candidate ? diagnosePc(candidate, allParts) : [];
  const conflicts = checks.filter(check => check.status === "attention");
  const before = build ? diagnosePc(build, allParts) : [];
  const added = conflicts.filter(check => !before.some(previous => previous.id === check.id && previous.status === "attention"));
  const simulateUrl = `/meu-pc?simulate=${encodeURIComponent(part.id)}&slot=${slot}`;

  useEffect(() => {
    if (!signedIn) return;
    let active = true;
    setLoading(true);
    setError(false);
    fetch("/api/profile", { cache: "no-store", signal: AbortSignal.timeout(15000) })
      .then(async response => {
        if (!response.ok) throw Error();
        return response.json() as Promise<{ profile: UserProfile }>;
      })
      .then(data => { if (active) setProfile(data.profile); })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [signedIn, attempt]);

  const selectedTerm = term ? glossaryById(term) : undefined;
  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100">
      <header className="border-b border-white/10"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-8"><a href="/" className="flex items-center gap-2 text-sm font-semibold"><ArrowLeft className="size-4" />Explorar peças</a><a href="/meu-pc" className="text-sm text-cyan-200">Meu PC →</a></div></header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-7 sm:px-8">
        <section className="grid items-start gap-5 xl:grid-cols-[360px_minmax(0,1fr)_330px]">
          <div className="lab-panel overflow-hidden">
            <div className="relative flex min-h-[320px] items-center justify-center bg-white p-7">
              {media && !imageFailed ? <img src={media.imageUrl} alt={media.alt} className="max-h-[300px] w-full object-contain" referrerPolicy="no-referrer" onError={() => setImageFailed(true)} /> : <div className="max-w-56 text-center text-slate-500"><ImageOff className="mx-auto size-10" /><p className="mt-4 text-sm font-semibold">Foto verificada ainda não disponível</p><p className="mt-2 text-xs leading-5">A ficha continua útil sem usar uma imagem de outro modelo.</p></div>}
              {media && !imageFailed && <span className="absolute left-4 top-4 rounded-full bg-slate-950/85 px-3 py-1 text-xs font-semibold text-white">{media.match === "exact" ? "Foto do modelo exato" : "Foto oficial da linha"}</span>}
            </div>
            <div className="border-t border-white/10 p-4 text-sm leading-6 text-slate-400">{media ? <><a href={media.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-200 underline underline-offset-4">Imagem do fabricante<ExternalLink className="ml-1 inline size-3" /></a>{media.match === "line" && <p className="mt-2">A aparência pode variar. Confira o sufixo e a revisão antes da compra.</p>}</> : <p>Nenhuma foto foi associada sem confirmação do modelo ou da linha.</p>}</div>
          </div>

          <div className="lab-panel p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2 text-sm text-cyan-200"><Layers className="size-4" />{categoryMeta[part.category].label}<span className="text-slate-500">/</span>{part.brand}</div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{part.name}</h1>
            <p className="mt-4 text-base leading-7 text-slate-400">{part.tags.includes("atual") ? `Ficha de ${part.name}: recursos, limitações e compatibilidade para planejar seu próximo passo.` : part.summary}</p>
            <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4"><p className="text-sm text-slate-400">Identidade no catálogo</p><p className="mt-1 font-semibold">{hierarchy.exactness}</p>{part.category === "gpu" && <p className="mt-2 text-sm text-slate-400">Base: {identity.vendor} · {identity.chip} · {part.specs.vram ?? "—"} GB</p>}</div>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">{compareMetrics[part.category].filter(metric => !metric.key.includes("Index")).slice(0, 3).map(metric => <div key={metric.key}><button className="text-left text-sm text-slate-400" disabled={!metric.termId} onClick={() => setTerm(metric.termId!)}>{metric.label}{metric.termId && <CircleHelp className="ml-1 inline size-3" />}</button><p className="mt-1 text-xl font-bold">{formatSpecValue(part.specs[metric.key], metric.unit)}</p></div>)}</div>
            <div className="mt-6 flex flex-wrap gap-3"><Button asChild className="bg-cyan-300 text-slate-950 hover:bg-cyan-200"><a href={`/?compare=${encodeURIComponent(part.id)}`}><SquareStack />Comparar esta peça</a></Button><Button asChild variant="outline" className="border-white/10 bg-white/5"><a href={simulateUrl}><FlaskConical />Simular no Meu PC</a></Button></div>
            <p className="mt-4 text-sm text-slate-500">{part.price > 0 ? `Referência estimada: ${part.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}. Sem cotação ao vivo.` : "Preço ainda não consultado para esta ficha."}</p>
          </div>

          <aside className="lab-panel p-5">
            <h2 className="flex items-center gap-2 text-lg font-bold"><ShieldCheck className="size-5 text-cyan-300" />E no seu PC?</h2>
            {!signedIn ? <><p className="mt-3 text-sm leading-6 text-slate-400">Entre no Meu PC para conferir esta peça junto da configuração que você salvou e iniciar uma simulação.</p><Button className="mt-5 w-full" asChild><a href={simulateUrl}>Entrar e simular<ArrowRight /></a></Button></> : loading ? <p className="mt-5 flex items-center gap-2 text-sm text-slate-400" role="status"><Loader2 className="size-4 animate-spin" />Carregando seu PC…</p> : error ? <><p className="mt-4 text-sm text-amber-200">Seu PC não carregou. A ficha da peça continua disponível.</p><Button className="mt-4" variant="outline" onClick={() => setAttempt(value => value + 1)}>Tentar novamente</Button></> : build && <><p className="mt-3 text-sm text-slate-400">Base: <b className="text-slate-200">{build.name}</b></p>{multipleSlots(part.category) && <div className="mt-4"><label id="replacement-slot" className="text-sm text-slate-400">Onde simular a peça</label><Select value={slot} onValueChange={setSlot}><SelectTrigger aria-labelledby="replacement-slot" className="mt-2 w-full"><SelectValue /></SelectTrigger><SelectContent>{(build.parts[part.category] ?? []).map((id, index) => <SelectItem key={`${id}-${index}`} value={String(index)}>Trocar {allParts.find(item => item.id === id)?.name ?? `item ${index + 1}`}</SelectItem>)}<SelectItem value={String(build.parts[part.category]?.length ?? 0)}>Adicionar outro item</SelectItem></SelectContent></Select></div>}<div className="my-4 rounded-xl border border-white/10 p-4"><p className="font-semibold">{added.length ? `${added.length} novo(s) ponto(s) de atenção` : "Sem novo conflito identificado"}</p><p className="mt-2 text-sm leading-6 text-slate-400">{checks.filter(check => check.status === "pending").length} verificações ainda precisam de dados ou conferência. Isso não garante compatibilidade integral.</p></div>{conflicts.slice(0, 3).map(conflict => <p key={conflict.id} className="mb-2 flex items-start gap-2 text-sm text-amber-200"><CircleAlert className="mt-0.5 size-4 shrink-0" />{conflict.title}</p>)}<Button className="mt-3 w-full bg-cyan-300 text-slate-950" asChild><a href={simulateUrl}>Abrir simulação<ArrowRight /></a></Button><p className="mt-3 text-sm text-slate-500">Apenas uma prévia. Seu PC salvo permanece como está.</p></>}
          </aside>
        </section>

        <Tabs defaultValue="hierarchy" className="gap-5">
          <div className="overflow-x-auto"><TabsList variant="line" className="h-12 min-w-max gap-3"><TabsTrigger value="hierarchy">Hierarquia do produto</TabsTrigger><TabsTrigger value="analysis">Análise Upgrade PC</TabsTrigger><TabsTrigger value="specs">Ficha técnica</TabsTrigger><TabsTrigger value="performance">Desempenho</TabsTrigger><TabsTrigger value="alternatives">Alternativas</TabsTrigger></TabsList></div>

          <TabsContent value="hierarchy" className="space-y-5">
            <section className="lab-panel p-6"><h2 className="text-xl font-bold">Do componente base ao modelo vendido</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">A hierarquia evita tratar o chip e a placa pronta como se fossem a mesma coisa. Em GPUs, por exemplo, NVIDIA, AMD ou Intel definem o chip; ASUS, Gigabyte, Gainward e outras montam variantes com refrigeração e construção próprias.</p><div className="mt-6 grid gap-3 md:grid-cols-4">{hierarchy.levels.map((level, index) => <div key={level.label} className="rounded-xl border border-white/10 bg-white/[0.025] p-4"><span className="text-xs font-bold text-cyan-300">0{index + 1}</span><p className="mt-3 text-sm text-slate-400">{level.label}</p><p className="mt-1 font-semibold leading-6">{index === 0 ? categoryMeta[part.category].label : level.value}</p></div>)}</div></section>
            <div className="grid gap-5 md:grid-cols-2"><section className="lab-panel p-6"><h2 className="text-lg font-bold">Posicionamento da construção</h2><p className="mt-4 text-2xl font-bold text-cyan-200">{hierarchy.position}</p><p className="mt-3 text-sm leading-6 text-slate-400">Base usada: {hierarchy.constructionBasis}. Isso organiza o catálogo; não substitui desmontagem, medição de temperatura, ruído ou qualidade elétrica.</p></section><section className="lab-panel p-6"><h2 className="text-lg font-bold">O que está confirmado?</h2><p className="mt-4 font-semibold">{hierarchy.exactness}</p><p className="mt-3 text-sm leading-6 text-slate-400">{hierarchy.exactModel ? "A análise pode usar as medidas e conexões desta ficha, respeitando a fonte vinculada." : "Não atribuímos cooler, PCB, ruído ou garantia de uma variante específica enquanto o SKU completo não estiver confirmado."}</p></section></div>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-5"><p className="text-sm leading-6 text-slate-400">Leitura editorial das especificações disponíveis. Não é um teste de bancada, review de usuário ou certificação de qualidade.{!part.source && " Esta ficha está em validação e ainda não tem fonte técnica vinculada."}</p><div className="grid gap-5 md:grid-cols-2"><section className="lab-panel p-6"><h2 className="text-lg font-bold">Pontos a favor</h2><ul className="mt-4 space-y-4">{analysis.strengths.map(text => <li key={text} className="flex gap-3 text-base leading-7 text-slate-300"><Check className="mt-1 size-4 shrink-0 text-emerald-300" />{text}</li>)}</ul></section><section className="lab-panel p-6"><h2 className="text-lg font-bold">O que conferir</h2><ul className="mt-4 space-y-4">{analysis.cautions.map(text => <li key={text} className="flex gap-3 text-base leading-7 text-slate-300"><CircleAlert className="mt-1 size-4 shrink-0 text-amber-300" />{text}</li>)}</ul></section></div><section className="lab-panel p-6"><h2 className="text-lg font-bold">Onde essa peça faz sentido?</h2><p className="mt-3 leading-7 text-slate-300">{analysis.audience}</p><p className="mt-3 leading-7 text-slate-400">A decisão depende do que você já tem e do objetivo da troca. Use a simulação acima para conferir encaixes; compare testes do seu programa ou jogo para avaliar o ganho.</p></section></TabsContent>

          <TabsContent value="specs"><section className="lab-panel overflow-hidden"><div className="border-b border-white/10 p-5"><h2 className="text-xl font-bold">Especificações cadastradas</h2><p className="mt-2 text-sm text-slate-400">Dados ausentes aparecem como “—”. Índices estimados do comparador não são medições desta ficha.</p></div><dl className="grid sm:grid-cols-2">{compareMetrics[part.category].filter(metric => !metric.key.includes("Index")).map(metric => <div key={metric.key} className="flex justify-between gap-5 border-b border-white/8 p-5"><dt className="text-sm text-slate-400">{metric.termId ? <button className="text-left underline decoration-dotted underline-offset-4" onClick={() => setTerm(metric.termId!)}>{metric.label}</button> : metric.label}</dt><dd className="text-right font-semibold">{formatSpecValue(part.specs[metric.key], metric.unit)}</dd></div>)}</dl></section></TabsContent>

          <TabsContent value="performance" className="space-y-5"><section className="lab-panel p-6"><h2 className="text-xl font-bold">O que os dados permitem dizer</h2><p className="mt-4 leading-7 text-slate-300">{analysis.performance}</p><div className="mt-5 rounded-xl border border-white/10 p-5"><h3 className="font-semibold">Sem benchmark medido vinculado a esta ficha</h3><p className="mt-2 text-sm leading-6 text-slate-400">Não há FPS, temperatura, ruído ou percentual de ganho verificado para apresentar. Os índices antigos do catálogo continuam no comparador como estimativas e não são usados aqui como resultados de teste.</p></div><h3 className="mt-6 font-semibold">Como comparar um teste</h3><div className="mt-3 grid gap-3 text-sm sm:grid-cols-3">{["Mesmo programa, versão e cena de teste", "Mesma CPU/GPU, RAM e condições térmicas", "Resolução, qualidade e upscaling declarados"].map(text => <p key={text} className="rounded-xl border border-white/10 p-4 leading-6 text-slate-400">{text}</p>)}</div></section></TabsContent>

          <TabsContent value="alternatives" className="space-y-5">{!!family.length && <section className="lab-panel p-6"><h2 className="text-xl font-bold">Mesmo chip, outras fichas</h2><p className="mt-2 text-sm text-slate-400">Cada modelo mantém suas próprias medidas, alimentação e fontes.</p><div className="mt-4 space-y-3">{family.map(item => <a key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 p-4 hover:border-cyan-300/30" href={`/pecas/${item.id}`}><span>{item.brand} · {item.name}</span><ArrowRight className="size-4 shrink-0" /></a>)}</div></section>}<div><h2 className="text-xl font-bold">Alternativas para comparar</h2><p className="mt-2 text-sm text-slate-400">Seleção pela categoria e, quando informado, pela plataforma. Não é um ranking de desempenho ou uma garantia de compatibilidade.</p></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{alternatives.map(item => <a className="lab-panel p-5 hover:border-cyan-300/30" key={item.id} href={`/pecas/${item.id}`}><p className="text-sm text-cyan-200">{item.brand}</p><h3 className="mt-2 text-lg font-bold">{item.name}</h3><p className="mt-3 text-sm text-slate-400">{item.platform ?? (partIdentity(item).family === identity.family ? "Mesmo chip e capacidade" : "Outra opção da categoria")}</p><span className="mt-4 block text-sm text-cyan-200">Ver análise →</span></a>)}</div></TabsContent>
        </Tabs>

        <section className="rounded-xl border border-white/10 p-5"><h2 className="font-semibold">Fontes e limites da análise</h2>{part.source ? <p className="mt-3 text-sm leading-6 text-slate-400"><a className="text-cyan-200 underline underline-offset-4" href={part.source.url} target="_blank" rel="noopener noreferrer">Ficha do fabricante<ExternalLink className="ml-1 inline size-3" /></a> · conferida no catálogo em {part.source.checkedAt}. A análise acima interpreta essa ficha; não substitui testes independentes.</p> : <p className="mt-3 text-sm leading-6 text-slate-400">Dados herdados do catálogo, com validação pendente. Nenhuma fonte de benchmark foi atribuída a esta peça.</p>}</section>
      </main>

      <Dialog open={!!selectedTerm} onOpenChange={open => !open && setTerm(null)}><DialogContent><DialogHeader><DialogTitle>{selectedTerm?.name}</DialogTitle><DialogDescription>{selectedTerm?.short}</DialogDescription></DialogHeader><p className="leading-7 text-slate-300">{selectedTerm?.practical}</p><p className="text-sm text-slate-400">Influencia: {selectedTerm?.affects.join(", ")}</p></DialogContent></Dialog>
    </div>
  );
}
