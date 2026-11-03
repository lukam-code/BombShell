'use client';
/**
 * Interaktivni plan lokala (SVG).
 *  - Plan je PODATAK (Layout) – stolovi se crtaju iz niza, ništa nije hardkodirano.
 *  - Animirani marker "putuje" od stola do stola (framer-motion, 700 ms, easeInOut).
 *  - Na telefonu se viewBox glatko zumira na izabrani sto (pan/zoom), na desktopu ceo plan stoji.
 *  - Pristupačnost: svaki sto je role="button", roving tabindex, strelice prebacuju fokus
 *    na najbliži sto u tom smeru, Enter/Space bira. prefers-reduced-motion → bez animacija.
 */
import { animate, motion, useAnimationControls, useMotionTemplate, useMotionValue, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Layout, TableDef } from '@/lib/types';

export type TableStatus = 'free' | 'selected' | 'taken' | 'blocked' | 'toosmall';

const COLOR = {
  accent: 'rgb(var(--accent))', gold: 'rgb(var(--gold))', danger: 'rgb(var(--danger))',
  raised: 'rgb(var(--raised))', muted: 'rgb(var(--muted))', fg: 'rgb(var(--fg))', bg: 'rgb(var(--bg))',
};
const EASE = [0.65, 0, 0.35, 1] as const;
const MOVE_MS = 0.7;

/** Pozicije stolica oko stola. */
function chairs(t: TableDef): { x: number; y: number }[] {
  const cx = t.w / 2, cy = t.h / 2, out: { x: number; y: number }[] = [];
  if (t.shape === 'round') {
    const r = t.w / 2 + 7;
    for (let i = 0; i < t.seats; i++) {
      const a = (i / t.seats) * Math.PI * 2 - Math.PI / 2;
      out.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
    }
  } else {
    const top = Math.ceil(t.seats / 2), bottom = t.seats - top;
    const row = (n: number, y: number) => { for (let i = 0; i < n; i++) out.push({ x: ((i + 0.5) / n) * t.w, y }); };
    row(top, -7); row(bottom, t.h + 7);
  }
  return out;
}

interface NodeProps {
  t: TableDef; status: TableStatus; tabIndex: number; reduced: boolean; unavailableTick: number;
  onActivate: (t: TableDef) => void; onKey: (e: React.KeyboardEvent, t: TableDef) => void; onFocus: (t: TableDef) => void;
}

function TableNode({ t, status, tabIndex, reduced, unavailableTick, onActivate, onKey, onFocus }: NodeProps) {
  const shake = useAnimationControls();
  const cx = t.w / 2, cy = t.h / 2;
  const unavailable = status === 'taken' || status === 'blocked';

  // "shake" animacija kad gost klikne/hoveruje zauzet sto
  useEffect(() => {
    if (unavailableTick > 0 && !reduced) shake.start({ x: [0, -6, 6, -4, 4, -2, 0], transition: { duration: 0.45 } });
  }, [unavailableTick, reduced, shake]);

  const stroke = status === 'selected' ? COLOR.gold : unavailable ? COLOR.danger : status === 'toosmall' ? COLOR.muted : COLOR.accent;
  const fill = unavailable ? 'rgb(var(--danger) / .12)' : status === 'selected' ? 'rgb(var(--gold) / .16)' : COLOR.raised;
  const common = { className: 'body', style: { fill, stroke, strokeWidth: unavailable || status === 'selected' ? 2.5 : 1.75, strokeDasharray: status === 'toosmall' ? '4 4' : undefined } };
  const label = `Sto ${t.label}, ${t.seats} mesta, ${t.zone}, ${
    status === 'free' ? 'slobodan' : status === 'selected' ? 'izabran' : status === 'toosmall' ? 'premali za izabran broj osoba' : 'zauzeto'}`;
  const fs = Math.max(11, Math.min(18, t.h * 0.3));

  return (
    <g transform={`translate(${t.x} ${t.y})`}>
      <motion.g animate={shake}>
        <g
          className="table-node" role="button" tabIndex={tabIndex} aria-label={label}
          aria-pressed={status === 'selected'} aria-disabled={unavailable || status === 'toosmall'}
          data-table-id={t.id} data-status={status}
          onClick={() => onActivate(t)} onFocus={() => onFocus(t)}
          onKeyDown={(e) => onKey(e, t)}
          onMouseEnter={() => unavailable && onActivate(t)} /* hover na zauzet sto → shake + poruka */
        >
          {/* pulsirajući glow samo za slobodne */}
          {status === 'free' && (t.shape === 'round'
            ? <circle className="t-pulse" cx={cx} cy={cy} r={t.w / 2 + 5} style={{ fill: 'none', stroke: COLOR.accent, strokeWidth: 2 }} />
            : <rect className="t-pulse" x={-5} y={-5} width={t.w + 10} height={t.h + 10} rx={16} style={{ fill: 'none', stroke: COLOR.accent, strokeWidth: 2 }} />)}
          {/* fokus prsten (tastatura) */}
          {t.shape === 'round'
            ? <circle className="focus-ring" cx={cx} cy={cy} r={t.w / 2 + 10} style={{ fill: 'none', stroke: COLOR.gold, strokeWidth: 2, opacity: 0 }} />
            : <rect className="focus-ring" x={-10} y={-10} width={t.w + 20} height={t.h + 20} rx={18} style={{ fill: 'none', stroke: COLOR.gold, strokeWidth: 2, opacity: 0 }} />}
          {/* stolice */}
          {chairs(t).map((c, i) => <circle key={i} cx={c.x} cy={c.y} r={4.5} style={{ fill: unavailable ? 'rgb(var(--danger) / .5)' : 'rgb(var(--muted) / .45)' }} />)}
          {/* tabla */}
          {t.shape === 'round'
            ? <circle cx={cx} cy={cy} r={t.w / 2} {...common} style={{ ...common.style, filter: status === 'selected' ? 'url(#glow)' : undefined }} />
            : <rect width={t.w} height={t.h} rx={12} {...common} style={{ ...common.style, filter: status === 'selected' ? 'url(#glow)' : undefined }} />}
          <text x={cx} y={cy - (t.h > 50 ? 2 : 0)} textAnchor="middle" dominantBaseline="central" fontSize={fs} fontWeight={800}
            style={{ fill: unavailable ? COLOR.danger : COLOR.fg, fontFamily: 'var(--font-display)', pointerEvents: 'none' }}>{t.label}</text>
          {t.h > 50 && <text x={cx} y={cy + fs * 0.9} textAnchor="middle" fontSize={10} style={{ fill: COLOR.muted, pointerEvents: 'none' }}>{t.seats} mesta</text>}
          {unavailable && (
            <g style={{ pointerEvents: 'none' }}>
              <rect x={cx - 31} y={t.h + 14} width={62} height={16} rx={8} style={{ fill: COLOR.bg, stroke: COLOR.danger, strokeWidth: 1.5 }} />
              <text x={cx} y={t.h + 22.5} textAnchor="middle" dominantBaseline="central" fontSize={9.5} fontWeight={800} letterSpacing={1}
                style={{ fill: COLOR.danger }}>ZAUZETO</text>
            </g>
          )}
        </g>
      </motion.g>
    </g>
  );
}

export interface FloorPlanProps {
  layout: Layout;
  statusOf: (t: TableDef) => TableStatus;
  selectedId: string | null;
  onSelect: (t: TableDef) => void;
  /** Poziva se kad gost pokuša sto koji ne može da se izabere. */
  onUnavailable: (t: TableDef, status: TableStatus) => void;
}

export function FloorPlan({ layout, statusOf, selectedId, onSelect, onUnavailable }: FloorPlanProps) {
  const reduced = !!useReducedMotion();
  const { width: W, height: H } = layout;
  const [focusId, setFocusId] = useState<string | null>(null);
  const [ticks, setTicks] = useState<Record<string, number>>({});
  const wrap = useRef<HTMLDivElement>(null);
  const lastMsg = useRef(0);

  // ---- pan/zoom preko viewBox motion vrednosti ----
  const vx = useMotionValue(0), vy = useMotionValue(0), vw = useMotionValue(W), vh = useMotionValue(H);
  const viewBox = useMotionTemplate`${vx} ${vy} ${vw} ${vh}`;
  const selected = useMemo(() => layout.tables.find((t) => t.id === selectedId) ?? null, [layout, selectedId]);

  useEffect(() => {
    const narrow = typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches;
    const zoom = narrow && selected ? 0.58 : 1;
    const w = W * zoom, h = H * zoom;
    const cx = selected ? selected.x + selected.w / 2 : W / 2, cy = selected ? selected.y + selected.h / 2 : H / 2;
    const x = Math.min(Math.max(cx - w / 2, 0), W - w), y = Math.min(Math.max(cy - h / 2, 0), H - h);
    const opts = reduced ? { duration: 0 } : { duration: MOVE_MS, ease: EASE };
    const ctrls = [animate(vx, x, opts), animate(vy, y, opts), animate(vw, w, opts), animate(vh, h, opts)];
    return () => ctrls.forEach((c) => c.stop());
  }, [selected, W, H, reduced, vx, vy, vw, vh]);

  const activate = useCallback((t: TableDef) => {
    const s = statusOf(t);
    if (s === 'free' || s === 'selected') { onSelect(t); return; }
    setTicks((p) => ({ ...p, [t.id]: (p[t.id] ?? 0) + 1 }));
    const now = Date.now();
    if (now - lastMsg.current > 800) { lastMsg.current = now; onUnavailable(t, s); } // ograniči poruke pri hoveru
  }, [statusOf, onSelect, onUnavailable]);

  /** Strelice: fokus na najbliži sto u izabranom smeru. */
  const onKey = useCallback((e: React.KeyboardEvent, t: TableDef) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(t); return; }
    const dir = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] }[e.key];
    if (!dir) return;
    e.preventDefault();
    const c = (x: TableDef) => ({ x: x.x + x.w / 2, y: x.y + x.h / 2 });
    const from = c(t);
    let best: TableDef | null = null, bestScore = Infinity;
    for (const o of layout.tables) {
      if (o.id === t.id) continue;
      const p = c(o), dx = p.x - from.x, dy = p.y - from.y;
      const along = dx * dir[0] + dy * dir[1];
      if (along <= 0) continue;
      const score = along + 2 * Math.abs(dx * dir[1] + dy * dir[0]); // penalizuj bočno odstupanje
      if (score < bestScore) { bestScore = score; best = o; }
    }
    if (best) wrap.current?.querySelector<SVGGElement>(`[data-table-id="${CSS.escape(best.id)}"]`)?.focus();
  }, [layout.tables, activate]);

  const rovingId = focusId && layout.tables.some((t) => t.id === focusId) ? focusId : selectedId ?? layout.tables[0]?.id;
  const center = selected ? { x: selected.x + selected.w / 2, y: selected.y + selected.h / 2 } : null;
  const markerR = selected ? Math.max(selected.w, selected.h) / 2 + 16 : 0;

  return (
    <div ref={wrap} className="overflow-hidden rounded-2xl border border-white/10 bg-surface" style={{ aspectRatio: `${W} / ${H}` }}>
      <motion.svg viewBox={viewBox} className="block h-full w-full" role="group" aria-label="Plan lokala – izaberi sto strelicama i Enterom"
        preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0H0V40" fill="none" style={{ stroke: 'rgb(var(--fg) / .035)' }} strokeWidth="1" />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#grid)" />
        <rect x="3" y="3" width={W - 6} height={H - 6} rx="22" style={{ fill: 'none', stroke: 'rgb(var(--fg) / .12)', strokeWidth: 2 }} />

        {layout.fixtures.map((f) => (
          <g key={f.id} aria-hidden>
            <rect x={f.x} y={f.y} width={f.w} height={f.h} rx={10} style={{ fill: 'rgb(var(--fg) / .05)', stroke: 'rgb(var(--fg) / .18)', strokeWidth: 1.5 }} />
            <text x={f.x + f.w / 2} y={f.y + f.h / 2} textAnchor="middle" dominantBaseline="central" fontSize={12} letterSpacing={3} fontWeight={700}
              style={{ fill: COLOR.muted, fontFamily: 'var(--font-display)' }}>{f.label}</text>
          </g>
        ))}

        {layout.tables.map((t) => (
          <TableNode key={t.id} t={t} status={statusOf(t)} reduced={reduced} unavailableTick={ticks[t.id] ?? 0}
            tabIndex={t.id === rovingId ? 0 : -1} onActivate={activate} onKey={onKey} onFocus={(x) => setFocusId(x.id)} />
        ))}

        {/* Marker koji klizi od stola do stola */}
        {center && (
          <motion.g key="marker" initial={{ x: center.x, y: center.y }} animate={{ x: center.x, y: center.y }}
            transition={reduced ? { duration: 0 } : { duration: MOVE_MS, ease: EASE }} style={{ pointerEvents: 'none' }} data-testid="marker">
            <circle r={markerR} className="t-ring" style={{ fill: 'none', stroke: COLOR.gold, strokeWidth: 2.5, strokeDasharray: '10 10', filter: 'url(#glow)' }} />
            <path d={`M0 ${-markerR - 3} l-8 -12 h16 z`} style={{ fill: COLOR.gold }} />
          </motion.g>
        )}
      </motion.svg>
    </div>
  );
}
