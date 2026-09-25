import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Bed,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  ShieldCheck,
  Star,
  Users,
  Zap,
} from "lucide-react";

import { BookingWidget } from "@/components/booking-widget";
import { ListingCard } from "@/components/listing-card";
import { MessageHostDialog } from "@/components/message-host-dialog";
import { Badge, Card, CardContent, CardHeader, CardTitle, Separator } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/avatar";
import { getSessionUser } from "@/lib/auth";
import { getListing, incrementViews, similarListings } from "@/lib/db/listings";
import { providersAround, isOpenNow } from "@/lib/db/providers";
import { listingReviews } from "@/lib/db/reviews";
import { getI18n } from "@/lib/i18n/server";
import { amenityTerm } from "@/lib/taxonomy";
import { photoUrl } from "@/lib/photos";
import { formatDate, formatDistance, formatMoney } from "@/lib/utils";
import type { Locale } from "@/lib/types";
import { FavoriteButton } from "./favorite-button";
import { ReviewSection } from "./review-section";

/**
 * The listing detail page. Everything the guest needs to decide: photos,
 * honest description, the neighbourhood ring, reviews, and the booking widget.
 * The exact address and host phone only appear for the owner or a confirmed
 * guest — `getListing` enforces that, this page just renders what it gets.
 */
export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ locale: Locale; id: string }>;
}) {
  const { t, href, locale } = await getI18n(params);
  const { id } = await params;

  const user = await getSessionUser();
  const listing = await getListing(id, {
    locale,
    viewerId: user?.id ?? null,
  });

  if (!listing) notFound();

  // Fire-and-forget — never block the render on a counter.
  void incrementViews(listing.id);

  const [reviews, nearbyProviders, similar] = await Promise.all([
    listingReviews(listing.id).catch(() => []),
    providersAround({ lat: listing.lat, lng: listing.lng }, locale).catch(() => []),
    similarListings(listing, locale, user?.id ?? null).catch(() => []),
  ]);

  const isOwner = user?.id === listing.hostId;
  const locationText = [listing.neighborhood, listing.subcity, listing.city]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="container py-6 sm:py-10 space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Link href={href("/search")} className="hover:text-primary">
            {t("common.back")}
          </Link>
          <span aria-hidden>/</span>
          <span>{locationText}</span>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {listing.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
              {listing.ratingAvg > 0 ? (
                <span className="inline-flex items-center gap-1 font-semibold text-ink-800">
                  <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden />
                  {listing.ratingAvg.toFixed(1)}
                  <span className="font-normal text-muted-foreground">
                    ({t("common.reviews", { count: listing.ratingCount })})
                  </span>
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-4" aria-hidden />
                {locationText}
              </span>
              {listing.verified ? (
                <Badge variant="verified" className="gap-1">
                  <CheckCircle2 className="size-3.5" aria-hidden />
                  {t("common.verified")}
                </Badge>
              ) : null}
              {listing.instantBook ? (
                <Badge variant="accent" className="gap-1">
                  <Zap className="size-3.5" aria-hidden />
                  {t("listing.instantBook")}
                </Badge>
              ) : null}
            </div>
          </div>
          <FavoriteButton listingId={listing.id} saved={listing.isFavorite ?? false} />
        </div>

        {listing.status !== "published" ? (
          <Badge variant="muted">{t("listing.draftNotice")}</Badge>
        ) : null}
      </div>

      {/* Photo gallery */}
      <div className="grid grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-3xl">
        {listing.photos.slice(0, 5).map((key, index) => (
          <div
            key={key}
            className={
              index === 0
                ? "col-span-4 row-span-2 aspect-[4/3] sm:col-span-2 sm:aspect-auto"
                : "hidden aspect-[4/3] sm:block"
            }
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoUrl(key)}
              alt={listing.photoAlts[index] ?? listing.title}
              className="h-full w-full object-cover"
              loading={index === 0 ? "eager" : "lazy"}
            />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-10 lg:col-span-2">
          {/* Quick facts */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-ink-700">
            <span className="inline-flex items-center gap-1.5">
              <Bed className="size-4 text-ink-400" aria-hidden />
              {t("common.bedrooms", { count: listing.bedrooms })}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="size-4 text-ink-400" aria-hidden />
              {t("common.guests", { count: listing.maxGuests })}
            </span>
            {listing.areaSqm ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4 text-ink-400" aria-hidden />
                {t("common.sqm", { count: listing.areaSqm })}
              </span>
            ) : null}
            {listing.availableFrom ? (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="size-4 text-ink-400" aria-hidden />
                {t("listing.availableFrom", { date: formatDate(listing.availableFrom) })}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-primary">
                <Calendar className="size-4" aria-hidden />
                {t("listing.availableNow")}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4 text-ink-400" aria-hidden />
              {listing.rentalType === "monthly"
                ? t("listing.minStay", { count: listing.minStayMonths })
                : t("listing.minNights", { count: listing.minNights })}
            </span>
          </div>

          <Separator />

          {/* Host card */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <UserAvatar name={listing.hostName} className="size-12" />
              <div>
                <p className="font-semibold text-foreground">
                  {t("listing.hostedBy", { name: listing.hostName })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("listing.hostSince", { date: formatDate(listing.hostSince) })}
                  {listing.hostResponseRate > 0
                    ? ` · ${t("listing.responseRate", { rate: listing.hostResponseRate })}`
                    : ""}
                </p>
              </div>
            </div>
            {!isOwner ? (
              <MessageHostDialog
                listingId={listing.id}
                hostId={listing.hostId}
                hostName={listing.hostName}
                userSignedIn={!!user}
              />
            ) : null}
          </div>

          {listing.hostPhone || listing.addressLine ? (
            <div className="rounded-2xl border border-primary/20 bg-primary-soft/40 p-4 text-sm">
              {listing.hostPhone ? (
                <p className="font-medium text-foreground">{listing.hostPhone}</p>
              ) : null}
              {listing.addressLine ? (
                <p className="mt-1 text-ink-700">{listing.addressLine}</p>
              ) : null}
            </div>
          ) : (
            <p className="flex items-start gap-2 rounded-2xl bg-muted/60 p-4 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              {t("listing.areaNote")}
            </p>
          )}

          <Separator />

          {/* Description */}
          {listing.description ? (
            <section>
              <h2 className="font-display text-xl font-bold text-foreground">
                {t("listing.about")}
              </h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-700">
                {listing.description}
              </p>
            </section>
          ) : null}

          {/* Amenities */}
          {listing.amenityKeys.length > 0 ? (
            <section>
              <h2 className="font-display text-xl font-bold text-foreground">
                {t("listing.offers")}
              </h2>
              <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {listing.amenityKeys.map((key) => {
                  const term = amenityTerm(key);
                  if (!term) return null;
                  return (
                    <li
                      key={key}
                      className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-ink-700"
                    >
                      <CheckCircle2 className="size-4 shrink-0 text-primary" aria-hidden />
                      {locale === "am" ? term.am : term.en}
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          {/* House rules */}
          {listing.houseRules ? (
            <section>
              <h2 className="font-display text-xl font-bold text-foreground">
                {t("listing.rules")}
              </h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-700">
                {listing.houseRules}
              </p>
            </section>
          ) : null}

          {/* Nearby services */}
          <section>
            <h2 className="font-display text-xl font-bold text-foreground">
              {t("listing.nearby")}
            </h2>
            {nearbyProviders.length > 0 ? (
              <ul className="mt-4 space-y-2.5">
                {nearbyProviders.map((provider) => (
                  <li
                    key={provider.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {provider.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isOpenNow(provider) ? t("services.openNow") : t("services.closed")}
                      </p>
                    </div>
                    {provider.distanceKm !== undefined ? (
                      <span className="shrink-0 text-xs font-medium text-muted-foreground">
                        {formatDistance(provider.distanceKm)}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">{t("listing.nearbyEmpty")}</p>
            )}
          </section>

          {/* Reviews */}
          <ReviewSection
            listingId={listing.id}
            reviews={reviews}
            breakdown={listing.ratingBreakdown}
            ratingAvg={listing.ratingAvg}
            ratingCount={listing.ratingCount}
            isOwner={isOwner}
          />
        </div>

        {/* Booking column */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          {isOwner ? (
            <Card>
              <CardHeader>
                <CardTitle>{t("nav.hostDashboard")}</CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={href("/host")}
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  {t("host.dashboard")} →
                </Link>
              </CardContent>
            </Card>
          ) : (
            <BookingWidget listing={listing} userSignedIn={!!user} />
          )}

          {listing.depositMonths > 0 && listing.rentalType === "monthly" ? (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              {t("listing.deposit")}:{" "}
              {t("listing.depositMonths", { count: listing.depositMonths })} ·{" "}
              {formatMoney(listing.price * listing.depositMonths, listing.currency)}
            </p>
          ) : null}
        </div>
      </div>

      {/* Similar homes */}
      {similar.length > 0 ? (
        <section className="border-t border-border pt-10">
          <h2 className="font-display text-2xl font-bold text-foreground">
            {t("listing.similar")}
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {similar.map((other) => (
              <ListingCard key={other.id} listing={other} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
