"use client";

import { m, useReducedMotion } from "framer-motion";
import { CalendarHeart, Clock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { fadeUp, Reveal } from "@/components/ui/Reveal";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { cn } from "@/lib/cn";
import { CategoryIcon } from "@/lib/icons";
import { formatDuration, formatPrice } from "@/lib/time";
import type { CategoryWithServices } from "@/lib/types";

export function Services({ categories }: { categories: CategoryWithServices[] | null }) {
  // Podrazumevano prva kategorija – kraći prikaz na telefonu; "Sve usluge" je jedan klik dalje.
  const [active, setActive] = useState<string>(categories?.[0]?.id ?? "sve");
  const reduce = useReducedMotion();
  const list = categories ?? [];
  const visible =
    active === "sve"
      ? list.flatMap((c) => c.services.map((s) => ({ ...s, category: c })))
      : list.filter((c) => c.id === active).flatMap((c) => c.services.map((s) => ({ ...s, category: c })));

  return (
    <section id="usluge" aria-labelledby="usluge-naslov" className="py-20 sm:py-28">
      <div className="container-page">
        <Reveal>
          <SectionTitle
            id="usluge-naslov"
            eyebrow="Naše usluge"
            title="Sve za Vašu lepotu na jednom mestu"
            subtitle="Od frizure i manikira do masaža i svilenih trepavica – izaberite tretman i zakažite termin u nekoliko klikova."
          />
        </Reveal>

        {categories === null || list.length === 0 ? (
          <p className="mx-auto max-w-md rounded-2xl bg-white p-8 text-center text-ink-soft shadow-card">
            Spisak usluga trenutno nije dostupan. Pozovite nas i rado ćemo Vam pomoći oko termina.
          </p>
        ) : (
          <>
            <div
              role="group"
              aria-label="Filtriraj po kategoriji"
              className="-mx-5 mb-10 flex gap-2 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:justify-center sm:px-0"
            >
              {[{ id: "sve", name: "Sve usluge" }, ...list].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={active === c.id}
                  onClick={() => setActive(c.id)}
                  className={cn(
                    "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-300",
                    active === c.id
                      ? "border-rose-deep bg-rose-deep text-white shadow-soft"
                      : "border-rose-light bg-white text-ink hover:border-rose-dark hover:text-rose-deeper",
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>

            <m.ul
              key={active}
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
              initial={reduce ? false : "hidden"}
              whileInView="show"
              viewport={{ once: true, margin: "-40px" }}
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
            >
                {visible.map((s) => (
                  <m.li
                    key={s.id}
                    variants={fadeUp}
                    className="group flex flex-col rounded-2xl border border-rose-light/80 bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-rose/60 hover:shadow-soft"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-light text-rose-deeper transition-colors duration-300 group-hover:bg-rose-deep group-hover:text-white">
                        <CategoryIcon name={s.category.icon} className="h-6 w-6" />
                      </span>
                      <span className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-gold-dark">
                        {s.category.name}
                      </span>
                    </div>
                    <h3 className="mt-5 text-xl font-medium text-ink">{s.name}</h3>
                    {s.description && <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">{s.description}</p>}
                    <div className="mt-5 flex items-center justify-between border-t border-rose-light pt-4">
                      <div>
                        <p className="font-semibold text-ink">{formatPrice(s.price_rsd)}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-soft">
                          <Clock className="h-3.5 w-3.5" aria-hidden /> {formatDuration(s.duration_minutes)}
                        </p>
                      </div>
                      <Link
                        href={`/zakazivanje?usluga=${s.id}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-rose-dark px-4 py-2 text-sm font-semibold text-rose-deeper transition-all duration-300 hover:scale-105 hover:bg-rose-deep hover:text-white hover:shadow-glow"
                        aria-label={`Zakaži: ${s.name}`}
                      >
                        <CalendarHeart className="h-4 w-4" aria-hidden /> Zakaži
                      </Link>
                    </div>
                  </m.li>
                ))}
            </m.ul>
          </>
        )}
      </div>
    </section>
  );
}
