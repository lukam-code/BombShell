'use client';
/**
 * Rezervacija je daleko ispod hero sekcije, pa se njen JS (React stablo + framer-motion + plan)
 * učitava tek kad se sekcija približi ekranu (ili kad se klikne "Rezerviši sto"). Poboljšava TBT/LCP.
 */
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

const Booking = dynamic(() => import('./Booking').then((m) => m.Booking), { ssr: false });

export function BookingLazy() {
  const ref = useRef<HTMLDivElement>(null);
  const [load, setLoad] = useState(false);

  useEffect(() => {
    if (load || !ref.current) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setLoad(true); io.disconnect(); } }, { rootMargin: '900px 0px' });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [load]);

  return load ? <Booking /> : (
    <section id="rezervacija" ref={ref} className="scroll-mt-16 bg-surface/50" aria-label="Rezervacija">
      <div className="section min-h-[1100px]">
        <p className="eyebrow">Rezervacija</p>
        <h2 className="h2 mt-3">Izaberi svoj sto</h2>
        <noscript><p className="mt-4 text-muted">Za online rezervaciju je potreban uključen JavaScript – pozovi nas telefonom.</p></noscript>
      </div>
    </section>
  );
}
