"use client";

import { CalendarDays, Clock, Mail, MessageSquare, Phone, Scissors, ShieldCheck, User, Wallet } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Input";
import { formatPhoneLocal, normalizeSerbianPhone } from "@/lib/phone";
import { siteConfig } from "@/lib/siteConfig";
import { capitalize, formatDuration, formatLongDate, formatPrice, formatTime } from "@/lib/time";
import type { Service } from "@/lib/types";
import type { CustomerForm } from "@/lib/validation";

export function SummaryList({
  service,
  startTime,
  customer,
}: {
  service: Service;
  startTime: string;
  customer?: CustomerForm;
}) {
  const rows: Array<[React.ElementType, string, string]> = [
    [Scissors, "Usluga", service.name],
    [CalendarDays, "Datum", capitalize(formatLongDate(startTime))],
    [Clock, "Vreme", `${formatTime(startTime)} (trajanje ${formatDuration(service.duration_minutes)})`],
    [Wallet, "Cena", formatPrice(service.price_rsd)],
  ];
  if (customer) {
    const phone = normalizeSerbianPhone(customer.phone);
    rows.push([User, "Ime i prezime", customer.name]);
    rows.push([Phone, "Telefon", phone ? formatPhoneLocal(phone) : customer.phone]);
    if (customer.email) rows.push([Mail, "Email", customer.email]);
    if (customer.note) rows.push([MessageSquare, "Napomena", customer.note]);
  }
  return (
    <dl className="divide-y divide-rose-light rounded-2xl border border-rose-light bg-white px-5 shadow-card">
      {rows.map(([Icon, label, value]) => (
        <div key={label} className="flex items-start gap-3 py-3.5">
          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gold-dark" aria-hidden />
          <dt className="w-28 shrink-0 text-sm text-ink-soft">{label}</dt>
          <dd className="min-w-0 flex-1 break-words text-sm font-medium text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function StepReview({
  service,
  startTime,
  customer,
  accepted,
  onAccept,
  onConfirm,
  submitting,
  error,
}: {
  service: Service;
  startTime: string;
  customer: CustomerForm;
  accepted: boolean;
  onAccept: (v: boolean) => void;
  onConfirm: () => void;
  submitting: boolean;
  error: string | null;
}) {
  return (
    <div className="space-y-6">
      <SummaryList service={service} startTime={startTime} customer={customer} />

      <section aria-labelledby="politika-naslov" className="rounded-2xl border border-gold/50 bg-rose-50 p-5">
        <h3 id="politika-naslov" className="flex items-center gap-2 font-serif text-lg text-ink">
          <ShieldCheck className="h-5 w-5 text-gold-dark" aria-hidden /> Politika otkazivanja
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink">{siteConfig.cancellationPolicy}</p>
      </section>

      <Checkbox
        label={<span className="font-medium">Upoznata sam sa politikom otkazivanja</span>}
        checked={accepted}
        onChange={(e) => onAccept(e.target.checked)}
      />

      {error && (
        <p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm text-red-800">
          {error}
        </p>
      )}

      <Button size="lg" fullWidth onClick={onConfirm} disabled={!accepted || submitting} aria-disabled={!accepted || submitting}>
        {submitting ? "Zakazujem…" : "Potvrdi termin"}
      </Button>
      {!accepted && <p className="text-center text-xs text-ink-soft">Za potvrdu termina potrebno je da prihvatite politiku otkazivanja.</p>}
    </div>
  );
}
