"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Filter, SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/card";
import { Checkbox, Label, NativeSelect } from "@/components/ui/form";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/overlay";
import { useI18n } from "@/lib/i18n/client";
import { CITIES, ADDIS_SUBCITIES } from "@/lib/geo";
import { AMENITIES, PROPERTY_TYPES } from "@/lib/taxonomy";
import { activeFilterCount, type RawSearchParams } from "@/lib/search";
import type { SearchFilters } from "@/lib/types";

export function SearchFiltersBar({
  filters,
}: {
  filters: SearchFilters;
}) {
  const { t, href, locale } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  // Local draft state for the sheet
  const [draftCity, setDraftCity] = useState(filters.city);
  const [draftSubcity, setDraftSubcity] = useState(filters.subcity);
  const [draftRentalType, setDraftRentalType] = useState(filters.rentalType);
  const [draftPropertyTypes, setDraftPropertyTypes] = useState<string[]>(filters.propertyTypes);
  const [draftMinPrice, setDraftMinPrice] = useState(filters.minPrice?.toString() ?? "");
  const [draftMaxPrice, setDraftMaxPrice] = useState(filters.maxPrice?.toString() ?? "");
  const [draftBedrooms, setDraftBedrooms] = useState(filters.bedrooms?.toString() ?? "");
  const [draftBathrooms, setDraftBathrooms] = useState(filters.bathrooms?.toString() ?? "");
  const [draftFurnished, setDraftFurnished] = useState(filters.furnished);
  const [draftAmenities, setDraftAmenities] = useState<string[]>(filters.amenities);
  const [draftVerified, setDraftVerified] = useState(filters.verifiedOnly);
  const [draftInstant, setDraftInstant] = useState(filters.instantBook);

  const applyFilters = () => {
    const sp = new URLSearchParams(searchParams.toString());

    if (draftCity) sp.set("city", draftCity);
    else sp.delete("city");

    if (draftSubcity) sp.set("subcity", draftSubcity);
    else sp.delete("subcity");

    if (draftRentalType) sp.set("rentalType", draftRentalType);
    else sp.delete("rentalType");

    if (draftPropertyTypes.length > 0) sp.set("propertyType", draftPropertyTypes.join(","));
    else sp.delete("propertyType");

    if (draftMinPrice) sp.set("minPrice", draftMinPrice);
    else sp.delete("minPrice");

    if (draftMaxPrice) sp.set("maxPrice", draftMaxPrice);
    else sp.delete("maxPrice");

    if (draftBedrooms) sp.set("bedrooms", draftBedrooms);
    else sp.delete("bedrooms");

    if (draftBathrooms) sp.set("bathrooms", draftBathrooms);
    else sp.delete("bathrooms");

    if (draftFurnished) sp.set("furnished", draftFurnished);
    else sp.delete("furnished");

    if (draftAmenities.length > 0) sp.set("amenities", draftAmenities.join(","));
    else sp.delete("amenities");

    if (draftVerified) sp.set("verified", "1");
    else sp.delete("verified");

    if (draftInstant) sp.set("instantBook", "1");
    else sp.delete("instantBook");

    sp.set("page", "1");

    setOpen(false);
    startTransition(() => {
      router.push(`${href("/search")}?${sp.toString()}`);
    });
  };

  const clearFilters = () => {
    setDraftCity("");
    setDraftSubcity("");
    setDraftRentalType("");
    setDraftPropertyTypes([]);
    setDraftMinPrice("");
    setDraftMaxPrice("");
    setDraftBedrooms("");
    setDraftBathrooms("");
    setDraftFurnished("");
    setDraftAmenities([]);
    setDraftVerified(false);
    setDraftInstant(false);

    setOpen(false);
    startTransition(() => {
      router.push(href("/search"));
    });
  };

  const handleSortChange = (newSort: string) => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("sort", newSort);
    sp.set("page", "1");
    startTransition(() => {
      router.push(`${href("/search")}?${sp.toString()}`);
    });
  };

  const count = activeFilterCount(filters);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card/60 p-4 rounded-2xl shadow-sm backdrop-blur-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="rounded-full gap-2 font-medium">
              <SlidersHorizontal className="size-4" aria-hidden />
              <span>{t("search.filters")}</span>
              {count > 0 ? (
                <Badge variant="verified" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[11px]">
                  {count}
                </Badge>
              ) : null}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
            <SheetHeader className="p-6 border-b border-border">
              <SheetTitle className="flex items-center gap-2">
                <Filter className="size-5 text-primary" />
                <span>{t("search.filters")}</span>
              </SheetTitle>
              <SheetDescription>{t("search.filtersSummary")}</SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* City & Subcity */}
              <div className="space-y-3">
                <Label className="font-semibold text-sm">{t("search.city")}</Label>
                <NativeSelect
                  value={draftCity}
                  onChange={(e) => {
                    setDraftCity(e.target.value);
                    if (e.target.value !== "Addis Ababa") setDraftSubcity("");
                  }}
                >
                  <option value="">{t("common.any")}</option>
                  {CITIES.map((c) => (
                    <option key={c.key} value={c.key}>
                      {locale === "am" ? c.am : c.en}
                    </option>
                  ))}
                </NativeSelect>

                {draftCity === "Addis Ababa" ? (
                  <div className="mt-2">
                    <Label className="text-xs text-muted-foreground">{t("search.subcity")}</Label>
                    <NativeSelect
                      value={draftSubcity}
                      onChange={(e) => setDraftSubcity(e.target.value)}
                      className="mt-1"
                    >
                      <option value="">{t("common.any")}</option>
                      {ADDIS_SUBCITIES.map((sc) => (
                        <option key={sc} value={sc}>
                          {sc}
                        </option>
                      ))}
                    </NativeSelect>
                  </div>
                ) : null}
              </div>

              {/* Rental Type */}
              <div className="space-y-3">
                <Label className="font-semibold text-sm">{t("search.rentalType")}</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "", label: t("common.any") },
                    { id: "monthly", label: t("search.monthlyRentals") },
                    { id: "nightly", label: t("search.nightlyStays") },
                  ].map((rt) => (
                    <button
                      key={rt.id}
                      type="button"
                      onClick={() => setDraftRentalType(rt.id as any)}
                      className={`rounded-xl border p-2.5 text-xs font-medium transition-colors ${
                        draftRentalType === rt.id
                          ? "border-primary bg-primary-soft text-primary font-semibold"
                          : "border-border bg-card text-ink-700 hover:bg-muted"
                      }`}
                    >
                      {rt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="space-y-3">
                <Label className="font-semibold text-sm">{t("search.priceRange")} (ETB)</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs text-muted-foreground">{t("search.minPrice")}</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={draftMinPrice}
                      onChange={(e) => setDraftMinPrice(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">{t("search.maxPrice")}</span>
                    <input
                      type="number"
                      placeholder="Any"
                      value={draftMaxPrice}
                      onChange={(e) => setDraftMaxPrice(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Property Types */}
              <div className="space-y-3">
                <Label className="font-semibold text-sm">{t("search.propertyType")}</Label>
                <div className="grid grid-cols-2 gap-2">
                  {PROPERTY_TYPES.map((pt) => {
                    const checked = draftPropertyTypes.includes(pt.key);
                    return (
                      <label
                        key={pt.key}
                        className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs cursor-pointer transition-colors ${
                          checked
                            ? "border-primary bg-primary-soft text-primary font-medium"
                            : "border-border bg-card text-ink-700 hover:bg-muted"
                        }`}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(c) => {
                            if (c) setDraftPropertyTypes([...draftPropertyTypes, pt.key]);
                            else setDraftPropertyTypes(draftPropertyTypes.filter((k) => k !== pt.key));
                          }}
                        />
                        <span>{locale === "am" ? pt.am : pt.en}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Bedrooms & Bathrooms */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">{t("search.bedrooms")}</Label>
                  <NativeSelect
                    value={draftBedrooms}
                    onChange={(e) => setDraftBedrooms(e.target.value)}
                  >
                    <option value="">{t("common.any")}</option>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n}+
                      </option>
                    ))}
                  </NativeSelect>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">{t("search.bathrooms")}</Label>
                  <NativeSelect
                    value={draftBathrooms}
                    onChange={(e) => setDraftBathrooms(e.target.value)}
                  >
                    <option value="">{t("common.any")}</option>
                    {[1, 2, 3, 4].map((n) => (
                      <option key={n} value={n}>
                        {n}+
                      </option>
                    ))}
                  </NativeSelect>
                </div>
              </div>

              {/* Furnished */}
              <div className="space-y-3">
                <Label className="font-semibold text-sm">{t("search.furnished")}</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "", label: t("common.any") },
                    { id: "furnished", label: t("search.furnished") },
                    { id: "unfurnished", label: t("search.unfurnished") },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setDraftFurnished(f.id as any)}
                      className={`rounded-xl border p-2 text-xs font-medium transition-colors ${
                        draftFurnished === f.id
                          ? "border-primary bg-primary-soft text-primary font-semibold"
                          : "border-border bg-card text-ink-700 hover:bg-muted"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amenities */}
              <div className="space-y-3">
                <Label className="font-semibold text-sm">{t("listing.amenities")}</Label>
                <div className="grid grid-cols-2 gap-2">
                  {AMENITIES.map((am) => {
                    const checked = draftAmenities.includes(am.key);
                    return (
                      <label
                        key={am.key}
                        className="flex items-center gap-2 text-xs text-ink-700 cursor-pointer"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(c) => {
                            if (c) setDraftAmenities([...draftAmenities, am.key]);
                            else setDraftAmenities(draftAmenities.filter((k) => k !== am.key));
                          }}
                        />
                        <span>{locale === "am" ? am.am : am.en}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Verified & Instant Book */}
              <div className="space-y-2.5 pt-2 border-t border-border">
                <label className="flex items-center justify-between text-sm cursor-pointer">
                  <span>{t("search.verifiedOnly")}</span>
                  <Checkbox checked={draftVerified} onCheckedChange={(c) => setDraftVerified(!!c)} />
                </label>
                <label className="flex items-center justify-between text-sm cursor-pointer">
                  <span>{t("search.instantBook")}</span>
                  <Checkbox checked={draftInstant} onCheckedChange={(c) => setDraftInstant(!!c)} />
                </label>
              </div>
            </div>

            <SheetFooter className="p-6 border-t border-border flex flex-row items-center justify-between gap-3">
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                {t("common.clear")}
              </Button>
              <Button size="sm" onClick={applyFilters} loading={isPending}>
                {t("common.apply")}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* Quick filter pills */}
        {filters.rentalType ? (
          <Badge variant="secondary" className="gap-1 font-normal py-1 px-3">
            <span>{filters.rentalType === "monthly" ? t("search.monthlyRentals") : t("search.nightlyStays")}</span>
            <button
              onClick={() => {
                const sp = new URLSearchParams(searchParams.toString());
                sp.delete("rentalType");
                router.push(`${href("/search")}?${sp.toString()}`);
              }}
              className="hover:text-foreground"
            >
              <X className="size-3" />
            </button>
          </Badge>
        ) : null}

        {filters.city ? (
          <Badge variant="secondary" className="gap-1 font-normal py-1 px-3">
            <span>{filters.city}</span>
            <button
              onClick={() => {
                const sp = new URLSearchParams(searchParams.toString());
                sp.delete("city");
                sp.delete("subcity");
                router.push(`${href("/search")}?${sp.toString()}`);
              }}
              className="hover:text-foreground"
            >
              <X className="size-3" />
            </button>
          </Badge>
        ) : null}

        {count > 0 ? (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-muted-foreground hover:text-foreground h-8 px-2">
            {t("common.clear")}
          </Button>
        ) : null}
      </div>

      {/* Sort selection */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground hidden sm:inline">{t("search.sortBy")}:</span>
        <select
          value={filters.sort}
          onChange={(e) => handleSortChange(e.target.value)}
          className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
        >
          <option value="recommended">{t("search.sortRecommended")}</option>
          <option value="newest">{t("search.sortNewest")}</option>
          <option value="price_asc">{t("search.sortPriceAsc")}</option>
          <option value="price_desc">{t("search.sortPriceDesc")}</option>
          <option value="rating">{t("search.sortRating")}</option>
          {filters.nearLat !== null ? (
            <option value="distance">{t("search.nearMe")}</option>
          ) : null}
        </select>
      </div>
    </div>
  );
}
