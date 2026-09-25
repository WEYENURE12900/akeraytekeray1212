import { notFound, redirect } from "next/navigation";
import Link from "next/link";

import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionUser } from "@/lib/auth";
import { getOwnedListing, listingPhotos, publishBlockers } from "@/lib/db/listings";
import { getI18n } from "@/lib/i18n/server";
import type { ListingStatus, Locale } from "@/lib/types";
import { ListingEditorForm } from "./editor-form";
import { PhotoManager } from "./photo-manager";
import { ListingStatusButton } from "../../listing-status-button";

/**
 * The listing editor. Ownership is enforced twice: once here by the
 * getOwnedListing gate, and again inside every server action this page posts
 * to. A guessed id gets a 404, not someone else's home.
 */
export default async function HostListingEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale; id: string }>;
  searchParams: Promise<{ saved?: string; photo?: string }>;
}) {
  const { t, href, locale } = await getI18n(params);
  const { id } = await params;
  const query = await searchParams;

  const user = await getSessionUser();
  if (!user) redirect(href("/signin?next=/host"));

  const listing = await getOwnedListing(id, user.id);
  if (!listing) notFound();

  const photos = await listingPhotos(id).catch(() => []);
  const blockers = publishBlockers(listing, photos.length);

  const statusLabels: Record<ListingStatus, string> = {
    draft: t("host.status.draft"),
    published: t("host.status.published"),
    paused: t("host.status.paused"),
    removed: t("host.status.removed"),
  };

  return (
    <div className="container max-w-4xl py-8 sm:py-12 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs text-muted-foreground">
            <Link href={href("/host")} className="hover:text-primary">
              {t("host.dashboard")}
            </Link>{" "}
            / {listing.title_en}
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {listing.status === "draft" ? t("wizard.title") : t("wizard.editTitle")}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={listing.status === "published" ? "verified" : "muted"}>
            {statusLabels[listing.status]}
          </Badge>
          <ListingStatusButton listingId={listing.id} status={listing.status} />
        </div>
      </div>

      {query.saved === "1" ? (
        <p className="rounded-xl border border-eucalyptus-200 bg-primary-soft px-4 py-3 text-sm text-eucalyptus-800" role="status">
          {t("profile.saved")}
        </p>
      ) : null}

      {query.photo === "missing" || query.photo === "too_big" ? (
        <p className="rounded-xl border border-berbere-200 bg-berbere-50 px-4 py-3 text-sm text-berbere-500" role="alert">
          {query.photo === "too_big"
            ? t("error.fileTooBig", { size: "8 MB" })
            : t("error.uploadFailed")}
        </p>
      ) : null}

      {blockers.length > 0 && listing.status === "draft" ? (
        <p className="rounded-xl border border-tibeb-200 bg-accent-soft px-4 py-3 text-sm text-accent-foreground">
          {t("wizard.missing", { fields: blockers.join(", ") })}
        </p>
      ) : null}

      {/* Photos */}
      <Card>
        <CardHeader>
          <CardTitle>{t("wizard.step.photos")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("wizard.photosBody")}</p>
        </CardHeader>
        <CardContent>
          <PhotoManager
            listingId={listing.id}
            locale={locale}
            photos={photos.map((photo) => ({
              id: photo.id,
              key: photo.key,
              alt: photo.alt_en,
            }))}
          />
        </CardContent>
      </Card>

      {/* Details */}
      <Card>
        <CardHeader>
          <CardTitle>{t("wizard.step.basics")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ListingEditorForm listing={listing} locale={locale} />
        </CardContent>
      </Card>
    </div>
  );
}
