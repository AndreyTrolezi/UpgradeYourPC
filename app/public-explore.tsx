"use client";

import { useState } from "react";
import { ArrowRight, BookOpen, Cpu, LockKeyhole, PackageSearch, SquareStack } from "lucide-react";
import { catalog, categoryMeta } from "@/app/data/catalog";
import { CatalogView, CompareView, GlossaryView, TermDialog } from "@/app/lab-app";
import type { Part } from "@/app/lib/types";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

const publicParts = catalog.map(part => part.tags.includes("atual") ? { ...part, summary: `${categoryMeta[part.category].label} ${part.brand}. Consulte as especificações para comparar com outros modelos.`, tags: part.tags.filter(tag => tag !== "atual") } : part);

export function PublicExplore({ initialCompareId }: { initialCompareId?: string }) {
  const initialPart = publicParts.find(p => p.id === initialCompareId);
  const [tab, setTab] = useState(initialPart ? "compare" : "catalog");
  const [term, setTerm] = useState<string | null>(null);
  const [comparison, setComparison] = useState<Part | undefined>(initialPart);
  return <TooltipProvider><div className="min-h-screen bg-[#070b13] text-slate-100">
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#070b13]/95 backdrop-blur-xl"><div className="mx-auto flex max-w-[1500px] items-center gap-4 px-4 py-4 sm:px-8"><a href="/" className="flex items-center gap-3" aria-label="Upgrade PC, início"><span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-cyan-300 to-violet-400 font-black text-slate-950">UP</span><span className="text-sm font-black tracking-[.12em]">UPGRADE PC</span></a><span className="hidden border-l border-white/15 pl-5 text-sm text-slate-400 sm:inline">Explorar peças</span><Button asChild className="ml-auto bg-cyan-300 text-slate-950 hover:bg-cyan-200"><a href="/meu-pc"><Cpu />Meu PC<ArrowRight className="hidden sm:block" /></a></Button></div></header>
    <main className="mx-auto max-w-[1500px] space-y-7 px-4 py-7 sm:px-8 sm:py-10">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]"><div className="py-2"><p className="text-sm font-semibold text-cyan-300">HARDWARE PARA ENTENDER E ESCOLHER</p><h1 className="mt-4 max-w-3xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl">Conheça suas peças.<br /><span className="text-slate-400">Planeje seu próximo passo.</span></h1><p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">Explore o catálogo, compare modelos AMD e Intel e entenda o que cada especificação muda no uso real.</p><div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-500"><span>{catalog.length} modelos no catálogo</span><span>9 categorias</span><span>Consulta sem cadastro</span></div></div><aside className="lab-panel flex flex-col justify-center p-6"><div className="flex items-center gap-2 font-semibold text-cyan-200"><Cpu className="size-5" />Seu computador tem um lugar aqui</div><p className="mt-3 text-sm leading-6 text-slate-400">Cadastre seu PC, confira a compatibilidade e simule trocas com um histórico das configurações salvas.</p><Button asChild variant="outline" className="mt-5 w-full border-white/10 bg-white/5"><a href="/meu-pc">Acessar meu espaço<ArrowRight /></a></Button><p className="mt-3 flex items-center gap-2 text-xs text-slate-500"><LockKeyhole className="size-3" />Configurações privadas na sua conta</p></aside></section>
      <Tabs value={tab} onValueChange={setTab} className="gap-5"><div className="overflow-x-auto"><TabsList variant="line" className="h-12 min-w-max gap-4 border-b border-white/10"><TabsTrigger className="px-3" value="catalog"><PackageSearch />Catálogo</TabsTrigger><TabsTrigger className="px-3" value="compare"><SquareStack />Comparar peças</TabsTrigger><TabsTrigger className="px-3" value="glossary"><BookOpen />Entenda os termos</TabsTrigger></TabsList></div>
        {tab !== "glossary" && <p className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm leading-6 text-slate-400">As fichas estão em validação. Preços de referência e índices de desempenho são estimativas do catálogo, sem cotação ao vivo. Confira o modelo exato e a ficha do fabricante.</p>}
        <TabsContent value="catalog"><CatalogView parts={publicParts} publicMode onAddCustom={() => {}} onUse={part => { setComparison(part); setTab("compare"); }} onTerm={setTerm} /></TabsContent>
        <TabsContent value="compare"><CompareView key={comparison?.id ?? "default"} parts={publicParts} publicMode initialPart={comparison} onTerm={setTerm} onUse={() => {}} /></TabsContent>
        <TabsContent value="glossary"><GlossaryView extensions={[]} onOpen={setTerm} /></TabsContent>
      </Tabs>
    </main><footer className="mx-auto flex max-w-[1500px] flex-wrap justify-between gap-3 border-t border-white/10 px-4 py-6 text-sm text-slate-500 sm:px-8"><span>Upgrade PC · AMD, Intel e suas possibilidades.</span><a href="/meu-pc" className="hover:text-cyan-200">Ir para Meu PC →</a></footer>
    <TermDialog termId={term} onOpenChange={open => !open && setTerm(null)} /><Toaster position="bottom-right" richColors />
  </div></TooltipProvider>;
}
