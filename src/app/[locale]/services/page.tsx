import Link from "next/link";
import { Wrench } from "lucide-react";

import { ProviderCard } from "@/components/provider-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/card";
import { searchProviders, isOpenNow } from "@/lib/db/providers";
import { getI18n } from "@/lib/i18n/server";
import {
  parseProviderFilters,
  providerFiltersToQuery,
  type RawSearchParams,
} from "@/lib/search";
import { SERVICE_CATEGORIES } from "@/lib/taxonomy";
import type { Locale } from "@/lib/types";

/**
 * The services directory. Filters live in the URL like the homes search, so a
 * filtered view is a shareable link. Open-now and distance sorting happen in
 * the worker, inside `searchProviders`.
 */
export default async function ServicesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<RawSearchParams>;
}) {
  const { t, href, locale } = await getI18n(params);
  const filters = parseProviderFilters(await searchParams);

  const result = await searchProviders(filters, locale).catch(() => ({
    providers: [],
    total: 0,
    page: 1,
    pageSize: 30,
  }));

  const totalPages = Math.ceil(result.total / result.pageSize);

  return (
    <div className="container py-8 sm:py-12 space-y-8">
      <div className="max-w-2xl">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {t("services.title")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          {t("services.body")}
        </p>
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2">
        <Link href={href("/services")}>
          <Badge
            variant={!filters.category ? "default" : "outline"}
            className="px-3.5 py-1.5 cursor-pointer"
          >
            {t("services.allCategories")}
          </Badge>
        </Link>
        {SERVICE_CATEGORIES.map((category) => (
          <Link
            key={category.key}
            href={href(`/services${providerFiltersToQuery({ ...filters, category: category.key, page: 1 })}`)}
          >
            <Badge
              variant={filters.category === category.key ? "default" : "outline"}
              className="px-3.5 py-1.5 cursor-pointer"
            >
              {locale === "am" ? category.am : category.en}
            </Badge>
          </Link>
        ))}
      </div>

      {/* Quick toggles */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "openNow", label: t("services.openNow"), on: filters.openNow },
          { key: "delivery", label: t("services.delivery"), on: filters.delivery },
          { key: "emergency", label: t("services.emergency"), on: filters.emergency },
          { key: "verified", label: t("common.verified"), on: filters.verifiedOnly },
        ].map((toggle) => {
          const next = { ...filters, page: 1 } as Record<string, unknown>;
          if (toggle.key === "openNow") next.openNow = !toggle.on;
          if (toggle.key === "delivery") next.delivery = !toggle.on;
          if (toggle.key === "emergency") next.emergency = !toggle.on;
          if (toggle.key === "verified") next.verifiedOnly = !toggle.on;
          return (
            <Link key={toggle.key} href={href(`/services${providerFiltersToQuery(next)}`)}>
              <Badge
                variant={toggle.on ? "verified" : "secondary"}
                className="px-3.5 py-1.5 cursor-pointer"
              >
                {toggle.label}
              </Badge>
            </Link>
          );
        })}
      </div>

      <p className="text-sm text-muted-foreground">
        {t("services.count", { count: result.total })}
      </p>

      {result.providers.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {result.providers.map((provider) => (
            <ProviderCard key={provider.id} provider={provider} isOpen={isOpenNow(provider)} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
          <div className="grid size-14 place-items-center rounded-2xl bg-muted text-muted-foreground mb-4">
            <Wrench className="size-7" aria-hidden />
          </div>
          <h3 className="font-display text-lg font-semibold text-foreground">
            {t("services.empty")}
          </h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {t("services.emptyBody")}
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-2 pt-6 border-t border-border">
          {filters.page > 1 ? (
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link href={href(`/services${providerFiltersToQuery({ ...filters, page: filters.page - 1 })}`)}>
                {t("common.back")}
              </Link>
            </Button>
          ) : null}
          <span className="px-4 text-xs font-medium text-muted-foreground">
            {filters.page} / {totalPages}
          </span>
          {filters.page < totalPages ? (
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link href={href(`/services${providerFiltersToQuery({ ...filters, page: filters.page + 1 })}`)}>
                {t("common.next")}
              </Link>
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
