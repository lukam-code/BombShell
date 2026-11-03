'use client';
/** Uređivač rasporeda: prevuci sto (snap 10), izmeni oblik/kapacitet/oznaku, dodaj/obriši, sačuvaj u bazu. */
import { useRef, useState } from 'react';
import type { Layout, Shape, TableDef } from '@/lib/types';

const SNAP = 10;
const snap = (n: number) => Math.round(n / SNAP) * SNAP;

export function LayoutEditor({ initial }: { initial: Layout }) {
  const [layout, setLayout] = useState<Layout>(initial);
  const [sel, setSel] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const table = layout.tables.find((t) => t.id === sel) ?? null;

  const point = (e: React.PointerEvent) => {
    const p = svg.current!.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.current!.getScreenCTM()!.inverse());
  };
  const patch = (id: string, v: Partial<TableDef>) => setLayout((l) => ({ ...l, tables: l.tables.map((t) => (t.id === id ? { ...t, ...v } : t)) }));

  function add(shape: Shape) {
    let n = layout.tables.length + 1;
    while (layout.tables.some((t) => t.id === `t${n}`)) n++;
    const t: TableDef = { id: `t${n}`, label: String(n), x: 100, y: 100, w: shape === 'round' ? 70 : 100, h: shape === 'round' ? 70 : 60, shape, seats: 4, zone: 'Sala' };
    setLayout((l) => ({ ...l, tables: [...l.tables, t] })); setSel(t.id);
  }

  async function save() {
    setMsg('Čuvam…');
    const res = await fetch('/api/admin/layout', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(layout) });
    const d = await res.json().catch(() => ({}));
    setMsg(res.ok ? 'Sačuvano ✓ – gosti odmah vide novi raspored.' : `Greška: ${d.error ?? res.status}`);
  }

  const num = (k: 'seats' | 'w' | 'h' | 'x' | 'y') => (
    <input className="input" type="number" value={table![k]} onChange={(e) => patch(table!.id, { [k]: Number(e.target.value) })} />
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div>
        <div className="mb-3 flex flex-wrap gap-2">
          <button className="btn-ghost !min-h-10 text-sm" onClick={() => add('round')}>+ Okrugli sto</button>
          <button className="btn-ghost !min-h-10 text-sm" onClick={() => add('rect')}>+ Pravougaoni sto</button>
          <button className="btn-primary !min-h-10 ml-auto text-sm" onClick={save}>Sačuvaj raspored</button>
        </div>
        <svg ref={svg} viewBox={`0 0 ${layout.width} ${layout.height}`} className="w-full touch-none rounded-2xl border border-white/10 bg-surface"
          onPointerMove={(e) => { if (!drag.current) return; const p = point(e), d = drag.current; patch(d.id, { x: snap(p.x - d.dx), y: snap(p.y - d.dy) }); }}
          onPointerUp={() => (drag.current = null)} onPointerLeave={() => (drag.current = null)}>
          {layout.fixtures.map((f) => (
            <g key={f.id}><rect x={f.x} y={f.y} width={f.w} height={f.h} rx={10} fill="rgb(255 255 255 / .05)" stroke="rgb(255 255 255 / .2)" />
              <text x={f.x + f.w / 2} y={f.y + f.h / 2} textAnchor="middle" dominantBaseline="central" fontSize={12} fill="#8a96a6">{f.label}</text></g>
          ))}
          {layout.tables.map((t) => (
            <g key={t.id} onPointerDown={(e) => { const p = point(e); drag.current = { id: t.id, dx: p.x - t.x, dy: p.y - t.y }; setSel(t.id); (e.target as Element).setPointerCapture?.(e.pointerId); }} style={{ cursor: 'grab' }}>
              {t.shape === 'round'
                ? <circle cx={t.x + t.w / 2} cy={t.y + t.h / 2} r={t.w / 2} fill="#151b25" stroke={t.id === sel ? '#f4c76b' : '#22e6c3'} strokeWidth={t.id === sel ? 3 : 1.75} />
                : <rect x={t.x} y={t.y} width={t.w} height={t.h} rx={12} fill="#151b25" stroke={t.id === sel ? '#f4c76b' : '#22e6c3'} strokeWidth={t.id === sel ? 3 : 1.75} />}
              <text x={t.x + t.w / 2} y={t.y + t.h / 2} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={800} fill="#eef3f7" style={{ pointerEvents: 'none' }}>{t.label}</text>
            </g>
          ))}
        </svg>
        <p role="status" className="mt-3 text-sm text-accent">{msg}</p>
      </div>

      <aside className="card space-y-3 p-4" aria-label="Svojstva stola">
        {!table ? <p className="text-muted">Klikni na sto da ga izmeniš ili prevuci da ga pomeriš.</p> : (
          <>
            <h3 className="font-display text-lg font-bold">Sto {table.label}</h3>
            <label className="block text-sm text-muted">Oznaka<input className="input" value={table.label} maxLength={8} onChange={(e) => patch(table.id, { label: e.target.value })} /></label>
            <label className="block text-sm text-muted">Zona<input className="input" value={table.zone} onChange={(e) => patch(table.id, { zone: e.target.value })} /></label>
            <label className="block text-sm text-muted">Kapacitet{num('seats')}</label>
            <label className="block text-sm text-muted">Oblik
              <select className="input" value={table.shape} onChange={(e) => { const s = e.target.value as Shape; patch(table.id, { shape: s, ...(s === 'round' ? { h: table.w } : {}) }); }}>
                <option value="round">Okrugli</option><option value="rect">Pravougaoni</option></select></label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-sm text-muted">Širina{num('w')}</label>
              <label className="block text-sm text-muted">Visina{num('h')}</label>
            </div>
            <button className="w-full rounded-full border border-danger/50 py-2 text-danger hover:bg-danger/10"
              onClick={() => { setLayout((l) => ({ ...l, tables: l.tables.filter((t) => t.id !== table.id) })); setSel(null); }}>Obriši sto</button>
          </>
        )}
      </aside>
    </div>
  );
}
