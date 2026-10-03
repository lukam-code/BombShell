"use client";

import { m, useReducedMotion } from "framer-motion";
import { AlertCircle, CalendarCheck2, CalendarDays, CalendarX2, Clock, Phone, Scissors } from "lucide-react";
import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { mapRpcError } from "@/lib/booking";
import { CANCELLATION_HOURS, siteConfig } from "@/lib/siteConfig";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { capitalize, formatLongDate, formatTime } from "@/lib/time";
import { STATUS_LABELS, type BookingByToken } from "@/lib/types";

const PHONE_MSG = (
  <>
    Rok za online otkazivanje je istekao. Molimo Vas pozovite nas na{" "}
    <a href={siteConfig.phone.href} className="font-semibold underline underline-offset-4">
      {siteConfig.phone.display}
    </a>
    .
  </>
);

export function CancelBooking({ token, initial, loadError }: { token: string; initial: BookingByToken | null; loadError: boolean }) {
  const [booking, setBooking] = useState(initial);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<React.ReactNode>(null);
  const [done, setDone] = useState(false);
  const reduce = useReducedMotion();

  if (loadError || !booking) {
    return (
      <Panel icon={<AlertCircle className="h-8 w-8" strokeWidth={1.5} />} title={loadError ? "Greška pri učitavanju" : "Termin nije pronađen"}>
        <p className="text-ink-soft">
          {loadError
            ? "Podaci o terminu trenutno ne mogu da se učitaju. Pokušajte ponovo kasnije ili nas pozovite."
            : "Link za otkazivanje nije ispravan ili je termin obrisan. Proverite link iz potvrde ili nas pozovite."}
        </p>
        <CallButton />
      </Panel>
    );
  }

  async function cancel() {
    setBusy(true);
    setError(null);
    const { error: err } = await getBrowserSupabase().rpc("cancel_booking", { p_token: token });
    setBusy(false);
    setConfirmOpen(false);
    if (err) {
      const mapped = mapRpcError(err);
      if (mapped.kind === "deadline") {
        setBooking((b) => (b ? { ...b, can_cancel: false } : b));
        setError(PHONE_MSG);
      } else if (mapped.kind === "validation" || mapped.kind === "not_found") {
        setError(mapped.message);
      } else {
        setError("Otkazivanje trenutno nije uspelo. Pokušajte ponovo ili nas pozovite.");
      }
      return;
    }
    setBooking((b) => (b ? { ...b, status: "cancelled", can_cancel: false } : b));
    setDone(true);
  }

  const details = (
    <dl className="mt-6 divide-y divide-rose-light rounded-2xl border border-rose-light bg-cream px-5 text-left">
      {[
        [Scissors, "Usluga", booking.service_name],
        [CalendarDays, "Datum", capitalize(formatLongDate(booking.start_time))],
        [Clock, "Vreme", `${formatTime(booking.start_time)} – ${formatTime(booking.end_time)}`],
        [CalendarCheck2, "Status", STATUS_LABELS[booking.status]],
      ].map(([Icon, label, value]) => {
        const I = Icon as React.ElementType;
        return (
          <div key={label as string} className="flex items-center gap-3 py-3">
            <I className="h-4 w-4 text-gold-dark" aria-hidden />
            <dt className="w-20 text-sm text-ink-soft">{label as string}</dt>
            <dd className="text-sm font-medium text-ink">{value as string}</dd>
          </div>
        );
      })}
    </dl>
  );

  if (done || booking.status === "cancelled") {
    return (
      <Panel icon={<CalendarX2 className="h-8 w-8" strokeWidth={1.5} />} title={done ? "Termin je otkazan" : "Ovaj termin je već otkazan"}>
        <m.div initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} role="status">
          <p className="text-ink-soft">
            {done ? "Hvala što ste nas obavestili na vreme. Termin je oslobođen za druge klijentkinje." : "Za ovaj termin više nije potrebna nikakva radnja."}
          </p>
          {details}
          <ButtonLink href="/zakazivanje" className="mt-8" size="lg">
            Zakaži novi termin
          </ButtonLink>
        </m.div>
      </Panel>
    );
  }

  const isActive = booking.status === "pending" || booking.status === "confirmed";

  return (
    <Panel icon={<CalendarDays className="h-8 w-8" strokeWidth={1.5} />} title="Vaš termin">
      {details}
      {error && (
        <p role="alert" className="mt-6 rounded-2xl bg-red-50 p-4 text-left text-sm text-red-800">
          {error}
        </p>
      )}
      {isActive && booking.can_cancel ? (
        <>
          <p className="mt-6 text-sm text-ink-soft">
            Termin možete otkazati online najkasnije {CANCELLATION_HOURS} sata pre zakazanog vremena.
          </p>
          <Button size="lg" className="mt-6" onClick={() => setConfirmOpen(true)}>
            <CalendarX2 className="h-5 w-5" aria-hidden /> Otkaži termin
          </Button>
        </>
      ) : isActive ? (
        !error && (
          <p role="alert" className="mt-6 rounded-2xl bg-rose-50 p-4 text-left text-sm text-ink">
            {PHONE_MSG}
          </p>
        )
      ) : (
        <p className="mt-6 text-sm text-ink-soft">Ovaj termin se više ne može otkazati.</p>
      )}
      {isActive && !booking.can_cancel && <CallButton />}

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Otkazati termin?">
        <p className="text-ink-soft">
          Da li ste sigurni da želite da otkažete termin <strong className="text-ink">{booking.service_name}</strong>,{" "}
          {formatLongDate(booking.start_time)} u {formatTime(booking.start_time)}?
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
          <Button onClick={cancel} disabled={busy}>
            {busy ? "Otkazujem…" : "Da, otkaži termin"}
          </Button>
          <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
            Ne, zadrži termin
          </Button>
        </div>
      </Modal>
    </Panel>
  );
}

function Panel({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-4xl border border-rose-light bg-white p-7 text-center shadow-soft sm:p-10">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-light text-rose-deeper" aria-hidden>
        {icon}
      </span>
      <h1 className="mt-5 text-3xl font-medium">{title}</h1>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function CallButton() {
  return (
    <ButtonLink href={siteConfig.phone.href} variant="secondary" className="mt-6">
      <Phone className="h-4 w-4" aria-hidden /> {siteConfig.phone.display}
    </ButtonLink>
  );
}
