import { NextResponse } from "next/server";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { catalog } from "@/app/data/catalog";
import { marketStores } from "@/app/lib/market";
import { cachedMarket, marketEnabled, refreshMarket, MarketError } from "@/app/lib/market-server";

export const dynamic = "force-dynamic";
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(request: Request) {
  if (!await getChatGPTUser()) return json({ error: "Entre na sua conta para consultar ofertas." }, 401);
  const partId = new URL(request.url).searchParams.get("partId");
  const configured = marketEnabled();
  if (!partId) return json({ configured });
  if (!catalog.some(p => p.id === partId)) return json({ error: "Peça não encontrada." }, 404);
  try { return json({ configured, snapshot: await cachedMarket(`price:v1:${partId}`) }); }
  catch { return json({ configured, error: "Não foi possível carregar a consulta salva." }, 503); }
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return json({ error: "Entre na sua conta para consultar ofertas." }, 401);
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return json({ error: "Origem inválida." }, 403);
  try {
    const raw = await request.text();
    if (raw.length > 1000) return json({ error: "Consulta grande demais." }, 413);
    let body: { partId?: string; storeId?: string };
    try { body = JSON.parse(raw); } catch { return json({ error: "Consulta inválida." }, 400); }
    if (!body || typeof body !== "object") return json({ error: "Consulta inválida." }, 400);
    const part = catalog.find(p => p.id === body.partId && !p.tags.includes("atual"));
    const store = marketStores.find(s => s.id === body.storeId);
    if ((!part && !store) || (part && store)) return json({ error: "Selecione uma peça ou loja do catálogo." }, 400);
    const snapshot = await refreshMarket(part ? `price:v1:${part.id}` : `coupon:v1:${store!.id}`, user.userId, part ?? store!.id);
    return json({ configured: marketEnabled(), snapshot });
  } catch (error) {
    if (error instanceof MarketError) return json({ code: error.code, error: error.message }, error.status);
    return json({ error: "Não foi possível concluir a consulta. Tente mais tarde." }, 503);
  }
}
