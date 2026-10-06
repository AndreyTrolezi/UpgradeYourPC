import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import ts from "typescript";

const sqlite = new DatabaseSync(":memory:");
for (const file of fs.readdirSync("drizzle").filter(f => f.endsWith(".sql")).sort()) sqlite.exec(fs.readFileSync(`drizzle/${file}`, "utf8"));
const db = { prepare(sql) { return { args: [], bind(...args) { this.args = args; return this; }, async first() { return sqlite.prepare(sql).get(...this.args) ?? null; }, async run() { return sqlite.prepare(sql).run(...this.args); } }; } };
const env = { DB: db };
let user = { userId: "test-user" };
const cache = new Map();
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file).exports;
  const mod = { exports: {} }; cache.set(file, mod);
  const source = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const require = id => {
    if (id === "cloudflare:workers") return { env };
    if (id === "@/db") return { getD1: () => db };
    if (id === "@/app/chatgpt-auth") return { getChatGPTUser: async () => user };
    if (id === "next/server") return { NextResponse: { json: (body, init) => Response.json(body, init) } };
    return load((id.startsWith("@/") ? path.resolve(id.slice(2)) : path.resolve(path.dirname(file), id)) + ".ts");
  };
  new Function("require", "module", "exports", source)(require, mod, mod.exports);
  return mod.exports;
}
const { catalog } = load("app/data/catalog.ts");
const { verifiedCatalog } = load("app/data/catalog-verified.ts");
const { matchesPart, parseBRL, safeStoreUrl, offerFromResult, summarizeOffers, parseCoupons, marketStores } = load("app/lib/market.ts");
const { partPrice, totalPrice, analyzeBuild } = load("app/lib/compatibility.ts");
const { refreshMarket, collectPrices } = load("app/lib/market-server.ts");
const route = load("app/api/market/route.ts");
const part = id => { const p = catalog.find(p => p.id === id); assert(p, id); return p; };
const ryzen = part("r7-5700x");
assert.equal(new Set(catalog.map(p => p.id)).size, catalog.length);
assert.equal(verifiedCatalog.length, 12);
for (const p of verifiedCatalog) {
  assert.equal(p.priceStatus, "unpriced"); assert.equal(p.price, 0); assert(p.source.url.startsWith("https://"));
  assert(matchesPart(p, `${p.brand} ${p.name}`), `${p.name} matches its own identity`);
}
for (const name of ["5700", "5700G", "5700X3D", "5700GE", "5700X cooler", "5700X kit upgrade", "5700X usado", "5700X recondicionado", "5700X computador gamer"]) assert(!matchesPart(ryzen, `AMD Ryzen 7 ${name}`), name);
assert(matchesPart(ryzen, "Processador AMD Ryzen 7 5700 X 8 núcleos"));
assert(!matchesPart(part("i5-12400"), "Intel Core i5-12400F"));
assert(!matchesPart(part("sapphire-pulse-rx9060xt-16"), "Sapphire Pulse RX 9060 XT 8GB"));
assert(matchesPart(part("sapphire-pulse-rx9060xt-16"), "Sapphire Pulse RX 9060 XT 16 GB"));
assert(!matchesPart(part("gigabyte-b550m-aorus-elite-r13"), "Gigabyte B550M Aorus Elite AX rev 1.3"));
assert(!matchesPart(part("kingston-nv3-1tb-2280"), "Kingston NV3 1TB M.2 2230"));
assert.equal(parseBRL("R$ 1.299,90"), 1299.9);
assert.equal(parseBRL("R$ 799,00 à vista"), 799);
for (const invalid of ["US$ 100.00", "$799", "12x R$ 100,00", "10 x de R$ 100,00", "R$ 300,00/mês", "R$ 1,299.99", "a partir de R$ 300,00", "R$ 100,00 - R$ 500,00"]) assert.equal(parseBRL(invalid), null, invalid);
for (const url of ["javascript:alert(1)", "https://kabum.com.br.evil.test/p/1", "https://kabum.com.br@evil.test/p/1", "http://kabum.com.br/p/1", "https://kabum.com.br:8080/p/1", "https://kabum.com.br/redirect?url=https://evil.test", "https://www.google.com/shopping/1"]) assert.equal(safeStoreUrl(url), null, url);
const row = { title: "Processador AMD Ryzen 7 5700X novo", price: "R$ 1.000,00", link: "https://www.kabum.com.br/produto/teste" };
assert.equal(offerFromResult(ryzen, row).shipping, null);
assert.equal(offerFromResult(ryzen, { ...row, delivery: "Frete grátis" }).shipping, 0);
assert.equal(offerFromResult(ryzen, { ...row, second_hand_condition: "Used" }), null);
assert.equal(offerFromResult(ryzen, { ...row, details_and_offers: ["Out of stock"] }), null);
const offers = [100, 1000, 1100, 1200, 10000].map((price, i) => ({ ...offerFromResult(ryzen, row), price, storeId: marketStores[i].id, store: marketStores[i].name, url: `https://${marketStores[i].host}/product` }));
const s = summarizeOffers(ryzen, [...offers, { ...offers[1], price: 2000 }], new Date().toISOString());
assert.equal(s.mean, 1100); assert.equal(s.median, 1100); assert.equal(s.sampleSize, 3); assert.equal(s.excluded, 2);
assert.equal(s.offers.length, 5); assert.equal(s.minimum, 1000);
assert.equal(summarizeOffers(ryzen, [], new Date().toISOString()).mean, null);
const couponLink = "https://www.kabum.com.br/cupons";
const bingLink = `https://www.bing.com/ck/a?u=a1${Buffer.from(couponLink).toString("base64url")}`;
const coupons = parseCoupons("kabum", { coupons_results: { items: [{ coupon: "TESTE10", title: "Condições no site", link: bingLink }, { coupon: "FALSO", link: "https://evil.test/cupons" }, { coupon: "OUTRALOJA", link: "https://www.pichau.com.br/cupons" }] } }, new Date().toISOString());
assert.equal(coupons.coupons.length, 1); assert.equal(coupons.coupons[0].url, couponLink);
const build = { id: "test", name: "test", parts: { cpu: ["r5-9600x"] }, goal: "work", budget: 2000, notes: "" };
assert(analyzeBuild(build).checks.some(c => c.id === "unpriced"));
build.estimatedPrices = { "r5-9600x": 1100.5 };
assert.equal(totalPrice(build), 1100.5); assert.equal(partPrice(build, part("r5-9600x")), 1100.5);
assert(!analyzeBuild(build).checks.some(c => c.id === "unpriced"));

let calls = [];
globalThis.fetch = async url => {
  const u = new URL(url); calls.push(u);
  assert.equal(u.origin, "https://serpapi.com"); assert.equal(u.searchParams.get("api_key"), "test-secret");
  if (u.searchParams.get("engine") === "google_shopping") {
    assert.equal(u.searchParams.get("gl"), "br"); assert.equal(u.searchParams.get("hl"), "pt");
    assert.equal(u.searchParams.get("q"), '"AMD Ryzen 7 5700X" -kit -combo -notebook -laptop -computador -"pc gamer"');
    return Response.json({ shopping_results: [{ title: row.title, product_link: "https://www.google.com/shopping/1", immersive_product_page_token: "documented-token-test" }, { title: "AMD Ryzen 7 5700G", immersive_product_page_token: "wrong-model-token" }] });
  }
  assert.equal(u.searchParams.get("engine"), "google_immersive_product");
  assert.equal(u.searchParams.get("page_token"), "documented-token-test");
  return Response.json({ product_results: { title: row.title, stores: marketStores.slice(0, 3).map((store, i) => ({ ...row, price: `R$ ${1000 + i * 100},00`, link: `https://${store.host}/p/5700x` })) } });
};
const post = body => route.POST(new Request("https://lab.test/api/market", { method: "POST", headers: { origin: "https://lab.test", "content-type": "application/json" }, body: JSON.stringify(body) }));
user = null; assert.equal((await post({ partId: ryzen.id })).status, 401); user = { userId: "test-user" };
assert.equal((await post(null)).status, 400);
assert.equal((await post({ partId: "untrusted-custom-part", query: "arbitrary query" })).status, 400);
assert.equal((await post({ partId: ryzen.id })).status, 503); assert.equal(calls.length, 0);
env.SERPAPI_API_KEY = "test-secret";
const live = await post({ partId: ryzen.id }); assert.equal(live.status, 200);
const data = await live.json(); assert.equal(data.snapshot.mean, 1100); assert.equal(data.snapshot.sampleSize, 3); assert.equal(calls.length, 2);
assert(!JSON.stringify(data).includes("test-secret")); assert(!JSON.stringify(data).includes("documented-token"));
await refreshMarket(`price:v1:${ryzen.id}`, "test-user", ryzen); assert.equal(calls.length, 2, "cache avoids new API calls");
const requestWrongOrigin = new Request("https://lab.test/api/market", { method: "POST", headers: { origin: "https://evil.test" }, body: JSON.stringify({ partId: ryzen.id }) });
assert.equal((await route.POST(requestWrongOrigin)).status, 403);
// Rate-limit reservations enforce a hard ceiling even for parallel refreshes.
sqlite.exec("DELETE FROM market_cache; DELETE FROM market_usage;");
const month = new Date().toISOString().slice(0, 7);
sqlite.prepare("INSERT INTO market_usage (key,count) VALUES (?,197)").run(`month:${month}`);
const parallel = await Promise.allSettled([refreshMarket("price:a", "u1", ryzen), refreshMarket("price:b", "u2", ryzen)]);
assert.equal(parallel.filter(r => r.status === "fulfilled").length, 1);
assert.equal(sqlite.prepare("SELECT count FROM market_usage WHERE key = ?").get(`month:${month}`).count, 200);
assert.equal(parallel.find(r => r.status === "rejected").reason.status, 429);
globalThis.fetch = async () => { throw new Error("should never leak test-secret"); };
await assert.rejects(() => collectPrices(ryzen), e => e.status === 502 && !e.message.includes("test-secret"));
console.log(`Market checks passed: ${catalog.length} parts; exact variants, merchant URLs, BRL, coupons, averages, cache, auth and quota.`);
sqlite.close();
