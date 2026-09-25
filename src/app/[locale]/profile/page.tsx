import { redirect } from "next/navigation";
import { Star } from "lucide-react";

import { UserAvatar } from "@/components/ui/avatar";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/card";
import { getSessionUser } from "@/lib/auth";
import { authoredReviews } from "@/lib/db/reviews";
import { getI18n } from "@/lib/i18n/server";
import { formatPhone } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import type { Locale } from "@/lib/types";

/**
 * The signed-in user's profile. Read-only for now — the edit form comes with
 * profile actions; the important part is that the page exists and shows the
 * account honestly.
 */
export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { t, href, locale } = await getI18n(params);
  const user = await getSessionUser();
  if (!user) redirect(href("/signin?next=/profile"));

  const reviews = await authoredReviews(user.id).catch(() => []);

  return (
    <div className="container max-w-3xl py-8 sm:py-12 space-y-8">
      <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {t("profile.title")}
      </h1>

      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <UserAvatar name={user.fullName} className="size-16" />
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
