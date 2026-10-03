import { createClient } from "npm:@supabase/supabase-js@2";
import type { Env } from "./env.ts";
import type { BookingRow, Db, LogEntry, ReviewRow } from "./types.ts";

const BOOKING_SELECT = "*, services(name, duration_minutes, price_rsd)";

export function createDb(env: Env): Db {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY nisu dostupni u Edge Function okruženju.");
  }
  const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return {
    async getBooking(id) {
      const { data, error } = await sb.from("bookings").select(BOOKING_SELECT).eq("id", id).maybeSingle();
      if (error) throw error;
      return data as BookingRow | null;
    },
    async getReview(id) {
      const { data, error } = await sb.from("reviews").select("id, customer_name, rating, text, created_at, services(name)").eq("id", id).maybeSingle();
      if (error) throw error;
      return data as ReviewRow | null;
    },
    async claimDueReminders() {
      const { data, error } = await sb.rpc("claim_due_reminders");
      if (error) throw error;
      const rows = (data ?? []) as BookingRow[];
      if (rows.length === 0) return rows;
      // dopuni nazive usluga
      const { data: services } = await sb.from("services").select("id, name, duration_minutes, price_rsd").in("id", [...new Set(rows.map((r) => r.service_id))]);
      const byId = new Map((services ?? []).map((s: { id: string }) => [s.id, s]));
      return rows.map((r) => ({ ...r, services: (byId.get(r.service_id) as BookingRow["services"]) ?? null }));
    },
    async log(entry: LogEntry) {
      const { error } = await sb.from("notification_log").insert({ ...entry, error: entry.error?.slice(0, 1000) ?? null });
      if (error) console.error("Upis u notification_log nije uspeo:", error.message);
    },
  };
}
