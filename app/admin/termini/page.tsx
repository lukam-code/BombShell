"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { BookingModal } from "@/components/admin/BookingModal";
import { NewBookingModal } from "@/components/admin/NewBookingModal";
import { TimeGrid } from "@/components/admin/TimeGrid";
import { Empty, ErrorNote, PageHeader, SmallButton, Spinner, StatusBadge, inputCls, labelCls } from "@/components/admin/ui";
import { cn } from "@/lib/cn";
import { BOOKING_SELECT, errorMessage, fetchBookings, shiftYmd, todayInBelgrade, weekStartYmd } from "@/lib/adminData";
import { formatPhoneLocal } from "@/lib/phone";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { capitalize, formatBelgrade, formatTime, formatYmdLong } from "@/lib/time";
import { STATUS_LABELS, type Booking, type BookingStatus } from "@/lib/types";

type View = "dan" | "nedelja" | "lista";

function TerminiInner() {
  const params = useSearchParams();
  const router = useRouter();
  const today = todayInBelgrade();
  const view = (params.get("prikaz") as View) || "dan";
  const date = params.get("datum") || today;
  const [status, setStatus] = useState<BookingStatus | "all" | "active">((params.get("status") as BookingStatus) || "all");
  const [from, setFrom] = useState(params.get("od") || today);
  const [to, setTo] = useState(params.get("do") || shiftYmd(today, 30));
  const [showCancelled, setShowCancelled] = useState(false);
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [creating, setCreating] = useState(false);

  const days = useMemo(() => {
    if (view === "dan") return [date];
    const ws = weekStartYmd(date);
    return Array.from({ length: 7 }, (_, i) => shiftYmd(ws, i));
  }, [view, date]);

  const setParam = useCallback(
    (next: Record<string, string>) => {
      const p = new URLSearchParams(params.toString());
      Object.entries(next).forEach(([k, v]) => p.set(k, v));
      p.delete("id");
      router.replace(`/admin/termini?${p.toString()}`);
    },
    [params, router],
  );

  const load = useCallback(async () => {
    setError(null);
    try {
      const list =
        view === "lista"
          ? await fetchBookings({ fromYmd: from, toYmd: shiftYmd(to, 1), status })
          : await fetchBookings({ fromYmd: days[0], toYmd: shiftYmd(days[days.length - 1], 1), status: "all" });
      setBookings(list);
    } catch (e) {
      setError(errorMessage(e));
      setBookings([]);
    }
  }, [view, from, to, status, days]);

  useEffect(() => {
    load();
  }, [load]);

  // Otvaranje termina iz email linka (?id=...)
  const idParam = params.get("id");
  useEffect(() => {
    if (!idParam) return;
    getBrowserSupabase()
      .from("bookings")
      .select(BOOKING_SELECT)
      .eq("id", idParam)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setSelected(data as Booking);
          const ymd = formatBelgrade((data as Booking).start_time, "yyyy-MM-dd");
          if (ymd !== date) setParam({ datum: ymd, prikaz: "dan" });
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idParam]);

  const step = view === "dan" ? 1 : 7;
  const title =
    view === "dan"
      ? capitalize(formatYmdLong(date))
      : view === "nedelja"
        ? `Nedelja ${formatBelgrade(`${days[0]}T12:00:00Z`, "d. MMM")} – ${formatBelgrade(`${days[6]}T12:00:00Z`, "d. MMM yyyy.")}`
        : "Lista termina";

  return (
    <div>
      <PageHeader
        title="Termini"
        actions={
          <SmallButton tone="primary" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" aria-hidden /> Novi termin
          </SmallButton>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-full border border-rose-light bg-white p-1" role="group" aria-label="Prikaz">
          {(["dan", "nedelja", "lista"] as View[]).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setParam({ prikaz: v })}
              className={cn("rounded-full px-4 py-1.5 text-sm font-semibold capitalize", view === v ? "bg-rose-deep text-white" : "text-ink hover:bg-rose-50")}
            >
              {v === "dan" ? "Dan" : v === "nedelja" ? "Nedelja" : "Lista"}
            </button>
          ))}
        </div>
        {view !== "lista" && (
          <div className="flex items-center gap-1">
            <SmallButton aria-label="Prethodno" onClick={() => setParam({ datum: shiftYmd(date, -step) })}>
              <ChevronLeft className="h-4 w-4" />
            </SmallButton>
            <SmallButton onClick={() => setParam({ datum: today })}>Danas</SmallButton>
            <SmallButton aria-label="Sledeće" onClick={() => setParam({ datum: shiftYmd(date, step) })}>
              <ChevronRight className="h-4 w-4" />
            </SmallButton>
            <input type="date" aria-label="Izaberi datum" className={cn(inputCls, "w-auto py-1.5")} value={date} onChange={(e) => e.target.value && setParam({ datum: e.target.value })} />
          </div>
        )}
      </div>

      <h2 className="mb-3 font-serif text-xl">{title}</h2>
      <ErrorNote>{error}</ErrorNote>

      {view === "lista" ? (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 rounded-2xl border border-rose-light bg-white p-4 sm:grid-cols-4">
            <div>
              <label className={labelCls} htmlFor="f-status">Status</label>
              <select id="f-status" className={inputCls} value={status} onChange={(e) => setStatus(e.target.value as BookingStatus | "all" | "active")}>
                <option value="all">Svi</option>
                <option value="active">Aktivni (na čekanju + potvrđeni)</option>
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="f-od">Od</label>
              <input id="f-od" type="date" className={inputCls} value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <label className={labelCls} htmlFor="f-do">Do</label>
              <input id="f-do" type="date" className={inputCls} value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div className="flex items-end">
              <SmallButton className="w-full" onClick={() => { setFrom(shiftYmd(today, -30)); setTo(today); }}>Poslednjih 30 dana</SmallButton>
            </div>
          </div>
          {bookings === null ? (
            <Spinner />
          ) : bookings.length === 0 ? (
            <Empty>Nema termina za izabrane filtere.</Empty>
          ) : (
            <ul className="space-y-2">
              {bookings.map((b) => (
                <li key={b.id}>
                  <button type="button" onClick={() => setSelected(b)} className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl border border-rose-light bg-white p-4 text-left shadow-card hover:border-rose">
                    <span className="w-full text-sm font-semibold sm:w-44">
                      {capitalize(formatBelgrade(b.start_time, "EEE d.M."))} {formatTime(b.start_time)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{b.customer_name}</span>
                      <span className="block truncate text-xs text-ink-soft">{b.services?.name} · {formatPhoneLocal(b.customer_phone)}</span>
                    </span>
                    <StatusBadge status={b.status} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {bookings && bookings.length > 0 && <p className="mt-3 text-xs text-ink-soft">Ukupno: {bookings.length}</p>}
        </>
      ) : (
        <>
          <label className="mb-3 flex items-center gap-2 text-sm text-ink-soft">
            <input type="checkbox" className="h-4 w-4 accent-rose-deep" checked={showCancelled} onChange={(e) => setShowCancelled(e.target.checked)} />
            Prikaži otkazane
          </label>
          {bookings === null ? <Spinner /> : <TimeGrid days={days} bookings={bookings} onSelect={setSelected} showCancelled={showCancelled} />}
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-ink-soft">
            {(["pending", "confirmed", "completed", "no_show"] as BookingStatus[]).map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5">
                <StatusBadge status={s} />
              </span>
            ))}
          </div>
        </>
      )}

      <BookingModal booking={selected} onClose={() => setSelected(null)} onChanged={load} />
      <NewBookingModal open={creating} onClose={() => setCreating(false)} onCreated={load} defaultDate={view === "lista" ? today : date} />
    </div>
  );
}

export default function TerminiPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <TerminiInner />
    </Suspense>
  );
}
