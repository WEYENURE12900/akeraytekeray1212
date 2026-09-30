import { getDB, tryGetDB } from "../cf";
import type { NotificationRow } from "../types";
import { newId } from "../utils";

export async function getUserNotifications(
  userId: string,
  limit = 20,
): Promise<NotificationRow[]> {
  const db = await tryGetDB();
  if (!db) return [];

  const { results } = await db
    .prepare(
      `SELECT * FROM notifications
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ?`,
    )
    .bind(userId, limit)
    .all<NotificationRow>();

  return results;
}

export async function markNotificationsRead(userId: string): Promise<void> {
  const db = await getDB();
  await db
    .prepare("UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0")
    .bind(userId)
    .run();
}

export async function createNotification(input: {
  userId: string;
  kind: string;
  titleEn: string;
  titleAm?: string | null;
  bodyEn?: string | null;
  bodyAm?: string | null;
  href?: string | null;
}): Promise<string> {
  const db = await getDB();
  const id = newId("notif");

  await db
    .prepare(
      `INSERT INTO notifications (id, user_id, kind, title_en, title_am, body_en, body_am, href, read, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, datetime('now'))`,
    )
    .bind(
      id,
      input.userId,
      input.kind,
      input.titleEn,
      input.titleAm ?? null,
      input.bodyEn ?? null,
      input.bodyAm ?? null,
      input.href ?? null,
    )
    .run();

  return id;
}
