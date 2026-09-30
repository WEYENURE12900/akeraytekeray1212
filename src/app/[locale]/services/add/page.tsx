import { redirect } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, NativeSelect, Textarea, Checkbox } from "@/components/ui/form";
import { getSessionUser } from "@/lib/auth";
import { createProviderAction } from "@/actions/providers";
import { CITIES } from "@/lib/geo";
import { getI18n } from "@/lib/i18n/server";
import { SERVICE_CATEGORIES } from "@/lib/taxonomy";
import type { Locale } from "@/lib/types";

/**
 * Business registration form. Any signed-in user can add a local business.
 * Submission goes through `createProviderAction` which creates the provider
 * and redirects to its detail page.
 */
export default async function AddBusinessPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { t, href, locale } = await getI18n(params);
  const user = await getSessionUser();
  if (!user) redirect(href("/signin?next=/services/add"));

  const sp = await searchParams;
  const errorKey = typeof sp.error === "string" ? sp.error : null;

  return (
    <div className="container max-w-2xl py-8 sm:py-12 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {t("provider.addBusiness")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          {t("provider.addBusinessBody")}
        </p>
      </div>

      {errorKey ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">
          {errorKey === "name_required" ? t("error.nameRequired") : t("error.generic")}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{t("provider.details")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createProviderAction} className="space-y-5">
            <input type="hidden" name="locale" value={locale} />

            {/* Business name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={`${t("provider.name")} (English)`} required>
                <Input name="nameEn" required minLength={2} placeholder="e.g. Tomoca Coffee" />
              </Field>
              <Field label={`${t("provider.name")} (አማርኛ)`}>
                <Input name="nameAm" placeholder="e.g. ቶሞካ ቡና" />
              </Field>
            </div>

            {/* Category */}
            <Field label={t("provider.category")} required>
              <NativeSelect name="category" required>
                {SERVICE_CATEGORIES.map((cat) => (
                  <option key={cat.key} value={cat.key}>
                    {locale === "am" ? `${cat.am} (${cat.en})` : cat.en}
                  </option>
                ))}
              </NativeSelect>
            </Field>

            {/* Description */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={`${t("provider.description")} (English)`}>
                <Textarea name="descriptionEn" rows={3} placeholder="Brief description of the business" />
              </Field>
              <Field label={`${t("provider.description")} (አማርኛ)`}>
                <Textarea name="descriptionAm" rows={3} placeholder="ስለ ንግዱ አጭር መግለጫ" />
              </Field>
            </div>

            {/* Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={t("provider.phone")}>
                <Input name="phone" type="tel" placeholder="+251 911 123 456" />
              </Field>
              <Field label={t("provider.phoneAlt")}>
                <Input name="phoneAlt" type="tel" placeholder="+251 911 789 012" />
              </Field>
            </div>

            <Field label={t("provider.website")}>
              <Input name="website" type="url" placeholder="https://example.com" />
            </Field>

            {/* Location */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label={t("auth.city")}>
                <NativeSelect name="city" defaultValue="Addis Ababa">
                  {CITIES.map((c) => (
                    <option key={c.key} value={c.key}>
                      {locale === "am" ? `${c.am} (${c.en})` : c.en}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <Field label={t("provider.subcity")}>
                <Input name="subcity" placeholder="e.g. Bole" />
              </Field>
              <Field label={t("provider.neighborhood")}>
                <Input name="neighborhood" placeholder="e.g. Atlas" />
              </Field>
            </div>

            <Field label={t("provider.address")}>
              <Input name="addressLine" placeholder="Street address or landmark" />
            </Field>

            {/* Operating hours */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={t("provider.opensAt")}>
                <Input name="opensAt" type="time" />
              </Field>
              <Field label={t("provider.closesAt")}>
                <Input name="closesAt" type="time" />
              </Field>
            </div>

            {/* Operating days */}
            <Field label={t("provider.openDays")}>
              <div className="flex flex-wrap gap-3">
                {[
                  { value: 0, en: "Sun", am: "እሁድ" },
                  { value: 1, en: "Mon", am: "ሰኞ" },
                  { value: 2, en: "Tue", am: "ማክ" },
                  { value: 3, en: "Wed", am: "ረቡዕ" },
                  { value: 4, en: "Thu", am: "ሐሙስ" },
                  { value: 5, en: "Fri", am: "አርብ" },
                  { value: 6, en: "Sat", am: "ቅዳሜ" },
                ].map((day) => (
                  <label key={day.value} className="flex items-center gap-1.5 text-sm">
                    <Checkbox name="openDays" value={String(day.value)} defaultChecked />
                    {locale === "am" ? day.am : day.en}
                  </label>
                ))}
              </div>
            </Field>

            {/* Service flags */}
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Checkbox name="delivery" value="1" />
                {t("services.delivery")}
              </label>
              <label className="flex items-center gap-2 text-sm font-medium">
                <Checkbox name="emergency" value="1" />
                {t("services.emergency")} (24/7)
              </label>
            </div>

            {/* Photo upload */}
            <Field label={t("provider.photo")}>
              <Input name="photo" type="file" accept="image/*" />
            </Field>

            <Button type="submit" className="w-full gap-2">
              <Plus className="size-4" aria-hidden />
              {t("provider.submit")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
