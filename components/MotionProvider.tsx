"use client";

import { LazyMotion } from "framer-motion";

// Animacione mogućnosti (uključujući drag/swipe) se učitavaju asinhrono posle prvog
// prikaza, pa početni JavaScript ostaje mali (bolji Lighthouse rezultat na mobilnom).
const loadFeatures = () => import("framer-motion").then((mod) => mod.domMax);

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      {children}
    </LazyMotion>
  );
}
