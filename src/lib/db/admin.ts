import { getDB, tryGetDB } from "../cf";
import type { BookingStatus, ListingStatus, Locale } from "../types";

export interface AdminStats {
  totalUsers: number;
  totalHosts: number;
  liveListings: number;
  draftListings: number;
  totalListings: number;
  totalProviders: number;
  draftProviders: number;
  totalBookings: number;
  pendingBookings: number;
  totalReviews: number;
}

export interface AdminListingItem {
  id: string;
  title_en: string;
  title_am: string | null;
  property_type: string;
  rental_type: string;
  price: number;
  currency: string;
  city: string;
  subcity: string | null;
  neighborhood: string | null;
  status: ListingStatus;
  verified: number;
  host_id: string;
  host_name: string;
  host_email: string | null;
  host_phone: string | null;
  created_at: string;
  photo_count: number;
}

export interface AdminProviderItem {
  id: string;
  name_en: string;
  name_am: string | null;
  category: string;
  city: string;
  subcity: string | null;
  neighborhood: string | null;
  phone: string | null;
  status: string;
  verified: number;
  rating_avg: number;
  rating_count: number;
  owner_id: string | null;
  owner_name: string | null;
  created_at: string;
}

export interface AdminUserItem {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  is_host: number;
  is_admin: number;
  phone_verified: number;
  email_verified: number;
  created_at: string;
  listing_count: number;
}

export interface AdminBookingItem {
  id: string;
  code: string;
  listing_id: string;
  listing_title: string;
  guest_id: string;
  guest_name: string;
  host_id: string;
  host_name: string;
  start_date: string;
  end_date: string;
  total: number;
  currency: string;
  status: BookingStatus;
  created_at: string;
}

export async function getAdminStats(): Promise<AdminStats> {
  const db = await tryGetDB();
  if (!db) {
    return {
      totalUsers: 0,
      totalHosts: 0,
      liveListings: 0,
      draftListings: 0,
      totalListings: 0,
      totalProviders: 0,
      draftProviders: 0,
      totalBookings: 0,
      pendingBookings: 0,
      totalReviews: 0,
    };
  }

  const [
    users,
    hosts,
    liveListings,
    draftListings,
    totalListings,
    totalProviders,
    draftProviders,
    totalBookings,
    pendingBookings,
    totalReviews,
  ] = await Promise.all([
    db.prepare("SELECT COUNT(*) as c FROM users").first<{ c: number }>(),
    db.prepare("SELECT COUNT(*) as c FROM users WHERE is_host = 1").first<{ c: number }>(),
    db.prepare("SELECT COUNT(*) as c FROM listings WHERE status = 'published'").first<{ c: number }>(),
    db.prepare("SELECT COUNT(*) as c FROM listings WHERE status = 'draft'").first<{ c: number }>(),
    db.prepare("SELECT COUNT(*) as c FROM listings").first<{ c: number }>(),
    db.prepare("SELECT COUNT(*) as c FROM providers").first<{ c: number }>(),
    db.prepare("SELECT COUNT(*) as c FROM providers WHERE status = 'draft'").first<{ c: number }>(),
    db.prepare("SELECT COUNT(*) as c FROM bookings").first<{ c: number }>(),
    db.prepare("SELECT COUNT(*) as c FROM bookings WHERE status = 'pending'").first<{ c: number }>(),
    db.prepare("SELECT COUNT(*) as c FROM reviews").first<{ c: number }>(),
  ]);

  return {
    totalUsers: users?.c ?? 0,
    totalHosts: hosts?.c ?? 0,
    liveListings: liveListings?.c ?? 0,
    draftListings: draftListings?.c ?? 0,
    totalListings: totalListings?.c ?? 0,
    totalProviders: totalProviders?.c ?? 0,
    draftProviders: draftProviders?.c ?? 0,
    totalBookings: totalBookings?.c ?? 0,
    pendingBookings: pendingBookings?.c ?? 0,
    totalReviews: totalReviews?.c ?? 0,
  };
}

export async function getAdminListings(filterStatus?: string): Promise<AdminListingItem[]> {
  const db = await tryGetDB();
  if (!db) return [];

  let query = `
    SELECT l.id, l.title_en, l.title_am, l.property_type, l.rental_type, l.price,
           l.currency, l.city, l.subcity, l.neighborhood, l.status, l.verified,
           l.host_id, l.created_at,
           u.full_name AS host_name, u.email AS host_email, u.phone AS host_phone,
           (SELECT COUNT(*) FROM listing_photos lp WHERE lp.listing_id = l.id) AS photo_count
      FROM listings l
      JOIN users u ON u.id = l.host_id
  `;
  const params: unknown[] = [];

  if (filterStatus) {
    query += " WHERE l.status = ?";
    params.push(filterStatus);
  }

  query += " ORDER BY l.created_at DESC LIMIT 100";

  const { results } = await db.prepare(query).bind(...params).all<AdminListingItem>();
  return results;
}

export async function getAdminProviders(filterStatus?: string): Promise<AdminProviderItem[]> {
  const db = await tryGetDB();
  if (!db) return [];

  let query = `
    SELECT p.id, p.name_en, p.name_am, p.category, p.city, p.subcity, p.neighborhood,
           p.phone, p.status, p.verified, p.rating_avg, p.rating_count,
           p.owner_id, p.created_at,
           u.full_name AS owner_name
      FROM providers p
      LEFT JOIN users u ON u.id = p.owner_id
  `;
  const params: unknown[] = [];

  if (filterStatus) {
    query += " WHERE p.status = ?";
    params.push(filterStatus);
  }

  query += " ORDER BY p.created_at DESC LIMIT 100";

  const { results } = await db.prepare(query).bind(...params).all<AdminProviderItem>();
  return results;
}

export async function getAdminUsers(): Promise<AdminUserItem[]> {
  const db = await tryGetDB();
  if (!db) return [];

  const { results } = await db
    .prepare(
      `SELECT u.id, u.full_name, u.email, u.phone, u.city, u.is_host, u.is_admin,
              u.phone_verified, u.email_verified, u.created_at,
              (SELECT COUNT(*) FROM listings l WHERE l.host_id = u.id) AS listing_count
         FROM users u
        ORDER BY u.created_at DESC
        LIMIT 100`,
    )
    .all<AdminUserItem>();

  return results;
}

export async function getAdminBookings(): Promise<AdminBookingItem[]> {
  const db = await tryGetDB();
  if (!db) return [];

  const { results } = await db
    .prepare(
      `SELECT b.id, b.code, b.listing_id, b.guest_id, b.host_id, b.start_date, b.end_date,
              b.total, b.currency, b.status, b.created_at,
              l.title_en AS listing_title,
              g.full_name AS guest_name,
              h.full_name AS host_name
         FROM bookings b
         JOIN listings l ON l.id = b.listing_id
         JOIN users g ON g.id = b.guest_id
         JOIN users h ON h.id = b.host_id
        ORDER BY b.created_at DESC
        LIMIT 100`,
    )
    .all<AdminBookingItem>();

  return results;
}

export async function adminSetListingVerified(id: string, verified: boolean): Promise<void> {
  const db = await getDB();
  await db
    .prepare("UPDATE listings SET verified = ?, updated_at = datetime('now') WHERE id = ?")
    .bind(verified ? 1 : 0, id)
    .run();
}

export async function adminSetListingStatus(id: string, status: ListingStatus): Promise<void> {
  const db = await getDB();
  await db
    .prepare("UPDATE listings SET status = ?, updated_at = datetime('now') WHERE id = ?")
    .bind(status, id)
    .run();
}

export async function adminSetProviderVerified(id: string, verified: boolean): Promise<void> {
  const db = await getDB();
  await db
    .prepare("UPDATE providers SET verified = ?, updated_at = datetime('now') WHERE id = ?")
    .bind(verified ? 1 : 0, id)
    .run();
}

export async function adminSetProviderStatus(id: string, status: string): Promise<void> {
  const db = await getDB();
  await db
    .prepare("UPDATE providers SET status = ?, updated_at = datetime('now') WHERE id = ?")
    .bind(status, id)
    .run();
}

export async function adminToggleUserRole(
  userId: string,
  role: "is_host" | "is_admin" | "phone_verified" | "email_verified",
  value: boolean,
): Promise<void> {
  const db = await getDB();
  await db
    .prepare(`UPDATE users SET ${role} = ?, updated_at = datetime('now') WHERE id = ?`)
    .bind(value ? 1 : 0, userId)
    .run();
}
