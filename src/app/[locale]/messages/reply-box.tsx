"use client";

import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";

import { sendMessageAction } from "@/actions/messages";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";

/** Reply box for an open thread. Clears itself on a successful send. */
export function ReplyBox({ conversationId }: { conversationId: string }) {
  const { t } = useI18n();
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();

  const send = () => {
    const text = body.trim();
    if (!text) return;

    startTransition(async () => {
      const res = await sendMessageAction(conversationId, text);
      if (res.ok) {
        setBody("");
      } else {
        toast.error(t(res.error));
      }
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
      className="flex items-end gap-2"
    >
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={t("chat.placeholder")}
        rows={2}
        maxLength={2000}
        className="flex-1 resize-none rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
          }
        }}
      />
      <Button type="submit" size="icon" disabled={isPending || !body.trim()} aria-label={t("chat.send")}>
        <Send className="size-4" aria-hidden />
      </Button>
    </form>
  );
}
