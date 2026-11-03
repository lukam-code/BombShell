'use client';
import { useEffect, useState } from 'react';
import { Logo } from '../Logo';

const links = [
  ['O nama', '#o-nama'], ['Meni', '#meni'], ['Galerija', '#galerija'], ['Događaji', '#dogadjaji'], ['Kontakt', '#kontakt'],
];

export function Nav() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setSolid(window.scrollY > 24);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition ${solid || open ? 'bg-bg/85 backdrop-blur-lg border-b border-white/5' : ''}`}>
      <nav aria-label="Glavna navigacija" className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="#top" aria-label="Barakudans – početak"><Logo className="text-xs tracking-[.1em] sm:text-base sm:tracking-[.14em]" /></a>
        <ul className="hidden items-center gap-7 text-sm text-muted md:flex">
          {links.map(([l, h]) => <li key={h}><a href={h} className="transition hover:text-fg">{l}</a></li>)}
        </ul>
        <div className="flex items-center gap-2">
          <a href="#rezervacija" className="btn-primary !min-h-10 whitespace-nowrap px-4 text-sm sm:px-5">Rezerviši sto</a>
          <button className="grid h-10 w-10 place-items-center rounded-full border border-white/10 md:hidden" aria-expanded={open} aria-controls="mobile-menu" aria-label="Meni" onClick={() => setOpen(!open)}>
            <span className="block h-0.5 w-4 bg-fg before:absolute before:-translate-y-1.5 before:block before:h-0.5 before:w-4 before:bg-fg after:absolute after:translate-y-1.5 after:block after:h-0.5 after:w-4 after:bg-fg" />
          </button>
        </div>
      </nav>
      {open && (
        <ul id="mobile-menu" className="border-t border-white/5 bg-bg/95 px-4 pb-4 md:hidden">
          {links.map(([l, h]) => <li key={h}><a href={h} onClick={() => setOpen(false)} className="block py-3 text-lg">{l}</a></li>)}
        </ul>
      )}
    </header>
  );
}
