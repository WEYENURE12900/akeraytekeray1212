"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { getDB, getPhotos } from "@/lib/cf";
import { createProvider, rateProvider, type NewProvider } from "@/lib/db/providers";
import { ADDIS_CENTER, CITIES } from "@/lib/geo";
import { coerceLocale, localeHref } from "@/lib/i18n/config";
import type { MessageKey } from "@/lib/i18n/messages";
import { MAX_PHOTO_BYTES, newObjectName } from "@/lib/photos";
import type { Locale } from "@/lib/types";
import { boolField, field } from "@/lib/utils";

export interface ProviderFormState {
  ok?: boolean;
  error?: MessageKey;
}

export async function createProviderAction(form: FormData): Promise<void> {
  const locale: Locale = coerceLocale(field(form, "locale"));
  const user = await requireUser(locale, "/services/add");

  const nameEn = field(form, "nameEn");
  const nameAm = field(form, "nameAm") || null;
  const category = field(form, "category") || "restaurant";
  const descriptionEn = field(form, "descriptionEn") || null;
  const descriptionAm = field(form, "descriptionAm") || null;
  const phone = field(form, "phone") || null;
  const phoneAlt = field(form, "phoneAlt") || null;
  const website = field(form, "website") || null;
  const addressLine = field(form, "addressLine") || null;
  const city = field(form, "city") || "Addis Ababa";
  const subcity = field(form, "subcity") || null;
  const neighborhood = field(form, "neighborhood") || null;

  const rawLat = Number(field(form, "lat"));
  const rawLng = Number(field(form, "lng"));
  const matchedCity = CITIES.find(
    (c) => c.key.toLowerCase() === city.toLowerCase() || c.en.toLowerCase() === city.toLowerCase(),
  );
  const cityCenter = matchedCity ? matchedCity.center : ADDIS_CENTER;
  const lat = Number.isFinite(rawLat) && rawLat !== 0 ? rawLat : cityCenter.lat;
  const lng = Number.isFinite(rawLng) && rawLng !== 0 ? rawLng : cityCenter.lng;

  const opensAt = field(form, "opensAt") || null;
  const closesAt = field(form, "closesAt") || null;
  const delivery = boolField(form, "delivery");
  const emergency = boolField(form, "emergency");

  const rawOpenDays = form.getAll("openDays").map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);
  const openDays = rawOpenDays.length ? rawOpenDays : [0, 1, 2, 3, 4, 5, 6];

  if (!nameEn || nameEn.trim().length < 2) {
    redirect(`${localeHref(locale, "/services/add")}?error=name_required`);
  }

  const input: NewProvider = {
    ownerId: user.id,
    nameEn: nameEn.trim(),
    nameAm: nameAm?.trim() || null,
    category,
    descriptionEn,
    descriptionAm,
    phone,
    addressLine,
    city,
    subcity,
    neighborhood,
    lat,
    lng,
    opensAt,
    closesAt,
    openDays,
    delivery,
    emergency,
  };

  const id = await createProvider(input);

  // If alternate phone or website provided, update them
  if (phoneAlt || website) {
    const db = await getDB();
    await db
      .prepare("UPDATE providers SET phone_alt = ?, website = ? WHERE id = ?")
      .bind(phoneAlt, website, id)
      .run();
  }

  // Handle optional photo upload
  const file = form.get("photo");
  if (file instanceof File && file.size > 0 && file.size <= MAX_PHOTO_BYTES) {
    try {
      const bucket = await getPhotos();
      const objectName = newObjectName("provider", user.id, file.name || "provider.jpg");
      await bucket.put(objectName, await file.arrayBuffer(), {
        httpMetadata: { contentType: file.type || "image/jpeg" },
      });
      const db = await getDB();
      await db
        .prepare("UPDATE providers SET photo_key = ? WHERE id = ?")
        .bind(`r2:${objectName}`, id)
        .run();
    } catch {}
  }

  // Auto-publish if admin or user submitted
  // If admin submitted, immediately publish and mark verified
  if (user.isAdmin) {
    const db = await getDB();
    await db
      .prepare("UPDATE providers SET status = 'published', verified = 1 WHERE id = ?")
      .bind(id)
      .run();
  } else {
    // Publish community contribution
    const db = await getDB();
    await db
      .prepare("UPDATE providers SET status = 'published' WHERE id = ?")
      .bind(id)
      .run();
  }

  revalidatePath("/[locale]/services", "page");
  revalidatePath("/[locale]/admin", "page");
  redirect(localeHref(locale, `/services/${id}`));
}

export async function rateProviderAction(
  _prev: ProviderFormState,
  form: FormData,
): Promise<ProviderFormState> {
  const locale: Locale = coerceLocale(field(form, "locale"));
  const providerId = field(form, "providerId");
  const rating = Number(field(form, "rating"));
  const comment = field(form, "comment") || null;

  if (!providerId) return { error: "error.generic" };
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return { error: "review.ratingRequired" };
  }

  const user = await requireUser(locale, `/services/${providerId}`);
  await rateProvider(providerId, user.id, rating, comment);

  revalidatePath("/[locale]/services/[id]", "page");
  revalidatePath("/[locale]/services", "page");
  return { ok: true };
}
