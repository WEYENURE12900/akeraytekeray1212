"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Calendar, CheckCircle2, ShieldCheck, Users, Zap } from "lucide-react";
import { toast } from "sonner";

import { requestBookingAction, type BookingFormState } from "@/actions/bookings";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/client";
import { quote } from "@/lib/pricing";
import { formatMoney } from "@/lib/utils";
import type { ListingDetailModel } from "@/lib/types";

export function BookingWidget({
  listing,
  userSignedIn,
}: {
  listing: ListingDetailModel;
  userSignedIn: boolean;
}) {
  const { t, href, locale } = useI18n();
  const [isPending, startTransition] = useTransition();

  // Tomorrow as default start. Built from the LOCAL date, not toISOString(),
  // which is UTC and would skip a day for visitors east of Greenwich.
  const localDate = (date: Date): string =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
      date.getDate(),
    ).padStart(2, "0")}`;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultStart = localDate(tomorrow);

  // End date based on rental type
  const defaultEnd = new Date(tomorrow);
  if (listing.rentalType === "monthly") {
    defaultEnd.setMonth(defaultEnd.getMonth() + Math.max(1, listing.minStayMonths));
  } else {
    defaultEnd.setDate(defaultEnd.getDate() + Math.max(1, listing.minNights));
  }
  const defaultEndStr = localDate(defaultEnd);

  const [from, setFrom] = useState(defaultStart);
  const [to, setTo] = useState(defaultEndStr);
  const [guests, setGuests] = useState(1);
  const [guestMessage, setGuestMessage] = useState("");
  const [bookingState, setBookingState] = useState<BookingFormState | null>(null);

  // The same math the server runs, from the same module, so the preview and
  // the stored booking can never disagree on a price.
  const preview = quote({
    rentalType: listing.rentalType,
    price: listing.price,
    currency: listing.currency,
    depositMonths: listing.depositMonths,
    minStayMonths: listing.minStayMonths,
    minNights: listing.minNights,
    from,
    to,
  });
  const units = preview.units;
  const subtotal = preview.subtotal;
  const serviceFee = preview.serviceFee;
  const deposit = preview.deposit;
  const total = preview.total;

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userSignedIn) {
      toast.error(t("nav.signIn"));
      return;
    }

    const form = new FormData();
    form.set("locale", locale);
    form.set("listingId", listing.id);
    form.set("from", from);
    form.set("to", to);
    form.set("guests", String(guests));
    form.set("message", guestMessage);

    startTransition(async () => {
      try {
        const res = await requestBookingAction({}, form);
        setBookingState(res);
        if (res.ok) {
          toast.success(t("booking.requestSent"));
        } else if (res.error) {
          toast.error(t(res.error as any));
        }
      } catch {
        toast.error(t("error.generic"));
      }
    });
  };

  if (bookingState?.ok) {
    return (
      <div className="rounded-3xl border border-primary/20 bg-primary-soft/40 p-6 text-center space-y-4 shadow-card">
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-primary text-primary-foreground">
          <CheckCircle2 className="size-6" />
        </div>
        <h3 className="font-display text-lg font-bold text-foreground">
          {bookingState.status === "confirmed"
            ? t("booking.confirmed")
            : t("booking.requestSent")}
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {t("booking.code")}:{" "}
          <strong className="text-foreground tracking-wider font-mono text-sm">
            {bookingState.code}
          </strong>
        </p>
        {bookingState.status !== "confirmed" ? (
          <p className="text-xs text-muted-foreground">
            {t("booking.statusPendingNotice")}
          </p>
        ) : null}
        <div className="pt-2">
          <Button asChild className="w-full rounded-full">
            <Link href={href("/trips")}>{t("nav.trips")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-lift space-y-5">
      {/* Price Header */}
      <div className="flex items-baseline justify-between">
        <div>
          <span className="font-display text-2xl font-bold text-foreground">
            {formatMoney(listing.price, listing.currency)}
          </span>
          <span className="ml-1 text-xs text-muted-foreground">
            {listing.rentalType === "nightly" ? t("common.perNight") : t("common.perMonth")}
          </span>
        </div>
        {listing.instantBook ? (
          <Badge variant="glass" className="flex items-center gap-1 text-amber-700 font-medium">
            <Zap className="size-3.5 fill-amber-500 text-amber-500" />
            <span>{t("listing.instantBook")}</span>
          </Badge>
        ) : null}
      </div>

      <form onSubmit={handleBooking} className="space-y-4">
        {/* Date Inputs */}
        <div className="rounded-2xl border border-border overflow-hidden divide-y divide-border">
          <div className="grid grid-cols-2 divide-x divide-border">
            <div className="p-2.5 bg-card">
              <label className="block text-[10px] font-semibold text-muted-foreground uppercase">
                {t("booking.checkIn")}
              </label>
              <input
                type="date"
                required
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full bg-transparent text-xs font-medium text-foreground focus:outline-none cursor-pointer mt-0.5"
              />
            </div>
            <div className="p-2.5 bg-card">
              <label className="block text-[10px] font-semibold text-muted-foreground uppercase">
                {t("booking.checkOut")}
              </label>
              <input
                type="date"
                required
                min={from}
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full bg-transparent text-xs font-medium text-foreground focus:outline-none cursor-pointer mt-0.5"
              />
            </div>
          </div>

          <div className="p-2.5 bg-card">
            <label className="block text-[10px] font-semibold text-muted-foreground uppercase">
              {t("booking.guests")}
            </label>
            <select
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              className="w-full bg-transparent text-xs font-medium text-foreground focus:outline-none cursor-pointer mt-0.5"
            >
              {Array.from({ length: listing.maxGuests }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n} className="bg-card text-foreground">
                  {t("common.guests", { count: n })}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Note to host */}
        <div>
          <label className="block text-xs font-medium text-ink-700 mb-1">
            {t("booking.messageHostOptional")}
          </label>
          <textarea
            rows={2}
            value={guestMessage}
            onChange={(e) => setGuestMessage(e.target.value)}
            placeholder={t("booking.guestMessagePlaceholder")}
            className="w-full rounded-xl border border-input bg-card p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Cost Breakdown */}
        <div className="space-y-2 border-t border-border pt-4 text-xs text-ink-600">
          <div className="flex justify-between">
            <span>
              {formatMoney(listing.price, listing.currency)} ×{" "}
              {listing.rentalType === "monthly"
                ? t("common.months", { count: units })
                : t("common.nights", { count: units })}
            </span>
            <span>{formatMoney(subtotal, listing.currency)}</span>
          </div>

          {deposit > 0 ? (
            <div className="flex justify-between">
              <span>{t("booking.deposit")} ({listing.depositMonths} mo)</span>
              <span>{formatMoney(deposit, listing.currency)}</span>
            </div>
          ) : null}

          <div className="flex justify-between">
            <span>{t("booking.serviceFee")}</span>
            <span>{formatMoney(serviceFee, listing.currency)}</span>
          </div>

          <div className="flex justify-between border-t border-border/80 pt-2 font-display text-sm font-bold text-foreground">
            <span>{t("booking.total")}</span>
            <span>{formatMoney(total, listing.currency)}</span>
          </div>
        </div>

        {/* Action Button */}
        {userSignedIn ? (
          <Button type="submit" size="lg" className="w-full rounded-full shadow-md" loading={isPending}>
            {listing.instantBook ? t("booking.instantBookNow") : t("booking.requestToBook")}
          </Button>
        ) : (
          <Button asChild size="lg" className="w-full rounded-full shadow-md">
            <Link href={href(`/signin?next=/listing/${listing.id}`)}>
              {t("nav.signIn")}
            </Link>
          </Button>
        )}

        <div className="flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
          <ShieldCheck className="size-3.5 text-primary" />
          <span>{t("booking.noChargeYet")}</span>
        </div>
      </form>
    </div>
  );
}

export default BookingWidget;
