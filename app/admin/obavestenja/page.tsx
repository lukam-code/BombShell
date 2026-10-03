"use client";

import { RefreshCw } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { Badge, Empty, ErrorNote, PageHeader, SmallButton, Spinner, inputCls, labelCls } from "@/components/admin/ui";
import { errorMessage } from "@/lib/adminData";
import { formatPhoneLocal } from "@/lib/phone";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { formatBelgrade } from "@/lib/time";
import type { NotificationLog } from "@/lib/types";

const TYPE_LABELS: Record<string, string> = {
  confirmation: "Potvrda",
  reminder: "Podsetnik",
  cancellation: "Otkazivanje",
  salon_new: "Salonu: novi termin",
  salon_cancelled: "Salonu: otkazan",
  salon_review: "Salonu: recenzija",
};
const STATUS_TONE = { sent: "green", failed: "red", skipped: "gray" } as const;
const STATUS_LABEL = { sent: "Poslato", failed: "Neuspešno", skipped: "Preskočeno" };

type Row = NotificationLog & { bookings?: { customer_name: string } | null };

function LogInner() {
  const params = useSearchParams();
  const [status, setStatus] = useState(params.get("status") ?? "");
  const [channel, setChannel] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setRows(null);
    let q = getBrowserSupabase().from("notification_log").select("*, bookings(customer_name)").order("created_at", { ascending: false }).limit(300);
    if (status) q = q.eq("status", status);
    if (channel) q = q.eq("channel", channel);
    const { data, error: err } = await q;
    if (err) setError(errorMessage(err));
    setRows((data ?? []) as Row[]);
  }, [status, channel]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <PageHeader
        title="Log obaveštenja"
        subtitle="Status svake SMS, Viber i email poruke. „Preskočeno” znači da ključevi nisu podešeni ili klijentkinja nije želela poruke."
        actions={
          <SmallButton onClick={load}>
            <RefreshCw className="h-4 w-4" aria-hidden /> Osveži
          </SmallButton>
        }
      />
      <div className="mb-4 grid max-w-md grid-cols-2 gap-3">
        <div>
          <label className={labelCls} htmlFor="l-status">Status</label>
          <select id="l-status" className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Svi</option>
            <option value="sent">Poslato</option>
            <option value="failed">Neuspešno</option>
            <option value="skipped">Preskočeno</option>
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="l-kanal">Kanal</label>
          <select id="l-kanal" className={inputCls} value={channel} onChange={(e) => setChannel(e.target.value)}>
            <option value="">Svi</option>
            <option value="viber">Viber</option>
            <option value="sms">SMS</option>
            <option value="email">Email</option>
          </select>
        </div>
      </div>
      <ErrorNote>{error}</ErrorNote>
      {rows === null ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <Empty>Nema zapisa.</Empty>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-rose-light bg-white shadow-card">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-rose-50 text-left text-xs uppercase tracking-wider text-ink-soft">
              <tr>
                <th className="px-4 py-3">Vreme</th>
                <th className="px-4 py-3">Kanal</th>
                <th className="px-4 py-3">Tip</th>
                <th className="px-4 py-3">Primalac</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Detalji</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-light">
              {rows.map((r) => (
                <tr key={r.id} className="align-top">
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums">{formatBelgrade(r.created_at, "d.M. HH:mm:ss")}</td>
                  <td className="px-4 py-3 uppercase">{r.channel}</td>
                  <td className="px-4 py-3">{TYPE_LABELS[r.type] ?? r.type}</td>
                  <td className="px-4 py-3">
                    {r.bookings?.customer_name && <span className="block font-medium">{r.bookings.customer_name}</span>}
                    <span className="text-ink-soft">{r.recipient?.startsWith("+381") ? formatPhoneLocal(r.recipient) : r.recipient ?? "—"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                  </td>
                  <td className="max-w-xs break-words px-4 py-3 text-xs text-ink-soft">{r.error ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function NotificationLogPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <LogInner />
    </Suspense>
  );
}
