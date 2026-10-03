"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { errorMessage, fetchAllServices } from "@/lib/adminData";
import { mapRpcError, type Slot } from "@/lib/booking";
import { normalizeSerbianPhoneAny } from "@/lib/phone";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { belgradeToUtc } from "@/lib/time";
import type { CategoryWithServices } from "@/lib/types";
import { ErrorNote, SmallButton, inputCls, labelCls } from "./ui";

/** Ručno dodavanje termina (zakazivanje telefonom). */
export function NewBookingModal({
  open,
  onClose,
  onCreated,
  defaultDate,
  prefill,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  defaultDate: string;
  prefill?: { name?: string; phone?: string };
}) {
  const [categories, setCategories] = useState<CategoryWithServices[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [name, setName] = useState(prefill?.name ?? "");
  const [phone, setPhone] = useState(prefill?.phone ?? "");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<"confirmed" | "pending">("confirmed");
  const [send, setSend] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDate(defaultDate);
    setError(null);
    fetchAllServices().then(setCategories).catch((e) => setError(errorMessage(e)));
  }, [open, defaultDate]);

  useEffect(() => {
    if (!open || !serviceId || !date) return setSlots([]);
    getBrowserSupabase()
      .rpc("get_available_slots", { p_service_id: serviceId, p_date: date })
      .then(({ data }) => setSlots((data ?? []) as Slot[]));
  }, [open, serviceId, date]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const e164 = normalizeSerbianPhoneAny(phone);
    if (!serviceId || !date || !time) return setError("Izaberite uslugu, datum i vreme.");
    if (name.trim().length < 2) return setError("Unesite ime klijentkinje.");
    if (!e164) return setError("Unesite ispravan broj telefona (npr. 065 123 4567).");
    if (!/^\d{2}:(00|15|30|45)$/.test(time)) return setError("Vreme mora biti na 15 minuta (npr. 10:00, 10:15).");
    setBusy(true);
    const { error: err } = await getBrowserSupabase().rpc("admin_create_booking", {
      p_service_id: serviceId,
      p_start_time: belgradeToUtc(date, time).toISOString(),
      p_customer_name: name.trim(),
      p_customer_phone: e164,
      p_customer_email: email.trim() || null,
      p_note: note.trim() || null,
      p_send_confirmation: send,
      p_status: status,
    });
    setBusy(false);
    if (err) {
      const m = mapRpcError(err);
      return setError(m.kind === "network" ? errorMessage(err) : m.kind === "slot_taken" ? "U tom periodu već postoji drugi termin." : m.message);
    }
    setTime("");
    setName("");
    setPhone("");
    setEmail("");
    setNote("");
    onCreated();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Novi termin" className="sm:max-w-xl">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className={labelCls} htmlFor="nb-usluga">Usluga</label>
          <select id="nb-usluga" className={inputCls} value={serviceId} onChange={(e) => setServiceId(e.target.value)} required>
            <option value="">— Izaberite —</option>
            {categories.map((c) => (
              <optgroup key={c.id} label={c.name}>
                {c.services.map((s) => (
                  <option key={s.id} value={s.id} disabled={!s.is_active}>
                    {s.name} ({s.duration_minutes} min){!s.is_active ? " – sakrivena" : ""}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls} htmlFor="nb-datum">Datum</label>
            <input id="nb-datum" type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div>
            <label className={labelCls} htmlFor="nb-vreme">Vreme</label>
            <input id="nb-vreme" type="time" step={900} className={inputCls} value={time} onChange={(e) => setTime(e.target.value)} required />
          </div>
        </div>
        {serviceId && (
          <div>
            <p className={labelCls}>Slobodno (online pravila)</p>
            {slots.length === 0 ? (
              <p className="text-xs text-ink-soft">Nema slobodnih online termina tog dana – i dalje možete uneti vreme ručno (u okviru radnog vremena).</p>
            ) : (
              <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
                {slots.map((s) => (
                  <button
                    key={s.start_time}
                    type="button"
                    onClick={() => setTime(s.label)}
                    className={`rounded-lg border px-2 py-1 text-xs font-semibold tabular-nums ${time === s.label ? "border-rose-deep bg-rose-deep text-white" : "border-rose-light hover:bg-rose-50"}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="nb-ime">Ime i prezime</label>
            <input id="nb-ime" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className={labelCls} htmlFor="nb-tel">Telefon</label>
            <input id="nb-tel" type="tel" className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="065 123 4567" required />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="nb-email">Email (opciono)</label>
            <input id="nb-email" type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className={labelCls} htmlFor="nb-status">Status</label>
            <select id="nb-status" className={inputCls} value={status} onChange={(e) => setStatus(e.target.value as "confirmed" | "pending")}>
              <option value="confirmed">Potvrđen</option>
              <option value="pending">Na čekanju</option>
            </select>
          </div>
        </div>
        <div>
          <label className={labelCls} htmlFor="nb-napomena">Napomena</label>
          <textarea id="nb-napomena" className={inputCls} rows={2} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" className="mt-0.5 h-5 w-5 accent-rose-deep" checked={send} onChange={(e) => setSend(e.target.checked)} />
          <span>
            Pošalji SMS/Viber potvrdu klijentkinji
            <span className="block text-xs text-ink-soft">Uključuje i podsetnik dan ranije (i email potvrdu ako je unet email).</span>
          </span>
        </label>
        <ErrorNote>{error}</ErrorNote>
        <div className="flex justify-end gap-2 pt-2">
          <SmallButton onClick={onClose}>Odustani</SmallButton>
          <SmallButton tone="primary" type="submit" disabled={busy}>
            {busy ? "Čuvam…" : "Sačuvaj termin"}
          </SmallButton>
        </div>
      </form>
    </Modal>
  );
}
