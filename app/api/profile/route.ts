import { getChatGPTUser } from "@/app/chatgpt-auth";
import { isBuildConfig, normalizeProfile } from "@/app/lib/profile";
import { readPcHistory, writeProfile } from "@/app/lib/pc-history";
import { getD1 } from "@/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });
  try {
    const db = getD1();
    const row = await db.prepare("SELECT profile_json, revision, updated_at FROM user_profiles WHERE user_id = ? LIMIT 1").bind(user.userId).first<{ profile_json: string; revision: string; updated_at: string }>();
    return NextResponse.json({ profile: normalizeProfile(row ? JSON.parse(row.profile_json) : null, user.displayName), revision: row?.revision ?? null, savedAt: row?.updated_at ?? null, history: await readPcHistory(db, user.userId) });
  } catch {
    return NextResponse.json({ error: "Não foi possível carregar seu perfil agora. Tente novamente para acessar seus dados." }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });
  const raw = await request.text();
  if (raw.length > 120_000) return NextResponse.json({ error: "Perfil grande demais." }, { status: 413 });
  let body;
  try { body = JSON.parse(raw); } catch { return NextResponse.json({ error: "Dados inválidos." }, { status: 400 }); }
  if (!body || !isBuildConfig(body.profile?.currentBuild) || !isBuildConfig(body.profile?.draftBuild) || !(body.expectedRevision === null || typeof body.expectedRevision === "string")) {
    return NextResponse.json({ error: "Recarregue a página antes de salvar esta configuração." }, { status: 400 });
  }
  try {
    const profile = normalizeProfile(body.profile, user.displayName);
    const saved = await writeProfile(getD1(), user, profile, body.expectedRevision);
    if (!saved) return NextResponse.json({ error: "Há uma versão mais recente salva em outra aba. Exporte suas alterações e recarregue a página antes de continuar." }, { status: 409 });
    return NextResponse.json({ profile, ...saved });
  } catch {
    return NextResponse.json({ error: "Não foi possível salvar seu perfil. Suas alterações continuam nesta página." }, { status: 503 });
  }
}
