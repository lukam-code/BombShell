"use client";

import { addDays, startOfWeek } from "date-fns";
import { getBrowserSupabase } from "./supabase/client";
import { belgradeToUtc, dateToYmd, todayInBelgrade, ymdToDate } from "./time";
import type { Booking, BookingStatus, CategoryWithServices } from "./types";

export const BOOKING_SELECT = "*, services(name, duration_minutes, price_rsd)";

/** [od, do) u UTC za opseg lokalnih datuma u Beogradu */
export function rangeUtc(fromYmd: string, toYmdExclusive: string) {
  return { from: belgradeToUtc(fromYmd, "00:00").toISOString(), to: belgradeToUtc(toYmdExclusive, "00:00").toISOString() };
}

export function weekStartYmd(ymd: string) {
  return dateToYmd(startOfWeek(ymdToDate(ymd), { weekStartsOn: 1 }));
}

export function shiftYmd(ymd: string, days: number) {
  return dateToYmd(addDays(ymdToDate(ymd), days));
}

export { todayInBelgrade };

export async function fetchBookings(opts: { fromYmd: string; toYmd: string; status?: BookingStatus | "active" | "all" }) {
  const { from, to } = rangeUtc(opts.fromYmd, opts.toYmd);
  let q = getBrowserSupabase().from("bookings").select(BOOKING_SELECT).gte("start_time", from).lt("start_time", to).order("start_time");
  if (opts.status === "active") q = q.in("status", ["pending", "confirmed"]);
  else if (opts.status && opts.status !== "all") q = q.eq("status", opts.status);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Booking[];
}

export async function updateBookingStatus(id: string, status: BookingStatus) {
  const { error } = await getBrowserSupabase().from("bookings").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function fetchAllServices() {
  const { data, error } = await getBrowserSupabase()
    .from("service_categories")
    .select("id, name, slug, icon, sort_order, services(id, category_id, name, description, duration_minutes, price_rsd, is_active, sort_order)")
    .order("sort_order")
    .order("sort_order", { referencedTable: "services" });
  if (error) throw error;
  return (data ?? []) as CategoryWithServices[];
}

export function errorMessage(e: unknown) {
  if (e && typeof e === "object" && "message" in e) return String((e as { message: string }).message);
  return "Došlo je do greške.";
}
