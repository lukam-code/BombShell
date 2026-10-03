"use client";

import { useEffect } from "react";

const KEY = "bombshell-intro-seen";

/**
 * Intro "BOMBSHELL" (fade-in + blagi scale, ukupno 1.5s), samo jednom po sesiji.
 * Animacija je čist CSS (ne čeka JavaScript), pa ne usporava prikaz stranice.
 * Skripta u <head> dodaje klasu `intro-seen` pre prvog iscrtavanja ako je intro već viđen
 * ili ako korisnik ima uključeno "prefers-reduced-motion" – tada se overlay uopšte ne prikazuje.
 */
export function IntroAnimation() {
  useEffect(() => {
    try {
      sessionStorage.setItem(KEY, "1");
    } catch {}
  }, []);

  return (
    <div aria-hidden className="intro-overlay fixed inset-0 z-[90] flex items-center justify-center bg-cream">
      <div className="intro-mark text-center">
        <p className="font-serif text-4xl font-semibold tracking-[0.25em] text-ink sm:text-6xl">BOMBSHELL</p>
        <span className="intro-line mx-auto mt-4 block h-px bg-gold" />
      </div>
    </div>
  );
}

/** Inline skripta za <head>: sakriva intro pre prvog iscrtavanja ako ne treba da se prikaže. */
export const introScript = `try{if(sessionStorage.getItem("${KEY}")||matchMedia("(prefers-reduced-motion: reduce)").matches){document.documentElement.classList.add("intro-seen")}}catch(e){}`;
