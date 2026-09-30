"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { isEmail, normaliseEmail, normalisePhone, requireUser } from "@/lib/auth";
import { getDB, getPhotos } from "@/lib/cf";
import { markNotificationsRead } from "@/lib/db/notifications";
import { updateUserProfile, type ProfilePatch } from "@/lib/db/profile";
import { coerceLocale, localeHref } from "@/lib/i18n/config";
import type { MessageKey } from "@/lib/i18n/messages";
import { MAX_PHOTO_BYTES, newObjectName } from "@/lib/photos";
import type { Locale } from "@/lib/types";
import { boolField, field } from "@/lib/utils";

export interface ProfileFormState {
  ok?: boolean;
  error?: MessageKey;
}

export async function updateUserProfileAction(form: FormData): Promise<void> {
  const locale: Locale = coerceLocale(field(form, "locale"));
  const user = await requireUser(locale, "/profile");

  const fullName = field(form, "fullName");
  const bio = field(form, "bio");
  const city = field(form, "city");
  const rawPhone = field(form, "phone");
  const rawEmail = field(form, "email");
  const wantsHost = boolField(form, "isHost");

  if (!fullName || fullName.trim().length < 2) {
    redirect(`${localeHref(locale, "/profile")}?error=name_required`);
  }

  const patch: ProfilePatch = {
    fullName: fullName.trim(),
    bio: bio || null,
    city: city || null,
    isHost: wantsHost,
  };

  if (rawPhone) {
    const normalised = normalisePhone(rawPhone);
    if (!normalised) {
      redirect(`${localeHref(locale, "/profile")}?error=invalid_phone`);
    }
    // Check clash
    const db = await getDB();
    const clash = await db
      .prepare("SELECT id FROM users WHERE phone = ? AND id != ? LIMIT 1")
      .bind(normalised, user.id)
      .first<{ id: string }>();
    if (clash) {
      redirect(`${localeHref(locale, "/profile")}?error=phone_exists`);
    }
    patch.phone = normalised;
  }

  if (rawEmail) {
    if (!isEmail(rawEmail)) {
      redirect(`${localeHref(locale, "/profile")}?error=invalid_email`);
    }
    const cleanEmail = normaliseEmail(rawEmail);
    const db = await getDB();
    const clash = await db
      .prepare("SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1")
      .bind(cleanEmail, user.id)
      .first<{ id: string }>();
    if (clash) {
      redirect(`${localeHref(locale, "/profile")}?error=email_exists`);
    }
    patch.email = cleanEmail;
  }

  // Handle avatar upload if provided
  const avatarFile = form.get("avatar");
  if (avatarFile instanceof File && avatarFile.size > 0 && avatarFile.size <= MAX_PHOTO_BYTES) {
    try {
      const bucket = await getPhotos();
      const objectName = newObjectName("avatar", user.id, avatarFile.name || "avatar.jpg");
      await bucket.put(objectName, await avatarFile.arrayBuffer(), {
        httpMetadata: { contentType: avatarFile.type || "image/jpeg" },
      });
      patch.avatarKey = `r2:${objectName}`;
    } catch {}
  }

  await updateUserProfile(user.id, patch);

  revalidatePath("/[locale]/profile", "page");
  revalidatePath("/", "layout");
  redirect(`${localeHref(locale, "/profile")}?saved=1`);
}

export async function markNotificationsReadAction(locale: Locale = "en"): Promise<{ ok: boolean }> {
  const user = await requireUser(locale, "/profile");
  await markNotificationsRead(user.id);
  revalidatePath("/[locale]/profile", "page");
  return { ok: true };
}
