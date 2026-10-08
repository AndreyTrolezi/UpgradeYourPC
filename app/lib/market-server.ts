import { env } from "cloudflare:workers";
import { getD1 } from "@/db";
import { items, record, matchesPart, offerFromResult, summarizeOffers, parseCoupons, marketStores } from "./market";
import type { CouponSnapshot, MarketOffer, MarketSnapshot, Part } from "./types";

export class MarketError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}
export const marketEnabled = () => Boolean((env as Cloudflare.Env).SERPAPI_API_KEY?.trim());
export type Snapshot = MarketSnapshot | CouponSnapshot;

export async function cachedMarket(key: string): Promise<Snapshot | null> {
  const row = await getD1().prepare("SELECT payload FROM market_cache WHERE key = ? AND expires_at > ?").bind(key, Date.now()).first<{ payload: string }>();
  return row ? JSON.parse(row.payload) as Snapshot : null;
}

async function reserveCalls(userId: string, count: number) {
  const date = new Date().toISOString();
  // Atomic per-bucket reservations across concurrent Workers. Failed attempts consume local budget.
  for (const [key, limit] of [[`user:${userId}:${date.slice(0, 10)}`, 12], [`hour:${date.slice(0, 13)}`, 40], [`month:${date.slice(0, 7)}`, 200]] as const) {
    const reserved = await getD1().prepare(`INSERT INTO market_usage (key, count) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET count = market_usage.count + excluded.count
      WHERE market_usage.count + excluded.count <= ? RETURNING count`).bind(key, count, limit).first();
    if (!reserved) throw new MarketError(429, "quota", "O limite de consultas foi atingido. Tente mais tarde; resultados ainda válidos continuam disponíveis.");
  }
}

async function searchSerp(params: Record<string, string>) {
  const url = new URL("https://serpapi.com/search.json");
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  url.searchParams.set("api_key", (env as Cloudflare.Env).SERPAPI_API_KEY!.trim());
  let response: Response;
  const startedAt = Date.now();
  try { response = await fetch(url.toString(), { signal: AbortSignal.timeout(20000), redirect: "manual", headers: { Accept: "application/json" } }); }
  catch (error) {
    // Never log the request URL: it contains the SerpApi credential.
    const elapsedMs = Date.now() - startedAt;
    const kind = error instanceof Error ? error.name : typeof error;
    const cause = error instanceof Error && "cause" in error ? (error as Error & { cause?: unknown }).cause : undefined;
    const causeCode = cause && typeof cause === "object" && "code" in cause && typeof cause.code === "string" ? cause.code : "unknown";
    console.error("market.serpapi.fetch_failed", { engine: params.engine ?? "unknown", elapsedMs, kind, causeCode });
    throw new MarketError(502, "provider", "Falha na conexão com o provedor de preços. Confira o diagnóstico no terminal do servidor.");
  }
  // Never follow redirects to another host with the API key in the URL.
  if (response.status >= 300 && response.status < 400) throw new MarketError(502, "provider", "O provedor redirecionou a consulta inesperadamente.");
  if (!response.ok) throw new MarketError(502, "provider", "O provedor não autorizou ou não concluiu a consulta. O administrador pode conferir a chave e o saldo da API.");
  let data: Record<string, unknown>;
  try { data = record(await response.json()); }
  catch { throw new MarketError(502, "provider", "O provedor retornou uma resposta inválida."); }
  if (data.error || record(data.search_metadata).status === "Error") throw new MarketError(502, "provider", "A busca não pôde ser concluída pelo provedor.");
  return data;
}

function shoppingQuery(part: Part) {
  const identity = `${part.brand} ${part.name}`.replace(/"/g, "").trim();
  // Quoting the exact product identity reduces substitutions before the
  // stricter title matcher runs. Negative terms are only broad product forms;
  // variant suffixes remain enforced by matchesPart().
  return `"${identity}" -kit -combo -notebook -laptop -computador -\"pc gamer\"`;
}

export async function collectPrices(part: Part): Promise<MarketSnapshot> {
  const shopping = await searchSerp({ engine: "google_shopping", q: shoppingQuery(part), gl: "br", hl: "pt", google_domain: "google.com.br" });
  const results = [...items(shopping.shopping_results), ...items(shopping.inline_shopping_results), ...items(shopping.categorized_shopping_results).flatMap(v => items(v.shopping_results))];
  const matching = results.filter(r => typeof r.title === "string" && matchesPart(part, r.title));
  const offers: MarketOffer[] = matching.flatMap(r => { const offer = offerFromResult(part, r); return offer ? [offer] : []; });
  const tokens = [...new Set(matching.map(r => r.immersive_product_page_token).filter((v): v is string => typeof v === "string" && v.length > 10 && v.length < 16000))].slice(0, 2);
  let failures = 0;
  // Shopping product_link may be a Google URL; retrieve direct merchant destinations separately.
  for (const token of tokens) {
    try {
      const product = record((await searchSerp({ engine: "google_immersive_product", page_token: token, more_stores: "true" })).product_results);
      for (const store of items(product.stores)) {
        const offer = offerFromResult(part, store);
        if (offer) offers.push(offer);
      }
    } catch { failures++; }
  }
  if (tokens.length && failures === tokens.length && !offers.length) throw new MarketError(502, "provider", "A busca encontrou o produto, mas não conseguiu consultar as ofertas das lojas.");
  return summarizeOffers(part, offers, new Date().toISOString(), failures > 0);
}

async function collectCoupons(storeId: string): Promise<CouponSnapshot> {
  const store = marketStores.find(s => s.id === storeId)!;
  const data = await searchSerp({ engine: "bing", q: `${store.name} cupom de desconto site:${store.host}`, mkt: "pt-BR" });
  return parseCoupons(storeId, data, new Date().toISOString());
}

export async function refreshMarket(key: string, userId: string, target: Part | string): Promise<Snapshot> {
  const cached = await cachedMarket(key);
  if (cached) return cached;
  if (!marketEnabled()) throw new MarketError(503, "setup", "A pesquisa online aguarda ativação pelo administrador.");
  const db = getD1();
  const token = crypto.randomUUID();
  const lease = await db.prepare(`INSERT INTO market_cache (key, lease_until, lease_token) VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET lease_until = excluded.lease_until, lease_token = excluded.lease_token
    WHERE market_cache.lease_until < ? RETURNING key`).bind(key, Date.now() + 100000, token, Date.now()).first();
  if (!lease) throw new MarketError(409, "busy", "Esta consulta já está em andamento. Aguarde um momento e consulte novamente.");
  try {
    const completed = await cachedMarket(key);
    if (completed) return completed;
    await reserveCalls(userId, typeof target === "string" ? 1 : 3);
    const snapshot = typeof target === "string" ? await collectCoupons(target) : await collectPrices(target);
    await db.prepare("UPDATE market_cache SET payload = ?, expires_at = ? WHERE key = ? AND lease_token = ?").bind(JSON.stringify(snapshot), Date.parse(snapshot.expiresAt), key, token).run();
    return snapshot;
  } finally {
    await db.prepare("UPDATE market_cache SET lease_until = 0 WHERE key = ? AND lease_token = ?").bind(key, token).run();
  }
}
