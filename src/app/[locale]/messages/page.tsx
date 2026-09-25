import Link from "next/link";
import { redirect } from "next/navigation";
import { Mail } from "lucide-react";

import { UserAvatar } from "@/components/ui/avatar";
import { Badge, Card, CardContent } from "@/components/ui/card";
import { getSessionUser } from "@/lib/auth";
import { getConversation, inbox, markRead, threadMessages } from "@/lib/db/conversations";
import { getI18n } from "@/lib/i18n/server";
import { formatDate } from "@/lib/utils";
import type { Locale } from "@/lib/types";
import { ReplyBox } from "./reply-box";

/**
 * The inbox, and when ?c=<id> is present, the open thread beside it. The
 * thread query itself enforces membership, so a guessed id shows nothing.
 */
export default async function MessagesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ c?: string }>;
}) {
  const { t, href, locale } = await getI18n(params);
  const { c: activeId } = await searchParams;

  const user = await getSessionUser();
  if (!user) redirect(href("/signin?next=/messages"));

  const conversations = await inbox(user.id, locale).catch(() => []);

  const active = activeId
    ? await getConversation(activeId, user.id, locale).catch(() => null)
    : null;

  const messages = active
    ? await threadMessages(active.id, user.id).catch(() => [])
    : [];

  // Opening a thread clears the viewer's badge — after reading, not before.
  if (active && active.unread > 0) {
    await markRead(active.id, user.id);
  }

  return (
    <div className="container max-w-5xl py-8 sm:py-12">
      <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {t("chat.title")}
      </h1>

      {conversations.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
          <div className="grid size-14 place-items-center rounded-2xl bg-muted text-muted-foreground mb-4">
            <Mail className="size-7" aria-hidden />
          </div>
          <h3 className="font-display text-lg font-semibold text-foreground">{t("chat.empty")}</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">{t("chat.emptyBody")}</p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,320px)_1fr]">
          {/* Thread list */}
          <div className="space-y-2">
            {conversations.map((conversation) => {
              const isActive = active?.id === conversation.id;
              return (
                <Link
                  key={conversation.id}
                  href={href(`/messages?c=${conversation.id}`)}
                  className={`flex items-center gap-3 rounded-2xl border p-3 transition-colors ${
                    isActive
                      ? "border-primary bg-primary-soft/40"
                      : "border-border bg-card hover:bg-muted/60"
                  }`}
                >
                  <UserAvatar name={conversation.otherName} className="size-10 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-foreground">
                        {conversation.otherName}
                      </span>
                      {conversation.unread > 0 ? (
                        <Badge variant="verified" className="tnum shrink-0">
                          {conversation.unread}
                        </Badge>
                      ) : null}
                    </span>
                    {conversation.listingTitle ? (
                      <span className="block truncate text-xs text-muted-foreground">
                        {t("chat.about", { title: conversation.listingTitle })}
                      </span>
                    ) : null}
                    <span className="block truncate text-xs text-ink-600">
                      {conversation.last_message ?? ""}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Open thread */}
          <Card className="flex min-h-[420px] flex-col">
            {active ? (
              <>
                <div className="border-b border-border p-4">
                  <p className="font-display text-base font-semibold text-foreground">
                    {active.otherName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("chat.startedBy", { date: formatDate(active.created_at) })}
                  </p>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto p-4">
                  {messages.map((message) => {
                    const mine = message.sender_id === user.id;
                    return (
                      <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                            mine
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-ink-800"
                          }`}
                        >
                          <p className="whitespace-pre-line">{message.body}</p>
                          <p
                            className={`mt-1 text-[10px] ${
                              mine ? "text-primary-foreground/70" : "text-muted-foreground"
                            }`}
                          >
                            {formatDate(message.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-border p-4">
                  <ReplyBox conversationId={active.id} />
                </div>
              </>
            ) : (
              <CardContent className="grid flex-1 place-items-center p-10 text-center">
                <p className="text-sm text-muted-foreground">{t("chat.selectThread")}</p>
              </CardContent>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
