"use client";

import { ChevronRight, Clock } from "lucide-react";
import { cn } from "@/lib/cn";
import { CategoryIcon } from "@/lib/icons";
import { formatDuration, formatPrice } from "@/lib/time";
import type { CategoryWithServices, Service } from "@/lib/types";

export function StepService({
  categories,
  categoryId,
  serviceId,
  onCategory,
  onService,
}: {
  categories: CategoryWithServices[];
  categoryId: string | null;
  serviceId: string | null;
  onCategory: (id: string | null) => void;
  onService: (s: Service) => void;
}) {
  const category = categories.find((c) => c.id === categoryId);

  if (!category) {
    return (
      <div>
        <h2 className="sr-only">Izaberite kategoriju</h2>
        <p className="text-ink-soft">Koju vrstu tretmana želite? Izaberite kategoriju.</p>
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {categories.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onCategory(c.id)}
                className="group flex h-full w-full flex-col items-center gap-3 rounded-2xl border border-rose-light bg-white p-5 text-center shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-rose hover:shadow-soft"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-light text-rose-deeper transition-colors group-hover:bg-rose-deep group-hover:text-white">
                  <CategoryIcon name={c.icon} className="h-6 w-6" />
                </span>
                <span className="font-medium text-ink">{c.name}</span>
                <span className="text-xs text-ink-soft">
                  {c.services.length} {c.services.length === 1 ? "usluga" : c.services.length < 5 ? "usluge" : "usluga"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div>
      <button type="button" onClick={() => onCategory(null)} className="mb-4 text-sm font-medium text-rose-deeper hover:underline">
        ← Sve kategorije
      </button>
      <h2 className="text-2xl font-medium sm:text-3xl">{category.name}</h2>
      <p className="mt-2 text-ink-soft">Izaberite uslugu</p>
      <ul className="mt-6 space-y-3">
        {category.services.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => onService(s)}
              aria-pressed={serviceId === s.id}
              className={cn(
                "group flex w-full items-center gap-4 rounded-2xl border bg-white p-4 text-left shadow-card transition-all duration-300 hover:border-rose hover:shadow-soft sm:p-5",
                serviceId === s.id ? "border-rose-deep ring-2 ring-rose/40" : "border-rose-light",
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink">{s.name}</p>
                {s.description && <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{s.description}</p>}
                <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  <span className="inline-flex items-center gap-1 text-ink-soft">
                    <Clock className="h-4 w-4" aria-hidden /> {formatDuration(s.duration_minutes)}
                  </span>
                  <span className="font-semibold text-ink">{formatPrice(s.price_rsd)}</span>
                </p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-rose-dark transition-transform group-hover:translate-x-1" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
