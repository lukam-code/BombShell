import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export const STEPS = ["Usluga", "Datum", "Termin", "Podaci", "Potvrda"];

export function ProgressBar({ step }: { step: number }) {
  const pct = ((step - 1) / (STEPS.length - 1)) * 100;
  return (
    <div className="mb-8 sm:mb-10">
      <p className="sr-only" aria-live="polite">
        Korak {step} od {STEPS.length}: {STEPS[step - 1]}
      </p>
      <div className="relative" aria-hidden>
        <div className="absolute left-4 right-4 top-4 h-0.5 rounded bg-rose-light sm:left-5 sm:right-5 sm:top-5" />
        <div
          className="absolute left-4 top-4 h-0.5 rounded bg-gradient-to-r from-rose to-rose-deep transition-[width] duration-500 ease-out sm:left-5 sm:top-5"
          style={{ width: `calc((100% - 2.5rem) * ${pct / 100})` }}
        />
        <ol className="relative flex justify-between">
          {STEPS.map((label, i) => {
            const n = i + 1;
            const done = n < step;
            const current = n === step;
            return (
              <li key={label} className="flex flex-col items-center gap-2">
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold transition-all duration-500 sm:h-10 sm:w-10",
                    done && "border-rose-deep bg-rose-deep text-white",
                    current && "scale-110 border-rose-deep bg-white text-rose-deeper shadow-soft",
                    !done && !current && "border-rose-light bg-white text-ink-soft",
                  )}
                >
                  {done ? <Check className="h-4 w-4" /> : n}
                </span>
                <span className={cn("hidden text-xs font-medium sm:block", current ? "text-rose-deeper" : "text-ink-soft")}>{label}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
