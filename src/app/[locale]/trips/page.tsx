import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, Compass } from "lucide-react";

import { Badge, Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/avatar";
import { getSessionUser } from "@/lib/auth";
import { completeDueBookings, guestBookings } from "@/lib/db/bookings";
import { getI18n } from "@/lib/i18n/server";
import { photoUrl } from "@/lib/photos";
import { formatDate, formatMoney } from "@/lib/utils";
import type { BookingModel, Locale } from "@/lib/types";
import { BookingActions } from "./booking-actions";
import { ReviewForm } from "./review-form";

/**
 * The guest's rentals. Pending first (they need attention), then everything
 * else newest-move-in first. Completed stays carry the review prompt once.
 */
export default async function TripsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { t, href, locale } = await getI18n(params);
  const user = await getSessionUser();
  if (!user) redirect(href(`/signin?next=/trips`));

  // Age past confirmed stays into completed before reading, so the review
  // prompts appear without waiting for a cron.
  await completeDueBookings(user.id);
  const bookings = await guestBookings(user.id, locale).catch(() => []);

  const upcoming = bookings.filter(
    (b) => b.status === "pending" || b.status === "confirmed",
  );
  const past = bookings.filter(
    (b) => b.status === "completed" || b.status === "cancelled" || b.status === "declined",
  );

  const statusLabels: Record<BookingModel["status"], string> = {
    pending: t("booking.status.pending"),
    confirmed: t("booking.status.confirmed"),
    declined: t("booking.status.declined"),
    cancelled: t("booking.status.cancelled"),
    completed: t("booking.status.completed"),
  };

  const statusVariant = (status: BookingModel["status"]) => {
    if (status === "confirmed") return "verified" as const;
    if (status === "pending") return "accent" as const;
    if (status === "declined" || status === "cancelled") return "destructive" as const;
    return "muted" as const;
  };

  const renderBooking = (booking: BookingModel) => (
    <Card key={booking.id} className="overflow-hidden">
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:p-5">
        <Link
          href={href(`/listing/${booking.listing_id}`)}
          className="block w-full shrink-0 overflow-hidden rounded-xl sm:w-40"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl(booking.listingPhoto)}
            alt={booking.listingTitle}
            className="aspect-[4/3] w-full object-cover"
            loading="lazy"
          />
        </Link>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                href={href(`/listing/${booking.listing_id}`)}
                className="font-display text-base font-semibold text-foreground hover:text-primary"
              >
                {booking.listingTitle}
              </Link>
              <p className="text-xs text-muted-foreground">
                {[booking.listingNeighborhood, booking.listingCity].filter(Boolean).join(", ")}
              </p>
            </div>
            <Badge variant={statusVariant(booking.status)}>{statusLabels[booking.status]}</Badge>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-600">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="size-3.5 text-ink-400" aria-hidden />
              {formatDate(booking.start_date)} → {formatDate(booking.end_date)}
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">
              {t("booking.code", { code: booking.code })}
            </span>
            <span className="font-semibold text-foreground">
              {formatMoney(booking.total, booking.currency)}
            </span>
          </div>

          {booking.guest_message ? (
            <p className="line-clamp-2 text-xs text-muted-foreground">
              {booking.guest_message}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <span className="inline-flex items-center gap-1.5 text-xs text-ink-600">
              <UserAvatar name={booking.hostName} className="size-6" />
              {booking.hostName}
              {booking.hostPhone ? (
                <a
                  href={`tel:${booking.hostPhone}`}
                  className="font-semibold text-primary hover:underline"
                >
                  {booking.hostPhone}
                </a>
              ) : null}
            </span>

            <BookingActions
              bookingId={booking.id}
              status={booking.status}
            />

            {booking.status === "completed" && !booking.hasReview ? (
              <ReviewForm listingId={booking.listing_id} bookingId={booking.id} />
            ) : null}
            {booking.status === "completed" && booking.hasReview ? (
              <span className="text-xs text-muted-foreground">{t("booking.reviewed")}</span>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container max-w-4xl py-8 sm:py-12 space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {t("booking.myRentals")}
        </h1>
      </div>

      {bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
          <div className="grid size-14 place-items-center rounded-2xl bg-muted text-muted-foreground mb-4">
            <Compass className="size-7" aria-hidden />
          </div>
          <h3 className="font-display text-lg font-semibold text-foreground">
            {t("booking.empty")}
          </h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">{t("booking.emptyBody")}</p>
          <Button asChild className="mt-6 rounded-full">
            <Link href={href("/search")}>{t("booking.emptyCta")}</Link>
          </Button>
        </div>
      ) : (
        <>
          {upcoming.length > 0 ? (
            <section className="space-y-4">
              <h2 className="font-display text-lg font-semibold text-foreground">
                {t("booking.upcoming")}
              </h2>
              {upcoming.map(renderBooking)}
            </section>
          ) : null}

          {past.length > 0 ? (
            <section className="space-y-4">
              <h2 className="font-display text-lg font-semibold text-foreground">
                {t("booking.past")}
              </h2>
              {past.map(renderBooking)}
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
