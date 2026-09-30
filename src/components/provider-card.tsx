"use client";

import Link from "next/link";

import {
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  Star,
  Truck,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";
import { photoUrl, providerPlaceholder } from "@/lib/photos";
import { serviceCategoryTerm } from "@/lib/taxonomy";
import { formatDistance } from "@/lib/utils";
import type { ProviderCardModel } from "@/lib/types";

export function ProviderCard({
  provider,
  isOpen,
  className = "",
}: {
  provider: ProviderCardModel;
  /**
   * Computed on the server with the Addis (UTC+3) clock via `isOpenNow`.
   * Recomputing here would use the visitor's timezone and show shops shut
   * when they are open. When omitted, no open/closed label is shown.
   */
  isOpen?: boolean;
  className?: string;
}) {
  const { t, locale, href } = useI18n();

  const term = serviceCategoryTerm(provider.category);
  const categoryLabel = term ? (locale === "am" ? term.am : term.en) : provider.category;

  const locationText = [provider.neighborhood, provider.subcity, provider.city]
    .filter(Boolean)
    .join(", ");

  // photoUrl() understands r2:/ph:/absolute keys; the old hand-built URL
  // skipped the r2: prefix strip and 404'd every uploaded provider photo.
  const imageUrl = `${photoUrl(provider.photoKey ?? providerPlaceholder(provider.id))}?w=600&h=400`;

  const detailHref = href(`/services/${provider.id}`);

  return (
    <Link
      href={detailHref}
      className={`group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all duration-300 hover:shadow-cardHover ${className}`}
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={provider.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <Badge variant="glass" className="font-semibold text-primary">
            {categoryLabel}
          </Badge>
          {provider.verified ? (
            <Badge variant="glass" className="text-primary">
              <ShieldCheck className="size-3.5" aria-hidden />
            </Badge>
          ) : null}
        </div>

        {provider.distanceKm !== undefined ? (
          <div className="absolute bottom-3 left-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
            {formatDistance(provider.distanceKm)}
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-base font-semibold text-foreground group-hover:text-primary transition-colors">
            {provider.name}
          </h3>
          {provider.ratingAvg > 0 ? (
            <div className="flex items-center gap-1 font-semibold text-xs text-ink-800 shrink-0">
              <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden />
              <span>{provider.ratingAvg.toFixed(1)}</span>
            </div>
          ) : null}
        </div>

        {provider.description ? (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {provider.description}
          </p>
        ) : null}

        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="size-3.5 text-ink-400 shrink-0" aria-hidden />
          <span className="truncate">{locationText || provider.addressLine}</span>
        </div>

        {/* Operating status & tags */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          {provider.emergency ? (
            <Badge variant="destructive" className="flex items-center gap-1">
              <Zap className="size-3" aria-hidden />
              <span>24/7 {t("services.emergency")}</span>
            </Badge>
          ) : isOpen !== undefined ? (
            <span
              className={`inline-flex items-center gap-1 font-medium ${
                isOpen ? "text-eucalyptus-700" : "text-muted-foreground"
              }`}
            >
              <Clock className="size-3.5" aria-hidden />
              {isOpen ? t("services.openNow") : t("services.closed")}
              {provider.opensAt && provider.closesAt ? (
                <span className="text-muted-foreground font-normal">
                  ({provider.opensAt} {"\u2013"} {provider.closesAt})
                </span>
              ) : null}
            </span>
          ) : null}

          {provider.delivery ? (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Truck className="size-3" aria-hidden />
              <span>{t("services.delivery")}</span>
            </Badge>
          ) : null}
        </div>

        {/* Contact CTA */}
        {provider.phone ? (
          <div className="mt-4 pt-3 border-t border-border/60" onClick={(e) => e.stopPropagation()}>
            <Button asChild variant="outline" size="sm" className="w-full">
              <a href={`tel:${provider.phone}`} className="flex items-center justify-center gap-2">
                <Phone className="size-3.5 text-primary" aria-hidden />
                <span>{provider.phone}</span>
              </a>
            </Button>
          </div>
        ) : null}
      </div>
    </Link>
  );
}

export default ProviderCard;
