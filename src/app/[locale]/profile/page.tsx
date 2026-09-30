import { redirect } from "next/navigation";
import Link from "next/link";
import { Bell, Star } from "lucide-react";

import { ProfileEditor } from "./profile-editor";
import { MarkNotificationsRead } from "./mark-read-button";
import { UserAvatar } from "@/components/ui/avatar";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/card";
import { getSessionUser } from "@/lib/auth";
import { authoredReviews } from "@/lib/db/reviews";
import { getUserNotifications } from "@/lib/db/notifications";
import { getI18n } from "@/lib/i18n/server";
import { formatPhone } from "@/lib/auth";
import { photoUrl } from "@/lib/photos";
import { formatDate } from "@/lib/utils";
import type { Locale } from "@/lib/types";

/**
 * The signed-in user's profile with edit capability and notifications.
 */
export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { t, href, locale } = await getI18n(params);
  const user = await getSessionUser();
  if (!user) redirect(href("/signin?next=/profile"));

  const sp = await searchParams;
  const saved = sp.saved === "1";
  const errorKey = typeof sp.error === "string" ? sp.error : null;

  const [reviews, notifications] = await Promise.all([
    authoredReviews(user.id).catch(() => []),
    getUserNotifications(user.id).catch(() => []),
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="container max-w-3xl py-8 sm:py-12 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {t("profile.title")}
        </h1>
        <ProfileEditor
          profile={{
            fullName: user.fullName,
            bio: user.bio ?? null,
            city: user.city ?? null,
            phone: user.phone ?? null,
            email: user.email ?? null,
            isHost: !!user.isHost,
          }}
        />
      </div>

      {saved ? (
        <div className="rounded-xl border border-eucalyptus-200 bg-eucalyptus-50 px-4 py-3 text-sm text-eucalyptus-700">
          {t("profile.saved")}
        </div>
      ) : null}

      {errorKey ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">
          {errorKey === "name_required" ? t("error.nameRequired") :
           errorKey === "invalid_phone" ? t("error.invalidPhone") :
           errorKey === "phone_exists" ? t("error.phoneExists") :
           errorKey === "invalid_email" ? t("error.invalidEmail") :
           errorKey === "email_exists" ? t("error.emailExists") :
           t("error.generic")}
        </div>
      ) : null}

      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <UserAvatar
            name={user.fullName}
            src={user.avatarKey ? photoUrl(user.avatarKey) : null}
            className="size-16"
          />
          <div className="min-w-0">
            <p className="font-display text-lg font-semibold text-foreground">{user.fullName}</p>
            <p className="text-sm text-muted-foreground">
              {t("profile.memberSince", { date: formatDate(user.createdAt) })}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {user.isHost ? <Badge variant="verified">{t("mode.host")}</Badge> : null}
              {user.isAdmin ? <Badge variant="accent">{t("nav.admin")}</Badge> : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("profile.contact")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {user.phone ? (
            <p className="flex justify-between">
              <span className="text-muted-foreground">{t("auth.phone")}</span>
              <span className="font-medium text-foreground">{formatPhone(user.phone)}</span>
            </p>
          ) : null}
          {user.email ? (
            <p className="flex justify-between">
              <span className="text-muted-foreground">{t("auth.email")}</span>
              <span className="font-medium text-foreground">{user.email}</span>
            </p>
          ) : null}
          {user.city ? (
            <p className="flex justify-between">
              <span className="text-muted-foreground">{t("auth.city")}</span>
              <span className="font-medium text-foreground">{user.city}</span>
            </p>
          ) : null}
        </CardContent>
      </Card>

      {user.bio ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("profile.about")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-ink-700">{user.bio}</p>
          </CardContent>
        </Card>
      ) : null}

      {/* Notifications */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="size-4" aria-hidden />
            {t("profile.notifications")}
            {unreadCount > 0 ? (
              <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                {unreadCount}
              </Badge>
            ) : null}
          </CardTitle>
          {unreadCount > 0 ? <MarkNotificationsRead /> : null}
        </CardHeader>
        <CardContent>
          {notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`rounded-lg px-3 py-2 text-sm ${
                    notif.read ? "bg-transparent" : "bg-primary/5 border border-primary/10"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-foreground">
                      {locale === "am" && notif.title_am ? notif.title_am : notif.title_en}
                    </p>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatDate(notif.created_at)}
                    </span>
                  </div>
                  {(locale === "am" ? notif.body_am : notif.body_en) ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {locale === "am" && notif.body_am ? notif.body_am : notif.body_en}
                    </p>
                  ) : null}
                  {notif.href ? (
                    <Link
                      href={href(notif.href)}
                      className="mt-1 inline-block text-xs font-medium text-primary hover:underline"
                    >
                      {t("common.viewDetails")}
                    </Link>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("profile.noNotifications")}</p>
          )}
        </CardContent>
      </Card>

      {reviews.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("listing.reviews")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id}>
                <div className="flex items-center gap-2">
                  <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden />
                  <span className="text-sm font-semibold">{review.rating}/5</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(review.created_at)}
                  </span>
                </div>
                {review.comment ? (
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-700">{review.comment}</p>
                ) : null}
                <Separator className="mt-4" />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
