/** Generisana "neon" pločica koja stoji dok vlasnik ne doda pravu fotografiju. */
export function Placeholder({ label = 'Dodaj fotografiju', hue = 0 }: { label?: string; hue?: number }) {
  return (
    <div className="relative grid h-full w-full place-items-center overflow-hidden"
      style={{ background: `radial-gradient(circle at ${30 + hue * 10}% 25%, rgb(var(--accent) / .28), transparent 60%), radial-gradient(circle at 80% 90%, rgb(var(--gold) / .16), transparent 55%), rgb(var(--raised))` }}>
      <svg viewBox="0 0 64 40" className="h-10 w-16 text-white/15" aria-hidden><path d="M2 20C14 4 30 0 46 12l14-9-5 17 5 17-14-9C30 40 14 36 2 20z" fill="currentColor" /></svg>
      <span className="absolute bottom-3 left-3 text-[11px] uppercase tracking-widest text-white/35">{label}</span>
    </div>
  );
}
