"use client";

import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { srLatn } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { capitalize, dateToYmd, ymdToDate } from "@/lib/time";

const WEEKDAYS = ["Pon", "Uto", "Sre", "Čet", "Pet", "Sub", "Ned"];

/**
 * Pristupačan kalendar: strelice pomeraju fokus, Enter/razmak bira dan,
 * PageUp/PageDown menjaju mesec, Home/End skaču na početak/kraj nedelje.
 */
export function Calendar({
  value,
  onSelect,
  minYmd,
  maxYmd,
  isDisabled,
}: {
  value: string | null;
  onSelect: (ymd: string) => void;
  minYmd: string;
  maxYmd: string;
  isDisabled: (ymd: string) => boolean;
}) {
  const min = ymdToDate(minYmd);
  const max = ymdToDate(maxYmd);
  const [month, setMonth] = useState(() => startOfMonth(value ? ymdToDate(value) : min));
  const [focused, setFocused] = useState<Date>(() => (value ? ymdToDate(value) : min));
  const gridRef = useRef<HTMLDivElement>(null);
  const shouldFocus = useRef(false);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    const list: Date[] = [];
    for (let d = start; !isAfter(d, end); d = addDays(d, 1)) list.push(d);
    return list;
  }, [month]);

  const outOfRange = (d: Date) => isBefore(d, min) || isAfter(d, max);
  const disabled = (d: Date) => outOfRange(d) || isDisabled(dateToYmd(d));

  useEffect(() => {
    if (!shouldFocus.current) return;
    shouldFocus.current = false;
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-ymd="${dateToYmd(focused)}"]`)?.focus();
  }, [focused, month]);

  function moveFocus(next: Date) {
    if (isBefore(next, min)) next = min;
    if (isAfter(next, max)) next = max;
    shouldFocus.current = true;
    setFocused(next);
    if (!isSameMonth(next, month)) setMonth(startOfMonth(next));
  }

  function onKeyDown(e: React.KeyboardEvent, d: Date) {
    const map: Record<string, () => Date> = {
      ArrowLeft: () => addDays(d, -1),
      ArrowRight: () => addDays(d, 1),
      ArrowUp: () => addDays(d, -7),
      ArrowDown: () => addDays(d, 7),
      Home: () => startOfWeek(d, { weekStartsOn: 1 }),
      End: () => endOfWeek(d, { weekStartsOn: 1 }),
      PageUp: () => addMonths(d, -1),
      PageDown: () => addMonths(d, 1),
    };
    if (map[e.key]) {
      e.preventDefault();
      moveFocus(map[e.key]());
    }
  }

  const canPrev = isAfter(startOfMonth(month), min);
  const canNext = isBefore(endOfMonth(month), max);

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-rose-light bg-white p-4 shadow-card sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMonth(addMonths(month, -1))}
          disabled={!canPrev}
          className="rounded-full p-2 text-rose-deeper transition-colors hover:bg-rose-light disabled:opacity-30"
          aria-label="Prethodni mesec"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h3 className="font-serif text-xl text-ink" aria-live="polite" id="cal-month">
          {capitalize(format(month, "LLLL yyyy.", { locale: srLatn }))}
        </h3>
        <button
          type="button"
          onClick={() => setMonth(addMonths(month, 1))}
          disabled={!canNext}
          className="rounded-full p-2 text-rose-deeper transition-colors hover:bg-rose-light disabled:opacity-30"
          aria-label="Sledeći mesec"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      <div role="grid" aria-labelledby="cal-month" ref={gridRef}>
        <div role="row" className="mb-2 grid grid-cols-7 text-center text-xs font-semibold uppercase tracking-wider text-ink-soft">
          {WEEKDAYS.map((w) => (
            <span role="columnheader" key={w} className="py-1">
              {w}
            </span>
          ))}
        </div>
        {Array.from({ length: days.length / 7 }).map((_, row) => (
          <div role="row" key={row} className="grid grid-cols-7 gap-1">
            {days.slice(row * 7, row * 7 + 7).map((d) => {
              const ymd = dateToYmd(d);
              const inMonth = isSameMonth(d, month);
              const isDis = disabled(d);
              const selected = value === ymd;
              const isToday = ymd === minYmd;
              const tabbable = isSameDay(d, focused) && inMonth;
              return (
                <div role="gridcell" key={ymd} aria-selected={selected} className="flex justify-center">
                  {inMonth ? (
                    <button
                      type="button"
                      data-ymd={ymd}
                      tabIndex={tabbable ? 0 : -1}
                      aria-disabled={isDis}
                      aria-label={`${format(d, "EEEE, d. MMMM", { locale: srLatn })}${isDis ? " – nije dostupno" : ""}`}
                      onClick={() => !isDis && onSelect(ymd)}
                      onKeyDown={(e) => {
                        if ((e.key === "Enter" || e.key === " ") && isDis) e.preventDefault();
                        onKeyDown(e, d);
                      }}
                      onFocus={() => setFocused(d)}
                      className={cn(
                        "relative flex aspect-square w-full max-w-[3rem] items-center justify-center rounded-full text-sm transition-all duration-200",
                        selected && "bg-rose-deep font-semibold text-white shadow-glow",
                        !selected && !isDis && "font-medium text-ink hover:bg-rose-light",
                        isDis && "cursor-not-allowed text-ink-soft/40 line-through decoration-ink-soft/30",
                      )}
                    >
                      {format(d, "d")}
                      {isToday && !selected && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-gold" aria-hidden />}
                    </button>
                  ) : (
                    <span aria-hidden className="aspect-square w-full max-w-[3rem]" />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <p className="mt-4 flex items-center justify-center gap-4 text-xs text-ink-soft">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden /> danas
        </span>
        <span>Nedeljom ne radimo</span>
      </p>
    </div>
  );
}
