import type { CouponSnapshot, MarketOffer, MarketSnapshot, Part } from "./types";

// Domains identify the destination, never certify a marketplace seller.
export const marketStores = [
  { id: "kabum", name: "KaBuM!", host: "kabum.com.br" },
  { id: "pichau", name: "Pichau", host: "pichau.com.br" },
  { id: "terabyte", name: "TerabyteShop", host: "terabyteshop.com.br" },
  { id: "gk", name: "GK InfoStore", host: "gkinfostore.com.br" },
  { id: "patoloco", name: "Patoloco", host: "patoloco.com.br" },
] as const;

type RecordValue = Record<string, unknown>;
export const record = (v: unknown): RecordValue => v !== null && typeof v === "object" && !Array.isArray(v) ? v as RecordValue : {};
export const items = (v: unknown): RecordValue[] => Array.isArray(v) ? v.slice(0, 100).map(record) : [];
const str = (v: unknown) => typeof v === "string" ? v.slice(0, 2000) : "";
const normal = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/(\d)\s+(x3d|xtx|xt|ti|kf|gt|g|f|x|k)\b/g, "$1$2").replace(/(\d)\s+(gb|tb|mhz|w)\b/g, "$1$2").replace(/[^a-z0-9]+/g, " ").trim();
const has = (title: string, term: string) => (` ${normal(title)} `).includes(` ${normal(term)} `);

export function safeStoreUrl(raw: unknown) {
  try {
    const url = new URL(str(raw));
    if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443")) return null;
    const store = marketStores.find(s => url.hostname === s.host || url.hostname === `www.${s.host}`);
    if (!store || url.pathname === "/" || /(?:redirect|redirecturl|redirect_uri|returnurl|url|target|dest|destination)=/i.test(url.search)) return null;
    url.hash = "";
    return { url: url.href, store };
  } catch { return null; }
}

export function matchesPart(part: Part, title: string): boolean {
  const text = normal(title);
  if (/\b(usad[oa]s?|seminov[oa]s?|recondicionad[oa]s?|refurbished|renewed|used|open box|caixa aberta|defeito|sucata|kit upgrade|pc completo|computador completo|notebook|laptop|bundle)\b/.test(text)) return false;
  if (part.category === "cpu") {
    if (/\b(cooler|dissipador|watercooler|placa mae|motherboard|kit|pc|montado|combo|computador)\b/.test(text)) return false;
    const model = normal(part.name).match(/\b\d{4,5}(?:x3d|[a-z]+)?\b/)?.[0];
    // Ultra 5/7/9 use three digits. Keep suffixes mandatory and exact.
    const ultra = normal(part.name).includes("ultra") ? normal(part.name).match(/\b\d{3}[a-z]+\b/)?.[0] : undefined;
    return Boolean((model || ultra) && has(title, model || ultra!) && has(title, part.brand) && /\b(ryzen|core|athlon|processador|processor)\b/.test(text));
  }
  if (part.marketMatch?.length) {
    if (/\b(kit|combo|suporte|waterblock|ventoinha)\b/.test(text)) return false;
    // Do not substitute a similarly named board revision or a different GPU edition.
    for (const variant of ["ax", "wifi", "ii", "v2", "r2", "white", "evo"]) {
      if (has(title, variant) && !has(part.name, variant)) return false;
    }
    return part.marketMatch.every(term => has(title, term));
  }
  if (part.category === "gpu") {
    if (/\b(suporte|backplate|waterblock|ventoinha|cooler|kit)\b/.test(text)) return false;
    const chip = normal(part.name).match(/\b(?:rtx|gtx|rx|arc)\s*[ab]?\d{3,4}(?:ti|xtx|xt)?\b/)?.[0];
    const capacity = Number(part.specs.vram);
    return Boolean(chip && has(title, chip) && (!capacity || new RegExp(`\\b${capacity}\\s*g(?:b|btyes)\\b`).test(text)));
  }
  const tokens = normal(part.name).split(" ").filter(t => !["de", "com", "para", "gb", "tb", "ddr4", "ddr5", "nvme", "ssd", "atx", "matx", "wifi", "wi", "fi"].includes(t));
  return tokens.length > 0 && has(title, part.brand) && tokens.every(t => has(title, t)) && (!/\bkit\b/.test(text) || /\bkit\b/.test(normal(part.name)));
}

export function parseBRL(label: unknown): number | null {
  const text = str(label).replace(/\u00a0/g, " ").trim();
  if (!/R\$/.test(text) || /(?:\d+\s*x\s*(?:de\s*)?R\$|\/m[eê]s|por m[eê]s|a partir|\d\s*[-–]\s*R\$)/i.test(text)) return null;
  const match = text.match(/R\$\s*(\d{1,3}(?:\.\d{3})+(?:,\d{2})?|\d+(?:,\d{2})?)(?![\d.,])/);
  if (!match || /R\$/.test(text.slice((match.index ?? 0) + match[0].length))) return null;
  const value = Number(match[1].replace(/\./g, "").replace(",", "."));
  return Number.isFinite(value) && value >= 20 && value <= 100_000 ? value : null;
}

export function offerFromResult(part: Part, result: RecordValue): MarketOffer | null {
  const title = str(result.title);
  const metadata = [title, str(result.snippet), str(result.second_hand_condition), ...[result.details_and_offers, result.extensions].flatMap(v => Array.isArray(v) ? v.map(str) : [])].join(" ");
  if (!matchesPart(part, title) || /\b(usad[oa]s?|seminov[oa]s?|recondicionad[oa]s?|refurbished|renewed|used|open box|marketplace|vendido por terceiro|out of stock|esgotad[oa]|indispon[ií]vel)\b/i.test(metadata)) return null;
  const destination = safeStoreUrl(result.link);
  const price = parseBRL(result.price);
  if (!destination || !price) return null;
  const shippingText = str(result.shipping || result.delivery);
  // Freight is kept separate; a missing value is never treated as free.
  let shipping: number | null = null;
  if (/gr[aá]tis|gratuito|free/i.test(shippingText)) shipping = 0;
  else {
    const n = shippingText.match(/R\$\s*([\d.]+,\d{2})/);
    if (n) shipping = Number(n[1].replace(/\./g, "").replace(",", "."));
  }
  const payment = /\bpix\b/i.test(metadata) ? "Pix informado no anúncio" : /boleto/i.test(metadata) ? "Boleto informado no anúncio" : "Forma de pagamento a confirmar";
  return { title, storeId: destination.store.id, store: destination.store.name, price, shipping, url: destination.url, payment, condition: /\b(novo|new)\b/i.test(metadata) ? "anunciado novo" : "não informado", inSample: true };
}

const round = (n: number) => Math.round(n * 100) / 100;
const median = (sorted: number[]) => (sorted[Math.floor(sorted.length / 2)] + sorted[Math.floor((sorted.length - 1) / 2)]) / 2;
export function summarizeOffers(part: Part, input: MarketOffer[], checkedAt: string, partial = false): MarketSnapshot {
  const byUrl = new Map<string, MarketOffer>();
  for (const o of [...input].sort((a, b) => a.price - b.price)) if (!byUrl.has(o.url)) byUrl.set(o.url, o);
  const offers = [...byUrl.values()];
  // One lowest listed price per store, so a large retailer cannot dominate the average.
  const stores = new Map<string, MarketOffer>();
  for (const offer of offers) if (!stores.has(offer.storeId)) stores.set(offer.storeId, offer);
  const candidates = [...stores.values()];
  const mid = candidates.length ? median(candidates.map(o => o.price).sort((a, b) => a - b)) : 0;
  // A deliberately conservative, disclosed filter, applied only with >= 4 stores.
  const included = candidates.filter(o => candidates.length < 4 || (o.price >= mid * 0.5 && o.price <= mid * 2));
  const urls = new Set(included.map(o => o.url));
  const prices = included.map(o => o.price).sort((a, b) => a - b);
  return {
    partId: part.id, partName: `${part.brand} ${part.name}`, mode: "online",
    mean: prices.length ? round(prices.reduce((a, b) => a + b, 0) / prices.length) : null,
    median: prices.length ? round(median(prices)) : null,
    minimum: prices[0] ?? null, maximum: prices.at(-1) ?? null, sampleSize: prices.length,
    offers: offers.map(o => ({ ...o, inSample: urls.has(o.url) })), checkedAt,
    expiresAt: new Date(Date.parse(checkedAt) + 86400000).toISOString(),
    excluded: candidates.length - included.length, partial,
    note: "Amostra de anúncios em reais, sem frete e sem desconto de cupom. Um preço por loja; pagamentos podem variar. Usados identificados são excluídos. Condição, vendedor, nota fiscal, garantia e estoque precisam ser conferidos na loja. Não representa todo o mercado.",
  };
}

function couponUrl(value: unknown) {
  let raw = str(value);
  try {
    const url = new URL(raw);
    if ((url.hostname === "www.bing.com" || url.hostname === "bing.com") && url.pathname === "/ck/a") {
      const encoded = url.searchParams.get("u");
      if (!encoded?.startsWith("a1")) return null;
      const payload = encoded.slice(2).replace(/-/g, "+").replace(/_/g, "/");
      raw = atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, "="));
    }
  } catch { return null; }
  return safeStoreUrl(raw);
}

export function parseCoupons(storeId: string, data: RecordValue, checkedAt: string): CouponSnapshot {
  const coupons: CouponSnapshot["coupons"] = [];
  for (const entry of items(record(data.coupons_results).items)) {
    const destination = couponUrl(entry.link);
    const code = str(entry.coupon).trim();
    if (!destination || destination.store.id !== storeId || !/^[A-Z0-9_-]{3,40}$/i.test(code)) continue;
    if (coupons.some(c => c.code.toUpperCase() === code.toUpperCase())) continue;
    coupons.push({ code, description: str(entry.title), url: destination.url, sourceInfo: str(entry.source_info) });
  }
  const pages = items(data.organic_results).flatMap(entry => {
    const destination = couponUrl(entry.link);
    return destination?.store.id === storeId && /cupom|cupons|promo[cç][aã]o|ofertas/i.test(str(entry.title)) ? [{ title: str(entry.title), url: destination.url }] : [];
  }).slice(0, 3);
  return { storeId, coupons, pages, checkedAt, expiresAt: new Date(Date.parse(checkedAt) + 6 * 3600000).toISOString() };
}
