"use client";

import { Phone, Plus, Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { BookingModal } from "@/components/admin/BookingModal";
import { NewBookingModal } from "@/components/admin/NewBookingModal";
import { Empty, ErrorNote, PageHeader, Panel, SmallButton, Spinner, StatusBadge, inputCls } from "@/components/admin/ui";
import { BOOKING_SELECT, errorMessage, todayInBelgrade } from "@/lib/adminData";
import { formatPhoneLocal, normalizeSerbianPhoneAny } from "@/lib/phone";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { capitalize, formatBelgrade, formatTime } from "@/lib/time";
import type { Booking } from "@/lib/types";

function HistoryInner() {
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("tel") ?? "");
  const [phone, setPhone] = useState<string | null>(null);
  const [list, setList] = useState<Booking[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [creating, setCreating] = useState(false);

  const search = useCallback(async (raw: string) => {
    setError(null);
    const e164 = normalizeSerbianPhoneAny(raw);
    if (!e164) {
      setError("Unesite ispravan broj telefona.");
      return;
    }
    setPhone(e164);
    setList(null);
    const { data, error: err } = await getBrowserSupabase()
      .from("bookings")
      .select(BOOKING_SELECT)
      .eq("customer_phone", e164)
      .order("start_time", { ascending: false })
      .limit(500);
    if (err) setError(errorMessage(err));
    setList((data ?? []) as Booking[]);
  }, []);

  useEffect(() => {
    const tel = params.get("tel");
    if (tel) search(tel);
  }, [params, search]);

  const now = new Date();
  const stats = list && {
    total: list.length,
    completed: list.filter((b) => b.status === "completed").length,
    cancelled: list.filter((b) => b.status === "cancelled").length,
    cancelledByCustomer: list.filter((b) => b.status === "cancelled" && b.cancelled_by === "customer").length,
    noShow: list.filter((b) => b.status === "no_show").length,
    upcoming: list.filter((b) => ["pending", "confirmed"].includes(b.status) && new Date(b.start_time) > now).length,
  };
  const name = list?.[0]?.customer_name;

  return (
    <div>
      <PageHeader title="Klijentkinje" subtitle="Istorija dolazaka po broju telefona" />
      <form
        className="mb-6 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          search(query);
        }}
      >
        <input className={inputCls} type="tel" placeholder="Broj telefona, npr. 065 123 4567" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Broj telefona" />
        <SmallButton tone="primary" type="submit">
          <Search className="h-4 w-4" aria-hidden /> Traži
        </SmallButton>
      </form>
      <ErrorNote>{error}</ErrorNote>

      {phone && list === null && <Spinner />}
      {phone && list && (
        <>
          <Panel
            className="mb-4"
            title={name ?? formatPhoneLocal(phone)}
            action={
              <div className="flex gap-2">
                <a href={`tel:${phone}`} className="inline-flex items-center gap-1.5 rounded-full border border-rose-light px-3 py-1.5 text-sm font-semibold hover:bg-rose-50">
                  <Phone className="h-4 w-4" aria-hidden /> {formatPhoneLocal(phone)}
                </a>
                <SmallButton onClick={() => setCreating(true)}>
                  <Plus className="h-4 w-4" aria-hidden /> Termin
                </SmallButton>
              </div>
            }
          >
            {list.length === 0 ? (
              <Empty>Nema termina za ovaj broj.</Empty>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {[
                  ["Ukupno", stats!.total],
                  ["Dolasci", stats!.completed],
                  ["Otkazivanja", stats!.cancelled],
                  ["Nedolasci", stats!.noShow],
                  ["Predstojeći", stats!.upcoming],
                ].map(([l, v]) => (
                  <div key={l} className={`rounded-xl p-3 ${l === "Nedolasci" && Number(v) > 0 ? "bg-red-50" : "bg-rose-50"}`}>
                    <p className="font-serif text-2xl">{v}</p>
                    <p className="text-xs text-ink-soft">{l}</p>
                  </div>
                ))}
              </div>
            )}
            {stats && stats.noShow >= 2 && (
              <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-800">
                Pažnja: {stats.noShow} nedolazaka bez otkazivanja. Prema politici otkazivanja salon može da odbije buduća online zakazivanja.
              </p>
            )}
          </Panel>
          {list.length > 0 && (
            <ul className="space-y-2">
              {list.map((b) => (
                <li key={b.id}>
                  <button type="button" onClick={() => setSelected(b)} className="flex w-full items-center gap-4 rounded-2xl border border-rose-light bg-white p-4 text-left hover:border-rose">
                    <span className="w-36 shrink-0 text-sm font-semibold">
                      {capitalize(formatBelgrade(b.start_time, "EEE d.M.yyyy."))}
                      <span className="block text-xs font-normal text-ink-soft">{formatTime(b.start_time)}</span>
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm">{b.services?.name}</span>
                    <StatusBadge status={b.status} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      <BookingModal booking={selected} onClose={() => setSelected(null)} onChanged={() => phone && search(phone)} />
      <NewBookingModal
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={() => phone && search(phone)}
        defaultDate={todayInBelgrade()}
        prefill={{ name, phone: phone ? formatPhoneLocal(phone) : undefined }}
      />
    </div>
  );
}

export default function ClientsPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <HistoryInner />
    </Suspense>
  );
}
