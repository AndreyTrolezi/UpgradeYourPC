import { getChatGPTUser } from "@/app/chatgpt-auth";
import { parseExtensionManifest } from "@/app/lib/extensions";
import { getD1 } from "@/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type ExtensionRow = { plugin_id: string; manifest_json: string; enabled: string; installed_at: string };

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });
  try {
    const result = await getD1().prepare("SELECT plugin_id, manifest_json, enabled, installed_at FROM extension_installs WHERE user_id = ? ORDER BY installed_at ASC").bind(user.userId).all<ExtensionRow>();
    const extensions = (result.results ?? []).flatMap((row) => {
      try { return [{ pluginId: row.plugin_id, manifest: JSON.parse(row.manifest_json), enabled: row.enabled === "1", installedAt: row.installed_at }]; }
      catch { return []; }
    });
    return NextResponse.json({ extensions });
  } catch (error) {
    console.error("extensions.get", error);
    return NextResponse.json({ error: "Não foi possível carregar as extensões." }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });
  try {
    const raw = await request.text();
    if (raw.length > 90_000) return NextResponse.json({ error: "Manifesto grande demais." }, { status: 413 });
    const body = JSON.parse(raw) as { manifest?: unknown; enabled?: boolean; remove?: boolean; pluginId?: string };
    if (body.remove && body.pluginId) {
      await getD1().prepare("DELETE FROM extension_installs WHERE user_id = ? AND plugin_id = ?").bind(user.userId, body.pluginId).run();
      return NextResponse.json({ removed: body.pluginId });
    }
    const manifest = parseExtensionManifest(JSON.stringify(body.manifest));
    const now = new Date().toISOString();
    await getD1().prepare(`
      INSERT INTO extension_installs (user_id, plugin_id, manifest_json, enabled, installed_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, plugin_id) DO UPDATE SET
        manifest_json = excluded.manifest_json,
        enabled = excluded.enabled,
        updated_at = excluded.updated_at
    `).bind(user.userId, manifest.id, JSON.stringify(manifest), body.enabled === false ? "0" : "1", now, now).run();
    return NextResponse.json({ pluginId: manifest.id, manifest, enabled: body.enabled !== false, savedAt: now });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível instalar a extensão.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
