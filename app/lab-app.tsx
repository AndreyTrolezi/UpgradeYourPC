"use client";

import { catalog, categoryMeta, blankBuild } from "@/app/data/catalog";
import { PartCatalog } from "@/app/part-catalog";
import { MyPcView } from "@/app/my-pc-view";
import { changePcPart } from "@/app/lib/my-pc";
import { SmartView } from "@/app/smart-view";
import { PriceSummary } from "@/app/price-summary";
import { MarketView } from "@/app/market-view";
import { compareMetrics, glossary, glossaryById } from "@/app/data/glossary";
import { analyzeBuild, firstPart, formatSpecValue, getBuildParts, recommendParts, totalPrice, partPrice } from "@/app/lib/compatibility";
import { builtInExtensions, exampleManifest, parseExtensionManifest, permissionLabels } from "@/app/lib/extensions";
import { makeDefaultProfile } from "@/app/lib/profile";
import type { BuildConfig, Offer, Part, PartCategory, SavedBuild, StoredExtension, UserProfile, PcHistoryEntry } from "@/app/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarRail, SidebarTrigger,
} from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  BookOpen, Boxes, Check, ChevronRight, CircleAlert, CircleCheck, CircleHelp, CircleX,
  Copy, Cpu, Database, Download, FileJson, FileSpreadsheet, FileText, Gauge, HardDrive,
  LayoutDashboard, LockKeyhole, MemoryStick, MessageCircle, Monitor, PackagePlus, PackageSearch,
  PanelTop, Plug, Plus, Power, Printer, Puzzle, RotateCcw, Save, Search, Settings2, ShieldAlert,
  ShieldCheck, Sparkles, SquareStack, Thermometer, Trash2, Wrench, X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

export type ViewId = "assistant" | "overview" | "my-pc" | "builder" | "compare" | "catalog" | "prices" | "glossary" | "extensions";

const categoryIcons: Record<PartCategory, LucideIcon> = {
  cpu: Cpu, motherboard: PanelTop, gpu: Gauge, memory: MemoryStick, storage: HardDrive,
  psu: Power, cooler: Thermometer, case: Boxes, monitor: Monitor,
};

const navItems: Array<{ id: ViewId; label: string; icon: LucideIcon; hint: string }> = [
  { id: "assistant", label: "Consultor", icon: Sparkles, hint: "Montar por descrição" },
  { id: "overview", label: "Visão geral", icon: LayoutDashboard, hint: "Resumo do laboratório" },
  { id: "my-pc", label: "Meu PC", icon: Cpu, hint: "Configuração atual" },
  { id: "builder", label: "Montador", icon: Wrench, hint: "Criar e validar" },
  { id: "compare", label: "Comparar", icon: SquareStack, hint: "Todas as peças" },
  { id: "catalog", label: "Catálogo", icon: PackageSearch, hint: "Peças e fichas" },
  { id: "prices", label: "Preços", icon: ShieldCheck, hint: "Ofertas confiáveis" },
  { id: "glossary", label: "Glossário", icon: BookOpen, hint: "Termos na prática" },
  { id: "extensions", label: "Extensões", icon: Puzzle, hint: "Plug-ins e permissões" },
];

const money = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value || 0);
const clone = <T,>(value: T): T => structuredClone(value);
const unique = <T,>(values: T[]) => [...new Set(values)];

function downloadFile(filename: string, contents: string, type: string) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function buildText(build: BuildConfig, parts: Part[]) {
  const lines = [`${build.name}`, ""];
  for (const category of Object.keys(categoryMeta) as PartCategory[]) {
    const selected = getBuildParts(build, category, parts);
    if (!selected.length) continue;
    lines.push(`${categoryMeta[category].label}: ${selected.map((item) => item.name).join(" + ")}`);
  }
  lines.push("", `Total de referência: ${money(totalPrice(build, parts))}`);
  if (getBuildParts(build, undefined, parts).some(p => p.priceStatus === "unpriced" && !partPrice(build, p))) lines.push("Total parcial: há peças sem preço.");
  for (const p of getBuildParts(build, undefined, parts)) {
    const source = build.priceSources?.[p.id];
    if (source) lines.push(`${p.name}: ${money(partPrice(build, p))} — ${source.method === "mean" ? "média" : "mediana"} de ${source.sampleSize} lojas em ${new Date(source.checkedAt).toLocaleDateString("pt-BR")}, sem frete e cupons.`);
  }
  if (build.notes) lines.push(`Observações: ${build.notes}`);
  lines.push("", "Montado no Upgrade Lab");
  return lines.join("\n");
}

function buildCsv(build: BuildConfig, parts: Part[]) {
  const rows = [["Categoria", "Fabricante", "Peça", "Preço de referência", "Qualidade", "Origem do preço", "Data da consulta"]];
  for (const category of Object.keys(categoryMeta) as PartCategory[]) {
    for (const item of getBuildParts(build, category, parts)) {
      const source = build.priceSources?.[item.id];
      rows.push([categoryMeta[category].label, item.brand, item.name, item.priceStatus === "unpriced" && !partPrice(build, item) ? "Não consultado" : String(partPrice(build, item)).replace(".", ","), item.quality, source ? `${source.method === "mean" ? "Média" : "Mediana"} de ${source.sampleSize} lojas, sem frete/cupons` : "Estimativa do catálogo", source?.checkedAt ?? ""]);
    }
  }
  rows.push(["TOTAL CONHECIDO", "", "", String(totalPrice(build, parts)).replace(".", ","), "", "Peças sem preço não estão somadas", ""]);
  const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
  return "\uFEFF" + rows.map((row) => row.map(escape).join(";")).join("\r\n");
}

export function LabApp({ user, initialView = "my-pc", initialSimulation, initialImport = false }: { user: { displayName: string; email: string }; initialView?: ViewId; initialSimulation?: { partId: string; slot: number }; initialImport?: boolean }) {
  const [view, setView] = useState<ViewId>(initialView);
  const [profile, setProfile] = useState<UserProfile>(() => makeDefaultProfile(user.displayName));
  const [savedBuilds, setSavedBuilds] = useState<SavedBuild[]>([]);
  const [extensions, setExtensions] = useState<StoredExtension[]>(() => builtInExtensions.map((manifest) => ({ pluginId: manifest.id, manifest, enabled: true, installedAt: new Date(0).toISOString() })));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [termId, setTermId] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportTarget, setExportTarget] = useState<"current" | "draft">("draft");
  const [extensionOpen, setExtensionOpen] = useState(false);
  const [manifestSource, setManifestSource] = useState(exampleManifest);
  const [customPartOpen, setCustomPartOpen] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  const [history, setHistory] = useState<PcHistoryEntry[]>([]);
  const [revision, setRevision] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [profileError, setProfileError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [saveError, setSaveError] = useState("");
  const [customTarget, setCustomTarget] = useState<{ category: PartCategory; index: number } | null>(null);
  const editRevision = useRef(0);
  const saveLock = useRef(false);
  const dirtyRef = useRef(false);

  const allParts = useMemo(() => [...catalog, ...profile.customParts], [profile.customParts]);
  const activeBuild = exportTarget === "current" ? profile.currentBuild : profile.draftBuild;

  useEffect(() => {
    let active = true;
    setLoading(true); setProfileError(false);
    Promise.allSettled([
      fetch("/api/profile", { cache: "no-store" }).then((response) => response.ok ? response.json() as Promise<{ profile: UserProfile; revision: string | null; savedAt: string | null; history: PcHistoryEntry[] }> : Promise.reject(new Error("profile"))),
      fetch("/api/builds", { cache: "no-store" }).then((response) => response.ok ? response.json() as Promise<{ builds: SavedBuild[] }> : Promise.reject(new Error("builds"))),
      fetch("/api/extensions", { cache: "no-store" }).then((response) => response.ok ? response.json() as Promise<{ extensions: StoredExtension[] }> : Promise.reject(new Error("extensions"))),
    ]).then(([profileResult, buildsResult, extensionsResult]) => {
      if (!active) return;
      if (profileResult.status === "fulfilled" && profileResult.value.profile) {
        setProfile(profileResult.value.profile); setRevision(profileResult.value.revision); setSavedAt(profileResult.value.savedAt); setHistory(profileResult.value.history ?? []);
      } else { setProfileError(true); }
      if (buildsResult.status === "fulfilled" && Array.isArray(buildsResult.value.builds)) setSavedBuilds(buildsResult.value.builds);
      if (extensionsResult.status === "fulfilled" && Array.isArray(extensionsResult.value.extensions)) {
        const stored = extensionsResult.value.extensions as StoredExtension[];
        const builtIns = builtInExtensions.map((manifest) => {
          const match = stored.find((item) => item.pluginId === manifest.id);
          return match ? { ...match, manifest } : { pluginId: manifest.id, manifest, enabled: true, installedAt: new Date(0).toISOString() };
        });
        setExtensions([...builtIns, ...stored.filter((item) => !builtInExtensions.some((manifest) => manifest.id === item.pluginId))]);
      }
      if ([buildsResult, extensionsResult].some((result) => result.status === "rejected")) toast.warning("Montagens ou extensões não carregaram. Recarregue a página para tentar novamente.");
      setLoading(false);
    });
    return () => { active = false; };
  }, [loadAttempt]);
  useEffect(() => {
    dirtyRef.current = dirty;
    const warn = (event: BeforeUnloadEvent) => { if (dirtyRef.current) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const changeProfile = (updater: (current: UserProfile) => UserProfile) => {
    if (loading || profileError) return;
    editRevision.current += 1;
    setProfile((current) => updater(current));
    setDirty(true);
  };

  async function saveProfile() {
    if (loading || profileError || saveLock.current || !dirty) return;
    saveLock.current = true; setSaving(true); setSaveError("");
    const savingRevision = editRevision.current;
    try {
      const response = await fetch("/api/profile", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ profile, expectedRevision: revision }) });
      const result = await response.json() as { error?: string; revision: string; savedAt: string; history: PcHistoryEntry[] };
      if (!response.ok) throw new Error(result.error ?? "Falha ao salvar");
      setRevision(result.revision); setSavedAt(result.savedAt); setHistory(result.history);
      if (savingRevision === editRevision.current) setDirty(false);
      toast.success("Configuração salva na sua conta.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível salvar agora.";
      setSaveError(message); toast.error(message);
    } finally { saveLock.current = false; setSaving(false); }
  }

  function updateBuild(target: "currentBuild" | "draftBuild", updater: (build: BuildConfig) => BuildConfig) {
    changeProfile((current) => ({ ...current, [target]: updater(clone(current[target])) }));
  }

  function setBuildPart(target: "currentBuild" | "draftBuild", category: PartCategory, index: number, id: string) {
    updateBuild(target, (build) => {
      const values = [...(build.parts[category] ?? [])];
      if (id === "__none") values.splice(index, 1); else values[index] = id;
      build.parts[category] = unique(values.filter(Boolean));
      return build;
    });
  }

  function addBuildSlot(target: "currentBuild" | "draftBuild", category: PartCategory) {
    const candidate = allParts.find((item) => item.category === category && !profile[target].parts[category]?.includes(item.id));
    if (!candidate) return toast.info("Não há outra peça disponível nessa categoria.");
    updateBuild(target, (build) => ({ ...build, parts: { ...build.parts, [category]: [...(build.parts[category] ?? []), candidate.id] } }));
  }

  async function saveBuildSnapshot() {
    const build = profile.draftBuild;
    try {
      const response = await fetch("/api/builds", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ build }) });
      const result = await response.json() as { error?: string; id: string; name: string; savedAt: string };
      if (!response.ok) throw new Error(result.error ?? "Falha ao salvar");
      const saved: SavedBuild = { id: result.id, name: result.name, payload: { ...clone(build), id: result.id }, createdAt: result.savedAt, updatedAt: result.savedAt };
      setSavedBuilds((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
      toast.success("Configuração adicionada à sua conta.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível salvar a configuração."); }
  }

  async function deleteSavedBuild(id: string) {
    try {
      const response = await fetch("/api/builds", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "delete", id }) });
      if (!response.ok) throw new Error("Não foi possível excluir");
      setSavedBuilds((current) => current.filter((item) => item.id !== id));
      toast.success("Configuração excluída.");
    } catch { toast.error("Não foi possível excluir a configuração."); }
  }

  function applyPlatform(platform: "AM4" | "AM5" | "Intel DDR4" | "Intel DDR5") {
    const next = clone(profile.currentBuild);
    next.id = `draft-${Date.now()}`;
    next.name = platform === "AM4" ? "Upgrade AM4 equilibrado" : `Migração ${platform}`;
    next.parts.monitor = ["odyssey-g5-32"];
    if (platform === "AM4") {
      next.parts.cpu = ["r7-5700x3d"]; next.parts.motherboard = ["asus-prime-b550ma"]; next.parts.memory = ["xpg-16-ddr4-3200"]; next.parts.cooler = ["ag400"];
    } else if (platform === "AM5") {
      next.parts.cpu = ["r5-7600"]; next.parts.motherboard = ["asrock-b650m-hdv"]; next.parts.memory = ["ddr5-32-6000"]; next.parts.cooler = ["ag400"];
    } else if (platform === "Intel DDR4") {
      next.parts.cpu = ["i5-13400f"]; next.parts.motherboard = ["asus-b760m-a-d4"]; next.parts.memory = ["ddr4-32-3200"]; next.parts.cooler = ["ag400"];
    } else {
      next.parts.cpu = ["i5-14600k"]; next.parts.motherboard = ["msi-b760-tomahawk"]; next.parts.memory = ["ddr5-32-6000"]; next.parts.cooler = ["ak620"];
    }
    changeProfile((current) => ({ ...current, draftBuild: next }));
    setView("builder");
    toast.success(`${platform} carregado no montador.`);
  }

  const titles: Record<ViewId, { title: string; subtitle: string }> = {
    assistant: { title: "Consultor de montagem", subtitle: "Descreva o uso e transforme o orçamento em uma configuração editável." },
    overview: { title: "Seu laboratório de hardware", subtitle: "Decisões de upgrade com contexto, compatibilidade e impacto prático." },
    "my-pc": { title: "Meu PC", subtitle: "Suas peças, suas escolhas e a evolução do seu computador." },
    builder: { title: "Montador universal", subtitle: "Combine AMD, Intel e todas as categorias; o diagnóstico muda em tempo real." },
    compare: { title: "Comparador de peças", subtitle: "Compare lado a lado qualquer categoria do computador." },
    catalog: { title: "Catálogo técnico", subtitle: "Consulte peças, construção, especificações e cadastre modelos próprios." },
    prices: { title: "Central de preços", subtitle: "Organize ofertas pelo custo real e pela procedência — não apenas pelo menor número." },
    glossary: { title: "Glossário na prática", subtitle: "Entenda o termo, o que ele significa no uso real e o que influencia." },
    extensions: { title: "Extensões do Upgrade Lab", subtitle: "Recursos independentes, permissões claras e uma futura comunidade de plug-ins." },
  };

  function openExport(target: "current" | "draft") { setExportTarget(target); setExportOpen(true); }

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen>
        <Sidebar collapsible="icon" className="border-r border-white/8 bg-[#080d18]">
          <SidebarHeader className="p-3">
            <div className="flex h-11 items-center gap-3 overflow-hidden rounded-xl border border-cyan-300/15 bg-white/[0.035] px-2.5">
              <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-cyan-300 to-violet-400 font-black text-slate-950 shadow-[0_0_24px_rgba(103,232,249,.25)]">UP</div>
              <div className="min-w-0 group-data-[collapsible=icon]:hidden">
                <div className="truncate text-sm font-black tracking-[.14em]">UPGRADE PC</div>
                <div className="text-[11px] text-slate-500">universal · AMD + Intel</div>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent className="px-2">
            <SidebarGroup><SidebarGroupContent><SidebarMenu><SidebarMenuItem><SidebarMenuButton asChild tooltip="Explorar peças"><a href="/" className="h-11 text-cyan-200"><PackageSearch /><span>Explorar peças <span className="ml-1 text-xs text-slate-500">↗</span></span></a></SidebarMenuButton></SidebarMenuItem></SidebarMenu></SidebarGroupContent></SidebarGroup>
            {[
              { label: "Meu espaço", ids: ["my-pc", "builder", "overview"] },
              { label: "Ferramentas", ids: ["catalog", "compare", "glossary"] },
              { label: "Outros recursos", ids: ["assistant", "prices", "extensions"] },
            ].map(group => <SidebarGroup key={group.label}>
              <SidebarGroupLabel className="text-xs font-semibold text-slate-500">{group.label}</SidebarGroupLabel>
              <SidebarGroupContent><SidebarMenu>{group.ids.map(id => navItems.find(item => item.id === id)!).map(item =>
                <SidebarMenuItem key={item.id}><SidebarMenuButton tooltip={item.hint} isActive={view === item.id} onClick={() => setView(item.id)} className="h-11 rounded-xl text-slate-400 data-[active=true]:bg-cyan-300/10 data-[active=true]:text-cyan-200 hover:bg-white/5 hover:text-white"><item.icon /><span>{item.label}</span></SidebarMenuButton></SidebarMenuItem>
              )}</SidebarMenu></SidebarGroupContent>
            </SidebarGroup>)}
          </SidebarContent>
          <SidebarFooter className="p-3">
            <div className="flex items-center gap-2 overflow-hidden rounded-xl border border-white/8 bg-white/[0.03] p-2">
              <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-violet-400/15 text-xs font-black text-violet-200">{profile.displayName.slice(0, 2).toUpperCase()}</div>
              <div className="min-w-0 group-data-[collapsible=icon]:hidden"><div className="truncate text-xs font-semibold">{profile.displayName}</div><div className="flex items-center gap-1 text-[10px] text-emerald-300"><LockKeyhole className="size-3" /> somente você</div></div>
            </div>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>

        <SidebarInset className="min-w-0 bg-[#070b13] text-slate-100">
          <header className="sticky top-0 z-30 flex min-h-16 items-center gap-3 border-b border-white/8 bg-[#070b13]/88 px-4 backdrop-blur-xl sm:px-6">
            <SidebarTrigger className="text-slate-400 hover:bg-white/5 hover:text-white" />
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-bold sm:text-lg">{titles[view].title}</h1>
              <p className="hidden truncate text-xs text-slate-500 md:block">{titles[view].subtitle}</p>
            </div>
            <div className="hidden items-center gap-2 text-xs text-slate-500 lg:flex">
              <span className={`size-1.5 rounded-full ${dirty ? "bg-amber-300" : "bg-emerald-300"}`} />
              {loading ? "carregando" : profileError ? "falha ao carregar" : dirty ? "alterações não salvas" : savedAt ? "salvo na conta" : "novo cadastro"}
            </div>
            <Button variant="outline" size="sm" aria-label="Exportar configuração" disabled={loading || profileError} onClick={() => openExport(view === "my-pc" ? "current" : "draft")} className="border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.07]"><Download /> <span className="hidden sm:inline">Exportar</span></Button>
            <Button size="sm" onClick={saveProfile} disabled={saving || loading || profileError || !dirty} aria-label={saving ? "Salvando configuração" : "Salvar alterações"} className="bg-cyan-300 text-slate-950 hover:bg-cyan-200"><Save /> <span className="hidden sm:inline">{saving ? "Salvando" : "Salvar"}</span></Button>
          </header>

          <div className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
            {saveError && <div role="alert" className="mb-5 rounded-xl border border-amber-300/30 bg-amber-300/5 p-4 text-sm text-amber-200">{saveError}</div>}
            {loading ? <div role="status" className="space-y-5 py-8"><p className="text-slate-400">Carregando seu espaço…</p><div className="h-52 animate-pulse rounded-2xl bg-white/5" /><div className="h-80 animate-pulse rounded-2xl bg-white/5" /></div> : profileError ? <div role="alert" className="lab-panel p-8"><CircleAlert className="size-8 text-amber-300" /><h2 className="mt-4 text-xl font-bold">Seu PC não carregou desta vez</h2><p className="mt-3 text-slate-400">Tente novamente para acessar sua configuração e continuar a edição.</p><Button className="mt-5 bg-cyan-300 text-slate-950" onClick={() => setLoadAttempt(value => value + 1)}>Tentar novamente</Button></div> : <>
            {["catalog", "compare", "builder"].includes(view) && <div className="mb-5 rounded-xl border border-amber-300/20 bg-amber-300/5 p-4 text-base text-amber-100">Catálogo em validação: preços-base e índices de desempenho são estimativas para simulação, não cotações atuais nem resultados de benchmark. Campos não confirmados aparecem como “—”. Confira a ficha do modelo exato, BIOS e disponibilidade antes da compra.</div>}
            {view === "assistant" && <SmartView onApply={(build) => { changeProfile((current) => ({ ...current, draftBuild: clone(build) })); setView("builder"); toast.success("Sugestão carregada. Revise e salve na sua conta."); }} />}
            {view === "overview" && <Overview profile={profile} parts={allParts} onOpen={setView} onPlatform={applyPlatform} />}
            {view === "my-pc" && <MyPcView initialSimulation={initialSimulation} initialImport={initialImport} customParts={profile.customParts} onImport={(build, customParts) => { changeProfile(current => ({ ...current, currentBuild: build, customParts })); toast.success("Importação aplicada à edição. Salve para guardar na conta."); }} build={profile.currentBuild} parts={allParts} history={history} savedAt={savedAt} dirty={dirty} onChange={build => changeProfile(current => ({ ...current, currentBuild: build }))} onTerm={setTermId} onExport={() => openExport("current")} onCustom={(category, index) => { setCustomTarget({ category, index }); setCustomPartOpen(true); }} onContinue={build => { changeProfile(current => ({ ...current, draftBuild: build })); setView("builder"); toast.info("Simulação carregada no montador. Salve para guardar."); }} />}
            {view === "builder" && <BuilderView build={profile.draftBuild} parts={allParts} savedBuilds={savedBuilds} onPart={(category, index, id) => setBuildPart("draftBuild", category, index, id)} onAdd={(category) => addBuildSlot("draftBuild", category)} onChange={(build) => changeProfile((current) => ({ ...current, draftBuild: build }))} onSave={saveBuildSnapshot} onLoad={(build) => { changeProfile((current) => ({ ...current, draftBuild: clone(build) })); toast.success("Configuração carregada no montador."); }} onDelete={deleteSavedBuild} onTerm={setTermId} onExport={() => openExport("draft")} />}
            {view === "compare" && <CompareView parts={allParts} onTerm={setTermId} onUse={(part) => { setBuildPart("draftBuild", part.category, 0, part.id); setView("builder"); }} />}
            {view === "catalog" && <CatalogView parts={allParts} onAddCustom={() => { setCustomTarget(null); setCustomPartOpen(true); }} onUse={(part) => { setBuildPart("draftBuild", part.category, 0, part.id); setView("builder"); toast.success(`${part.name} foi para o montador.`); }} onTerm={setTermId} />}
            {view === "prices" && <div className="space-y-5"><MarketView onUse={(snapshot, method) => {
              const part = catalog.find(p => p.id === snapshot.partId);
              const value = method === "mean" ? snapshot.mean : snapshot.median;
              if (!part || !value || snapshot.sampleSize < 3 || Date.parse(snapshot.expiresAt) <= Date.now()) return;
              updateBuild("draftBuild", build => ({ ...build, parts: { ...build.parts, [part.category]: [part.id] }, estimatedPrices: { ...build.estimatedPrices, [part.id]: value }, priceSources: { ...build.priceSources, [part.id]: { checkedAt: snapshot.checkedAt, sampleSize: snapshot.sampleSize, method } } }));
              setView("builder"); toast.success("Peça e referência de preço adicionadas ao montador.");
            }}/><PriceSummary parts={allParts} offers={profile.offers}/><PricesView profile={profile} parts={allParts} onChange={changeProfile} onAdd={() => setOfferOpen(true)} /></div>}
            {view === "glossary" && <GlossaryView extensions={extensions} onOpen={setTermId} />}
            {view === "extensions" && <ExtensionsView extensions={extensions} onToggle={async (item, enabled) => {
              try {
                const response = await fetch("/api/extensions", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ manifest: item.manifest, enabled }) });
                const result = await response.json() as { error?: string }; if (!response.ok) throw new Error(result.error);
                setExtensions((current) => current.map((entry) => entry.pluginId === item.pluginId ? { ...entry, enabled } : entry));
                toast.success(`${item.manifest.name} ${enabled ? "ativada" : "desativada"}.`);
              } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível atualizar a extensão."); }
            }} onImport={() => setExtensionOpen(true)} />}
            </>}
          </div>
        </SidebarInset>

        <TermDialog termId={termId} onOpenChange={(open) => !open && setTermId(null)} />
        <ExportDialog open={exportOpen} onOpenChange={setExportOpen} build={activeBuild} parts={allParts} />
        <ExtensionDialog open={extensionOpen} onOpenChange={setExtensionOpen} source={manifestSource} onSource={setManifestSource} onInstall={async () => {
          try {
            const manifest = parseExtensionManifest(manifestSource);
            if (extensions.some((item) => item.pluginId === manifest.id && item.manifest.builtIn)) throw new Error("Esse ID pertence a uma extensão interna.");
            const response = await fetch("/api/extensions", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ manifest, enabled: true }) });
            const result = await response.json() as { error?: string; savedAt: string }; if (!response.ok) throw new Error(result.error);
            const installed = { pluginId: manifest.id, manifest, enabled: true, installedAt: result.savedAt };
            setExtensions((current) => [...current.filter((item) => item.pluginId !== manifest.id), installed]);
            setExtensionOpen(false); toast.success("Manifesto instalado em modo seguro.");
          } catch (error) { toast.error(error instanceof Error ? error.message : "Manifesto inválido."); }
        }} />
        <CustomPartDialog key={customTarget ? customTarget.category + customTarget.index : "catalog"} initialCategory={customTarget?.category} open={customPartOpen} onOpenChange={setCustomPartOpen} onSave={(part) => { changeProfile(current => ({ ...current, customParts: [...current.customParts, part], currentBuild: customTarget && part.category === customTarget.category ? changePcPart(current.currentBuild, part.category, customTarget.index, part.id) : current.currentBuild })); setCustomPartOpen(false); toast.success("Peça adicionada. Salve para guardar na conta."); }} />
        <OfferDialog open={offerOpen} onOpenChange={setOfferOpen} parts={allParts} onSave={(offer) => { changeProfile((current) => ({ ...current, offers: [offer, ...current.offers] })); setOfferOpen(false); toast.success("Oferta cadastrada. Revise os dados antes de confiar."); }} />
        <Toaster position="bottom-right" richColors />
      </SidebarProvider>
    </TooltipProvider>
  );
}

function Overview({ profile, parts, onOpen, onPlatform }: { profile: UserProfile; parts: Part[]; onOpen: (view: ViewId) => void; onPlatform: (platform: "AM4" | "AM5" | "Intel DDR4" | "Intel DDR5") => void }) {
  const current = analyzeBuild(profile.currentBuild, parts);
  const draft = analyzeBuild(profile.draftBuild, parts);
  const currentCpu = firstPart(profile.currentBuild, "cpu", parts);
  const currentGpu = firstPart(profile.currentBuild, "gpu", parts);
  const currentMonitor = firstPart(profile.currentBuild, "monitor", parts);
  return (
    <div className="space-y-6">
      <section className="lab-hero">
        <div className="relative z-10 max-w-3xl">
          <div className="mb-4 flex flex-wrap items-center gap-2"><Badge className="border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">WORKSPACE PRIVADO</Badge><Badge variant="outline" className="border-white/10 text-slate-400">AMD + Intel</Badge><Badge variant="outline" className="border-white/10 text-slate-400">9 categorias</Badge></div>
          <h2 className="max-w-2xl text-3xl font-black leading-[1.04] tracking-[-.045em] sm:text-5xl">Seu PC é o ponto de partida. <span className="text-gradient">O contexto decide o upgrade.</span></h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">Compare plataformas completas, entenda cada termo e veja incompatibilidades antes de gastar. Nenhuma marca recebe preferência automática.</p>
          <div className="mt-6 flex flex-wrap gap-3"><Button onClick={() => onOpen("builder")} className="bg-cyan-300 text-slate-950 hover:bg-cyan-200"><Wrench /> Abrir montador</Button><Button variant="outline" onClick={() => onOpen("my-pc")} className="border-white/10 bg-white/5 hover:bg-white/10"><Settings2 /> Atualizar meu PC</Button></div>
        </div>
        <div className="lab-signal" aria-hidden="true"><span /><span /><span /><span /><span /></div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="CPU atual" value={currentCpu?.name ?? "Não informada"} note={currentCpu?.platform ?? "Defina a plataforma"} icon={Cpu} />
        <StatCard label="GPU atual" value={currentGpu?.name ?? "Não informada"} note={`${formatSpecValue(currentGpu?.specs.vram, "GB")} de VRAM`} icon={Gauge} />
        <StatCard label="Monitor principal" value={currentMonitor?.name ?? "Não informado"} note={`${formatSpecValue(currentMonitor?.specs.resolution)} · ${formatSpecValue(currentMonitor?.specs.refresh, "Hz")}`} icon={Monitor} />
        <StatCard label="Saúde da configuração" value={`${current.score}/100`} note={`${current.checks.filter((item) => item.severity === "error"). length} incompatibilidade(s) crítica(s)`} icon={ShieldCheck} accent={current.score >= 80} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <section className="lab-panel p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-3"><div><p className="lab-kicker">CAMINHOS DE PLATAFORMA</p><h3 className="text-xl font-bold">Compare sem ficar preso a uma marca</h3><p className="mt-1 text-sm text-slate-500">Cada botão prepara uma configuração coerente no montador.</p></div><Sparkles className="mt-1 size-5 text-violet-300" /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <PlatformCard title="Manter AM4" chip="menor custo total" detail="Ryzen 7 5700X3D, B550 e DDR4 atuais." tone="cyan" onClick={() => onPlatform("AM4")} />
            <PlatformCard title="Migrar para AM5" chip="longevidade" detail="Ryzen 5 7600, B650 e DDR5." tone="violet" onClick={() => onPlatform("AM5")} />
            <PlatformCard title="Intel + DDR4" chip="reaproveitamento" detail="Core i5-13400F, B760 e 32 GB DDR4." tone="blue" onClick={() => onPlatform("Intel DDR4")} />
            <PlatformCard title="Intel + DDR5" chip="desempenho misto" detail="Core i5-14600K, B760 e DDR5." tone="amber" onClick={() => onPlatform("Intel DDR5")} />
          </div>
        </section>
        <section className="lab-panel p-5 sm:p-6">
          <div className="flex items-center justify-between"><div><p className="lab-kicker">CONFIGURAÇÃO EM EDIÇÃO</p><h3 className="text-xl font-bold">{profile.draftBuild.name}</h3></div><ScorePill score={draft.score} /></div>
          <div className="my-5 space-y-3">
            {(["cpu", "gpu", "motherboard", "memory"] as PartCategory[]).map((category) => {
              const selected = firstPart(profile.draftBuild, category, parts); const Icon = categoryIcons[category];
              return <div key={category} className="flex items-center gap-3 rounded-xl border border-white/7 bg-black/15 p-3"><div className="grid size-9 place-items-center rounded-lg bg-white/5 text-slate-400"><Icon className="size-4" /></div><div className="min-w-0 flex-1"><div className="text-[11px] font-bold uppercase tracking-wider text-slate-600">{categoryMeta[category].label}</div><div className="truncate text-sm font-semibold">{selected?.name ?? "Não selecionada"}</div></div></div>;
            })}
          </div>
          <div className="flex items-center justify-between border-t border-white/8 pt-4"><div><div className="text-xs text-slate-500">Total de referência</div><div className="text-xl font-black">{money(draft.total)}</div></div><Button variant="outline" onClick={() => onOpen("builder")} className="border-white/10 bg-white/[0.03]">Continuar <ChevronRight /></Button></div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value, note, icon: Icon, accent }: { label: string; value: string; note: string; icon: LucideIcon; accent?: boolean }) {
  return <div className="lab-panel group p-4"><div className="mb-4 flex items-center justify-between"><span className="text-[11px] font-bold uppercase tracking-[.13em] text-slate-600">{label}</span><div className={`grid size-8 place-items-center rounded-lg ${accent ? "bg-emerald-300/10 text-emerald-300" : "bg-white/5 text-slate-500"}`}><Icon className="size-4" /></div></div><div className="line-clamp-2 min-h-12 text-base font-bold leading-6">{value}</div><div className="mt-2 text-xs text-slate-500">{note}</div></div>;
}

function PlatformCard({ title, chip, detail, tone, onClick }: { title: string; chip: string; detail: string; tone: string; onClick: () => void }) {
  return <button onClick={onClick} className={`platform-card platform-${tone}`}><div className="flex items-start justify-between gap-3"><strong>{title}</strong><ChevronRight className="size-4 shrink-0" /></div><span>{chip}</span><p>{detail}</p></button>;
}

function BuildEditor({ build, parts, onPart, onAdd, onChange, onExport }: { build: BuildConfig; parts: Part[]; onPart: (category: PartCategory, index: number, id: string) => void; onAdd: (category: PartCategory) => void; onChange: (build: BuildConfig) => void; onExport: () => void }) {
  const result = analyzeBuild(build, parts);
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
      <section className="lab-panel overflow-hidden">
        <div className="border-b border-white/8 p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="lab-kicker">BASE DAS RECOMENDAÇÕES</p><h2 className="text-2xl font-black">Peças instaladas</h2><p className="mt-1 text-sm text-slate-500">Você pode alterar esta configuração a qualquer momento.</p></div><Button variant="outline" onClick={onExport} className="border-white/10 bg-white/[0.03]"><Download /> Exportar meu PC</Button></div></div>
        <div className="divide-y divide-white/7">
          {(Object.keys(categoryMeta) as PartCategory[]).map((category) => <PartRows key={category} category={category} build={build} parts={parts} onPart={onPart} onAdd={onAdd} />)}
        </div>
      </section>
      <aside className="space-y-5">
        <section className="lab-panel p-5"><div className="mb-4 flex items-center justify-between"><div><p className="lab-kicker">DIAGNÓSTICO ATUAL</p><h3 className="text-xl font-bold">Visão do conjunto</h3></div><ScoreDial score={result.score} /></div><CheckList checks={result.checks.slice(0, 6)} /></section>
        <section className="lab-panel space-y-4 p-5"><Field label="Nome do perfil"><Input value={build.name} onChange={(event) => onChange({ ...build, name: event.target.value })} className="lab-input" /></Field><Field label="Uso principal"><SimpleSelect value={build.goal} onValue={(value) => onChange({ ...build, goal: value as BuildConfig["goal"] })} options={[{ value: "games", label: "Jogos" }, { value: "balanced", label: "Equilibrado" }, { value: "work", label: "Produtividade" }]} /></Field><Field label="Observações"><Textarea value={build.notes} onChange={(event) => onChange({ ...build, notes: event.target.value })} className="min-h-24 border-white/10 bg-black/20" placeholder="Ex.: pretendo trocar primeiro a CPU..." /></Field></section>
      </aside>
    </div>
  );
}

function PartRows({ category, build, parts, onPart, onAdd }: { category: PartCategory; build: BuildConfig; parts: Part[]; onPart: (category: PartCategory, index: number, id: string) => void; onAdd: (category: PartCategory) => void }) {
  const Icon = categoryIcons[category];
  const selected = build.parts[category] ?? [];
  const rows = selected.length ? selected : [""];
  return (
    <div className="grid gap-4 p-4 sm:grid-cols-[190px_minmax(0,1fr)] sm:p-5">
      <div className="flex gap-3"><div className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/5 text-slate-400"><Icon className="size-4" /></div><div><div className="text-sm font-bold">{categoryMeta[category].label}</div><p className="mt-1 text-xs leading-5 text-slate-600">{categoryMeta[category].description}</p></div></div>
      <div className="space-y-2">
        {rows.map((id, index) => <div key={`${category}-${index}`} className="flex gap-2"><PartSelect category={category} value={id || "__none"} parts={parts} onValue={(value) => onPart(category, index, value)} /><Button size="icon" variant="ghost" aria-label="Remover peça" onClick={() => onPart(category, index, "__none")} className="shrink-0 text-slate-500 hover:bg-rose-400/10 hover:text-rose-300"><X /></Button></div>)}
        {categoryMeta[category].multi && <Button size="sm" variant="ghost" onClick={() => onAdd(category)} className="text-cyan-300 hover:bg-cyan-300/10 hover:text-cyan-200"><Plus /> Adicionar outro</Button>}
      </div>
    </div>
  );
}

function BuilderView({ build, parts, savedBuilds, onPart, onAdd, onChange, onSave, onLoad, onDelete, onTerm, onExport }: { build: BuildConfig; parts: Part[]; savedBuilds: SavedBuild[]; onPart: (category: PartCategory, index: number, id: string) => void; onAdd: (category: PartCategory) => void; onChange: (build: BuildConfig) => void; onSave: () => void; onLoad: (build: BuildConfig) => void; onDelete: (id: string) => void; onTerm: (id: string) => void; onExport: () => void }) {
  const result = analyzeBuild(build, parts);
  const [focusCategory, setFocusCategory] = useState<PartCategory>("cpu");
  const recommendations = recommendParts(focusCategory, build, 3, parts);
  return (
    <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_410px]">
      <div className="space-y-5">
        <section className="lab-panel p-5 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/8 pb-5"><div className="min-w-[240px] flex-1"><Field label="Nome da configuração"><Input value={build.name} onChange={(event) => onChange({ ...build, name: event.target.value })} className="lab-input h-11 text-base font-bold" /></Field></div><div className="flex gap-2"><Button variant="outline" onClick={() => onChange(clone(blankBuild))} className="border-white/10 bg-white/[0.03]"><RotateCcw /> Limpar</Button><Button onClick={onSave} className="bg-cyan-300 text-slate-950 hover:bg-cyan-200"><Save /> Salvar cópia</Button></div></div>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <Field label="Objetivo"><SimpleSelect value={build.goal} onValue={(value) => onChange({ ...build, goal: value as BuildConfig["goal"] })} options={[{ value: "games", label: "Jogos" }, { value: "balanced", label: "Equilibrado" }, { value: "work", label: "Produtividade" }]} /></Field>
            <Field label="Orçamento total"><Input type="number" value={build.budget || ""} onChange={(event) => onChange({ ...build, budget: Math.max(0, Number(event.target.value) || 0) })} placeholder="Sem limite" className="lab-input" /></Field>
            <Field label="Total de referência"><div className={`flex h-9 items-center rounded-md border px-3 font-bold ${build.budget && result.total > build.budget ? "border-rose-400/30 bg-rose-400/8 text-rose-200" : "border-emerald-400/20 bg-emerald-400/8 text-emerald-200"}`}>{money(result.total)}</div></Field>
          </div>
        </section>

        <section className="lab-panel overflow-hidden">
          <div className="grid gap-2 border-b border-white/8 p-4 sm:grid-cols-3 lg:grid-cols-5">
            {(Object.keys(categoryMeta) as PartCategory[]).map((category) => {
              const Icon = categoryIcons[category]; const selected = firstPart(build, category, parts);
              return <button key={category} onClick={() => setFocusCategory(category)} className={`flex min-w-0 items-center gap-2 rounded-xl border p-2.5 text-left transition ${focusCategory === category ? "border-cyan-300/35 bg-cyan-300/8" : "border-white/7 bg-black/10 hover:bg-white/[0.035]"}`}><Icon className={`size-4 shrink-0 ${focusCategory === category ? "text-cyan-300" : "text-slate-600"}`} /><div className="min-w-0"><div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">{categoryMeta[category].short}</div><div className="truncate text-xs font-semibold">{selected?.name ?? "Selecionar"}</div></div></button>;
            })}
          </div>
          <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div>
              <div className="mb-3 flex items-center justify-between"><div><p className="lab-kicker">EDITANDO</p><h3 className="text-xl font-bold">{categoryMeta[focusCategory].label}</h3></div><TermHelp termId={compareMetrics[focusCategory][0]?.termId} onOpen={onTerm} /></div>
              <PartSelect category={focusCategory} value={build.parts[focusCategory]?.[0] ?? "__none"} parts={parts} onValue={(value) => onPart(focusCategory, 0, value)} large />
              {categoryMeta[focusCategory].multi && <Button size="sm" variant="ghost" onClick={() => onAdd(focusCategory)} className="mt-2 text-cyan-300"><Plus /> Adicionar unidade</Button>}
              <div className="mt-5 grid gap-2 sm:grid-cols-3">
                {recommendations.map((item) => <button key={item.id} onClick={() => onPart(focusCategory, 0, item.id)} className="rounded-xl border border-white/8 bg-white/[0.025] p-3 text-left hover:border-cyan-300/25 hover:bg-cyan-300/5"><div className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">compatível · valor</div><div className="mt-1 line-clamp-2 text-sm font-bold">{item.name}</div><div className="mt-2 text-xs text-slate-500">{money(item.price)}</div></button>)}
              </div>
            </div>
            <PartSnapshot part={firstPart(build, focusCategory, parts)} category={focusCategory} onTerm={onTerm} />
          </div>
        </section>

        <section className="lab-panel p-5"><div className="mb-4 flex items-center justify-between"><div><p className="lab-kicker">OBSERVAÇÕES</p><h3 className="font-bold">Contexto desta montagem</h3></div><Button size="sm" variant="outline" onClick={onExport} className="border-white/10 bg-white/[0.03]"><Download /> Exportar</Button></div><Textarea value={build.notes} onChange={(event) => onChange({ ...build, notes: event.target.value })} className="min-h-24 border-white/10 bg-black/20" placeholder="Objetivos, jogos, programas, preferências ou restrições..." /></section>
      </div>
      <aside className="space-y-5">
        <section className="lab-panel p-5"><div className="mb-4 flex items-center justify-between"><div><p className="lab-kicker">DIAGNÓSTICO EM TEMPO REAL</p><h3 className="text-xl font-bold">{result.score >= 85 ? "Conjunto coerente" : result.score >= 60 ? "Requer atenção" : "Revise a montagem"}</h3></div><ScoreDial score={result.score} /></div><div className="mb-4 grid grid-cols-2 gap-2"><MiniMetric label="Consumo estimado" value={`~${result.estimatedPower} W`} /><MiniMetric label="Orçamento" value={build.budget ? `${Math.round((result.total / build.budget) * 100)}%` : "livre"} /></div><CheckList checks={result.checks} onTerm={onTerm} /></section>
        <section className="lab-panel p-5"><div className="mb-4"><p className="lab-kicker">SALVAS NA SUA CONTA</p><h3 className="text-lg font-bold">Minhas configurações</h3></div>{savedBuilds.length ? <div className="space-y-2">{savedBuilds.slice(0, 8).map((saved) => <div key={saved.id} className="flex items-center gap-2 rounded-xl border border-white/8 bg-black/15 p-3"><button className="min-w-0 flex-1 text-left" onClick={() => onLoad(saved.payload)}><div className="truncate text-sm font-semibold">{saved.name}</div><div className="text-[11px] text-slate-600">{money(totalPrice(saved.payload, parts))} · {new Date(saved.updatedAt).toLocaleDateString("pt-BR")}</div></button><Button size="icon-sm" variant="ghost" onClick={() => onDelete(saved.id)} className="text-slate-600 hover:text-rose-300"><Trash2 /></Button></div>)}</div> : <EmptyState icon={Database} title="Nenhuma configuração salva" detail="Use “Salvar cópia” para criar seu primeiro histórico." />}</section>
      </aside>
    </div>
  );
}

function PartSnapshot({ part, category, onTerm }: { part?: Part; category: PartCategory; onTerm: (id: string) => void }) {
  if (!part) return <div className="grid min-h-48 place-items-center rounded-xl border border-dashed border-white/10 text-center text-sm text-slate-600">Selecione uma peça para ver os detalhes.</div>;
  return <div className="rounded-2xl border border-white/8 bg-black/20 p-4"><div className="mb-3 flex items-start justify-between gap-2"><div><div className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">{part.brand}</div><div className="mt-1 text-base font-bold">{part.name}</div></div><QualityBadge quality={part.quality} /></div><p className="text-xs leading-5 text-slate-500">{part.qualityNote}</p><div className="mt-4 divide-y divide-white/7">{compareMetrics[category].slice(0, 5).map((metric) => <div key={metric.key} className="flex items-center justify-between gap-3 py-2 text-xs"><span className="flex items-center gap-1 text-slate-500">{metric.label}<TermHelp termId={metric.termId} onOpen={onTerm} compact /></span><b className="text-right">{formatSpecValue(part.specs[metric.key], metric.unit)}</b></div>)}</div></div>;
}

export function CompareView({ parts, onTerm, onUse, initialPart, publicMode = false }: { parts: Part[]; onTerm: (id: string) => void; onUse: (part: Part) => void; initialPart?: Part; publicMode?: boolean }) {
  const [category, setCategory] = useState<PartCategory>(initialPart?.category ?? "cpu");
  const [selected, setSelected] = useState<string[]>(initialPart ? [initialPart.id] : ["r5-3600", "r7-5700x3d", "i5-13400f", "r5-7600"]);
  const [search, setSearch] = useState("");
  const candidates = parts.filter((item) => item.category === category && `${item.brand} ${item.name} ${item.tags.join(" ")}`.toLowerCase().includes(search.toLowerCase()));
  const chosen = selected.map((id) => parts.find((item) => item.id === id && item.category === category)).filter((item): item is Part => Boolean(item));
  function changeCategory(value: string) { const next = value as PartCategory; setCategory(next); setSelected(parts.filter((item) => item.category === next).slice(0, 3).map((item) => item.id)); }
  function toggle(id: string) { setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : current.length < 4 ? [...current, id] : (toast.info("Compare no máximo quatro peças."), current)); }
  return (
    <div className="space-y-5">
      <section className="lab-panel p-4 sm:p-5"><div className="grid gap-3 md:grid-cols-[260px_minmax(0,1fr)_auto]"><SimpleSelect value={category} onValue={changeCategory} options={(Object.keys(categoryMeta) as PartCategory[]).map((id) => ({ value: id, label: categoryMeta[id].label }))} /><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-600" /><Input value={search} onChange={(event) => setSearch(event.target.value)} className="lab-input pl-9" placeholder="Buscar fabricante, modelo ou característica" /></div><Button variant="outline" onClick={() => setSelected([])} className="border-white/10 bg-white/[0.03]"><X /> Limpar</Button></div><div className="scrollbar-thin mt-4 flex gap-2 overflow-x-auto pb-1">{candidates.map((item) => <button key={item.id} onClick={() => toggle(item.id)} className={`min-w-[210px] rounded-xl border p-3 text-left transition ${selected.includes(item.id) ? "border-cyan-300/35 bg-cyan-300/8" : "border-white/8 bg-black/15 hover:bg-white/[0.035]"}`}><div className="flex items-start gap-2"><span className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded border ${selected.includes(item.id) ? "border-cyan-300 bg-cyan-300 text-slate-950" : "border-white/15"}`}>{selected.includes(item.id) && <Check className="size-3" />}</span><div><div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">{item.brand}</div><div className="line-clamp-2 text-sm font-semibold">{item.name}</div></div></div></button>)}</div></section>
      <section className="lab-panel overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 p-5"><div><p className="lab-kicker">LADO A LADO</p><h2 className="text-xl font-bold">{categoryMeta[category].label}</h2></div><Badge variant="outline" className="border-white/10 text-slate-400">{chosen.length} de 4 selecionadas</Badge></div>
        {chosen.length ? <Table><TableHeader><TableRow className="border-white/8 bg-black/20 hover:bg-black/20"><TableHead className="min-w-48 px-5 text-slate-500">Critério</TableHead>{chosen.map((item) => <TableHead key={item.id} className="min-w-56 px-4 py-4"><div className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">{item.brand}</div><div className="mt-1 whitespace-normal text-sm font-black text-white">{item.name}</div>{!publicMode && <button onClick={() => onUse(item)} className="mt-2 text-[11px] font-semibold text-slate-500 hover:text-cyan-300">Usar no montador →</button>}</TableHead>)}</TableRow></TableHeader><TableBody>
          {compareMetrics[category].map((metric) => {
            const numeric = chosen.map((item) => item.specs[metric.key]).filter((value): value is number => typeof value === "number");
            const best = numeric.length ? (metric.higher ? Math.max(...numeric) : Math.min(...numeric)) : undefined;
            return <TableRow key={metric.key} className="border-white/7 hover:bg-white/[0.025]"><TableCell className="px-5 text-slate-500"><span className="flex items-center gap-1.5">{metric.label}<TermHelp termId={metric.termId} onOpen={onTerm} compact /></span></TableCell>{chosen.map((item) => { const value = item.specs[metric.key]; const winner = typeof value === "number" && value === best; return <TableCell key={item.id} className={`px-4 font-semibold ${winner ? "text-emerald-300" : "text-slate-200"}`}>{formatSpecValue(value, metric.unit)}{winner && numeric.length > 1 && <span className="ml-2 text-[9px] font-black uppercase tracking-wider">melhor</span>}</TableCell>; })}</TableRow>;
          })}
          <TableRow className="border-white/7 hover:bg-white/[0.025]"><TableCell className="px-5 text-slate-500">Preço de referência</TableCell>{chosen.map((item) => <TableCell key={item.id} className="px-4 text-base font-black">{item.price ? money(item.price) : item.priceStatus === "unpriced" || publicMode ? "Preço não consultado" : "Já instalado"}</TableCell>)}</TableRow>
          <TableRow className="border-white/7 hover:bg-white/[0.025]"><TableCell className="px-5 text-slate-500">Avaliação de construção</TableCell>{chosen.map((item) => <TableCell key={item.id} className="px-4"><QualityBadge quality={item.quality} /><p className="mt-2 max-w-xs whitespace-normal text-xs font-normal leading-5 text-slate-500">{item.qualityNote}</p></TableCell>)}</TableRow>
        </TableBody></Table> : <EmptyState icon={SquareStack} title="Selecione peças para comparar" detail="Marque até quatro modelos acima." />}
      </section>
    </div>
  );
}

export function CatalogView({ parts, onAddCustom, onUse, onTerm, publicMode = false }: { parts: Part[]; onAddCustom: () => void; onUse: (part: Part) => void; onTerm: (id: string) => void; publicMode?: boolean }) {
  return <PartCatalog parts={parts} onAddCustom={onAddCustom} onUse={onUse} onTerm={onTerm} publicMode={publicMode} />;
}

function PartCard({ part, onUse, onTerm, publicMode = false }: { part: Part; onUse: () => void; onTerm: (id: string) => void; publicMode?: boolean }) {
  const Icon = categoryIcons[part.category];
  return <article className="lab-panel group flex min-h-[310px] flex-col p-5 transition hover:-translate-y-0.5 hover:border-white/15"><div className="flex items-start justify-between gap-3"><div className="grid size-10 place-items-center rounded-xl bg-white/5 text-slate-500 group-hover:bg-cyan-300/8 group-hover:text-cyan-300"><Icon className="size-5" /></div><QualityBadge quality={part.quality} /></div><div className="mt-4"><div className="text-[10px] font-black uppercase tracking-[.15em] text-cyan-300">{part.brand} · {categoryMeta[part.category].short}</div><h3 className="mt-1 text-xl font-black tracking-tight">{part.name}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{part.summary}</p></div><div className="my-4 grid grid-cols-2 gap-x-4 gap-y-2 border-y border-white/7 py-3">{compareMetrics[part.category].slice(0, 4).map((metric) => <div key={metric.key}><div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">{metric.label}<TermHelp termId={metric.termId} onOpen={onTerm} compact /></div><div className="mt-0.5 truncate text-xs font-semibold">{formatSpecValue(part.specs[metric.key], metric.unit)}</div></div>)}</div><div className="mt-auto flex items-end justify-between gap-3"><div><div className="text-[10px] uppercase tracking-wider text-slate-600">Preço de referência</div><div className="text-lg font-black">{part.price ? money(part.price) : part.priceStatus === "unpriced" || publicMode ? "Preço não consultado" : "Já instalado"}</div></div><Button size="sm" variant="outline" onClick={onUse} className="border-white/10 bg-white/[0.03]">{publicMode ? "Comparar" : "Usar"} <ChevronRight /></Button></div>{part.source && <a href={part.source.url} target="_blank" rel="noopener noreferrer" className="mt-4 text-sm text-cyan-200 underline underline-offset-4">Ficha do fabricante · {new Date(part.source.checkedAt + "T12:00:00Z").toLocaleDateString("pt-BR")}</a>}</article>;
}

function PricesView({ profile, parts, onChange, onAdd }: { profile: UserProfile; parts: Part[]; onChange: (updater: (current: UserProfile) => UserProfile) => void; onAdd: () => void }) {
  const [search, setSearch] = useState("");
  const offers = profile.offers.filter((offer) => (!profile.trustedOnly || offer.trustScore >= 75) && `${offer.store} ${offer.seller} ${parts.find((part) => part.id === offer.partId)?.name ?? ""}`.toLowerCase().includes(search.toLowerCase())).sort((a, b) => (a.priceCash + a.shipping) - (b.priceCash + b.shipping));
  return <div className="space-y-5"><section className="lab-panel overflow-hidden"><div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_360px]"><div><div className="mb-3 flex items-center gap-2"><Badge className="border border-amber-300/20 bg-amber-300/10 text-amber-200">SUAS OFERTAS</Badge><Badge variant="outline" className="border-white/10 text-slate-500">cadastros pessoais</Badge></div><h2 className="max-w-2xl text-2xl font-black tracking-tight sm:text-3xl">Ofertas que você cadastrou</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">Guarde ofertas de outras lojas e informações que você conferiu. A pontuação depende dos dados cadastrados por você; não certifica a procedência do vendedor.</p></div><div className="rounded-2xl border border-white/8 bg-black/20 p-4"><div className="flex items-center justify-between gap-4"><div><div className="text-sm font-bold">Mostrar somente procedência alta</div><div className="mt-1 text-xs text-slate-600">Oculta pontuações abaixo de 75.</div></div><Switch checked={profile.trustedOnly} onCheckedChange={(checked) => onChange((current) => ({ ...current, trustedOnly: checked }))} /></div><Button onClick={onAdd} className="mt-4 w-full bg-cyan-300 text-slate-950 hover:bg-cyan-200"><Plus /> Cadastrar oferta</Button></div></div></section>
    <section className="lab-panel p-4 sm:p-5"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-600" /><Input value={search} onChange={(event) => setSearch(event.target.value)} className="lab-input pl-9" placeholder="Buscar peça, loja ou vendedor" /></div></section>
    {offers.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{offers.map((offer) => { const item = parts.find((part) => part.id === offer.partId); const trusted = offer.trustScore >= 75; return <article key={offer.id} className="lab-panel p-5"><div className="flex items-start justify-between gap-3"><div><div className="text-[10px] font-black uppercase tracking-wider text-slate-600">{offer.store} · {offer.sellerType}</div><h3 className="mt-1 font-bold">{item?.name ?? "Peça removida"}</h3></div><div className={`rounded-lg px-2 py-1 text-xs font-black ${trusted ? "bg-emerald-300/10 text-emerald-300" : "bg-amber-300/10 text-amber-300"}`}>{offer.trustScore}/100</div></div><div className="my-4 flex items-end justify-between border-y border-white/7 py-4"><div><div className="text-[10px] uppercase tracking-wider text-slate-600">Total à vista + frete</div><div className="text-2xl font-black">{money(offer.priceCash + offer.shipping)}</div></div><div className="text-right text-xs text-slate-500">{offer.condition}<br />{offer.nationalWarranty ? "com garantia" : "garantia não informada"}</div></div><div className="mb-4 flex flex-wrap gap-1.5"><OfferFlag good={offer.invoice} label="Nota fiscal" /><OfferFlag good={offer.nationalWarranty} label="Garantia" /><OfferFlag good={offer.condition === "novo"} label="Produto novo" /></div><div className="flex gap-2"><Button asChild size="sm" className="flex-1 bg-cyan-300 text-slate-950 hover:bg-cyan-200"><a href={offer.url} target="_blank" rel="noreferrer">Abrir oferta</a></Button><Button size="icon-sm" variant="ghost" aria-label="Excluir oferta" onClick={() => onChange((current) => ({ ...current, offers: current.offers.filter((item) => item.id !== offer.id) }))} className="text-slate-600 hover:text-rose-300"><Trash2 /></Button></div></article>; })}</div> : <EmptyState icon={ShieldCheck} title="Nenhuma oferta passa pelo filtro" detail="Cadastre um link manualmente ou desative temporariamente o filtro de procedência alta." />}</div>;
}

function OfferFlag({ good, label }: { good: boolean; label: string }) { return <span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${good ? "border-emerald-300/15 bg-emerald-300/7 text-emerald-300" : "border-white/8 bg-white/[0.025] text-slate-600"}`}>{good ? "✓" : "—"} {label}</span>; }

export function GlossaryView({ extensions, onOpen }: { extensions: StoredExtension[]; onOpen: (id: string) => void }) {
  const extensionTerms = extensions.filter((item) => item.enabled).flatMap((item) => item.manifest.contributions?.glossary ?? []);
  const terms = [...glossary, ...extensionTerms];
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const categories = unique(terms.map((item) => item.category));
  const shown = terms.filter((item) => (category === "all" || item.category === category) && `${item.name} ${item.short} ${item.practical} ${item.affects.join(" ")}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="space-y-5"><section className="lab-panel p-4 sm:p-5"><div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_260px]"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-600" /><Input value={search} onChange={(event) => setSearch(event.target.value)} className="lab-input pl-9" placeholder="Ex.: TDP, VRAM, dual channel, gargalo..." /></div><SimpleSelect value={category} onValue={setCategory} options={[{ value: "all", label: "Todas as áreas" }, ...categories.map((value) => ({ value, label: value }))]} /></div></section><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{shown.map((item) => <button key={item.id} onClick={() => onOpen(item.id)} className="lab-panel group min-h-56 p-5 text-left transition hover:-translate-y-0.5 hover:border-cyan-300/20"><div className="flex items-start justify-between"><span className="rounded-full border border-white/8 bg-white/[0.025] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">{item.category}</span><CircleHelp className="size-4 text-slate-600 group-hover:text-cyan-300" /></div><h3 className="mt-5 text-2xl font-black tracking-tight">{item.name}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{item.short}</p><div className="mt-4 flex flex-wrap gap-1.5">{item.affects.slice(0, 4).map((value) => <span key={value} className="rounded-md bg-cyan-300/7 px-2 py-1 text-[10px] font-semibold text-cyan-200/80">{value}</span>)}</div></button>)}</div></div>;
}

function ExtensionsView({ extensions, onToggle, onImport }: { extensions: StoredExtension[]; onToggle: (item: StoredExtension, enabled: boolean) => void; onImport: () => void }) {
  return <div className="space-y-5"><section className="lab-panel overflow-hidden"><div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_360px]"><div><Badge className="border border-violet-300/20 bg-violet-300/10 text-violet-200">API DE EXTENSÕES · v0.1</Badge><h2 className="mt-4 max-w-2xl text-3xl font-black tracking-tight">Como extensões do navegador, mas com cada permissão visível.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">O núcleo define contratos para catálogo, configurações, compatibilidade, glossário, preços e exportação. Nesta fase privada, extensões externas são instaladas por manifesto declarativo: nenhum JavaScript remoto é executado.</p></div><div className="rounded-2xl border border-violet-300/15 bg-violet-300/5 p-4"><div className="flex items-start gap-3"><LockKeyhole className="mt-0.5 size-5 text-violet-300" /><div><div className="font-bold">Estratégia para o código aberto</div><p className="mt-1 text-xs leading-5 text-slate-500">A licença planejada é copyleft de rede: modificações usadas como serviço também deverão disponibilizar o código correspondente. A decisão final fica para a abertura do repositório.</p></div></div><Button onClick={onImport} className="mt-4 w-full b g-violet-300 text-slate-950 hover:bg-violet-200"><Plug /> Instalar manifesto</Button></div></div></section><div className="grid gap-4 lg:grid-cols-2">{extensions.map((item) => <article key={item.pluginId} className="lab-panel p-5"><div className="flex items-start gap-4"><div className={`grid size-11 shrink-0 place-items-center rounded-xl ${item.manifest.builtIn ? "bg-cyan-300/8 text-cyan-300" : "bg-violet-300/8 text-violet-300"}`}><Puzzle className="size-5" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-black">{item.manifest.name}</h3>{item.manifest.builtIn && <Badge variant="outline" className="border-white/10 text-[9px] text-slate-500">INTERNA</Badge>}<span className="text-[10px] text-slate-600">v{item.manifest.version}</span></div><p className="mt-2 text-sm leading-6 text-slate-500">{item.manifest.description}</p><div className="mt-4 flex flex-wrap gap-1.5">{item.manifest.permissions.map((permission) => { const meta = permissionLabels[permission]; return <Tooltip key={permission}><TooltipTrigger asChild><span className={`cursor-help rounded-md border px-2 py-1 text-[10px] font-bold ${meta.risk === "alto" ? "border-rose-300/15 text-rose-300" : meta.risk === "médio" ? "border-amber-300/15 text-amber-300" : "border-white/8 text-slate-500"}`}>{meta.label}</span></TooltipTrigger><TooltipContent className="max-w-64">{meta.detail}</TooltipContent></Tooltip>; })}</div></div><Switch checked={item.enabled} onCheckedChange={(checked) => onToggle(item, checked)} aria-label={`${item.enabled ? "Desativar" : "Ativar"} ${item.manifest.name}`} /></div><div className="mt-4 flex items-center justify-between border-t border-white/7 pt-3 text-[11px] text-slate-600"><span>{item.manifest.author}</span><span>{item.enabled ? "Ativa" : "Desativada"}</span></div></article>)}</div><section className="lab-panel p-5"><div className="grid gap-4 md:grid-cols-3"><RoadmapStep n="01" title="Agora" text="Extensões internas e manifestos declarativos seguros." /><RoadmapStep n="02" title="Beta pública" text="SDK, validação, assinatura e catálogo comunitário." /><RoadmapStep n="03" title="Ecossistema" text="Marketplace, avaliações e atualização automática." /></div></section></div>;
}

function RoadmapStep({ n, title, text }: { n: string; title: string; text: string }) { return <div className="rounded-xl border border-white/7 bg-black/15 p-4"><div className="font-mono text-xs font-bold text-violet-300">{n}</div><div className="mt-3 font-bold">{title}</div><p className="mt-1 text-xs leading-5 text-slate-500">{text}</p></div>; }

function PartSelect({ category, value, parts, onValue, large }: { category: PartCategory; value: string; parts: Part[]; onValue: (value: string) => void; large?: boolean }) {
  const options = parts.filter((item) => item.category === category);
  return <Select value={value || "__none"} onValueChange={onValue}><SelectTrigger className={`w-full border-white/10 bg-black/20 text-left ${large ? "h-12" : "h-10"}`}><SelectValue placeholder="Selecionar peça" /></SelectTrigger><SelectContent className="border-white/10 bg-[#101725] text-slate-100"><SelectItem value="__none">Não selecionada</SelectItem>{options.map((item) => <SelectItem key={item.id} value={item.id}>{item.brand} · {item.name}</SelectItem>)}</SelectContent></Select>;
}

function SimpleSelect({ value, onValue, options }: { value: string; onValue: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return <Select value={value} onValueChange={onValue}><SelectTrigger className="h-9 w-full border-white/10 bg-black/20"><SelectValue /></SelectTrigger><SelectContent className="border-white/10 bg-[#101725] text-slate-100">{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-1.5 block text-[10px] font-black uppercase tracking-[.13em] text-slate-600">{label}</span>{children}</label>; }

function QualityBadge({ quality }: { quality: Part["quality"] }) {
  const style = quality === "não avaliada" ? "border-slate-400/20 bg-slate-400/5 text-slate-300" : quality === "excelente" ? "border-emerald-300/15 bg-emerald-300/8 text-emerald-300" : quality === "boa" ? "border-cyan-300/15 bg-cyan-300/8 text-cyan-300" : quality === "atenção" ? "border-rose-300/15 bg-rose-300/8 text-rose-300" : "border-amber-300/15 bg-amber-300/8 text-amber-300";
  return <span className={`rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-wider ${style}`}>{quality}</span>;
}

function ScorePill({ score }: { score: number }) { return <span className={`rounded-full border px-3 py-1 text-xs font-black ${score >= 85 ? "border-emerald-300/20 bg-emerald-300/8 text-emerald-300" : score >= 60 ? "border-amber-300/20 bg-amber-300/8 text-amber-300" : "border-rose-300/20 bg-rose-300/8 text-rose-300"}`}>{score}/100</span>; }

function ScoreDial({ score }: { score: number }) { const color = score >= 85 ? "#6ee7b7" : score >= 60 ? "#fcd34d" : "#fda4af"; return <div className="relative grid size-16 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(${color} ${score * 3.6}deg, rgba(255,255,255,.08) 0)` }}><div className="absolute inset-[5px] rounded-full bg-[#0d1421]" /><span className="relative text-sm font-black">{score}</span></div>; }

function MiniMetric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-white/7 bg-black/15 p-3"><div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">{label}</div><div className="mt-1 font-black">{value}</div></div>; }

function CheckList({ checks, onTerm }: { checks: ReturnType<typeof analyzeBuild>["checks"]; onTerm?: (id: string) => void }) {
  return <div className="space-y-2">{checks.map((check) => { const Icon = check.severity === "ok" ? CircleCheck : check.severity === "error" ? CircleX : check.severity === "warning" ? CircleAlert : CircleHelp; const style = check.severity === "ok" ? "border-emerald-300/12 bg-emerald-300/5 text-emerald-300" : check.severity === "error" ? "border-rose-300/15 bg-rose-300/6 text-rose-300" : check.severity === "warning" ? "border-amber-300/15 bg-amber-300/6 text-amber-300" : "border-cyan-300/12 bg-cyan-300/5 text-cyan-300"; return <div key={check.id} className={`rounded-xl border p-3 ${style}`}><div className="flex items-start gap-2.5"><Icon className="mt-0.5 size-4 shrink-0" /><div><div className="flex items-center gap-1.5 text-xs font-bold">{check.title}{onTerm && <TermHelp termId={check.term} onOpen={onTerm} compact />}</div><p className="mt-1 text-[11px] leading-5 text-slate-500">{check.detail}</p></div></div></div>; })}</div>;
}

function TermHelp({ termId, onOpen, compact }: { termId?: string; onOpen: (id: string) => void; compact?: boolean }) {
  const item = glossaryById(termId);
  if (!item) return null;
  return <Tooltip><TooltipTrigger asChild><button type="button" aria-label={`Explicar ${item.name}`} onClick={(event) => { event.stopPropagation(); onOpen(item.id); }} className={`inline-grid place-items-center rounded-full text-slate-600 hover:text-cyan-300 ${compact ? "size-4" : "size-6"}`}><CircleHelp className={compact ? "size-3" : "size-4"} /></button></TooltipTrigger><TooltipContent className="max-w-72"><b>{item.name}:</b> {item.short}</TooltipContent></Tooltip>;
}

function EmptyState({ icon: Icon, title, detail }: { icon: LucideIcon; title: string; detail: string }) { return <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-white/10 p-8 text-center"><div><div className="mx-auto grid size-11 place-items-center rounded-xl bg-white/5 text-slate-600"><Icon className="size-5" /></div><h3 className="mt-4 font-bold">{title}</h3><p className="mt-1 max-w-sm text-sm text-slate-600">{detail}</p></div></div>; }

export function TermDialog({ termId, onOpenChange }: { termId: string | null; onOpenChange: (open: boolean) => void }) {
  const item = glossaryById(termId ?? undefined);
  return <Dialog open={Boolean(item)} onOpenChange={onOpenChange}><DialogContent className="border-white/10 bg-[#0c1320] text-slate-100 sm:max-w-xl"><DialogHeader><div className="mb-2 flex items-center gap-2"><Badge className="border border-cyan-300/15 bg-cyan-300/8 text-cyan-300">{item?.category}</Badge></div><DialogTitle className="text-3xl font-black tracking-tight">{item?.name}</DialogTitle><DialogDescription className="text-base leading-7 text-slate-400">{item?.short}</DialogDescription></DialogHeader>{item && <div className="space-y-5"><div className="rounded-2xl border border-violet-300/12 bg-violet-300/5 p-4"><div className="text-[10px] font-black uppercase tracking-[.14em] text-violet-300">NA PRÁTICA</div><p className="mt-2 text-sm leading-6 text-slate-300">{item.practical}</p></div><div><div className="mb-2 text-[10px] font-black uppercase tracking-[.14em] text-slate-600">O QUE ISSO INFLUENCIA</div><div className="flex flex-wrap gap-2">{item.affects.map((value) => <span key={value} className="rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2 text-xs font-semibold">{value}</span>)}</div></div></div>}</DialogContent></Dialog>;
}

function ExportDialog({ open, onOpenChange, build, parts }: { open: boolean; onOpenChange: (open: boolean) => void; build: BuildConfig; parts: Part[] }) {
  const text = buildText(build, parts);
  const safe = build.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "configuracao";
  const actions = [
    { icon: FileSpreadsheet, label: "Excel", note: "CSV compatível com Excel", action: () => downloadFile(`${safe}.csv`, buildCsv(build, parts), "text/csv;charset=utf-8") },
    { icon: FileText, label: "Arquivo de texto", note: "Resumo simples em .txt", action: () => downloadFile(`${safe}.txt`, text, "text/plain;charset=utf-8") },
    { icon: FileJson, label: "JSON", note: "Dados estruturados para importar", action: () => downloadFile(`${safe}.json`, JSON.stringify(build, null, 2), "application/json") },
    { icon: Printer, label: "PDF", note: "Abre a impressão para salvar em PDF", action: () => { document.title = build.name; window.print(); } },
    { icon: Copy, label: "Copiar", note: "Texto pronto para colar", action: async () => { await navigator.clipboard.writeText(text); toast.success("Configuração copiada."); } },
    { icon: MessageCircle, label: "WhatsApp", note: "Abre o compartilhamento com o texto", action: () => window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer") },
  ];
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="border-white/10 bg-[#0c1320] text-slate-100 sm:max-w-2xl"><DialogHeader><DialogTitle className="text-2xl font-black">Exportar configuração</DialogTitle><DialogDescription className="text-slate-500">{build.name} · {money(totalPrice(build, parts))}</DialogDescription></DialogHeader><div className="grid gap-3 sm:grid-cols-2">{actions.map(({ icon: Icon, label, note, action }) => <button key={label} onClick={action} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.025] p-4 text-left transition hover:border-cyan-300/20 hover:bg-cyan-300/5"><div className="grid size-10 place-items-center rounded-xl bg-white/5 text-cyan-300"><Icon className="size-5" /></div><div><div className="font-bold">{label}</div><div className="mt-0.5 text-xs text-slate-600">{note}</div></div></button>)}</div><div className="print-sheet"><h1>{build.name}</h1><p>Gerado no Upgrade Lab</p>{(Object.keys(categoryMeta) as PartCategory[]).map((category) => { const selected = getBuildParts(build, category, parts); return selected.length ? <div key={category}><b>{categoryMeta[category].label}</b><span>{selected.map((item) => item.name).join(" + ")}</span></div> : null; })}<hr /><strong>Total conhecido: {money(totalPrice(build, parts))}</strong><p>Valores de referência, sem frete e cupons. Peças sem preço não entram no total.</p>{getBuildParts(build, undefined, parts).filter(p => build.priceSources?.[p.id]).map(p => <p key={p.id}>{p.name}: {money(partPrice(build, p))} · {build.priceSources![p.id].method === "mean" ? "média" : "mediana"} de {build.priceSources![p.id].sampleSize} lojas em {new Date(build.priceSources![p.id].checkedAt).toLocaleDateString("pt-BR")}</p>)}{build.notes && <p>{build.notes}</p>}</div></DialogContent></Dialog>;
}

function ExtensionDialog({ open, onOpenChange, source, onSource, onInstall }: { open: boolean; onOpenChange: (open: boolean) => void; source: string; onSource: (value: string) => void; onInstall: () => void }) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[88vh] overflow-y-auto border-white/10 bg-[#0c1320] text-slate-100 sm:max-w-2xl"><DialogHeader><DialogTitle className="text-2xl font-black">Instalar manifesto de extensão</DialogTitle><DialogDescription className="leading-6 text-slate-500">A instalação atual aceita somente metadados e permissões declarativas. Código remoto e acesso à internet permanecem bloqueados.</DialogDescription></DialogHeader><div className="rounded-xl border border-amber-300/12 bg-amber-300/5 p-3 text-xs leading-5 text-amber-100/70"><ShieldAlert className="mr-2 inline size-4" />Leia as permissões antes de instalar. O futuro SDK usará o mesmo modelo com isolamento e assinatura.</div><Textarea value={source} onChange={(event) => onSource(event.target.value)} spellCheck={false} className="min-h-80 border-white/10 bg-black/30 font-mono text-xs leading-5" /><DialogFooter><Button variant="outline" onClick={() => downloadFile("upgrade-lab-extension-manifest.json", exampleManifest, "application/json")} className="border-white/10 bg-white/[0.03]"><Download /> Baixar exemplo</Button><Button onClick={onInstall} className="bg-violet-300 text-slate-950 hover:bg-violet-200"><Plug /> Validar e instalar</Button></DialogFooter></DialogContent></Dialog>;
}

const numericSpecKeys = new Set(["cores", "threads", "boostClock", "l3", "tdp", "maxPower", "gamingIndex", "workIndex", "memorySlots", "m2Slots", "vrmTier", "vram", "memoryBus", "tgp", "rasterIndex", "rtIndex", "psuRecommended", "capacity", "modules", "speed", "cas", "voltage", "read", "write", "wattage", "qualityTier", "warrantyYears", "tdpCapacity", "height", "radiator", "fans", "noise", "gpuLength", "coolerHeight", "radiatorTop", "radiatorFront", "airflow", "refresh", "size"]);

function CustomPartDialog({ open, onOpenChange, onSave, initialCategory = "cpu" }: { open: boolean; onOpenChange: (open: boolean) => void; onSave: (part: Part) => void; initialCategory?: PartCategory }) {
  const [category, setCategory] = useState<PartCategory>(initialCategory);
  const [brand, setBrand] = useState(""); const [name, setName] = useState(""); const [price, setPrice] = useState(""); const [summary, setSummary] = useState(""); const [specs, setSpecs] = useState<Record<string, string>>({});
  const metrics = compareMetrics[category].slice(0, 8);
  function save() {
    if (!brand.trim() || !name.trim()) return toast.error("Informe fabricante e nome da peça.");
    const parsedSpecs = Object.fromEntries(metrics.filter(metric => specs[metric.key]?.trim()).map((metric) => [metric.key, numericSpecKeys.has(metric.key) ? Math.max(0, Number(specs[metric.key]) || 0) : specs[metric.key].trim()]));
    onSave({ id: `custom-${category}-${crypto.randomUUID()}`, category, brand: brand.trim().slice(0, 80), name: name.trim().slice(0, 120), price: Math.max(0, Number(price) || 0), platform: String(parsedSpecs.socket ?? "") || undefined, summary: summary.trim().slice(0, 260) || "Peça cadastrada manualmente.", tags: ["personalizada"], priceStatus: Number(price) > 0 ? undefined : "unpriced", quality: "não avaliada", qualityNote: "Dados informados manualmente; confirme especificações e procedência antes da compra.", specs: parsedSpecs });
    setBrand(""); setName(""); setPrice(""); setSummary(""); setSpecs({});
  }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[88vh] overflow-y-auto border-white/10 bg-[#0c1320] text-slate-100 sm:max-w-3xl"><DialogHeader><DialogTitle className="text-2xl font-black">Cadastrar peça personalizada</DialogTitle><DialogDescription className="text-slate-500">Disponível para todas as categorias. O item fica no seu perfil e pode ser comparado.</DialogDescription></DialogHeader><div className="grid gap-4 sm:grid-cols-2"><Field label="Categoria"><SimpleSelect value={category} onValue={(value) => { setCategory(value as PartCategory); setSpecs({}); }} options={(Object.keys(categoryMeta) as PartCategory[]).map((value) => ({ value, label: categoryMeta[value].label }))} /></Field><Field label="Preço de referência"><Input type="number" value={price} onChange={(event) => setPrice(event.target.value)} className="lab-input" placeholder="R$" /></Field><Field label="Fabricante"><Input value={brand} onChange={(event) => setBrand(event.target.value)} className="lab-input" placeholder="Ex.: AMD, Intel, ASUS" /></Field><Field label="Modelo"><Input value={name} onChange={(event) => setName(event.target.value)} className="lab-input" placeholder="Nome completo da peça" /></Field><div className="sm:col-span-2"><Field label="Resumo"><Input value={summary} onChange={(event) => setSummary(event.target.value)} className="lab-input" placeholder="O que diferencia este modelo?" /></Field></div>{metrics.map((metric) => <Field key={metric.key} label={`${metric.label}${metric.unit ? ` (${metric.unit})` : ""}`}><Input value={specs[metric.key] ?? ""} onChange={(event) => setSpecs((current) => ({ ...current, [metric.key]: event.target.value }))} type={numericSpecKeys.has(metric.key) ? "number" : "text"} className="lab-input" /></Field>)}</div><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)} className="border-white/10 bg-white/[0.03]">Cancelar</Button><Button onClick={save} className="bg-cyan-300 text-slate-950 hover:bg-cyan-200"><PackagePlus /> Adicionar</Button></DialogFooter></DialogContent></Dialog>;
}

function OfferDialog({ open, onOpenChange, parts, onSave }: { open: boolean; onOpenChange: (open: boolean) => void; parts: Part[]; onSave: (offer: Offer) => void }) {
  const [partId, setPartId] = useState(parts[0]?.id ?? ""); const [store, setStore] = useState(""); const [seller, setSeller] = useState(""); const [price, setPrice] = useState(""); const [shipping, setShipping] = useState(""); const [url, setUrl] = useState(""); const [condition, setCondition] = useState<Offer["condition"]>("novo"); const [sellerType, setSellerType] = useState<Offer["sellerType"]>("loja"); const [invoice, setInvoice] = useState(true); const [warranty, setWarranty] = useState(true);
  function save() {
    if (!partId || !store.trim() || !seller.trim() || !price || !url.trim()) return toast.error("Preencha peça, loja, vendedor, preço e link.");
    let safeUrl: string; try { const parsed = new URL(url); if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error(); safeUrl = parsed.toString(); } catch { return toast.error("Informe um link http ou https válido."); }
    const score = Math.min(100, 25 + (sellerType === "oficial" ? 25 : sellerType === "loja" ? 15 : 5) + (condition === "novo" ? 15 : condition === "recondicionado" ? 4 : 0) + (invoice ? 15 : 0) + (warranty ? 15 : 0) + (store.trim() && seller.trim() ? 5 : 0));
    onSave({ id: crypto.randomUUID(), partId, store: store.trim().slice(0, 80), seller: seller.trim().slice(0, 80), priceCash: Math.max(0, Number(price) || 0), priceInstallments: Math.max(0, Number(price) || 0), shipping: Math.max(0, Number(shipping) || 0), url: safeUrl, condition, sellerType, invoice, nationalWarranty: warranty, trustScore: score, checkedAt: new Date().toISOString() });
    setStore(""); setSeller(""); setPrice(""); setShipping(""); setUrl("");
  }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[88vh] overflow-y-auto border-white/10 bg-[#0c1320] text-slate-100 sm:max-w-2xl"><DialogHeader><DialogTitle className="text-2xl font-black">Cadastrar oferta</DialogTitle><DialogDescription className="text-slate-500">Os dados são declarados manualmente; a pontuação ajuda a organizar, mas não substitui a verificação do anúncio.</DialogDescription></DialogHeader><div className="grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><Field label="Peça"><Select value={partId} onValueChange={setPartId}><SelectTrigger className="w-full border-white/10 bg-black/20"><SelectValue /></SelectTrigger><SelectContent className="border-white/10 bg-[#101725] text-slate-100">{parts.map((part) => <SelectItem key={part.id} value={part.id}>{part.brand} · {part.name}</SelectItem>)}</SelectContent></Select></Field></div><Field label="Loja / marketplace"><Input value={store} onChange={(event) => setStore(event.target.value)} className="lab-input" /></Field><Field label="Vendedor"><Input value={seller} onChange={(event) => setSeller(event.target.value)} className="lab-input" /></Field><Field label="Preço à vista"><Input type="number" value={price} onChange={(event) => setPrice(event.target.value)} className="lab-input" /></Field><Field label="Frete"><Input type="number" value={shipping} onChange={(event) => setShipping(event.target.value)} className="lab-input" /></Field><Field label="Condição"><SimpleSelect value={condition} onValue={(value) => setCondition(value as Offer["condition"])} options={[{ value: "novo", label: "Novo" }, { value: "usado", label: "Usado" }, { value: "recondicionado", label: "Recondicionado" }]} /></Field><Field label="Tipo de vendedor"><SimpleSelect value={sellerType} onValue={(value) => setSellerType(value as Offer["sellerType"])} options={[{ value: "oficial", label: "Loja oficial" }, { value: "loja", label: "Loja identificada" }, { value: "marketplace", label: "Vendedor de marketplace" }]} /></Field><div className="sm:col-span-2"><Field label="Link"><Input value={url} onChange={(event) => setUrl(event.target.value)} className="lab-input" placeholder="https://..." /></Field></div><ToggleField label="Emite nota fiscal" checked={invoice} onChecked={setInvoice} /><ToggleField label="Garantia informada" checked={warranty} onChecked={setWarranty} /></div><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)} className="border-white/10 bg-white/[0.03]">Cancelar</Button><Button onClick={save} className="bg-cyan-300 text-slate-950 hover:bg-cyan-200"><ShieldCheck /> Calcular e salvar</Button></DialogFooter></DialogContent></Dialog>;
}

function ToggleField({ label, checked, onChecked }: { label: string; checked: boolean; onChecked: (value: boolean) => void }) { return <div className="flex items-center justify-between rounded-xl border border-white/8 bg-black/15 px-3 py-2.5"><span className="text-sm font-semibold">{label}</span><Switch checked={checked} onCheckedChange={onChecked} /></div>; }
