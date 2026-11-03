'use client';
/**
 * Rezervacioni tok: datum + termin + broj osoba → plan lokala → klik na sto → forma → potvrda.
 * Zauzetost se računa po (datum, termin) i osvežava polling-om svakih 5 s.
 * Konačnu proveru (kapacitet, duplo bukiranje) uvek radi server.
 */
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { config } from '@/lib/config';
import { bookableDates, bookableError, DAYS_SHORT, formatDateLong, MONTHS_SHORT } from '@/lib/dates';
import type { Layout, Occupancy, TableDef } from '@/lib/types';
import { reservationSchema } from '@/lib/validation';
import { FloorPlan, type TableStatus } from './FloorPlan';

const POLL_MS = 5000;

interface Success {
  code: string; tableLabel: string; date: string; slot: string; guests: number; name: string;
  notified: { email: string; sms: string };
}
type Fields = Record<string, string[] | undefined>;

export function Booking() {
  const reduced = !!useReducedMotion();
  const [layout, setLayout] = useState<Layout | null>(null);
  const [dates, setDates] = useState<string[]>([]);
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('');
  const [guests, setGuests] = useState(2);
  const [occ, setOcc] = useState<Occupancy>({ reserved: [], blocked: [] });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ text: string; tone: 'info' | 'error' } | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', note: '', notifyEmail: true, notifySms: false, website: '' });
  const [errors, setErrors] = useState<Fields>({});
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState<Success | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // inicijalizacija (datumi zavise od "sada" pa se računaju tek na klijentu)
  useEffect(() => {
    const ds = bookableDates();
    setDates(ds);
    if (ds[0]) setDate(ds[0]);
    fetch('/api/layout').then((r) => r.json()).then(setLayout).catch(() => setNotice({ text: 'Plan lokala trenutno nije dostupan.', tone: 'error' }));
  }, []);

  const slotOk = useCallback((d: string, s: string) => !!d && !bookableError(d, s), []);
  // kad se promeni datum, pazi da izabrani termin još važi
  useEffect(() => {
    if (!date) return;
    if (!slotOk(date, slot)) setSlot(config.booking.slots.find((s) => slotOk(date, s)) ?? '');
  }, [date, slot, slotOk]);

  // zauzetost: odmah + polling (pauziran dok je tab skriven)
  const refreshOcc = useCallback(async (d: string) => {
    try {
      const r = await fetch(`/api/availability?date=${d}`, { cache: 'no-store' });
      if (r.ok) { const data = (await r.json()) as Occupancy; setOcc((prev) => (JSON.stringify(prev) === JSON.stringify(data) ? prev : data)); }
    } catch { /* mreža – probaćemo ponovo */ }
  }, []);
  useEffect(() => {
    if (!date) return;
    setOcc({ reserved: [], blocked: [] });
    refreshOcc(date);
    const id = setInterval(() => { if (document.visibilityState === 'visible') refreshOcc(date); }, POLL_MS);
    return () => clearInterval(id);
  }, [date, refreshOcc]);

  const statusOf = useCallback((t: TableDef): TableStatus => {
    if (occ.reserved.some((r) => r.tableId === t.id && r.slot === slot)) return 'taken';
    if (occ.blocked.some((b) => b.tableId === t.id && (b.slot === '*' || b.slot === slot))) return 'blocked';
    if (guests > t.seats) return 'toosmall';
    return t.id === selectedId ? 'selected' : 'free';
  }, [occ, slot, guests, selectedId]);

  const selected = useMemo(() => layout?.tables.find((t) => t.id === selectedId) ?? null, [layout, selectedId]);

  // izabrani sto postao nedostupan (neko drugi ga je uzeo / admin blokirao / promenjen broj osoba)
  useEffect(() => {
    if (!selected) return;
    const s = statusOf(selected);
    if (s === 'taken' || s === 'blocked') { setSelectedId(null); setNotice({ text: `Sto ${selected.label} je u međuvremenu zauzet. Izaberi drugi.`, tone: 'error' }); }
    else if (s === 'toosmall') { setSelectedId(null); setNotice({ text: `Sto ${selected.label} ima ${selected.seats} mesta – premali za ${guests} osoba.`, tone: 'error' }); }
  }, [selected, statusOf, guests]);

  const onSelect = (t: TableDef) => {
    setNotice(null); setErrors({});
    setSelectedId(t.id === selectedId ? null : t.id);
    if (t.id !== selectedId && window.matchMedia('(max-width: 1023px)').matches) {
      setTimeout(() => panelRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' }), 250);
    }
  };
  const onUnavailable = (t: TableDef, s: TableStatus) => setNotice({
    tone: 'error',
    text: s === 'toosmall' ? `Sto ${t.label} ima ${t.seats} mesta – za ${guests} osoba izaberi veći sto.` : `Sto ${t.label} je zauzet za izabrani termin.`,
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || busy) return;
    const payload = { ...form, tableId: selected.id, date, slot, guests };
    const parsed = reservationSchema.safeParse(payload); // klijentska validacija (UX); server proverava ponovo
    if (!parsed.success) { setErrors(parsed.error.flatten().fieldErrors); return; }
    setErrors({}); setBusy(true); setNotice(null);
    try {
      const res = await fetch('/api/reservations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (res.ok && data.ok) {
        setSuccess({ code: data.code, notified: data.notified, ...data.reservation });
        refreshOcc(date);
      } else if (res.status === 422 && data.fields) {
        setErrors(data.fields);
      } else {
        setNotice({ text: data.error ?? 'Greška. Pokušaj ponovo.', tone: 'error' });
        if (res.status === 409) { setSelectedId(null); refreshOcc(date); } // neko nas je preduhitrio
      }
    } catch {
      setNotice({ text: 'Nema veze sa serverom. Pokušaj ponovo.', tone: 'error' });
    } finally { setBusy(false); }
  }

  function reset() {
    setSuccess(null); setSelectedId(null);
    setForm((f) => ({ ...f, note: '' }));
    document.getElementById('rezervacija')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));

  return (
    <section id="rezervacija" className="scroll-mt-16 bg-surface/50">
      <div className="section">
        <p className="eyebrow">Rezervacija</p>
        <h2 className="h2 mt-3">Izaberi svoj sto</h2>
        <p className="mt-4 max-w-xl text-muted">Odaberi datum, termin i broj osoba, pa klikni na slobodan sto na planu lokala.</p>

        {/* 1) datum / termin / osobe */}
        <div className="card mt-10 grid grid-cols-[minmax(0,1fr)] gap-6 p-4 sm:p-6">
          <fieldset className="min-w-0">
            <legend className="mb-2 text-sm font-semibold text-muted">Datum</legend>
            {dates.length === 0 ? <div className="h-16 animate-pulse rounded-xl bg-raised" /> : (
              <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-2" role="radiogroup" aria-label="Datum">
                {dates.slice(0, 21).map((d) => {
                  const dt = new Date(`${d}T12:00:00Z`), on = d === date;
                  return (
                    <button key={d} data-date={d} type="button" role="radio" aria-checked={on} onClick={() => { setDate(d); setSelectedId(null); setNotice(null); }}
                      className={`min-h-16 w-[4.5rem] shrink-0 snap-start rounded-xl border px-2 py-2 text-center transition ${on ? 'border-accent bg-accent/15 text-accent' : 'border-white/10 bg-raised hover:border-white/30'}`}>
                      <span className="block text-xs uppercase text-muted">{DAYS_SHORT[dt.getUTCDay()]}</span>
                      <span className="block font-display text-xl font-bold leading-tight">{dt.getUTCDate()}</span>
                      <span className="block text-xs text-muted">{MONTHS_SHORT[dt.getUTCMonth()]}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </fieldset>
          <div className="grid gap-6 sm:grid-cols-2">
            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-muted">Termin</legend>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Termin">
                {config.booking.slots.map((s) => {
                  const ok = slotOk(date, s), on = s === slot;
                  return (
                    <button key={s} type="button" role="radio" aria-checked={on} disabled={!ok} onClick={() => { setSlot(s); setSelectedId(null); setNotice(null); }}
                      className={`min-h-12 min-w-20 rounded-xl border px-4 font-semibold transition disabled:cursor-not-allowed disabled:opacity-35 ${on ? 'border-accent bg-accent/15 text-accent' : 'border-white/10 bg-raised hover:border-white/30'}`}>{s}</button>
                  );
                })}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-muted">Broj osoba</legend>
              <div className="flex items-center gap-3">
                <button type="button" aria-label="Manje osoba" disabled={guests <= 1} onClick={() => setGuests((g) => g - 1)} className="grid h-12 w-12 place-items-center rounded-xl border border-white/10 bg-raised text-2xl disabled:opacity-35">−</button>
                <output aria-live="polite" className="w-12 text-center font-display text-3xl font-bold">{guests}</output>
                <button type="button" aria-label="Više osoba" disabled={guests >= config.booking.maxGuests} onClick={() => setGuests((g) => g + 1)} className="grid h-12 w-12 place-items-center rounded-xl border border-white/10 bg-raised text-2xl disabled:opacity-35">+</button>
              </div>
            </fieldset>
          </div>
        </div>

        {/* 2) plan + panel */}
        <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div>
            {layout && slot ? (
              <FloorPlan layout={layout} statusOf={statusOf} selectedId={selectedId} onSelect={onSelect} onUnavailable={onUnavailable} />
            ) : <div className="aspect-[800/560] animate-pulse rounded-2xl bg-raised" />}
            <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted" aria-label="Legenda">
              <li className="flex items-center gap-2"><i className="h-3 w-3 rounded-full border-2 border-accent" />Slobodno</li>
              <li className="flex items-center gap-2"><i className="h-3 w-3 rounded-full border-2 border-gold bg-gold/30" />Izabrano</li>
              <li className="flex items-center gap-2"><i className="h-3 w-3 rounded-full border-2 border-danger bg-danger/20" />Zauzeto</li>
              <li className="flex items-center gap-2"><i className="h-3 w-3 rounded-full border-2 border-dashed border-muted" />Premali sto</li>
            </ul>
            <div aria-live="polite" role="status" className="mt-3 min-h-6 text-sm">
              {notice && <p className={notice.tone === 'error' ? 'text-danger' : 'text-accent'}>{notice.text}</p>}
            </div>
          </div>

          <div ref={panelRef} className="lg:sticky lg:top-24 lg:self-start">
            <AnimatePresence mode="wait">
              {success ? (
                <SuccessCard key="ok" s={success} onReset={reset} />
              ) : selected ? (
                <motion.form key={selected.id} onSubmit={submit} noValidate aria-label={`Rezervacija stola ${selected.label}`}
                  initial={reduced ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={reduced ? undefined : { opacity: 0, y: -8 }} transition={{ duration: 0.3 }}
                  className="card space-y-4 border-gold/30 p-5 shadow-glow-gold">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="eyebrow !text-gold">Izabrani sto</p>
                      <h3 className="font-display text-3xl font-extrabold">Sto {selected.label}</h3>
                    </div>
                    <span className="rounded-full bg-accent/10 px-3 py-1 text-sm font-semibold text-accent">Slobodan</span>
                  </div>
                  <dl className="grid grid-cols-2 gap-2 rounded-xl bg-raised p-3 text-sm">
                    <dt className="text-muted">Zona</dt><dd className="text-right">{selected.zone}</dd>
                    <dt className="text-muted">Kapacitet</dt><dd className="text-right">do {selected.seats} osoba</dd>
                    <dt className="text-muted">Termin</dt><dd className="text-right">{formatDateLong(date)}, {slot}</dd>
                    <dt className="text-muted">Gostiju</dt><dd className="text-right">{guests}</dd>
                  </dl>
                  <Field label="Ime i prezime" error={errors.name}><input className="input" autoComplete="name" value={form.name} onChange={set('name')} aria-invalid={!!errors.name} /></Field>
                  <Field label="Telefon" error={errors.phone}><input className="input" type="tel" inputMode="tel" autoComplete="tel" placeholder="+381 6x xxx xxxx" value={form.phone} onChange={set('phone')} aria-invalid={!!errors.phone} /></Field>
                  <Field label="Email" error={errors.email}><input className="input" type="email" inputMode="email" autoComplete="email" value={form.email} onChange={set('email')} aria-invalid={!!errors.email} /></Field>
                  <Field label="Napomena (opciono)" error={errors.note}><textarea className="input min-h-20 py-3" maxLength={300} value={form.note} onChange={set('note')} placeholder="Rođendan, alergije, posebne želje…" /></Field>
                  {/* honeypot */}
                  <input tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-0 w-0 opacity-0" name="website" value={form.website} onChange={set('website')} />
                  <div className="space-y-2 text-sm">
                    <label className="flex min-h-8 items-center gap-3"><input type="checkbox" className="h-5 w-5 accent-[rgb(var(--accent))]" checked={form.notifyEmail} onChange={set('notifyEmail')} />Pošalji potvrdu na email</label>
                    <label className="flex min-h-8 items-center gap-3"><input type="checkbox" className="h-5 w-5 accent-[rgb(var(--accent))]" checked={form.notifySms} onChange={set('notifySms')} />Pošalji potvrdu SMS-om</label>
                  </div>
                  <button className="btn-primary w-full text-lg" disabled={busy}>{busy ? 'Potvrđujem…' : 'Potvrdi rezervaciju'}</button>
                </motion.form>
              ) : (
                <motion.div key="empty" initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} className="card grid min-h-48 place-items-center p-8 text-center text-muted">
                  <p>Klikni na slobodan sto na planu da vidiš detalje i potvrdiš rezervaciju.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({ label, error, children }: { label: string; error?: string[]; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-muted">{label}</span>
      {children}
      {error?.[0] && <span role="alert" className="mt-1 block text-sm text-danger">{error[0]}</span>}
    </label>
  );
}

const NOTE: Record<string, string> = { sent: 'poslato', skipped: 'nije poslato', failed: 'slanje nije uspelo' };

function SuccessCard({ s, onReset }: { s: Success; onReset: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}
      className="card border-accent/40 p-6 text-center shadow-glow" role="status" data-testid="success">
      <svg viewBox="0 0 80 80" className="mx-auto h-20 w-20" aria-hidden>
        <circle cx="40" cy="40" r="36" fill="none" style={{ stroke: 'rgb(var(--accent))' }} strokeWidth="3" opacity=".35" />
        <path className="tick" d="M24 41l11 11 21-23" fill="none" style={{ stroke: 'rgb(var(--accent))' }} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <h3 className="mt-4 font-display text-2xl font-extrabold">Rezervacija potvrđena!</h3>
      <p className="mt-2 text-muted">Vidimo se, {s.name.split(' ')[0]}.</p>
      <dl className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-raised p-4 text-left text-sm">
        <dt className="text-muted">Sto</dt><dd className="text-right font-semibold">{s.tableLabel}</dd>
        <dt className="text-muted">Termin</dt><dd className="text-right">{formatDateLong(s.date)}, {s.slot}</dd>
        <dt className="text-muted">Gostiju</dt><dd className="text-right">{s.guests}</dd>
        <dt className="text-muted">Šifra</dt><dd className="text-right font-mono font-bold text-gold">{s.code}</dd>
      </dl>
      <p className="mt-4 text-sm text-muted">Email: {NOTE[s.notified.email]} · SMS: {NOTE[s.notified.sms]}</p>
      <button onClick={onReset} className="btn-ghost mt-5 w-full">Nova rezervacija</button>
    </motion.div>
  );
}
