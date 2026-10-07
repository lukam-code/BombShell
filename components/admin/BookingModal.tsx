"use client";

import { BadgeCheck, CheckCircle2, History, MessageCircle, MessageSquare, Phone, Send, UserX, XCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { errorMessage, updateBookingStatus } from "@/lib/adminData";
import { ADMIN_MESSAGE_TEST_RECIPIENT, buildCustomerMessage, messageLinks, type ManualMessageType } from "@/lib/customerMessages";
import { formatPhoneLocal } from "@/lib/phone";
import { capitalize, formatDuration, formatLongDate, formatPrice, formatTime, formatBelgrade } from "@/lib/time";
import type { Booking, BookingStatus } from "@/lib/types";
import { ErrorNote, SmallButton, StatusBadge } from "./ui";

export function BookingModal({ booking, onClose, onChanged }: { booking: Booking | null; onClose: () => void; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  // Lokalna kopija – posle potvrde/otkazivanja prozor ostaje otvoren da bi se poslala poruka
  const [current, setCurrent] = useState<Booking | null>(booking);
  const [justChanged, setJustChanged] = useState(false);

  useEffect(() => {
    setCurrent(booking);
    setJustChanged(false);
  }, [booking]);

  async function setStatus(status: BookingStatus) {
    if (!current) return;
    setBusy(true);
    setError(null);
    try {
      await updateBookingStatus(current.id, status);
      onChanged();
      setConfirmCancel(false);
      if (status === "confirmed" || status === "cancelled") {
        setCurrent({ ...current, status, cancelled_by: status === "cancelled" ? "salon" : null });
        setJustChanged(true);
      } else {
        onClose();
      }
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const b = current;
  const isPast = b ? new Date(b.start_time) < new Date() : false;
  const active = b && (b.status === "pending" || b.status === "confirmed");

  return (
    <Modal open={!!b} onClose={() => { setConfirmCancel(false); setError(null); onClose(); }} title={b?.customer_name ?? "Termin"}>
      {b && (
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <StatusBadge status={b.status} />
            {b.cancelled_by && <span className="text-xs text-ink-soft">otkazao/la: {b.cancelled_by === "customer" ? "klijentkinja" : "salon"}</span>}
          </div>
          <dl className="grid grid-cols-[7rem_1fr] gap-x-3 gap-y-2 text-sm">
            <dt className="text-ink-soft">Usluga</dt>
            <dd className="font-medium">{b.services?.name}</dd>
            <dt className="text-ink-soft">Datum</dt>
            <dd className="font-medium">{capitalize(formatLongDate(b.start_time))}</dd>
            <dt className="text-ink-soft">Vreme</dt>
            <dd className="font-medium">
              {formatTime(b.start_time)} – {formatTime(b.end_time)} {b.services && `(${formatDuration(b.services.duration_minutes)})`}
            </dd>
            <dt className="text-ink-soft">Cena</dt>
            <dd>{formatPrice(b.services?.price_rsd)}</dd>
            <dt className="text-ink-soft">Telefon</dt>
            <dd>
              <a href={`tel:${b.customer_phone}`} className="font-medium text-rose-deeper underline-offset-4 hover:underline">
                {formatPhoneLocal(b.customer_phone)}
              </a>
            </dd>
            {b.customer_email && (
              <>
                <dt className="text-ink-soft">Email</dt>
                <dd className="break-all">{b.customer_email}</dd>
              </>
            )}
            {b.note && (
              <>
                <dt className="text-ink-soft">Napomena</dt>
                <dd className="whitespace-pre-wrap">{b.note}</dd>
              </>
            )}
            <dt className="text-ink-soft">SMS/Viber</dt>
            <dd>{b.notifications_opt_in ? "Da" : "Ne"}{b.reminder_sent_at && " · podsetnik poslat"}</dd>
            <dt className="text-ink-soft">Zakazano</dt>
            <dd className="text-ink-soft">{formatBelgrade(b.created_at, "d.M.yyyy. HH:mm")}</dd>
          </dl>

          <div className="flex flex-wrap gap-2">
            <a href={`tel:${b.customer_phone}`} className="inline-flex items-center gap-1.5 rounded-full border border-rose-light px-3.5 py-2 text-sm font-semibold hover:bg-rose-50">
              <Phone className="h-4 w-4" aria-hidden /> Pozovi
            </a>
            <Link
              href={`/admin/klijentkinje?tel=${encodeURIComponent(b.customer_phone)}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-rose-light px-3.5 py-2 text-sm font-semibold hover:bg-rose-50"
            >
              <History className="h-4 w-4" aria-hidden /> Istorija
            </Link>
          </div>

          <NotifyCustomer booking={b} highlight={justChanged} />

          <ErrorNote>{error}</ErrorNote>

          {confirmCancel ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-900">
                Otkazati termin? {b.notifications_opt_in ? "Klijentkinja će dobiti SMS/Viber obaveštenje o otkazivanju." : "Klijentkinja nije prijavljena za SMS/Viber obaveštenja."}
              </p>
              <div className="mt-3 flex gap-2">
                <SmallButton tone="danger" disabled={busy} onClick={() => setStatus("cancelled")}>
                  Da, otkaži
                </SmallButton>
                <SmallButton onClick={() => setConfirmCancel(false)}>Odustani</SmallButton>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {b.status === "pending" && (
                <SmallButton tone="primary" disabled={busy} onClick={() => setStatus("confirmed")}>
                  <BadgeCheck className="h-4 w-4" aria-hidden /> Potvrdi
                </SmallButton>
              )}
              {active && (
                <SmallButton tone="danger" disabled={busy} onClick={() => setConfirmCancel(true)}>
                  <XCircle className="h-4 w-4" aria-hidden /> Otkaži
                </SmallButton>
              )}
              {b.status !== "completed" && b.status !== "cancelled" && (
                <SmallButton tone="success" disabled={busy} onClick={() => setStatus("completed")} title={!isPast ? "Termin još nije prošao" : undefined}>
                  <CheckCircle2 className="h-4 w-4" aria-hidden /> Završeno
                </SmallButton>
              )}
              {b.status !== "no_show" && b.status !== "cancelled" && (
                <SmallButton disabled={busy} onClick={() => setStatus("no_show")}>
                  <UserX className="h-4 w-4" aria-hidden /> Nije došla
                </SmallButton>
              )}
              {(b.status === "completed" || b.status === "no_show") && (
                <SmallButton disabled={busy} onClick={() => setStatus("confirmed")}>
                  Vrati na potvrđen
                </SmallButton>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

/** Slanje poruke klijentkinji sa telefona salona (SMS / Viber / WhatsApp) – bez ikakvog servisa. */
function NotifyCustomer({ booking, highlight }: { booking: Booking; highlight: boolean }) {
  const upcoming = new Date(booking.start_time) > new Date();
  const defaultType: ManualMessageType = booking.status === "cancelled" ? "cancellation" : "confirmation";
  const [type, setType] = useState<ManualMessageType>(defaultType);
  useEffect(() => setType(defaultType), [defaultType]);

  if (!upcoming || !["pending", "confirmed", "cancelled"].includes(booking.status)) return null;

  const text = buildCustomerMessage(type, booking);
  const recipient = ADMIN_MESSAGE_TEST_RECIPIENT ?? booking.customer_phone;
  const links = messageLinks(recipient, text);
  const options: Array<[ManualMessageType, string]> =
    booking.status === "cancelled"
      ? [["cancellation", "Otkazivanje"]]
      : [
          ["confirmation", "Potvrda"],
          ["reminder", "Podsetnik"],
        ];

  return (
    <section
      aria-label="Obavesti klijentkinju"
      className={`rounded-2xl border p-4 ${highlight ? "border-rose-deep bg-rose-50" : "border-rose-light"}`}
    >
      <p className="flex items-center gap-2 text-sm font-semibold">
        <Send className="h-4 w-4 text-rose-deeper" aria-hidden />
        {highlight ? "Sačuvano – obavestite klijentkinju" : "Obavesti klijentkinju"}
      </p>
      {options.length > 1 && (
        <div className="mt-3 flex gap-2" role="group" aria-label="Vrsta poruke">
          {options.map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={type === value}
              onClick={() => setType(value)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${type === value ? "border-rose-deep bg-rose-deep text-white" : "border-rose-light"}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      <p className="mt-3 whitespace-pre-wrap rounded-xl bg-white p-3 text-xs leading-relaxed text-ink-soft">{text}</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <a href={links.sms} className="inline-flex items-center justify-center gap-1.5 rounded-full bg-rose-deep px-3 py-2 text-sm font-semibold text-white hover:bg-rose-deeper">
          <MessageSquare className="h-4 w-4" aria-hidden /> SMS
        </a>
        <a href={links.viber} className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#7360F2] px-3 py-2 text-sm font-semibold text-white hover:opacity-90">
          <MessageCircle className="h-4 w-4" aria-hidden /> Viber
        </a>
        <a
          href={links.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#128C4A] px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          <MessageCircle className="h-4 w-4" aria-hidden /> WhatsApp
        </a>
      </div>
      <p className="mt-2 text-xs text-ink-soft">
        {ADMIN_MESSAGE_TEST_RECIPIENT ? (
          <>
            <strong className="text-amber-800">Probni režim:</strong> poruka ide na {formatPhoneLocal(ADMIN_MESSAGE_TEST_RECIPIENT)}, ne klijentkinji.
          </>
        ) : (
          <>Otvara aplikaciju na ovom telefonu sa upisanom porukom za {formatPhoneLocal(booking.customer_phone)} – samo pritisnite „Pošalji”.</>
        )}
      </p>
    </section>
  );
}
