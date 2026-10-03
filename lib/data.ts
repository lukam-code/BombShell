import { getPublicSupabase } from "./supabase/public";
import type { CategoryWithServices, PublicReview, ReviewsSummary } from "./types";

export async function getCategoriesWithServices(): Promise<CategoryWithServices[] | null> {
  const sb = getPublicSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from("service_categories")
    .select("id, name, slug, icon, sort_order, services(id, category_id, name, description, duration_minutes, price_rsd, is_active, sort_order)")
    .order("sort_order")
    .order("sort_order", { referencedTable: "services" });
  if (error) {
    console.error("Greška pri učitavanju usluga:", error.message);
    return null;
  }
  return (data as CategoryWithServices[])
    .map((c) => ({ ...c, services: (c.services ?? []).filter((s) => s.is_active) }))
    .filter((c) => c.services.length > 0);
}

export async function getApprovedReviews(): Promise<{ reviews: PublicReview[]; summary: ReviewsSummary }> {
  const empty = { reviews: [], summary: { average: 0, count: 0 } };
  const sb = getPublicSupabase();
  if (!sb) return empty;
  const { data, error } = await sb
    .from("reviews")
    .select("id, display_name, rating, text, service_id, created_at, services(name)")
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) {
    console.error("Greška pri učitavanju recenzija:", error.message);
    return empty;
  }
  const reviews = (data ?? []) as unknown as PublicReview[];
  // Prosek i broj računa baza nad svim odobrenim recenzijama (ne samo nad prikazanim).
  const { data: stats } = await sb.rpc("get_review_stats").single<{ average: number | null; count: number }>();
  const count = stats?.count ?? reviews.length;
  const average = stats?.average ?? (count ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : 0);
  return { reviews, summary: { average: Number(average) || 0, count: Number(count) || 0 } };
}
