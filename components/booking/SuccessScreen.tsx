"use client";

import { m, useReducedMotion } from "framer-motion";
import { CalendarPlus, Home, MessageCircle } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { buildIcs, downloadIcs } from "@/lib/ics";
import { CANCELLATION_HOURS, siteConfig } from "@/lib/siteConfig";
import type { Service } from "@/lib/types";
import type { CustomerForm } from "@/lib/validation";
import { SummaryList } from "./StepReview";

export function SuccessScreen({
  service,
  startTime,
  customer,
  bookingId,
  cancelToken,
}: {
  service: Service;
  startTime: string;
  customer: CustomerForm;
  bookingId: string;
  cancelToken: string;
}) {
  const reduce = useReducedMotion();
  const cancelUrl = `${siteConfig.url}/otkazivanje/${cancelToken}`;

  function addToCalendar() {
    const start = new Date(startTime);
    const end = new Date(start.getTime() + service.duration_minutes * 60_000);
    const ics = buildIcs({
      uid: bookingId,
      start,
      end,
      title: `BOMBSHELL – ${service.name}`,
      description: `Termin u salonu lepote Bombshell.\nAdresa: ${siteConfig.address.full}\nTelefon: ${siteConfig.phone.display}\nOtkazivanje (najkasnije ${CANCELLATION_HOURS}h ranije): ${cancelUrl}`,
      url: cancelUrl,
    });
    downloadIcs("bombshell-termin.ics", ics);
  }

  return (
    <div className="text-center">
      <div className="mx-auto flex h-28 w-28 items-center justify-center" aria-hidden>
        <m.svg viewBox="0 0 100 100" className="h-28 w-28">
          <m.circle
            cx="50"
            cy="50"
            r="45"
            fill="#FCE8EE"
            stroke="#D4789A"
            strokeWidth="3"
            initial={reduce ? false : { pathLength: 0, scale: 0.8 }}
            animate={{ pathLength: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
          <m.path
            d="M30 52 L45 66 L71 37"
            fill="none"
            stroke="#B5507A"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={reduce ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.45, duration: 0.5, ease: "easeOut" }}
          />
        </m.svg>
      </div>
      <m.div initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <h2 className="mt-6 text-3xl font-medium sm:text-4xl" tabIndex={-1} id="uspeh-naslov">
          Vaš termin je zakazan!
        </h2>
        <p className="mx-auto mt-3 max-w-md text-ink-soft">
          Hvala Vam, {customer.name.split(" ")[0]}. Radujemo se Vašem dolasku.
        </p>
        <div className="mt-8 text-left">
          <SummaryList service={service} startTime={startTime} />
        </div>
        {customer.optIn && (
          <p className="mx-auto mt-6 flex max-w-md items-start gap-2 rounded-2xl bg-rose-50 p-4 text-left text-sm text-ink">
            <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-deeper" aria-hidden />
            Uskoro ćete dobiti potvrdu putem Vibera ili SMS-a, a dan pre termina i podsetnik. U poruci se nalazi i link za otkazivanje.
          </p>
        )}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button size="lg" onClick={addToCalendar}>
            <CalendarPlus className="h-5 w-5" aria-hidden /> Dodaj u kalendar
          </Button>
          <ButtonLink href="/" variant="secondary" size="lg">
            <Home className="h-5 w-5" aria-hidden /> Početna strana
          </ButtonLink>
        </div>
        <p className="mt-6 text-xs text-ink-soft">
          Želite da otkažete? <a href={`/otkazivanje/${cancelToken}`} className="font-medium text-rose-deeper underline-offset-4 hover:underline">Otkažite termin ovde</a> (najkasnije 24h ranije).
        </p>
      </m.div>
    </div>
  );
}
