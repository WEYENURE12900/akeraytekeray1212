import Link from "next/link";
import { ChevronLeft, ChevronRight, Home, SlidersHorizontal } from "lucide-react";

import { ListingCard } from "@/components/listing-card";
import { SearchFiltersBar } from "@/components/search-filters";
import { Button } from "@/components/ui/button";
import { searchListings } from "@/lib/db/listings";
import { getI18n } from "@/lib/i18n/server";
import {
  filtersToQuery,
  parseSearchFilters,
  type RawSearchParams,
} from "@/lib/search";
import type { Locale } from "@/lib/types";

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<RawSearchParams>;
}) {
  const { t, href, locale } = await getI18n(params);
  const rawParams = await searchParams;
  const filters = parseSearchFilters(rawParams);

  const result = await searchListings(filters, locale).catch(() => ({
    listings: [],
    total: 0,
    page: 1,
    pageSize: 24,
  }));

  const totalPages = Math.ceil(result.total / result.pageSize);

  // Pagination query helpers
  const prevQuery = filtersToQuery({ ...filters, page: filters.page - 1 });
  const nextQuery = filtersToQuery({ ...filters, page: filters.page + 1 });

  return (
    <div className="container py-8 sm:py-10 space-y-6 sm:space-y-8">
      {/* Top Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {filters.city ? `${filters.city} — ` : ""}
            {t("search.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("search.resultCount", { count: result.total })}
          </p>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <SearchFiltersBar filters={filters} />

      {/* Listings Grid */}
      {result.listings.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {result.listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
          <div className="grid size-14 place-items-center rounded-2xl bg-muted text-muted-foreground mb-4">
            <Home className="size-7" aria-hidden />
          </div>
          <h3 className="font-display text-lg font-semibold text-foreground">
            {t("search.noResults")}
          </h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {t("search.noResultsHint")}
          </p>
          <div className="mt-6">
            <Button asChild variant="outline" className="rounded-full">
              <Link href={href("/search")}>{t("common.clear")}</Link>
            </Button>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-2 pt-6 border-t border-border">
          <Button
            asChild
            variant="outline"
            size="sm"
            disabled={filters.page <= 1}
            className="rounded-full"
          >
            <Link
              href={filters.page > 1 ? `${href("/search")}${prevQuery}` : "#"}
              aria-disabled={filters.page <= 1}
              tabIndex={filters.page <= 1 ? -1 : undefined}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="size-4" />
              <span>{t("common.back")}</span>
            </Link>
          </Button>

          <span className="px-4 text-xs font-medium text-muted-foreground">
            {filters.page} / {totalPages}
          </span>

          <Button
            asChild
            variant="outline"
            size="sm"
            disabled={filters.page >= totalPages}
            className="rounded-full"
          >
            <Link
              href={filters.page < totalPages ? `${href("/search")}${nextQuery}` : "#"}
              aria-disabled={filters.page >= totalPages}
              tabIndex={filters.page >= totalPages ? -1 : undefined}
              className="flex items-center gap-1"
            >
              <span>{t("common.next")}</span>
              <ChevronRight className="size-4" />
            </Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
