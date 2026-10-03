"use client";

import { cn } from "@/lib/cn";
import { capitalize, formatBelgrade, formatTime, todayInBelgrade } from "@/lib/time";
import { ymdToDate } from "@/lib/time";
import { format } from "date-fns";
import { srLatn } from "date-fns/locale";
import type { Booking } from "@/lib/types";
import { STATUS_BLOCK } from "./ui";

const START_H = 8;
const END_H = 22;
const PX_PER_MIN = 1.1;

/** Kalendarski prikaz (jedan ili više dana) sa vremenskom osom 08–22h. */
export function TimeGrid({ days, bookings, onSelect, showCancelled }: { days: string[]; bookings: Booking[]; onSelect: (b: Booking) => void; showCancelled: boolean }) {
  const today = todayInBelgrade();
  const height = (END_H - START_H) * 60 * PX_PER_MIN;
  const hours = Array.from({ length: END_H - START_H + 1 }, (_, i) => START_H + i);
  const minutesOf = (iso: string) => {
    const [h, m] = formatBelgrade(iso, "HH:mm").split(":").map(Number);
    return h * 60 + m;
  };
  const byDay = (ymd: string) =>
    bookings.filter((b) => formatBelgrade(b.start_time, "yyyy-MM-dd") === ymd && (showCancelled || b.status !== "cancelled"));

  return (
    <div className="overflow-x-auto rounded-2xl border border-rose-light bg-white shadow-card">
      <div className={cn("flex", days.length > 1 && "min-w-[860px]")}>
        <div className="w-12 shrink-0 border-r border-rose-light">
          <div className="h-12 border-b border-rose-light" />
          <div className="relative" style={{ height }}>
            {hours.map((h) => (
              <span key={h} className="absolute right-1.5 -translate-y-1/2 text-[0.65rem] tabular-nums text-ink-soft" style={{ top: (h - START_H) * 60 * PX_PER_MIN }}>
                {String(h).padStart(2, "0")}:00
              </span>
            ))}
          </div>
        </div>
        {days.map((ymd) => {
          const d = ymdToDate(ymd);
          const list = byDay(ymd);
          return (
            <div key={ymd} className="min-w-0 flex-1 border-r border-rose-light last:border-r-0">
              <div className={cn("flex h-12 flex-col items-center justify-center border-b border-rose-light text-xs", ymd === today && "bg-rose-light font-semibold text-rose-deeper")}>
                <span className="uppercase tracking-wider">{format(d, "EEE", { locale: srLatn })}</span>
                <span className="text-sm">{capitalize(format(d, "d. MMM", { locale: srLatn }))}</span>
              </div>
              <div className="relative" style={{ height }}>
                {hours.map((h) => (
                  <div key={h} className="absolute inset-x-0 border-t border-rose-light/60" style={{ top: (h - START_H) * 60 * PX_PER_MIN }} />
                ))}
                {list.map((b) => {
                  const top = (minutesOf(b.start_time) - START_H * 60) * PX_PER_MIN;
                  const h = Math.max(22, (minutesOf(b.end_time) - minutesOf(b.start_time)) * PX_PER_MIN - 2);
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => onSelect(b)}
                      className={cn(
                        "absolute inset-x-1 overflow-hidden rounded-lg border-l-4 px-2 py-1 text-left text-xs shadow-sm transition-transform hover:z-10 hover:scale-[1.02]",
                        STATUS_BLOCK[b.status],
                      )}
                      style={{ top, height: h }}
                      title={`${b.customer_name} – ${b.services?.name}`}
                    >
                      <span className="block truncate font-semibold">
                        {formatTime(b.start_time)} {b.customer_name}
                      </span>
                      <span className="block truncate opacity-80">{b.services?.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
