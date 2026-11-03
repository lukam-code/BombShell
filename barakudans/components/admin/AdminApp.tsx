'use client';
/** Admin panel: lozinka → Rezervacije / Blokade stolova / Raspored. Sve API rute proveravaju sesiju na serveru. */
import { useCallback, useEffect, useState } from 'react';
import { config } from '@/lib/config';
import { formatDateLong, nowInVenue } from '@/lib/dates';
import type { Block, Layout, Reservation } from '@/lib/types';
import { LayoutEditor } from './LayoutEditor';

type Tab = 'rez' | 'blok' | 'plan';

async function api<T>(url: string, init?: RequestInit): Promise<{ ok: boolean; status: number; data: T }> {
  const res = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers }, cache: 'no-store' });
  return { ok: res.ok, status: res.status, data: (await res.json().catch(() => ({}))) as T };
}

export function AdminApp() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>('rez');

  useEffect(() => { api('/api/admin/reservations?date=1970-01-01').then((r) => setAuthed(r.status !== 401)); }, []);

  if (authed === null) return <main className="grid min-h-screen place-items-center text-muted">Učitavam…</main>;
  if (!authed) return <Login onDone={() => setAuthed(true)} />;

  const tabs: [Tab, string][] = [['rez', 'Rezervacije'], ['blok', 'Blokade'], ['plan', 'Raspored']];
  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-extrabold">{config.name} · Admin</h1>
        <button className="btn-ghost !min-h-10 text-sm" onClick={async () => { await api('/api/admin/login', { method: 'DELETE' }); setAuthed(false); }}>Odjavi se</button>
      </header>
      <div role="tablist" className="mt-6 flex gap-2 border-b border-white/10">
        {tabs.map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={`min-h-11 border-b-2 px-4 font-semibold ${tab === k ? 'border-accent text-accent' : 'border-transparent text-muted'}`}>{l}</button>
        ))}
      </div>
      <div className="mt-6">
        {tab === 'rez' && <Reservations />}
        {tab === 'blok' && <Blocks />}
        {tab === 'plan' && <PlanTab />}
      </div>
    </main>
  );
}

function Login({ onDone }: { onDone: () => void }) {
  const [pw, setPw] = useState(''), [err, setErr] = useState('');
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <form className="card w-full max-w-sm space-y-4 p-6" onSubmit={async (e) => {
        e.preventDefault();
        const r = await api<{ error?: string }>('/api/admin/login', { method: 'POST', body: JSON.stringify({ password: pw }) });
        r.ok ? onDone() : setErr(r.data.error ?? 'Greška');
      }}>
        <h1 className="font-display text-2xl font-extrabold">Admin prijava</h1>
        <label className="block"><span className="mb-1.5 block text-sm text-muted">Lozinka</span>
          <input className="input" type="password" autoFocus autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} /></label>
        {err && <p role="alert" className="text-sm text-danger">{err}</p>}
        <button className="btn-primary w-full">Prijavi se</button>
      </form>
    </main>
  );
}

function Reservations() {
  const [date, setDate] = useState('');       // '' = sve od danas nadalje
  const [list, setList] = useState<Reservation[]>([]);
  const [layout, setLayout] = useState<Layout | null>(null);
  const load = useCallback(async () => {
    const r = await api<Reservation[]>(`/api/admin/reservations${date ? `?date=${date}` : ''}`);
    if (r.ok) setList(r.data);
  }, [date]);
  useEffect(() => { load(); const i = setInterval(load, 8000); return () => clearInterval(i); }, [load]);
  useEffect(() => { fetch('/api/layout').then((r) => r.json()).then(setLayout); }, []);
  const label = (id: string) => layout?.tables.find((t) => t.id === id)?.label ?? id;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <input type="date" className="input !w-auto" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Filtriraj po datumu" />
        <button className="btn-ghost !min-h-12" onClick={() => setDate('')}>Sve nadolazeće</button>
        <button className="btn-ghost !min-h-12" onClick={() => setDate(nowInVenue().date)}>Danas</button>
      </div>
      <ul className="mt-5 space-y-3">
        {list.length === 0 && <li className="card p-6 text-muted">Nema rezervacija.</li>}
        {list.map((r) => (
          <li key={r.id} className={`card flex flex-wrap items-center justify-between gap-3 p-4 ${r.status === 'cancelled' ? 'opacity-50' : ''}`}>
            <div>
              <p className="font-semibold">{formatDateLong(r.date)} · {r.slot} · sto {label(r.tableId)} · {r.guests} os.</p>
              <p className="text-sm text-muted">{r.name} · <a className="hover:text-accent" href={`tel:${r.phone}`}>{r.phone}</a> · {r.email}</p>
              {r.note && <p className="mt-1 text-sm italic text-muted">„{r.note}“</p>}
            </div>
            {r.status === 'cancelled' ? <span className="text-sm text-danger">otkazano</span> : (
              <button className="rounded-full border border-danger/50 px-4 py-2 text-sm text-danger hover:bg-danger/10"
                onClick={async () => { if (confirm(`Otkazati rezervaciju: ${r.name}?`)) { await api('/api/admin/reservations', { method: 'PATCH', body: JSON.stringify({ id: r.id }) }); load(); } }}>Otkaži</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Blocks() {
  const [date, setDate] = useState(nowInVenue().date);
  const [layout, setLayout] = useState<Layout | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const load = useCallback(async () => { const r = await api<Block[]>(`/api/admin/blocks?date=${date}`); if (r.ok) setBlocks(r.data); }, [date]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { fetch('/api/layout').then((r) => r.json()).then(setLayout); }, []);
  const slots = ['*', ...config.booking.slots];

  return (
    <div>
      <input type="date" className="input !w-auto" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Datum" />
      <p className="mt-3 text-sm text-muted">Klikni na termin da blokiraš/odblokiraš sto. „Ceo dan“ blokira sve termine.</p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[520px] text-left">
          <thead><tr className="text-sm text-muted"><th className="py-2">Sto</th>{slots.map((s) => <th key={s} className="py-2 text-center">{s === '*' ? 'Ceo dan' : s}</th>)}</tr></thead>
          <tbody>
            {layout?.tables.map((t) => (
              <tr key={t.id} className="border-t border-white/5">
                <td className="py-2 font-semibold">{t.label} <span className="text-sm font-normal text-muted">({t.seats})</span></td>
                {slots.map((s) => {
                  const b = blocks.find((x) => x.tableId === t.id && x.slot === s);
                  return (
                    <td key={s} className="py-2 text-center">
                      <button aria-pressed={!!b} aria-label={`Sto ${t.label}, ${s === '*' ? 'ceo dan' : s}, ${b ? 'blokiran' : 'slobodan'}`}
                        className={`min-h-10 min-w-16 rounded-lg border text-sm ${b ? 'border-danger bg-danger/15 text-danger' : 'border-white/10 text-muted hover:border-white/30'}`}
                        onClick={async () => {
                          if (b) await api(`/api/admin/blocks?id=${b.id}`, { method: 'DELETE' });
                          else await api('/api/admin/blocks', { method: 'POST', body: JSON.stringify({ tableId: t.id, date, slot: s, reason: 'Admin' }) });
                          load();
                        }}>{b ? 'Blokiran' : '—'}</button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PlanTab() {
  const [layout, setLayout] = useState<Layout | null>(null);
  useEffect(() => { fetch('/api/layout').then((r) => r.json()).then(setLayout); }, []);
  if (!layout) return <p className="text-muted">Učitavam…</p>;
  return <LayoutEditor initial={layout} />;
}
