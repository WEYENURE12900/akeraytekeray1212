"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";

import { replyReviewAction } from "@/actions/reviews";
import { UserAvatar } from "@/components/ui/avatar";
import { Badge, Separator } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";
import { useI18n } from "@/lib/i18n/client";
import { formatDate } from "@/lib/utils";
import type { ReviewModel } from "@/lib/types";

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value}/5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`size-3.5 ${n <= value ? "fill-amber-400 text-amber-400" : "text-ink-200"}`}
          aria-hidden
        />
      ))}
    </span>
  );
}

/** Reviews and the host's replies. The write form lives on the trips page. */
export function ReviewSection({
  listingId,
  reviews,
  breakdown,
  ratingAvg,
  ratingCount,
  isOwner,
}: {
  listingId: string;
  reviews: ReviewModel[];
  breakdown: { cleanliness: number; accuracy: number; location: number; value: number; communication: number };
  ratingAvg: number;
  ratingCount: number;
  isOwner: boolean;
}) {
  const { t } = useI18n();

  const breakdownRows: Array<{ key: string; label: string; value: number }> = [
    { key: "cleanliness", label: t("listing.ratingCleanliness"), value: breakdown.cleanliness },
    { key: "accuracy", label: t("listing.ratingAccuracy"), value: breakdown.accuracy },
    { key: "location", label: t("listing.ratingLocation"), value: breakdown.location },
    { key: "value", label: t("listing.ratingValue"), value: breakdown.value },
    { key: "communication", label: t("listing.ratingCommunication"), value: breakdown.communication },
  ];

  return (
    <section id="reviews">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-xl font-bold text-foreground">
          {t("listing.reviews")}
        </h2>
        {ratingCount > 0 ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-800">
            <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden />
            {ratingAvg.toFixed(1)} · {t("common.reviews", { count: ratingCount })}
          </span>
        ) : null}
      </div>

      {ratingCount > 0 ? (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {breakdownRows.map((row) => (
            <div
              key={row.key}
              className="rounded-xl border border-border bg-card p-3 text-center"
            >
              <p className="font-display text-lg font-bold text-foreground">
                {row.value.toFixed(1)}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{row.label}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-6 space-y-6">
        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("common.noReviewsYet")}</p>
        ) : (
          reviews.map((review) => (
            <ReviewCard key={review.id} review={review} isOwner={isOwner} />
          ))
        )}
      </div>
    </section>
  );
}

function ReviewCard({ review, isOwner }: { review: ReviewModel; isOwner: boolean }) {
  const { t } = useI18n();
  const [replying, setReplying] = useState(false);
  const [draft, setDraft] = useState(review.host_reply ?? "");
  const [isPending, startTransition] = useTransition();

  const submitReply = () => {
    startTransition(async () => {
      const res = await replyReviewAction(review.id, draft);
      if (res.ok) {
        setReplying(false);
        toast.success(t("common.save"));
      } else {
        toast.error(t(res.error ?? "error.generic"));
      }
    });
  };

  return (
    <article className="space-y-3">
      <div className="flex items-center gap-3">
        <UserAvatar name={review.authorName} className="size-10" />
        <div>
          <p className="text-sm font-semibold text-foreground">{review.authorName}</p>
          <div className="flex items-center gap-2">
            <Stars value={review.rating} />
            <span className="text-xs text-muted-foreground">{formatDate(review.created_at)}</span>
          </div>
        </div>
      </div>

      {review.comment ? (
        <p className="text-sm leading-relaxed text-ink-700">{review.comment}</p>
      ) : null}

      {review.host_reply ? (
        <div className="ml-6 rounded-xl border-l-2 border-primary/40 bg-muted/50 p-4">
          <Badge variant="verified" className="mb-1.5">
            {t("review.hostReply")}
          </Badge>
          <p className="text-sm leading-relaxed text-ink-700">{review.host_reply}</p>
        </div>
      ) : isOwner ? (
        replying ? (
          <div className="ml-6 space-y-2">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={t("review.replyPlaceholder")}
              rows={3}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={submitReply} loading={isPending}>
                {t("review.reply")}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setReplying(false)}>
                {t("common.cancel")}
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setReplying(true)}
            className="ml-6 text-xs font-semibold text-primary hover:underline"
          >
            {t("review.reply")}
          </button>
        )
      ) : null}

      <Separator />
    </article>
  );
}
