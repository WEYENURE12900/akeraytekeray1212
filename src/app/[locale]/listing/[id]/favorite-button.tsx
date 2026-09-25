"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";

import { toggleFavoriteAction } from "@/actions/favorites";
import { useI18n } from "@/lib/i18n/client";

/**
 * The heart on the listing page. Signed-out visitors are sent to sign in
 * rather than shown an error, because that is what they need to do next.
 */
export function FavoriteButton({
  listingId,
  saved: initialSaved,
}: {
  listingId: string;
  saved: boolean;
}) {
  const { t, href } = useI18n();
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    const nextState = !saved;
    setSaved(nextState);

    startTransition(async () => {
      try {
        const res = await toggleFavoriteAction(listingId);
        if (res.ok) {
          setSaved(res.saved);
        } else {
          setSaved(!nextState);
        }
      } catch {
        // A redirect throw lands here — send the guest to sign in properly.
        setSaved(!nextState);
        router.push(href(`/signin?next=/listing/${listingId}`));
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-pressed={saved}
      aria-label={saved ? t("fav.unsave") : t("fav.save")}
      className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-ink-700 shadow-sm transition-colors hover:bg-muted"
    >
      <Heart
        className={`size-4 transition-colors ${saved ? "fill-berbere text-berbere" : ""}`}
        aria-hidden
      />
      {saved ? t("common.remove") : t("common.save")}
    </button>
  );
}
