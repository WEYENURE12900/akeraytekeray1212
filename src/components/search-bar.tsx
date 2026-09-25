"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Building, Calendar, MapPin, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";
import { CITIES, ADDIS_SUBCITIES } from "@/lib/geo";
import { PROPERTY_TYPES } from "@/lib/taxonomy";

export function SearchBar({
  initialCity = "",
  initialSubcity = "",
  initialRentalType = "",
  initialPropertyType = "",
  variant = "hero",
}: {
  initialCity?: string;
  initialSubcity?: string;
  initialRentalType?: string;
  initialPropertyType?: string;
  variant?: "hero" | "compact";
}) {
  const { t, href, locale } = useI18n();
  const router = useRouter();

  const [city, setCity] = useState(initialCity || "Addis Ababa");
  const [subcity, setSubcity] = useState(initialSubcity);
  const [rentalType, setRentalType] = useState(initialRentalType);
  const [propertyType, setPropertyType] = useState(initialPropertyType);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (subcity) params.set("subcity", subcity);
    if (rentalType) params.set("rentalType", rentalType);
    if (propertyType) params.set("propertyType", propertyType);

    router.push(href(`/search?${params.toString()}`));
  };

  if (variant === "compact") {
    return (
      <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
        <div className="relative flex-1">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder={t("search.locationPlaceholder")}
            className="h-10 w-full rounded-full border border-border bg-card pl-9 pr-4 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <Button type="submit" size="sm" className="rounded-full shrink-0">
          <Search className="size-4" />
          <span className="hidden sm:inline">{t("common.search")}</span>
        </Button>
      </form>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-4xl rounded-3xl border border-border/80 bg-card/95 p-3 shadow-lift backdrop-blur-md transition-all sm:p-4"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* City selection */}
        <div className="flex flex-col gap-1 rounded-2xl bg-muted/50 p-2.5 transition-colors hover:bg-muted">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-700">
            <MapPin className="size-3.5 text-primary" aria-hidden />
            <span>{t("search.city")}</span>
          </label>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full bg-transparent text-sm font-medium text-foreground focus:outline-none cursor-pointer"
          >
            {CITIES.map((c) => (
              <option key={c.key} value={c.key} className="bg-card text-foreground">
                {locale === "am" ? c.am : c.en}
              </option>
            ))}
          </select>
        </div>

        {/* Subcity selection (only for Addis Ababa) */}
        <div className="flex flex-col gap-1 rounded-2xl bg-muted/50 p-2.5 transition-colors hover:bg-muted">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-700">
            <MapPin className="size-3.5 text-ink-400" aria-hidden />
            <span>{t("search.subcity")}</span>
          </label>
          <select
            value={subcity}
            onChange={(e) => setSubcity(e.target.value)}
            disabled={city !== "Addis Ababa"}
            className="w-full bg-transparent text-sm font-medium text-foreground focus:outline-none cursor-pointer disabled:opacity-50"
          >
            <option value="" className="bg-card text-foreground">{t("common.any")}</option>
            {ADDIS_SUBCITIES.map((sc) => (
              <option key={sc} value={sc} className="bg-card text-foreground">
                {sc}
              </option>
            ))}
          </select>
        </div>

        {/* Rental Type (Monthly / Nightly) */}
        <div className="flex flex-col gap-1 rounded-2xl bg-muted/50 p-2.5 transition-colors hover:bg-muted">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-700">
            <Calendar className="size-3.5 text-primary" aria-hidden />
            <span>{t("search.rentalType")}</span>
          </label>
          <select
            value={rentalType}
            onChange={(e) => setRentalType(e.target.value)}
            className="w-full bg-transparent text-sm font-medium text-foreground focus:outline-none cursor-pointer"
          >
            <option value="" className="bg-card text-foreground">{t("search.anyRentalType")}</option>
            <option value="monthly" className="bg-card text-foreground">{t("search.monthlyRentals")}</option>
            <option value="nightly" className="bg-card text-foreground">{t("search.nightlyStays")}</option>
          </select>
        </div>

        {/* Property Type */}
        <div className="flex flex-col gap-1 rounded-2xl bg-muted/50 p-2.5 transition-colors hover:bg-muted">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-700">
            <Building className="size-3.5 text-ink-400" aria-hidden />
            <span>{t("search.propertyType")}</span>
          </label>
          <select
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            className="w-full bg-transparent text-sm font-medium text-foreground focus:outline-none cursor-pointer"
          >
            <option value="" className="bg-card text-foreground">{t("common.any")}</option>
            {PROPERTY_TYPES.map((pt) => (
              <option key={pt.key} value={pt.key} className="bg-card text-foreground">
                {locale === "am" ? pt.am : pt.en}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end pt-1">
        <Button type="submit" size="lg" className="w-full sm:w-auto shadow-md">
          <Search className="size-4" />
          <span>{t("search.searchButton")}</span>
        </Button>
      </div>
    </form>
  );
}

export default SearchBar;
