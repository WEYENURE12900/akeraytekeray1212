"use server";

/**
 * Favourites.
 *
 * One toggle action, optimistically rendered on the client: the returned
 * boolean is the truth, so a failed save cannot leave a heart that lies.
 */
import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { toggleFavorite } from "@/lib/db/listings";
import { getDB } from "@/lib/cf";

/** Flips saved state and reports the new one. */
export async function toggleFavoriteAction(
  listingId: string,
): Promise<{ ok: boolean; saved: boolean }> {
  const user = await requireUser("en", "/signin");

  // Refuse ids that do not point at a real listing, so a tampered call cannot
  // fill the favorites table with ghosts.
  const db = await getDB();
  const exists = await db
    .prepare("SELECT 1 AS ok FROM listings WHERE id = ? AND status = 'published'")
    .bind(listingId)
    .first<{ ok: number }>();
  if (!exists) return { ok: false, saved: false };

  const saved = await toggleFavorite(user.id, listingId);

  revalidatePath("/[locale]/favorites", "page");
  return { ok: true, saved };
}
