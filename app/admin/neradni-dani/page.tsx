"use client";

import { Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Empty, ErrorNote, PageHeader, Panel, SmallButton, Spinner, inputCls, labelCls } from "@/components/admin/ui";
import { errorMessage, rangeUtc, shiftYmd, todayInBelgrade } from "@/lib/adminData";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { capitalize, formatYmdLong } from "@/lib/time";
import type { BlockedDate } from "@/lib/types";

export default function BlockedDatesPage() {
  const today = todayInBelgrade();
  const [list, setList] = useState<BlockedDate[] | null>(null);
  const [date, setDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error: err } = await getBrowserSupabase().from("blocked_dates").select("*").gte("date", shiftYmd(today, -30)).order("date");
    if (err) setError(errorMessage(err));
    setList((data ?? []) as BlockedDate[]);
  }, [today]);

  useEffect(() => {
    load();
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setWarning(null);
    if (!date) return setError("Izaberite datum.");
    const end = toDate && toDate > date ? toDate : date;
    const dates: string[] = [];
    for (let d = date; d <= end && dates.length < 60; d = shiftYmd(d, 1)) dates.push(d);
    const sb = getBrowserSupabase();
    const { error: err } = await sb.from("blocked_dates").upsert(
      dates.map((d) => ({ date: d, reason: reason.trim() || null })),
      { onConflict: "date" },
    );
    if (err) return setError(errorMessage(err));
    // Upozorenje ako već postoje termini tih dana
    const { from, to } = rangeUtc(date, shiftYmd(end, 1));
    const { count } = await sb.from("bookings").select("id", { count: "exact", head: true }).gte("start_time", from).lt("start_time", to).in("status", ["pending", "confirmed"]);
    if (count) setWarning(`Pažnja: u izabranom periodu već postoji ${count} aktivnih termina. Otkažite ih ili ih pomerite ručno (Termini).`);
    setDate("");
    setToDate("");
    setReason("");
    load();
  }

  async function remove(id: number) {
    const { error: err } = await getBrowserSupabase().from("blocked_dates").delete().eq("id", id);
    if (err) setError(errorMessage(err));
    load();
  }

  return (
    <div>
      <PageHeader title="Neradni dani" subtitle="Praznici, odmor i drugi dani kada salon ne radi – online zakazivanje je tada onemogućeno." />
      <Panel className="mb-5" title="Dodaj neradni dan">
        <form onSubmit={add} className="grid gap-3 sm:grid-cols-[1fr_1fr_2fr_auto] sm:items-end">
          <div>
            <label className={labelCls} htmlFor="bd-od">Datum (od)</label>
            <input id="bd-od" type="date" min={today} className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div>
            <label className={labelCls} htmlFor="bd-do">Do (opciono)</label>
            <input id="bd-do" type="date" min={date || today} className={inputCls} value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <div>
            <label className={labelCls} htmlFor="bd-razlog">Razlog</label>
            <input id="bd-razlog" className={inputCls} placeholder="npr. Božić, godišnji odmor" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <SmallButton tone="primary" type="submit">
            <Plus className="h-4 w-4" aria-hidden /> Dodaj
          </SmallButton>
        </form>
        <div className="mt-3 space-y-2">
          <ErrorNote>{error}</ErrorNote>
          {warning && <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">{warning}</p>}
        </div>
      </Panel>
      <Panel title="Neradni dani">
        {list === null ? (
          <Spinner />
        ) : list.length === 0 ? (
          <Empty>Nema unetih neradnih dana.</Empty>
        ) : (
          <ul className="divide-y divide-rose-light">
            {list.map((d) => (
              <li key={d.id} className={`flex items-center gap-3 py-3 ${d.date < today ? "opacity-50" : ""}`}>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{capitalize(formatYmdLong(d.date))}</span>
                  {d.reason && <span className="block text-xs text-ink-soft">{d.reason}</span>}
                </span>
                <SmallButton tone="danger" aria-label={`Ukloni ${d.date}`} onClick={() => remove(d.id)}>
                  <Trash2 className="h-4 w-4" />
                </SmallButton>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
