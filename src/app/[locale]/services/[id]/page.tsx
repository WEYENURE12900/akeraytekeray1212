import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Clock,
  ExternalLink,
  MapPin,
  Phone,
  ShieldCheck,
  Star,
  Truck,
  Zap,
} from "lucide-react";

import { ProviderReviewForm } from "./provider-review-form";
import { UserAvatar } from "@/components/ui/avatar";
import { Badge, Card, CardContent, CardHeader, CardTitle, Separator } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/auth";
import { getProvider, isOpenNow, providerReviews } from "@/lib/db/providers";
import { getI18n } from "@/lib/i18n/server";
import { photoUrl, providerPlaceholder } from "@/lib/photos";
import { serviceCategoryTerm } from "@/lib/taxonomy";
import { formatDate, formatDistance } from "@/lib/utils";
import type { Locale } from "@/lib/types";

const DAY_NAMES_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const DAY_NAMES_AM = ["እሁድ", "ሰኞ", "ማክ", "ረቡዕ", "ሐሙስ", "አርብ", "ቅዳሜ"] as const;

export default async function ProviderDetailPage({
  params,
}: {
  params: Promise<{ locale: Locale; id: string }>;
}) {
  const { locale, id } = await params;
  const { t, href } = await getI18n({ locale } as never);
  const user = await getSessionUser();

  const provider = await getProvider(id, locale, {
    viewerId: user?.id ?? null,
    isAdmin: user?.isAdmin ?? false,
  });
  if (!provider) notFound();

  const reviews = await providerReviews(id).catch(() => []);
  const open = isOpenNow(provider);

  const term = serviceCategoryTerm(provider.category);
  const categoryLabel = term ? (locale === "am" ? term.am : term.en) : provider.category;

  const locationParts = [provider.neighborhood, provider.subcity, provider.city].filter(Boolean);
  const locationText = locationParts.join(", ");

  const imageUrl = `${photoUrl(provider.photoKey ?? providerPlaceholder(provider.id))}?w=1200&h=600`;

  const dayNames = locale === "am" ? DAY_NAMES_AM : DAY_NAMES_EN;

  return (
    <div className="container max-w-4xl py-8 sm:py-12 space-y-8">
      {/* Back link */}
      <Link
        href={href("/services")}
        className="text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        ← {t("services.title")}
      </Link>

      {/* Hero image */}
      <div className="relative aspect-[2/1] sm:aspect-[3/1] w-full overflow-hidden rounded-2xl bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={provider.name}
          className="h-full w-full object-cover"
        />

        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <Badge variant="glass" className="font-semibold text-primary">
            {categoryLabel}
          </Badge>
          {provider.verified ? (
            <Badge variant="glass" className="text-primary gap-1">
              <ShieldCheck className="size-3.5" aria-hidden />
              <span>{t("common.verified")}</span>
            </Badge>
          ) : null}
          {provider.status !== "published" ? (
            <Badge variant="destructive">{provider.status}</Badge>
          ) : null}
        </div>
      </div>

      {/* Title and rating */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {provider.name}
          </h1>
          {locationText ? (
            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-4 shrink-0" aria-hidden />
              {locationText}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-4 shrink-0">
          {provider.ratingAvg > 0 ? (
            <div className="flex items-center gap-1.5">
              <Star className="size-5 fill-amber-400 text-amber-400" aria-hidden />
              <span className="text-lg font-bold">{provider.ratingAvg.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">
                ({provider.ratingCount})
              </span>
            </div>
          ) : null}
          <ProviderReviewForm providerId={id} userSignedIn={!!user} />
        </div>
      </div>

      {provider.description ? (
        <p className="text-sm leading-relaxed text-ink-700 max-w-2xl">
          {provider.description}
        </p>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Operating hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-4" aria-hidden />
              {t("provider.hours")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Open/closed status */}
            <div className="flex items-center gap-2">
              {provider.emergency ? (
                <Badge variant="destructive" className="gap-1">
                  <Zap className="size-3" aria-hidden />
                  24/7 {t("services.emergency")}
                </Badge>
              ) : (
                <span
                  className={`inline-flex items-center gap-1.5 text-sm font-medium ${
                    open ? "text-eucalyptus-700" : "text-muted-foreground"
                  }`}
                >
                  <span
                    className={`size-2 rounded-full ${
                      open ? "bg-eucalyptus-500" : "bg-muted-foreground"
                    }`}
                  />
                  {open ? t("services.openNow") : t("services.closed")}
                </span>
              )}
            </div>

            {/* Hours */}
            {provider.opensAt && provider.closesAt ? (
              <p className="text-sm text-muted-foreground">
                {provider.opensAt} – {provider.closesAt}
              </p>
            ) : null}

            {/* Operating days */}
            {provider.openDays.length > 0 && provider.openDays.length < 7 ? (
              <div className="flex flex-wrap gap-1.5">
                {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                  <Badge
                    key={day}
                    variant={provider.openDays.includes(day) ? "default" : "muted"}
                    className="text-xs px-2 py-0.5"
                  >
                    {dayNames[day]}
                  </Badge>
                ))}
              </div>
            ) : null}

            {/* Delivery badge */}
            {provider.delivery ? (
              <Badge variant="secondary" className="gap-1">
                <Truck className="size-3" aria-hidden />
                {t("services.delivery")}
              </Badge>
            ) : null}
          </CardContent>
        </Card>

        {/* Contact info */}
        <Card>
          <CardHeader>
            <CardTitle>{t("profile.contact")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {provider.phone ? (
              <div className="flex items-center gap-3">
                <Phone className="size-4 text-primary shrink-0" aria-hidden />
                <a
                  href={`tel:${provider.phone}`}
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                >
                  {provider.phone}
                </a>
              </div>
            ) : null}
            {provider.phoneAlt ? (
              <div className="flex items-center gap-3">
                <Phone className="size-4 text-muted-foreground shrink-0" aria-hidden />
                <a
                  href={`tel:${provider.phoneAlt}`}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {provider.phoneAlt}
                </a>
              </div>
            ) : null}
            {provider.website ? (
              <div className="flex items-center gap-3">
                <ExternalLink className="size-4 text-primary shrink-0" aria-hidden />
                <a
                  href={provider.website.startsWith("http") ? provider.website : `https://${provider.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary hover:underline truncate"
                >
                  {provider.website.replace(/^https?:\/\//, "")}
                </a>
              </div>
            ) : null}
            {provider.addressLine ? (
              <div className="flex items-center gap-3">
                <MapPin className="size-4 text-muted-foreground shrink-0" aria-hidden />
                <span className="text-sm text-muted-foreground">{provider.addressLine}</span>
              </div>
            ) : null}

            {provider.phone ? (
              <Button asChild variant="outline" className="w-full mt-2">
                <a href={`tel:${provider.phone}`} className="flex items-center justify-center gap-2">
                  <Phone className="size-4" aria-hidden />
                  <span>{t("common.call")}</span>
                </a>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Reviews section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Star className="size-4" aria-hidden />
            {t("listing.reviews")}
            {provider.ratingCount > 0 ? (
              <span className="text-sm font-normal text-muted-foreground">
                ({provider.ratingCount})
              </span>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id}>
                  <div className="flex items-center gap-3">
                    <UserAvatar name={review.authorName} className="size-8" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{review.authorName}</p>
                      <div className="flex items-center gap-1.5">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star
                              key={n}
                              className={`size-3.5 ${
                                n <= review.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-ink-200"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  {review.comment ? (
                    <p className="mt-2 text-sm leading-relaxed text-ink-700 pl-11">
                      {review.comment}
                    </p>
                  ) : null}
                  <Separator className="mt-4" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("common.noReviewsYet")}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
