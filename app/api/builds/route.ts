import { getChatGPTUser } from "@/app/chatgpt-auth";
import { isBuildConfig } from "@/app/lib/profile";
import type { SavedBuild } from "@/app/lib/types";
import { getD1 } from "@/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type BuildRow = { id: string; name: string; build_json: string; created_at: string; updated_at: string };

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });
  try {
    const result = await getD1().prepare("SELECT id, name, build_json, created_at, updated_at FROM saved_builds WHERE user_id = ? ORDER BY updated_at DESC LIMIT 50").bind(user.userId).all<BuildRow>();
    const builds: SavedBuild[] = (result.results ?? []).flatMap((row) => {
      try {
        const payload = JSON.parse(row.build_json);
        if (!isBuildConfig(payload)) return [];
        return [{ id: row.id, name: row.name, payload, createdAt: row.created_at, updatedAt: row.updated_at }];
      } catch { return []; }
    });
    return NextResponse.json({ builds });
  } catch (error) {
    console.error("builds.get", error);
    return NextResponse.json({ error: "Não foi possível carregar as configurações salvas." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });
  try {
    const raw = await request.text();
    if (raw.length > 100_000) return NextResponse.json({ error: "Configuração grande demais." }, { status: 413 });
    const body = JSON.parse(raw) as { action?: string; id?: string; build?: unknown };
    if (body.action === "delete") {
      if (!body.id) return NextResponse.json({ error: "ID ausente." }, { status: 400 });
      await getD1().prepare("DELETE FROM saved_builds WHERE id = ? AND user_id = ?").bind(body.id, user.userId).run();
      return NextResponse.json({ deleted: body.id });
    }
    if (!isBuildConfig(body.build)) return NextResponse.json({ error: "Configuração inválida." }, { status: 400 });
    const id = typeof body.id === "string" && /^[a-zA-Z0-9._-]{3,80}$/.test(body.id) ? body.id : crypto.randomUUID();
    const name = body.build.name.trim().slice(0, 100) || "Configuração sem nome";
    const now = new Date().toISOString();
    await getD1().prepare(`
      INSERT INTO saved_builds (id, user_id, name, build_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        build_json = excluded.build_json,
        updated_at = excluded.updated_at
      WHERE user_id = excluded.user_id
    `).bind(id, user.userId, name, JSON.stringify({ ...body.build, id }), now, now).run();
    return NextResponse.json({ id, name, savedAt: now });
  } catch (error) {
    console.error("builds.post", error);
    return NextResponse.json({ error: "Não foi possível salvar a configuração." }, { status: 503 });
  }
}
