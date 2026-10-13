import { createHash, randomBytes } from "node:crypto";
import type { DB } from "./db";
import type { SessionUser } from "./types";

export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

// Only a hash of the token is stored, so a leaked database can't be used to log in.
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createSession(db: DB, userId: number, now = Date.now()) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = now + SESSION_TTL_MS;
  db.prepare("DELETE FROM sessions WHERE user_id = ? AND expires_at <= ?").run(userId, now);
  db.prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)").run(
    hashToken(token),
    userId,
    expiresAt,
  );
  return { token, expiresAt: new Date(expiresAt) };
}

export function getSessionUser(db: DB, token: string, now = Date.now()): SessionUser | null {
  const row = db
    .prepare(
      `SELECT u.id, u.email, u.name, u.role, s.expires_at AS expiresAt
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.id = ?`,
    )
    .get(hashToken(token)) as (SessionUser & { expiresAt: number }) | undefined;

  if (!row) return null;
  if (row.expiresAt <= now) {
    deleteSession(db, token);
    return null;
  }
  return { id: row.id, email: row.email, name: row.name, role: row.role };
}

export function deleteSession(db: DB, token: string): void {
  db.prepare("DELETE FROM sessions WHERE id = ?").run(hashToken(token));
}
