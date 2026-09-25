"use client";

import { useTransition } from "react";

import { saveListingAction } from "@/actions/listings";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, NativeSelect, Textarea } from "@/components/ui/form";
import { CITIES, ADDIS_SUBCITIES } from "@/lib/geo";
import { useI18n } from "@/lib/i18n/client";
import { AMENITIES, PROPERTY_TYPES } from "@/lib/taxonomy";
import type { ListingRow, Locale } from "@/lib/types";
import { safeJSON } from "@/lib/utils";

/**
 * The editor form. Posts plain FormData to `saveListingAction`; the server
 * re-checks ownership and drops anything outside the editable column list,
 * so this form can stay simple.
 */
export function ListingEditorForm({
  listing,
  locale,
}: {
  listing: ListingRow;
  locale: Locale;
}) {
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();
  const selectedAmenities = new Set(safeJSON<string[]>(listing.amenities, []));

  return (
    <form
      action={(form) => startTransition(() => saveListingAction(form))}
      className="space-y-6"
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="listingId" value={listing.id} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t("wizard.titleLabel")} htmlFor="titleEn" required>
          <Input id="titleEn" name="titleEn" defaultValue={listing.title_en} required />
        </Field>
        <Field label={t("wizard.titleAmLabel")} htmlFor="titleAm" hint={t("wizard.titleAmHint")}>
          <Input id="titleAm" name="titleAm" defaultValue={listing.title_am ?? ""} />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t("wizard.summaryLabel")} htmlFor="summaryEn">
          <Input id="summaryEn" name="summaryEn" defaultValue={listing.summary_en ?? ""} />
        </Field>
        <Field label={t("wizard.summaryLabel") + " (AM)"} htmlFor="summaryAm">
          <Input id="summaryAm" name="summaryAm" defaultValue={listing.summary_am ?? ""} />
        </Field>
      </div>

      <Field label={t("wizard.descriptionLabel")} htmlFor="descriptionEn">
        <Textarea
          id="descriptionEn"
          name="descriptionEn"
          rows={5}
          defaultValue={listing.description_en ?? ""}
          placeholder={t("wizard.descriptionPlaceholder")}
        />
      </Field>

      <Field label={t("wizard.descriptionLabel") + " (AM)"} htmlFor="descriptionAm">
        <Textarea
          id="descriptionAm"
          name="descriptionAm"
          rows={5}
          defaultValue={listing.description_am ?? ""}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Field label={t("search.propertyType")} htmlFor="propertyType">
          <NativeSelect id="propertyType" name="propertyType" defaultValue={listing.property_type}>
            {PROPERTY_TYPES.map((pt) => (
              <option key={pt.key} value={pt.key}>
                {locale === "am" ? pt.am : pt.en}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label={t("search.rentalType")} htmlFor="rentalType">
          <NativeSelect id="rentalType" name="rentalType" defaultValue={listing.rental_type}>
            <option value="monthly">{t("search.monthlyRentals")}</option>
            <option value="nightly">{t("search.nightlyStays")}</option>
          </NativeSelect>
        </Field>
        <Field label={t("search.furnishing")} htmlFor="furnished">
          <NativeSelect id="furnished" name="furnished" defaultValue={listing.furnished}>
            <option value="furnished">{t("search.furnished")}</option>
            <option value="semi">{t("search.furnished")} (semi)</option>
            <option value="unfurnished">{t("search.unfurnished")}</option>
          </NativeSelect>
        </Field>
        <Field label={t("wizard.areaSqm")} htmlFor="areaSqm">
          <Input
            id="areaSqm"
            name="areaSqm"
            type="number"
            min={0}
            defaultValue={listing.area_sqm ?? ""}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Field label={t("wizard.bedrooms")} htmlFor="bedrooms">
          <Input id="bedrooms" name="bedrooms" type="number" min={0} defaultValue={listing.bedrooms} />
        </Field>
        <Field label={t("wizard.beds")} htmlFor="beds">
          <Input id="beds" name="beds" type="number" min={0} defaultValue={listing.beds} />
        </Field>
        <Field label={t("wizard.bathrooms")} htmlFor="bathrooms">
          <Input
            id="bathrooms"
            name="bathrooms"
            type="number"
            min={0}
            step={0.5}
            defaultValue={listing.bathrooms}
          />
        </Field>
        <Field label={t("wizard.maxGuests")} htmlFor="maxGuests">
          <Input
            id="maxGuests"
            name="maxGuests"
            type="number"
            min={1}
            defaultValue={listing.max_guests}
          />
        </Field>
      </div>

      {/* Location */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Field label={t("wizard.cityLabel")} htmlFor="city">
          <NativeSelect id="city" name="city" defaultValue={listing.city}>
            {CITIES.map((city) => (
              <option key={city.key} value={city.key}>
                {locale === "am" ? city.am : city.en}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label={t("wizard.subcityLabel")} htmlFor="subcity">
          <NativeSelect id="subcity" name="subcity" defaultValue={listing.subcity ?? ""}>
            <option value="">{t("common.any")}</option>
            {ADDIS_SUBCITIES.map((sc) => (
              <option key={sc} value={sc}>
                {sc}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label={t("wizard.areaLabel")} htmlFor="neighborhood">
          <Input id="neighborhood" name="neighborhood" defaultValue={listing.neighborhood ?? ""} />
        </Field>
        <Field label={t("wizard.availableFrom")} htmlFor="availableFrom">
          <Input
            id="availableFrom"
            name="availableFrom"
            type="date"
            defaultValue={listing.available_from ?? ""}
          />
        </Field>
      </div>

      <Field label={t("wizard.addressLabel")} htmlFor="addressLine" hint={t("wizard.addressHint")}>
        <Input id="addressLine" name="addressLine" defaultValue={listing.address_line ?? ""} />
      </Field>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Field label="Latitude" htmlFor="lat">
          <Input
            id="lat"
            name="lat"
            type="number"
            step="any"
            defaultValue={listing.lat}
            required
          />
        </Field>
        <Field label="Longitude" htmlFor="lng">
          <Input
            id="lng"
            name="lng"
            type="number"
            step="any"
            defaultValue={listing.lng}
            required
          />
        </Field>
      </div>

      {/* Amenities */}
      <div>
        <p className="mb-2 text-sm font-medium text-ink-800">{t("wizard.step.amenities")}</p>
        <p className="mb-3 text-xs text-muted-foreground">{t("wizard.amenitiesBody")}</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {AMENITIES.map((amenity) => (
            <label
              key={amenity.key}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-ink-700 cursor-pointer"
            >
              <input
                type="checkbox"
                name="amenities"
                value={amenity.key}
                defaultChecked={selectedAmenities.has(amenity.key)}
                className="size-4 accent-[#1D6F52]"
              />
              {locale === "am" ? amenity.am : amenity.en}
            </label>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Field
          label={listing.rental_type === "nightly" ? t("wizard.nightlyPrice") : t("wizard.monthlyPrice")}
          htmlFor="price"
          required
        >
          <Input
            id="price"
            name="price"
            type="number"
            min={0}
            defaultValue={listing.price}
            required
          />
        </Field>
        <Field label={t("wizard.depositMonths")} htmlFor="depositMonths">
          <Input
            id="depositMonths"
            name="depositMonths"
            type="number"
            min={0}
            defaultValue={listing.deposit_months}
          />
        </Field>
        <Field label={t("wizard.minStayMonths")} htmlFor="minStayMonths">
          <Input
            id="minStayMonths"
            name="minStayMonths"
            type="number"
            min={1}
            defaultValue={listing.min_stay_months}
          />
        </Field>
        <Field label={t("wizard.minNights")} htmlFor="minNights">
          <Input
            id="minNights"
            name="minNights"
            type="number"
            min={1}
            defaultValue={listing.min_nights}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t("wizard.rulesLabel")} htmlFor="houseRulesEn">
          <Textarea
            id="houseRulesEn"
            name="houseRulesEn"
            rows={3}
            defaultValue={listing.house_rules_en ?? ""}
            placeholder={t("wizard.rulesPlaceholder")}
          />
        </Field>
        <Field label={t("wizard.rulesLabel") + " (AM)"} htmlFor="houseRulesAm">
          <Textarea
            id="houseRulesAm"
            name="houseRulesAm"
            rows={3}
            defaultValue={listing.house_rules_am ?? ""}
          />
        </Field>
      </div>

      <label className="flex items-center gap-2.5 text-sm text-ink-700 cursor-pointer">
        <Checkbox name="instantBook" value="1" defaultChecked={listing.instant_book === 1} />
        {t("wizard.instantBook")}
      </label>

      <div className="flex items-center justify-end gap-3 border-t border-border pt-5">
        <Button type="submit" size="lg" loading={isPending}>
          {t("common.saveChanges")}
        </Button>
      </div>
    </form>
  );
}
