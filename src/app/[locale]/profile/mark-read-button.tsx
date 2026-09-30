"use client";

import { useTransition } from "react";
import { CheckCheck } from "lucide-react";

import { markNotificationsReadAction } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";

export function MarkNotificationsRead() {
  const { t, locale } = useI18n();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-1.5 text-xs"
      loading={pending}
      onClick={() => {
        startTransition(async () => {
          await markNotificationsReadAction(locale);
        });
      }}
    >
      <CheckCheck className="size-3.5" aria-hidden />
      {t("profile.markAllRead")}
    </Button>
  );
}
