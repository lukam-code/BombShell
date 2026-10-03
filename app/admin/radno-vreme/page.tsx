"use client";

import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import { ErrorNote, PageHeader, Panel, SmallButton, Spinner, inputCls } from "@/components/admin/ui";
import { errorMessage } from "@/lib/adminData";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { WorkingHours } from "@/lib/types";

const DAYS = ["Nedelja", "Ponedeljak", "Utorak", "Sreda", "Četvrtak", "Petak", "Subota"];
const ORDER = [1, 2, 3, 4, 5, 6, 0];

export default function WorkingHoursPage() {
  const [rows, setRows] = useState<WorkingHours[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getBrowserSupabase()
      .from("working_hours")
      .select("*")
      .then(({ data, error: err }) => {
        if (err) setError(errorMessage(err));
        setRows(((data ?? []) as WorkingHours[]).map((r) => ({ ...r, open_time: r.open_time.slice(0, 5), close_time: r.close_time.slice(0, 5) })));
      });
  }, []);

  const update = (dow: number, patch: Partial<WorkingHours>) => {
    setSaved(false);
    setRows((rs) => rs!.map((r) => (r.day_of_week === dow ? { ...r, ...patch } : r)));
  };

  async function save() {
    if (!rows) return;
    const bad = rows.find((r) => !r.is_closed && r.close_time <= r.open_time);
    if (bad) return setError(`${DAYS[bad.day_of_week]}: kraj radnog vremena mora biti posle početka.`);
    setBusy(true);
    setError(null);
    for (const r of rows) {
      const { error: err } = await getBrowserSupabase()
        .from("working_hours")
        .update({ open_time: r.open_time, close_time: r.close_time, is_closed: r.is_closed })
        .eq("day_of_week", r.day_of_week);
      if (err) {
        setBusy(false);
        return setError(errorMessage(err));
      }
    }
    setBusy(false);
    setSaved(true);
  }

  return (
    <div>
      <PageHeader title="Radno vreme" subtitle="Online termini se nude samo u okviru radnog vremena. Za praznike i odmor koristite „Neradni dani”." />
      <Panel>
        {rows === null ? (
          <Spinner />
        ) : (
          <div className="space-y-2">
            {ORDER.map((dow) => {
              const r = rows.find((x) => x.day_of_week === dow);
              if (!r) return null;
              return (
                <div key={dow} className="flex flex-wrap items-center gap-3 rounded-xl border border-rose-light p-3">
                  <span className="w-28 font-medium">{DAYS[dow]}</span>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="h-4 w-4 accent-rose-deep" checked={!r.is_closed} onChange={(e) => update(dow, { is_closed: !e.target.checked })} />
                    Radi
                  </label>
                  {!r.is_closed ? (
                    <div className="flex items-center gap-2">
                      <input type="time" step={900} aria-label={`${DAYS[dow]} od`} className={`${inputCls} w-32`} value={r.open_time} onChange={(e) => update(dow, { open_time: e.target.value })} />
                      <span>–</span>
                      <input type="time" step={900} aria-label={`${DAYS[dow]} do`} className={`${inputCls} w-32`} value={r.close_time} onChange={(e) => update(dow, { close_time: e.target.value })} />
                    </div>
                  ) : (
                    <span className="text-sm text-ink-soft">Zatvoreno</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <div className="mt-4 flex items-center gap-3">
          <SmallButton tone="primary" onClick={save} disabled={busy || !rows}>
            <Save className="h-4 w-4" aria-hidden /> {busy ? "Čuvam…" : "Sačuvaj"}
          </SmallButton>
          {saved && <span className="text-sm text-emerald-700" role="status">Sačuvano ✓</span>}
        </div>
        <div className="mt-3">
          <ErrorNote>{error}</ErrorNote>
        </div>
        <p className="mt-4 text-xs text-ink-soft">
          Napomena: prikaz radnog vremena na sajtu (kontakt sekcija, footer, SEO) se menja u fajlu <code>lib/siteConfig.ts</code>.
        </p>
      </Panel>
    </div>
  );
}
