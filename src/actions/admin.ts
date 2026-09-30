"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth";
import {
  adminSetListingStatus,
  adminSetListingVerified,
  adminSetProviderStatus,
  adminSetProviderVerified,
  adminToggleUserRole,
} from "@/lib/db/admin";
import type { ListingStatus, Locale } from "@/lib/types";

export async function adminSetListingVerifiedAction(
  listingId: string,
  verified: boolean,
  locale: Locale = "en",
): Promise<{ ok: boolean }> {
  await requireAdmin(locale);
  await adminSetListingVerified(listingId, verified);
  revalidatePath("/[locale]/admin", "page");
  revalidatePath("/[locale]/search", "page");
  revalidatePath("/[locale]/listing/[id]", "page");
  return { ok: true };
}

export async function adminSetListingStatusAction(
  listingId: string,
  status: ListingStatus,
  locale: Locale = "en",
): Promise<{ ok: boolean }> {
  await requireAdmin(locale);
  await adminSetListingStatus(listingId, status);
  revalidatePath("/[locale]/admin", "page");
  revalidatePath("/[locale]/search", "page");
  revalidatePath("/[locale]/listing/[id]", "page");
  return { ok: true };
}

export async function adminSetProviderVerifiedAction(
  providerId: string,
  verified: boolean,
  locale: Locale = "en",
): Promise<{ ok: boolean }> {
  await requireAdmin(locale);
  await adminSetProviderVerified(providerId, verified);
  revalidatePath("/[locale]/admin", "page");
  revalidatePath("/[locale]/services", "page");
  revalidatePath("/[locale]/services/[id]", "page");
  return { ok: true };
}

export async function adminSetProviderStatusAction(
  providerId: string,
  status: string,
  locale: Locale = "en",
): Promise<{ ok: boolean }> {
  await requireAdmin(locale);
  await adminSetProviderStatus(providerId, status);
  revalidatePath("/[locale]/admin", "page");
  revalidatePath("/[locale]/services", "page");
  revalidatePath("/[locale]/services/[id]", "page");
  return { ok: true };
}

export async function adminToggleUserRoleAction(
  userId: string,
  role: "is_host" | "is_admin" | "phone_verified" | "email_verified",
  value: boolean,
  locale: Locale = "en",
): Promise<{ ok: boolean }> {
  await requireAdmin(locale);
  await adminToggleUserRole(userId, role, value);
  revalidatePath("/[locale]/admin", "page");
  return { ok: true };
}
