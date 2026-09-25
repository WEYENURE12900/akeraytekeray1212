"use client";

import { useState } from "react";
import { Mail } from "lucide-react";

import { startThreadAction } from "@/actions/messages";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/overlay";
import { useI18n } from "@/lib/i18n/client";

export function MessageHostDialog({
  listingId,
  hostId,
  hostName,
  userSignedIn,
}: {
  listingId: string;
  hostId: string;
  hostName: string;
  userSignedIn: boolean;
}) {
  const { t, href, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");

  if (!userSignedIn) {
    return (
      <Button asChild variant="outline" size="sm" className="rounded-full gap-2">
        <a href={href(`/signin?next=/listing/${listingId}`)}>
          <Mail className="size-4" />
          <span>{t("listing.messageHost")}</span>
        </a>
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-full gap-2">
          <Mail className="size-4" />
          <span>{t("listing.messageHost")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("listing.messageHost")}</DialogTitle>
          <DialogDescription>
            {t("messaging.threadWith", { name: hostName })}
          </DialogDescription>
        </DialogHeader>

        <form action={startThreadAction} className="space-y-4">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="hostId" value={hostId} />
          <input type="hidden" name="listingId" value={listingId} />

          <div>
            <label className="block text-xs font-semibold text-ink-700 mb-1.5">
              {t("messaging.message")}
            </label>
            <textarea
              required
              name="body"
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={t("messaging.inputPlaceholder")}
              className="w-full rounded-xl border border-input bg-card p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit">
              {t("messaging.send")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default MessageHostDialog;
