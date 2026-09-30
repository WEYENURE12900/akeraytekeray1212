import { getDB } from "../cf";

export interface ProfilePatch {
  fullName?: string;
  bio?: string | null;
  city?: string | null;
  avatarKey?: string | null;
  phone?: string | null;
  email?: string | null;
  isHost?: boolean;
}

export async function updateUserProfile(
  userId: string,
  patch: ProfilePatch,
): Promise<boolean> {
  const db = await getDB();
  const updates: string[] = [];
  const binds: unknown[] = [];

  if (patch.fullName !== undefined) {
    updates.push("full_name = ?");
    binds.push(patch.fullName.trim());
  }
  if (patch.bio !== undefined) {
    updates.push("bio = ?");
    binds.push(patch.bio ? patch.bio.trim() : null);
  }
  if (patch.city !== undefined) {
    updates.push("city = ?");
    binds.push(patch.city ? patch.city.trim() : null);
  }
  if (patch.avatarKey !== undefined) {
    updates.push("avatar_key = ?");
    binds.push(patch.avatarKey);
  }
  if (patch.phone !== undefined) {
    updates.push("phone = ?");
    binds.push(patch.phone ? patch.phone.trim() : null);
  }
  if (patch.email !== undefined) {
    updates.push("email = ?");
    binds.push(patch.email ? patch.email.trim().toLowerCase() : null);
  }
  if (patch.isHost !== undefined) {
    updates.push("is_host = ?");
    binds.push(patch.isHost ? 1 : 0);
  }

  if (updates.length === 0) return false;

  updates.push("updated_at = datetime('now')");
  binds.push(userId);

  const result = await db
    .prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`)
    .bind(...binds)
    .run();

  return (result.meta?.changes ?? 0) > 0;
}
