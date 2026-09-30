import Link from "next/link";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  Compass,
  LayoutDashboard,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  Star,
  Users,
  Wrench,
  Zap,
} from "lucide-react";

import { requireAdmin } from "@/lib/auth";
import {
  getAdminBookings,
  getAdminListings,
  getAdminProviders,
  getAdminStats,
  getAdminUsers,
} from "@/lib/db/admin";
import { getI18n } from "@/lib/i18n/server";
import { formatDate, formatMoney } from "@/lib/utils";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/avatar";
import type { Locale } from "@/lib/types";
import {
  ListingStatusSelect,
  ListingVerifyButton,
  ProviderStatusButtons,
  ProviderVerifyButton,
  UserRoleButtons,
} from "./admin-controls";

export default async function AdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { t, href, locale } = await getI18n(params);
  const { tab = "overview" } = await searchParams;

  // Gate access - will redirect if not admin
  const user = await requireAdmin(locale);

  const stats = await getAdminStats();

  let listings: Awaited<ReturnType<typeof getAdminListings>> = [];
  let providers: Awaited<ReturnType<typeof getAdminProviders>> = [];
  let users: Awaited<ReturnType<typeof getAdminUsers>> = [];
  let bookings: Awaited<ReturnType<typeof getAdminBookings>> = [];

  if (tab === "listings") {
    listings = await getAdminListings();
  } else if (tab === "providers") {
    providers = await getAdminProviders();
  } else if (tab === "users") {
    users = await getAdminUsers();
  } else if (tab === "bookings") {
    bookings = await getAdminBookings();
  } else {
    // Overview tab: fetch recent bookings and pending counts
    bookings = (await getAdminBookings()).slice(0, 5);
  }

  const tabs = [
    { key: "overview", label: t("admin.overview"), count: null },
    { key: "listings", label: t("admin.listings"), count: stats.totalListings },
    { key: "providers", label: t("admin.providers"), count: stats.totalProviders },
    { key: "users", label: t("admin.users"), count: stats.totalUsers },
    { key: "bookings", label: t("admin.bookings"), count: stats.totalBookings },
  ];

  return (
    <div className="container max-w-6xl py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="verified" className="gap-1">
              <ShieldCheck className="size-3.5" />
              <span>{t("nav.admin")}</span>
            </Badge>
          </div>
          <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("admin.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kiray platform moderation and system administration
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: t("admin.statUsers"), value: stats.totalUsers, icon: Users },
          { label: t("admin.statHosts"), value: stats.totalHosts, icon: ShieldCheck },
          { label: t("admin.statListings"), value: stats.liveListings, icon: Building2 },
          { label: t("admin.statProviders"), value: stats.totalProviders, icon: Wrench },
          { label: t("admin.statBookings"), value: stats.totalBookings, icon: CalendarDays },
          { label: t("admin.statReviews"), value: stats.totalReviews, icon: Star },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="p-4 text-center">
              <item.icon className="mx-auto size-5 text-primary" aria-hidden />
              <p className="mt-2 font-display text-xl font-bold text-foreground tnum">
                {item.value}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{item.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        {tabs.map((item) => {
          const isActive = tab === item.key;
          return (
            <Link
              key={item.key}
              href={href(`/admin${item.key === "overview" ? "" : `?tab=${item.key}`}`)}
            >
              <Badge
                variant={isActive ? "default" : "outline"}
                className="px-3.5 py-1.5 text-xs cursor-pointer gap-1.5 transition-colors"
              >
                <span>{item.label}</span>
                {item.count !== null ? (
                  <span className="opacity-70 tnum">({item.count})</span>
                ) : null}
              </Badge>
            </Link>
          );
        })}
      </div>

      {/* Tab Content: Overview */}
      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Listing Pipeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Published & Active</span>
                  <span className="font-semibold text-primary">{stats.liveListings}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Drafts</span>
                  <span className="font-medium text-muted-foreground">{stats.draftListings}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Listings</span>
                  <span className="font-semibold">{stats.totalListings}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Community Services</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Published Services</span>
                  <span className="font-semibold text-primary">{stats.totalProviders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pending Approvals</span>
                  <span className="font-semibold text-amber-600">{stats.draftProviders}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Rental Requests</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pending Requests</span>
                  <span className="font-semibold text-accent">{stats.pendingBookings}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">All Bookings</span>
                  <span className="font-semibold">{stats.totalBookings}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Bookings List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Recent Rental Requests</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href={href("/admin?tab=bookings")}>{t("common.seeAll")}</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No recent bookings recorded.</p>
              ) : (
                <div className="divide-y divide-border">
                  {bookings.map((b) => (
                    <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">{b.listing_title}</p>
                        <p className="text-xs text-muted-foreground">
                          {b.guest_name} → {b.host_name} · {formatDate(b.start_date)} to {formatDate(b.end_date)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold tnum">{formatMoney(b.total, b.currency)}</span>
                        <Badge variant={b.status === "confirmed" ? "verified" : b.status === "pending" ? "accent" : "muted"}>
                          {b.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab Content: Listings */}
      {tab === "listings" && (
        <Card>
          <CardHeader>
            <CardTitle>{t("admin.listings")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {listings.map((item) => (
                <div key={item.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={href(`/listing/${item.id}`)}
                        className="font-semibold text-foreground hover:text-primary transition-colors"
                      >
                        {item.title_en}
                      </Link>
                      <Badge variant={item.status === "published" ? "verified" : item.status === "draft" ? "muted" : "destructive"}>
                        {item.status}
                      </Badge>
                      {item.verified ? (
                        <Badge variant="verified">
                          <CheckCircle2 className="size-3 mr-1" /> Verified
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Host: {item.host_name} ({item.host_email ?? item.host_phone ?? "N/A"}) · {item.city}, {item.subcity ?? ""} · {formatMoney(item.price, item.currency)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <ListingVerifyButton
                      listingId={item.id}
                      verified={item.verified === 1}
                      locale={locale}
                    />
                    <ListingStatusSelect
                      listingId={item.id}
                      currentStatus={item.status}
                      locale={locale}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab Content: Providers */}
      {tab === "providers" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("admin.providers")}</CardTitle>
            <Button asChild size="sm" className="rounded-full">
              <Link href={href("/services/add")}>+ Add Service</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {providers.map((item) => (
                <div key={item.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={href(`/services/${item.id}`)}
                        className="font-semibold text-foreground hover:text-primary transition-colors"
                      >
                        {item.name_en}
                      </Link>
                      <Badge variant="outline">{item.category}</Badge>
                      <Badge variant={item.status === "published" ? "verified" : "muted"}>
                        {item.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {[item.neighborhood, item.subcity, item.city].filter(Boolean).join(", ")} · Phone: {item.phone ?? "N/A"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <ProviderVerifyButton
                      providerId={item.id}
                      verified={item.verified === 1}
                      locale={locale}
                    />
                    <ProviderStatusButtons
                      providerId={item.id}
                      currentStatus={item.status}
                      locale={locale}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab Content: Users */}
      {tab === "users" && (
        <Card>
          <CardHeader>
            <CardTitle>{t("admin.users")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {users.map((item) => (
                <div key={item.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <UserAvatar name={item.full_name} className="size-10 shrink-0" />
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground truncate">{item.full_name}</span>
                        {item.is_admin ? <Badge variant="accent">Admin</Badge> : null}
                        {item.is_host ? <Badge variant="verified">Host</Badge> : null}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.email ?? item.phone ?? "No contact"} · Member since {formatDate(item.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <UserRoleButtons
                      userId={item.id}
                      isHost={item.is_host === 1}
                      isAdmin={item.is_admin === 1}
                      locale={locale}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab Content: Bookings */}
      {tab === "bookings" && (
        <Card>
          <CardHeader>
            <CardTitle>{t("admin.bookings")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {bookings.map((item) => (
                <div key={item.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-primary">{item.code}</span>
                      <Link href={href(`/listing/${item.listing_id}`)} className="font-semibold text-sm hover:underline">
                        {item.listing_title}
                      </Link>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Guest: {item.guest_name} · Host: {item.host_name} · Dates: {formatDate(item.start_date)} to {formatDate(item.end_date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-sm tnum">{formatMoney(item.total, item.currency)}</span>
                    <Badge variant={item.status === "confirmed" ? "verified" : item.status === "pending" ? "accent" : "muted"}>
                      {item.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
