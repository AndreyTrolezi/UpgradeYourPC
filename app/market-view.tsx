"use client";

import { useEffect, useState } from "react";
import { Search, ExternalLink, LoaderCircle, TicketPercent, Copy, Info } from "lucide-react";
import { toast } from "sonner";
import { catalog, categoryMeta } from "./data/catalog";
import { partCategories, type PartCategory } from "./lib/types";
import { marketStores } from "./lib/market";
import type { CouponSnapshot, MarketSnapshot } from "./lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const money = (n: number | null) => n === null ? "—" : n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const date = (s: string) => new Date(s).toLocaleString("pt-BR");

export function MarketView({ onUse }: { onUse: (snapshot: MarketSnapshot, method: "mean" | "median") => void }) {
  const [id, setId] = useState("r7-5700x");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<PartCategory | "all">("all");
  const [brand, setBrand] = useState("all");
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const part = catalog.find(p => p.id === id)!;
  const eligible = catalog.filter(p => !p.tags.includes("atual"));
  const brands = [...new Set(eligible.filter(p => category === "all" || p.category === category).map(p => p.brand))].sort();
  const filtered = eligible.filter(p => (category === "all" || p.category === category) && (brand === "all" || p.brand === brand) && `${p.brand} ${p.name} ${categoryMeta[p.category].label}`.toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR")));
  const options = filtered.some(p => p.id === id) ? filtered : [part, ...filtered];

  useEffect(() => {
    const controller = new AbortController();
    setSnapshot(null); setError(""); setChecking(true);
    fetch(`/api/market?partId=${encodeURIComponent(id)}`, { signal: controller.signal }).then(async response => {
      const data = await response.json() as { configured?: boolean; snapshot: MarketSnapshot | null; error?: string };
      if (controller.signal.aborted) return;
      if (typeof data.configured === "boolean") setConfigured(data.configured);
      if (!response.ok) throw new Error(data.error || "Não foi possível carregar a consulta salva.");
      setSnapshot(data.snapshot);
    }).catch(e => { if (!controller.signal.aborted) setError(e.message); }).finally(() => { if (!controller.signal.aborted) setChecking(false); });
    return () => controller.abort();
  }, [id]);

  async function search() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/market", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ partId: id }) });
      const data = await response.json() as { snapshot: MarketSnapshot; error?: string };
      if (!response.ok) throw new Error(data.error || "Não foi possível consultar as lojas.");
      setSnapshot(data.snapshot);
    } catch (e) { setError(e instanceof Error ? e.message : "Falha na consulta."); }
    finally { setLoading(false); }
  }

  return <section className="lab-panel overflow-hidden">
    <div className="border-b border-white/10 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl font-bold">Preços e cupons na internet</h2><span className="rounded-full border border-cyan-300/20 px-3 py-1 text-sm text-cyan-200">SerpApi · Brasil</span></div>
      <p className="mt-2 text-base text-slate-400">Escolha o modelo para encontrar links de lojas e comparar a amostra de preços.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
        <div className="space-y-2"><div className="grid gap-2 sm:grid-cols-2"><Select value={category} onValueChange={v => { setCategory(v as PartCategory | "all"); setBrand("all"); }} disabled={loading}><SelectTrigger aria-label="Filtrar categoria" className="w-full border-white/10 bg-black/20"><SelectValue placeholder="Categoria" /></SelectTrigger><SelectContent><SelectItem value="all">Todas as categorias</SelectItem>{partCategories.map(c => <SelectItem key={c} value={c}>{categoryMeta[c].label}</SelectItem>)}</SelectContent></Select><Select value={brand} onValueChange={setBrand} disabled={loading}><SelectTrigger aria-label="Filtrar fabricante" className="w-full border-white/10 bg-black/20"><SelectValue placeholder="Fabricante" /></SelectTrigger><SelectContent><SelectItem value="all">Todos os fabricantes</SelectItem>{brands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent></Select></div><Input aria-label="Filtrar modelos para pesquisa online" className="lab-input" placeholder="Filtrar por modelo, marca ou categoria" value={query} disabled={loading} onChange={e => setQuery(e.target.value)} />
          <Select value={id} onValueChange={setId} disabled={loading}><SelectTrigger aria-label="Modelo exato para consultar" className="w-full border-white/10 bg-black/20"><SelectValue /></SelectTrigger><SelectContent className="border-white/10 bg-[#101725] text-slate-100">{options.map(p => <SelectItem key={p.id} value={p.id}>{p.brand} {p.name}</SelectItem>)}</SelectContent></Select>
          {!filtered.length && <p className="text-sm text-slate-400">Nenhum modelo corresponde ao filtro.</p>}
        </div>
        <Button className="h-auto min-h-11 bg-cyan-300 text-slate-950 hover:bg-cyan-200" disabled={!configured || checking || loading} onClick={search}>{loading || checking ? <LoaderCircle className="animate-spin" /> : <Search />}{loading ? "Consultando lojas…" : "Buscar ofertas"}</Button>
      </div>
      <p className="mt-3 text-sm text-slate-400">Lojas incluídas: {marketStores.map(s => s.name).join(", ")}. Resultados são reutilizados por 24 horas para economizar consultas.</p>
      {configured === false && <div role="status" className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/5 p-4 text-sm leading-6 text-amber-100"><strong>Pesquisa online aguardando ativação.</strong> O administrador precisa conectar a chave da SerpApi. Até lá, o catálogo e as ofertas cadastradas continuam disponíveis.</div>}
      {error && <p role="alert" className="mt-4 rounded-xl border border-rose-300/20 p-3 text-sm text-rose-200">{error}</p>}
    </div>
    {snapshot ? <div className="space-y-5 p-5 sm:p-6" aria-live="polite">
      <div><h3 className="text-lg font-bold">{snapshot.partName}</h3><p className="mt-1 text-sm text-slate-400">Consultado em {date(snapshot.checkedAt)} · próxima atualização após {date(snapshot.expiresAt)}</p></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[["Média da amostra", money(snapshot.mean)], ["Mediana da amostra", money(snapshot.median)], ["Menor preço da amostra", money(snapshot.minimum)], ["Lojas na amostra", String(snapshot.sampleSize)]].map(([label, value]) => <div key={label} className="rounded-xl border border-white/10 bg-black/15 p-4"><p className="text-sm text-slate-400">{label}</p><p className="mt-2 text-2xl font-bold text-cyan-100">{value}</p></div>)}</div>
      {snapshot.sampleSize < 3 && <p className="text-sm text-amber-200">{snapshot.sampleSize ? "Amostra pequena: menos de 3 lojas. Os números descrevem apenas os anúncios encontrados." : "Nenhuma oferta passou pelos filtros. Isso não significa que a peça esteja indisponível no mercado."}</p>}
      {snapshot.partial && <p className="text-sm text-amber-200">Consulta parcial: algumas ofertas não puderam ser carregadas.</p>}
      <div className="flex flex-wrap gap-2"><Button disabled={snapshot.sampleSize < 3 || snapshot.mean === null || Date.parse(snapshot.expiresAt) <= Date.now()} onClick={() => onUse(snapshot, "mean")} className="bg-cyan-300 text-slate-950 hover:bg-cyan-200">Usar peça e média no montador</Button><Button variant="outline" disabled={snapshot.sampleSize < 3 || snapshot.median === null || Date.parse(snapshot.expiresAt) <= Date.now()} onClick={() => onUse(snapshot, "median")} className="border-white/10">Usar peça e mediana</Button></div>
      <div className="grid gap-3 lg:grid-cols-2">{snapshot.offers.map(o => <article key={o.url} className="rounded-xl border border-white/10 p-4"><div className="flex items-start justify-between gap-4"><div><h4 className="font-bold">{o.store}</h4><p className="mt-1 text-sm leading-6 text-slate-400">{o.title}</p></div><span className="shrink-0 text-xl font-bold">{money(o.price)}</span></div><p className="mt-3 text-sm text-slate-400">Frete: {o.shipping === null ? "consultar com seu CEP" : o.shipping === 0 ? "grátis no anúncio; conferir CEP" : money(o.shipping)} · {o.payment}</p><p className="mt-1 text-sm text-slate-400">Condição: {o.condition}. Vendedor, nota fiscal e garantia: conferir na loja.</p><div className="mt-4 flex items-center justify-between gap-2"><span className="text-sm text-slate-400">{o.inSample ? "Incluída na amostra" : "Fora da amostra (repetição ou extremo)"}</span><a href={o.url} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-cyan-200 underline underline-offset-4">Ver na loja <ExternalLink className="size-4" /></a></div></article>)}</div>
      <details className="rounded-xl border border-white/10 p-4 text-sm text-slate-400"><summary className="cursor-pointer font-semibold text-slate-200">Como os preços são calculados</summary><p className="mt-3 leading-6">{snapshot.note}</p><p className="mt-2 leading-6">Média = soma dos menores preços por loja ÷ número de lojas. Mediana = valor central da lista ordenada. Com pelo menos 4 lojas, valores abaixo de metade ou acima do dobro da mediana ficam fora da amostra ({snapshot.excluded} nesta consulta). A faixa restante vai de {money(snapshot.minimum)} a {money(snapshot.maximum)}.</p><p className="mt-2 leading-6">A correspondência usa o título do anúncio. Modelos genéricos de placa de vídeo podem reunir fabricantes diferentes do mesmo chip e memória. Confirme a versão e a revisão antes de comprar.</p></details>
    </div> : <div className="flex gap-3 p-5 text-sm leading-6 text-slate-400"><Info className="mt-1 size-5 shrink-0" /><p>Os preços de referência do catálogo são estimativas. Uma consulta online mostrará os anúncios encontrados, as lojas e a data da coleta.</p></div>}
    <CouponPanel configured={configured === true} />
  </section>;
}

function CouponPanel({ configured }: { configured: boolean }) {
  const [storeId, setStoreId] = useState("kabum");
  const [result, setResult] = useState<CouponSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function search() {
    setLoading(true); setResult(null); setError("");
    try {
      const response = await fetch("/api/market", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ storeId }) });
      const data = await response.json() as { snapshot: CouponSnapshot; error?: string };
      if (!response.ok) throw new Error(data.error || "Não foi possível buscar cupons.");
      setResult(data.snapshot);
    } catch (e) { setError(e instanceof Error ? e.message : "Falha na consulta."); }
    finally { setLoading(false); }
  }
  return <div className="border-t border-white/10 bg-violet-300/[0.025] p-5 sm:p-6"><h3 className="flex items-center gap-2 text-lg font-bold"><TicketPercent className="size-5 text-violet-300" /> Cupons e promoções por loja</h3><p className="mt-2 text-sm leading-6 text-slate-400">Busca códigos divulgados e páginas de promoção da própria loja. A cobertura no Brasil varia; validade e aplicação à peça só podem ser confirmadas no checkout. Nenhum desconto é aplicado automaticamente.</p><div className="mt-4 flex flex-col gap-3 sm:flex-row"><Select value={storeId} disabled={loading} onValueChange={id => { setStoreId(id); setResult(null); setError(""); }}><SelectTrigger className="w-full border-white/10 bg-black/20 sm:w-64" aria-label="Loja para buscar cupons"><SelectValue /></SelectTrigger><SelectContent className="border-white/10 bg-[#101725] text-slate-100">{marketStores.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select><Button variant="outline" className="border-violet-300/30 text-violet-200" disabled={!configured || loading} onClick={search}>{loading ? <LoaderCircle className="animate-spin" /> : <Search />}Buscar cupons</Button></div>{error && <p role="alert" className="mt-3 text-sm text-rose-200">{error}</p>}{result && <div className="mt-4 space-y-3" aria-live="polite"><p className="text-sm text-slate-400">Consultado em {date(result.checkedAt)} · resultado reutilizado por até 6 horas.</p>{!result.coupons.length && <p className="text-sm text-slate-300">Nenhum código identificado nesta consulta. A loja ainda pode oferecer promoções.</p>}{result.coupons.map(c => <div key={c.code} className="rounded-xl border border-violet-300/20 p-4"><div className="flex items-center gap-3"><code className="text-lg font-bold text-violet-200">{c.code}</code><Button size="sm" variant="ghost" aria-label={`Copiar cupom ${c.code}`} onClick={async () => { try { await navigator.clipboard.writeText(c.code); toast.success("Código copiado."); } catch { toast.error("Não foi possível copiar. Selecione o código manualmente."); } }}><Copy /></Button><span className="text-sm text-amber-200">Não testado no checkout</span></div><p className="mt-1 text-sm text-slate-300">{c.description}</p><p className="mt-1 text-sm text-slate-400">Validade e condições: consultar a fonte{c.sourceInfo ? ` · ${c.sourceInfo}` : ""}.</p><a className="mt-2 inline-block text-sm text-violet-200 underline" href={c.url} target="_blank" rel="noopener noreferrer">Ver divulgação e condições</a></div>)}{result.pages.map(p => <a key={p.url} href={p.url} target="_blank" rel="noopener noreferrer" className="block text-sm text-violet-200 underline underline-offset-4">{p.title} ↗</a>)}</div>}</div>;
}
