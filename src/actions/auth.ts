"use server";

/**
 * Auth server actions.
 *
 * Validation happens here, not in the browser, and every failure comes back as a
 * message *key* rather than an English sentence — the client translates it, so an
 * Amharic reader never sees a stray English error.
 *
 * `redirect()` works by throwing, so it always sits after the try block.
 */
import { redirect } from "next/navigation";
import { headers } from "next/headers";

import {
  createSession,
  createUser,
  destroySession,
  findUserByIdentifier,
  getSessionUser,
  isEmail,
  normaliseEmail,
  normalisePhone,
  parseIdentifier,
  pruneExpiredSessions,
  verifyPassword,
} from "@/lib/auth";
import { getDB } from "@/lib/cf";
import { coerceLocale } from "@/lib/i18n/config";
import type { MessageKey } from "@/lib/i18n/messages";
import { localeHref } from "@/lib/i18n/server";
import type { Locale } from "@/lib/types";
import { boolField, field } from "@/lib/utils";

export interface AuthState {
  /** A MessageKey the form translates, or undefined when nothing is wrong. */
  error?: MessageKey;
}

const MIN_PASSWORD = 8;

/** Only ever follow a same-site path, so `?next=` cannot become an open redirect. */
function safeNext(raw: string, locale: Locale): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return localeHref(locale, "/");
  return localeHref(locale, raw);
}

async function userAgent(): Promise<string | null> {
  const store = await headers();
  return store.get("user-agent");
}

export async function signInAction(_prev: AuthState, form: FormData): Promise<AuthState> {
  const locale = coerceLocale(field(form, "locale"));
  const identifier = parseIdentifier(field(form, "identifier"));
  const password = field(form, "password");

  if (identifier.kind === "invalid") return { error: "error.contactRequired" };
  if (!password) return { error: "error.required" };

  const row = await findUserByIdentifier(identifier);
  // Same message whether the account is missing or the password is wrong: a
  // different one would turn this form into a "does this number have an account"
  // lookup for anyone who cared to ask.
  if (!row || !(await verifyPassword(password, row.password_hash))) {
    return { error: "error.badCredentials" };
  }

  await createSession(row.id, await userAgent());
  await pruneExpiredSessions();

  redirect(safeNext(field(form, "next"), locale));
}

export async function signUpAction(_prev: AuthState, form: FormData): Promise<AuthState> {
  const locale = coerceLocale(field(form, "locale"));
  const fullName = field(form, "fullName");
  const rawContact = field(form, "identifier");
  const rawEmail = field(form, "email");
  const password = field(form, "password");
  const confirm = field(form, "confirmPassword");
  const wantsHost = boolField(form, "isHost");

  if (fullName.length < 2) return { error: "error.nameRequired" };
  if (password.length < MIN_PASSWORD) return { error: "error.passwordShort" };
  if (confirm && confirm !== password) return { error: "error.passwordMismatch" };

  // One field accepts either a phone number or an email, because that is how
  // people introduce themselves. A second optional email field is for those who
  // signed up with a phone.
  const primary = parseIdentifier(rawContact);
  if (primary.kind === "invalid") {
    return { error: rawContact.includes("@") ? "error.invalidEmail" : "error.invalidPhone" };
  }

  let phone = primary.kind === "phone" ? primary.value : null;
  let email = primary.kind === "email" ? primary.value : null;

  if (!email && rawEmail) {
    if (!isEmail(rawEmail)) return { error: "error.invalidEmail" };
    email = normaliseEmail(rawEmail);
  }
  if (!phone && !email) return { error: "error.contactRequired" };

  const db = await getDB();
  const clash = await db
    .prepare(
      `SELECT id FROM users
        WHERE (? IS NOT NULL AND phone = ?) OR (? IS NOT NULL AND email = ?)
        LIMIT 1`,
    )
    .bind(phone, phone, email, email)
    .first<{ id: string }>();
  if (clash) return { error: "error.accountExists" };

  const created = await createUser({
    fullName,
    phone,
    email,
    password,
    locale,
    isHost: wantsHost,
    city: field(form, "city") || null,
  });

  await createSession(created.id, await userAgent());

  redirect(safeNext(field(form, "next"), wantsHost ? locale : locale));
}

export async function signOutAction(locale: Locale): Promise<void> {
  await destroySession();
  redirect(localeHref(coerceLocale(locale), "/"));
}

/**
 * Turns hosting on for an existing account. The mode switch calls this before it
 * navigates, so someone can go from renting to hosting without a second form.
 */
export async function enableHostingAction(): Promise<{ ok: boolean }> {
  const user = await getSessionUser();
  if (!user) return { ok: false };
  if (user.isHost) return { ok: true };

  const db = await getDB();
  await db
    .prepare("UPDATE users SET is_host = 1, updated_at = datetime('now') WHERE id = ?")
    .bind(user.id)
    .run();

  return { ok: true };
}

/** Phone number normalisation, exposed so the sign-up form can echo it back. */
export async function previewPhone(raw: string): Promise<string | null> {
  return normalisePhone(raw);
}
