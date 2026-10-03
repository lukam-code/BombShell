"use client";

import { AlertTriangle, CalendarCheck, CalendarDays, Clock, MessageSquareHeart, Plus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { BookingModal } from "@/components/admin/BookingModal";
import { NewBookingModal } from "@/components/admin/NewBookingModal";
import { Empty, ErrorNote, PageHeader, Panel, SmallButton, Spinner, StatusBadge } from "@/components/admin/ui";
import { errorMessage, fetchBookings, rangeUtc, shiftYmd, todayInBelgrade, weekStartYmd } from "@/lib/adminData";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { capitalize, formatTime, formatYmdLong } from "@/lib/time";
import type { Booking } from "@/lib/types";

export default function DashboardPage() {
  const today = todayInBelgrade();
  const [todayList, setTodayList] = useState<Booking[] | null>(null);
  const [stats, setStats] = useState({ week: 0, pendingReviews: 0, toConfirm: 0, failed: 0 });
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      const sb = getBrowserSupabase();
      const ws = weekStartYmd(today);
      const week = rangeUtc(ws, shiftYmd(ws, 7));
      const since = new Date(Date.now() - 7 * 86400_000).toISOString();
      const [list, weekCount, reviews, toConfirm, failed] = await Promise.all([
        fetchBookings({ fromYmd: today, toYmd: shiftYmd(today, 1), status: "all" }),
        sb.from("bookings").select("id", { count: "exact", head: true }).gte("start_time", week.from).lt("start_time", week.to).neq("status", "cancelled"),
        sb.from("reviews").select("id", { count: "exact", head: true }).eq("is_approved", false),
        sb.from("bookings").select("id", { count: "exact", head: true }).eq("status", "pending").gte("start_time", new Date().toISOString()),
        sb.from("notification_log").select("id", { count: "exact", head: true }).eq("status", "failed").gte("created_at", since),
      ]);
      setTodayList(list);
      setStats({ week: weekCount.count ?? 0, pendingReviews: reviews.count ?? 0, toConfirm: toConfirm.count ?? 0, failed: failed.count ?? 0 });
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [today]);

  useEffect(() => {
    load();
  }, [load]);

  const cards = [
    { label: "Danas", value: todayList?.filter((b) => b.status !== "cancelled").length ?? "–", icon: CalendarCheck, href: "/admin/termini" },
    { label: "Ove nedelje", value: stats.week, icon: CalendarDays, href: "/admin/termini?prikaz=nedelja" },
    { label: "Čeka potvrdu", value: stats.toConfirm, icon: Clock, href: "/admin/termini?prikaz=lista&status=pending" },
    { label: "Recenzije na čekanju", value: stats.pendingReviews, icon: MessageSquareHeart, href: "/admin/recenzije" },
  ];

  return (
    <div>
      <PageHeader
        title="Kontrolna tabla"
        subtitle={capitalize(formatYmdLong(today))}
        actions={
          <SmallButton tone="primary" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" aria-hidden /> Novi termin
          </SmallButton>
        }
      />
      <ErrorNote>{error}</ErrorNote>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href} className="rounded-2xl border border-rose-light bg-white p-4 shadow-card transition-shadow hover:shadow-soft">
            <Icon className="h-5 w-5 text-rose-deeper" aria-hidden />
            <p className="mt-3 font-serif text-3xl">{value}</p>
            <p className="text-xs font-medium text-ink-soft">{label}</p>
          </Link>
        ))}
      </div>
      {stats.failed > 0 && (
        <Link href="/admin/obavestenja?status=failed" className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden />
          {stats.failed} neuspešnih obaveštenja u poslednjih 7 dana – pogledajte log.
        </Link>
      )}
      <Panel title="Današnji termini">
        {todayList === null ? (
          <Spinner />
        ) : todayList.length === 0 ? (
          <Empty>Danas nema zakazanih termina.</Empty>
        ) : (
          <ul className="divide-y divide-rose-light">
            {todayList.map((b) => (
              <li key={b.id}>
                <button type="button" onClick={() => setSelected(b)} className="flex w-full items-center gap-4 py-3 text-left hover:bg-rose-50">
                  <span className="w-14 shrink-0 font-semibold tabular-nums">{formatTime(b.start_time)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{b.customer_name}</span>
                    <span className="block truncate text-xs text-ink-soft">
                      {b.services?.name} · {formatTime(b.start_time)}–{formatTime(b.end_time)}
                    </span>
                  </span>
                  <StatusBadge status={b.status} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <BookingModal booking={selected} onClose={() => setSelected(null)} onChanged={load} />
      <NewBookingModal open={creating} onClose={() => setCreating(false)} onCreated={load} defaultDate={today} />
    </div>
  );
}
