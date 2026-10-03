"use client";

import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { ArrowLeft, Phone } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { mapRpcError, type Slot } from "@/lib/booking";
import { normalizeSerbianPhone } from "@/lib/phone";
import { MAX_BOOKING_DAYS_AHEAD, siteConfig } from "@/lib/siteConfig";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { addDaysYmd, capitalize, formatDuration, formatPrice, formatYmdLong, todayInBelgrade } from "@/lib/time";
import type { CategoryWithServices, Service } from "@/lib/types";
import type { CustomerForm } from "@/lib/validation";
import { Calendar } from "./Calendar";
import { ProgressBar, STEPS } from "./ProgressBar";
import dynamic from "next/dynamic";
import type { StepDetailsHandle } from "./StepDetails";
import { StepService } from "./StepService";
import { StepTime } from "./StepTime";

// Kasniji koraci (forma sa validacijom, pregled, ekran uspeha) se učitavaju po potrebi.
const StepDetails = dynamic(() => import("./StepDetails").then((mod) => mod.StepDetails), { ssr: false });
const StepReview = dynamic(() => import("./StepReview").then((mod) => mod.StepReview), { ssr: false });
const SuccessScreen = dynamic(() => import("./SuccessScreen").then((mod) => mod.SuccessScreen), { ssr: false });

const EMPTY_CUSTOMER: CustomerForm = { name: "", phone: "", email: "", note: "", optIn: true, website: "" };

type Success = { id: string; cancelToken: string };

export function BookingWizard({
  categories,
  initialServiceId,
}: {
  categories: CategoryWithServices[];
  initialServiceId?: string;
}) {
  const allServices = useMemo(() => categories.flatMap((c) => c.services), [categories]);
  const initialService = allServices.find((s) => s.id === initialServiceId) ?? null;

  const [step, setStep] = useState(initialService ? 2 : 1);
  const [direction, setDirection] = useState(1);
  const [categoryId, setCategoryId] = useState<string | null>(initialService?.category_id ?? null);
  const [service, setService] = useState<Service | null>(initialService);
  const [date, setDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [customer, setCustomer] = useState<CustomerForm>(EMPTY_CUSTOMER);
  const [accepted, setAccepted] = useState(false);

  const [closedDates, setClosedDates] = useState<Set<string>>(new Set());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState<Success | null>(null);

  const detailsRef = useRef<StepDetailsHandle>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const today = useMemo(() => todayInBelgrade(), []);
  const maxDate = useMemo(() => addDaysYmd(today, MAX_BOOKING_DAYS_AHEAD), [today]);

  // Kasnije korake učitaj u pozadini, da prelaz bude trenutan
  useEffect(() => {
    const t = setTimeout(() => {
      import("./StepDetails");
      import("./StepReview");
      import("./SuccessScreen");
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  // Neradni dani (nedelje, blokirani datumi) za kalendar
  useEffect(() => {
    getBrowserSupabase()
      .rpc("get_closed_dates", { p_from: today, p_to: maxDate })
      .then(({ data }) => {
        if (data) setClosedDates(new Set((data as { date: string }[]).map((d) => d.date)));
      });
  }, [today, maxDate]);

  const loadSlots = useCallback(async (serviceId: string, ymd: string) => {
    setSlotsLoading(true);
    setSlotsError(null);
    const { data, error } = await getBrowserSupabase().rpc("get_available_slots", { p_service_id: serviceId, p_date: ymd });
    if (error) {
      setSlotsError("Slobodni termini trenutno ne mogu da se učitaju. Pokušajte ponovo ili nas pozovite.");
      setSlots([]);
    } else {
      setSlots((data ?? []) as Slot[]);
    }
    setSlotsLoading(false);
  }, []);

  useEffect(() => {
    if (step === 3 && service && date) loadSlots(service.id, date);
  }, [step, service, date, loadSlots]);

  const goTo = useCallback(
    (next: number) => {
      if (step === 4 && next < 4 && detailsRef.current) {
        // čuvamo unete podatke i kada se korisnik vrati unazad
        setCustomer({ ...EMPTY_CUSTOMER, ...detailsRef.current.getValues() });
      }
      setDirection(next > step ? 1 : -1);
      setStep(next);
      setSubmitError(null);
    },
    [step],
  );

  // Fokus na naslov koraka zbog čitača ekrana i tastature
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }, [step, success, reduce]);

  async function confirm() {
    if (!service || !slot) return;
    setSubmitting(true);
    setSubmitError(null);
    const phone = normalizeSerbianPhone(customer.phone);
    const { data, error } = await getBrowserSupabase()
      .rpc("create_booking", {
        p_service_id: service.id,
        p_start_time: slot.start_time,
        p_customer_name: customer.name.trim(),
        p_customer_phone: phone,
        p_customer_email: customer.email?.trim() || null,
        p_note: customer.note?.trim() || null,
        p_notifications_opt_in: customer.optIn,
        p_honeypot: customer.website || null,
      })
      .single<{ id: string; cancel_token: string }>();
    setSubmitting(false);

    if (error || !data) {
      const mapped = mapRpcError(error);
      if (mapped.kind === "slot_taken") {
        setSlot(null);
        setNotice(mapped.message);
        goTo(3); // osveženi slotovi se učitavaju automatski
        return;
      }
      setSubmitError(mapped.message);
      return;
    }
    setDirection(1);
    setSuccess({ id: data.id, cancelToken: data.cancel_token });
  }

  const stepTitle: Record<number, string> = {
    1: "Izaberite uslugu",
    2: "Izaberite datum",
    3: "Izaberite vreme",
    4: "Vaši podaci",
    5: "Pregled i potvrda",
  };

  if (categories.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-card">
        <p className="text-ink">Online zakazivanje trenutno nije dostupno.</p>
        <a href={siteConfig.phone.href} className="mt-4 inline-flex items-center gap-2 font-semibold text-rose-deeper">
          <Phone className="h-4 w-4" aria-hidden /> Pozovite nas: {siteConfig.phone.display}
        </a>
      </div>
    );
  }

  return (
    <div>
      {!success && <ProgressBar step={step} />}

      <div ref={headingRef} tabIndex={-1} className="outline-none">
        {!success && (
          <div className="mb-6 flex items-center gap-3">
            {step > 1 && (
              <button
                type="button"
                onClick={() => goTo(step - 1)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-rose-light bg-white text-rose-deeper transition-colors hover:bg-rose-light"
                aria-label={`Nazad na korak: ${STEPS[step - 2]}`}
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-dark">
                Korak {step} od {STEPS.length}
              </p>
              <h1 className="text-2xl font-medium sm:text-3xl">{stepTitle[step]}</h1>
            </div>
          </div>
        )}
      </div>

      {/* Rezime izbora (vidljiv od 2. koraka) */}
      {!success && service && step > 1 && (
        <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl bg-rose-50 px-4 py-3 text-sm">
          <span className="font-semibold text-ink">{service.name}</span>
          <span className="text-ink-soft">{formatDuration(service.duration_minutes)}</span>
          <span className="text-ink-soft">{formatPrice(service.price_rsd)}</span>
          {date && step > 2 && <span className="text-ink-soft">{capitalize(formatYmdLong(date))}</span>}
          {slot && step > 3 && <span className="font-semibold text-rose-deeper">u {slot.label}</span>}
        </div>
      )}

      <div className="relative">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <m.div
            key={success ? "success" : step}
            custom={direction}
            initial={reduce ? { opacity: 0 } : { opacity: 0, x: direction * 48 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, x: direction * -48 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {success && service && slot ? (
              <SuccessScreen service={service} startTime={slot.start_time} customer={customer} bookingId={success.id} cancelToken={success.cancelToken} />
            ) : step === 1 ? (
              <StepService
                categories={categories}
                categoryId={categoryId}
                serviceId={service?.id ?? null}
                onCategory={setCategoryId}
                onService={(s) => {
                  if (s.id !== service?.id) setSlot(null);
                  setService(s);
                  goTo(2);
                }}
              />
            ) : step === 2 ? (
              <Calendar
                value={date}
                minYmd={today}
                maxYmd={maxDate}
                isDisabled={(ymd) => closedDates.has(ymd)}
                onSelect={(ymd) => {
                  if (ymd !== date) setSlot(null);
                  setDate(ymd);
                  setNotice(null);
                  goTo(3);
                }}
              />
            ) : step === 3 ? (
              <div>
                {notice && (
                  <p role="alert" className="mb-5 rounded-2xl border border-rose-dark/40 bg-rose-50 p-4 text-sm font-medium text-rose-deeper">
                    {notice}
                  </p>
                )}
                {date && <p className="mb-5 text-ink-soft">Slobodni termini za: <strong className="text-ink">{capitalize(formatYmdLong(date))}</strong></p>}
                <StepTime
                  slots={slots}
                  loading={slotsLoading}
                  error={slotsError}
                  selected={slot?.start_time ?? null}
                  onChangeDate={() => goTo(2)}
                  onSelect={(s) => {
                    setSlot(s);
                    setNotice(null);
                    goTo(4);
                  }}
                />
              </div>
            ) : step === 4 ? (
              <StepDetails
                ref={detailsRef}
                defaultValues={customer}
                onSubmit={(v) => {
                  setCustomer({ ...EMPTY_CUSTOMER, ...v });
                  setDirection(1);
                  setStep(5);
                }}
              />
            ) : step === 5 && service && slot ? (
              <StepReview
                service={service}
                startTime={slot.start_time}
                customer={customer}
                accepted={accepted}
                onAccept={setAccepted}
                onConfirm={confirm}
                submitting={submitting}
                error={submitError}
              />
            ) : null}
          </m.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
