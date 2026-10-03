"use client";

import { m, useReducedMotion } from "framer-motion";
import { CalendarX2, Moon, Sun, Sunrise } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Slot } from "@/lib/booking";

const GROUPS = [
  { label: "Pre podne", icon: Sunrise, test: (h: number) => h < 12 },
  { label: "Popodne", icon: Sun, test: (h: number) => h >= 12 && h < 17 },
  { label: "Uveče", icon: Moon, test: (h: number) => h >= 17 },
];

export function StepTime({
  slots,
  loading,
  error,
  selected,
  onSelect,
  onChangeDate,
}: {
  slots: Slot[];
  loading: boolean;
  error: string | null;
  selected: string | null;
  onSelect: (s: Slot) => void;
  onChangeDate: () => void;
}) {
  const reduce = useReducedMotion();

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5" aria-busy="true" aria-label="Učitavanje slobodnih termina">
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className="relative h-12 overflow-hidden rounded-xl bg-rose-light/60">
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm text-red-800">
        {error}
      </p>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="rounded-2xl border border-rose-light bg-white p-8 text-center shadow-card">
        <CalendarX2 className="mx-auto h-10 w-10 text-rose-dark" strokeWidth={1.5} aria-hidden />
        <p className="mt-4 font-medium text-ink">Za izabrani dan nema slobodnih termina.</p>
        <p className="mt-1 text-sm text-ink-soft">Izaberite drugi datum ili nas pozovite – možda nešto možemo da uklopimo.</p>
        <button type="button" onClick={onChangeDate} className="mt-5 text-sm font-semibold text-rose-deeper underline-offset-4 hover:underline">
          Izaberi drugi datum
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {GROUPS.map(({ label, icon: Icon, test }) => {
        const group = slots.filter((s) => test(Number(s.label.slice(0, 2))));
        if (group.length === 0) return null;
        return (
          <fieldset key={label}>
            <legend className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
              <Icon className="h-4 w-4 text-gold-dark" aria-hidden /> {label}
            </legend>
            <m.div
              className="grid grid-cols-3 gap-2 sm:grid-cols-5"
              initial={reduce ? false : "hidden"}
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.015 } } }}
            >
              {group.map((s) => {
                const isSel = selected === s.start_time;
                return (
                  <m.button
                    key={s.start_time}
                    type="button"
                    variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                    onClick={() => onSelect(s)}
                    aria-pressed={isSel}
                    className={cn(
                      "rounded-xl border py-3 text-sm font-semibold tabular-nums transition-all duration-200",
                      isSel
                        ? "border-rose-deep bg-rose-deep text-white shadow-glow"
                        : "border-rose-light bg-white text-ink hover:border-rose-dark hover:bg-rose-50",
                    )}
                  >
                    {s.label}
                  </m.button>
                );
              })}
            </m.div>
          </fieldset>
        );
      })}
    </div>
  );
}
