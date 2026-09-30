"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  Bed,
  Bath,
  CheckCircle2,
  Heart,
  Maximize2,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { toggleFavoriteAction } from "@/actions/favorites";
import { Badge } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/client";
import { photoUrl } from "@/lib/photos";
import { formatDistance, formatMoney } from "@/lib/utils";
import { propertyTypeTerm } from "@/lib/taxonomy";
import type { ListingCardModel } from "@/lib/types";

export function ListingCard({
  listing,
  className = "",
}: {
  listing: ListingCardModel;
  className?: string;
}) {
  const { t, href, locale } = useI18n();
  const [saved, setSaved] = useState(listing.isFavorite ?? false);
  const [isPending, startTransition] = useTransition();

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const nextState = !saved;
    setSaved(nextState);

    startTransition(async () => {
      try {
        const res = await toggleFavoriteAction(listing.id);
        if (res.ok) {
          setSaved(res.saved);
          toast.success(res.saved ? t("common.save") : t("common.remove"));
        } else {
          setSaved(!nextState);
        }
      } catch {
        setSaved(!nextState);
        toast.error(t("error.generic"));
      }
    });
  };

  const pTerm = propertyTypeTerm(listing.propertyType);
  const propertyLabel = pTerm ? (locale === "am" ? pTerm.am : pTerm.en) : listing.propertyType;
  const imageUrl = photoUrl(listing.photos?.[0] ?? listing.id);

  const locationText = [listing.neighborhood, listing.subcity, listing.city]
    .filter(Boolean)
    .join(", ");

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-cardHover ${className}`}
    >
      {/* Photo container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        <Link href={href(`/listing/${listing.id}`)} className="block h-full w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </Link>

        {/* Top Badges */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5 pointer-events-none">
          {listing.verified ? (
            <Badge variant="glass" className="flex items-center gap-1 font-semibold text-primary">
              <CheckCircle2 className="size-3.5 text-primary" aria-hidden />
              <span>{t("common.verified")}</span>
            </Badge>
          ) : null}
          {listing.instantBook ? (
            <Badge variant="glass" className="flex items-center gap-1 font-medium text-amber-700">
              <Zap className="size-3.5 fill-amber-500 text-amber-600" aria-hidden />
              <span>{t("listing.instantBook")}</span>
            </Badge>
          ) : null}
        </div>

        {/* Favorite Heart Button */}
        <button
          onClick={handleFavoriteClick}
          disabled={isPending}
          aria-label={saved ? t("nav.favorites") : t("common.save")}
          className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-white/85 text-ink-700 shadow-sm backdrop-blur-sm transition-transform hover:scale-110 hover:bg-white active:scale-95"
        >
          <Heart
            className={`size-4.5 transition-colors ${
              saved ? "fill-berbere text-berbere" : "text-ink-600"
            }`}
          />
        </button>

        {/* Distance tag if searched with location */}
        {listing.distanceKm !== undefined ? (
          <div className="absolute bottom-3 left-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
            {formatDistance(listing.distanceKm)}
          </div>
        ) : null}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-ink-600 uppercase tracking-wider">{propertyLabel}</span>
          {listing.ratingAvg > 0 ? (
            <div className="flex items-center gap-1 font-semibold text-ink-800">
              <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden />
              <span>{listing.ratingAvg.toFixed(1)}</span>
              <span className="text-muted-foreground font-normal">({listing.ratingCount})</span>
            </div>
          ) : (
            <span className="text-muted-foreground">{t("common.noReviewsYet")}</span>
          )}
        </div>

        <Link href={href(`/listing/${listing.id}`)} className="mt-1.5 focus:outline-none">
          <h3 className="font-display text-base font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {listing.title}
          </h3>
        </Link>

        <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{locationText}</p>

        {/* Quick Specs */}
        <div className="mt-3 flex items-center gap-3 border-y border-border/60 py-2.5 text-xs text-ink-600">
          <div className="flex items-center gap-1">
            <Bed className="size-3.5 text-ink-400" aria-hidden />
            <span>{t("common.bedrooms", { count: listing.bedrooms })}</span>
          </div>
          <div className="flex items-center gap-1">
            <Bath className="size-3.5 text-ink-400" aria-hidden />
            <span>{t("common.bathrooms", { count: listing.bathrooms })}</span>
          </div>
          {listing.areaSqm ? (
            <div className="flex items-center gap-1">
              <Maximize2 className="size-3.5 text-ink-400" aria-hidden />
              <span>{t("common.sqm", { count: listing.areaSqm })}</span>
            </div>
          ) : null}
        </div>

        {/* Nearby ring preview */}
        {listing.nearby && listing.nearby.length > 0 ? (
          <div className="mt-2.5 flex items-center gap-1.5 overflow-hidden text-[11px] text-muted-foreground">
            <Sparkles className="size-3 text-primary shrink-0" aria-hidden />
            <span className="truncate">
              {listing.nearby.map((n) => `${n.name} (${formatDistance(n.distanceKm)})`).join(" · ")}
            </span>
          </div>
        ) : null}

        {/* Pricing Footer */}
        <div className="mt-4 flex items-baseline justify-between pt-1">
          <div>
            <span className="font-display text-lg font-bold text-foreground">
              {formatMoney(listing.price, listing.currency)}
            </span>
            <span className="ml-1 text-xs text-muted-foreground">
              {listing.rentalType === "nightly" ? t("common.perNight") : t("common.perMonth")}
            </span>
          </div>

          <Link
            href={href(`/listing/${listing.id}`)}
            className="rounded-full bg-primary-soft px-3.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
          >
            {t("common.search")}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ListingCard;
