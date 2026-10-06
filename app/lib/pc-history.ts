import { normalizeProfile } from "@/app/lib/profile";
import type { PcHistoryEntry, UserProfile } from "@/app/lib/types";

type ProfileRow = { profile_json: string; revision: string; updated_at: string };

export async function readPcHistory(db: D1Database, userId: string): Promise<PcHistoryEntry[]> {
  const rows = await db.prepare("SELECT id, build_json, created_at FROM pc_history WHERE user_id = ? ORDER BY created_at DESC, rowid DESC LIMIT 30").bind(userId).all<{ id: string; build_json: string; created_at: string }>();
  return rows.results.map(row => ({ id: row.id, build: JSON.parse(row.build_json), createdAt: row.created_at }));
}

// Profile and snapshots are committed together. A stale tab cannot overwrite a newer save.
export async function writeProfile(db: D1Database, user: { userId: string; email: string; displayName: string }, profile: UserProfile, expectedRevision: string | null) {
  const previous = await db.prepare("SELECT profile_json, revision, updated_at FROM user_profiles WHERE user_id = ? LIMIT 1").bind(user.userId).first<ProfileRow>();
  if ((previous?.revision ?? null) !== expectedRevision) return null;
  const now = new Date().toISOString();
  const revision = crypto.randomUUID();
  const statements: D1PreparedStatement[] = [previous
    ? db.prepare("UPDATE user_profiles SET email = ?, display_name = ?, profile_json = ?, updated_at = ?, revision = ? WHERE user_id = ? AND revision = ?")
      .bind(user.email, profile.displayName, JSON.stringify(profile), now, revision, user.userId, expectedRevision)
    : db.prepare("INSERT INTO user_profiles (user_id, email, display_name, profile_json, created_at, updated_at, revision) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(user_id) DO NOTHING")
      .bind(user.userId, user.email, profile.displayName, JSON.stringify(profile), now, now, revision)];
  const before = previous ? normalizeProfile(JSON.parse(previous.profile_json), user.displayName).currentBuild : null;
  if (JSON.stringify(before) !== JSON.stringify(profile.currentBuild)) {
    if (before) statements.push(db.prepare(`INSERT INTO pc_history (id, user_id, build_json, created_at)
      SELECT ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM user_profiles WHERE user_id = ? AND revision = ?)
      AND NOT EXISTS (SELECT 1 FROM pc_history WHERE user_id = ?)`)
      .bind(crypto.randomUUID(), user.userId, JSON.stringify(before), previous!.updated_at, user.userId, revision, user.userId));
    statements.push(db.prepare(`INSERT INTO pc_history (id, user_id, build_json, created_at)
      SELECT ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM user_profiles WHERE user_id = ? AND revision = ?)`)
      .bind(crypto.randomUUID(), user.userId, JSON.stringify(profile.currentBuild), now, user.userId, revision));
  }
  const results = await db.batch(statements);
  if (!results[0].meta.changes) return null;
  return { revision, savedAt: now, history: await readPcHistory(db, user.userId) };
}
