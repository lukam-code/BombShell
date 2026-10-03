"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { m } from "framer-motion";
import { CheckCircle2, Star } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Honeypot, Input, Select, Textarea } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { CategoryWithServices } from "@/lib/types";
import { reviewSchema, type ReviewForm as ReviewFormValues } from "@/lib/validation";

const LABELS = ["", "Loše", "Može bolje", "Dobro", "Vrlo dobro", "Odlično"];

export function ReviewForm({ categories, onDone }: { categories: CategoryWithServices[]; onDone: () => void }) {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [hover, setHover] = useState(0);
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { name: "", rating: 0, serviceId: "", text: "", website: "" },
  });
  const textLen = watch("text")?.length ?? 0;

  async function onSubmit(values: ReviewFormValues) {
    setServerError(null);
    // Honeypot: botovi popune skriveno polje – tiho "uspešno" bez upisa.
    if (values.website) {
      setSent(true);
      return;
    }
    try {
      const sb = getBrowserSupabase();
      const { error } = await sb.from("reviews").insert({
        customer_name: values.name.trim(),
        rating: values.rating,
        text: values.text.trim(),
        service_id: values.serviceId || null,
        is_approved: false,
      });
      if (error) throw error;
      setSent(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      setServerError(
        msg.includes("Previše") ? msg : "Slanje trenutno nije uspelo. Pokušajte ponovo za nekoliko minuta.",
      );
    }
  }

  if (sent) {
    return (
      <m.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-6 text-center" role="status">
        <CheckCircle2 className="mx-auto h-14 w-14 text-rose-deep" strokeWidth={1.5} aria-hidden />
        <p className="mt-4 text-lg font-medium text-ink">Hvala! Vaša recenzija će biti objavljena nakon odobrenja.</p>
        <Button variant="secondary" className="mt-6" onClick={onDone}>
          Zatvori
        </Button>
      </m.div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="relative space-y-5">
      <Honeypot {...register("website")} />
      <Input label="Ime" required autoComplete="given-name" placeholder="npr. Jelena M." error={errors.name?.message} {...register("name")} />

      <fieldset>
        <legend className="mb-1.5 block text-sm font-medium text-ink">
          Ocena<span className="ml-0.5 text-rose-deeper" aria-hidden>*</span>
        </legend>
        <Controller
          control={control}
          name="rating"
          render={({ field }) => (
            <div className="flex items-center gap-3">
              <div className="flex" role="radiogroup" aria-label="Ocena od 1 do 5" onMouseLeave={() => setHover(0)}>
                {[1, 2, 3, 4, 5].map((n) => {
                  const active = (hover || field.value) >= n;
                  return (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={field.value === n}
                      aria-label={`${n} ${n === 1 ? "zvezdica" : n < 5 ? "zvezdice" : "zvezdica"}`}
                      tabIndex={field.value ? (field.value === n ? 0 : -1) : n === 1 ? 0 : -1}
                      onMouseEnter={() => setHover(n)}
                      onClick={() => field.onChange(n)}
                      onKeyDown={(e) => {
                        if (e.key === "ArrowRight" || e.key === "ArrowUp") {
                          e.preventDefault();
                          const v = Math.min(5, (field.value || 0) + 1);
                          field.onChange(v);
                          (e.currentTarget.parentElement?.children[v - 1] as HTMLElement)?.focus();
                        }
                        if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
                          e.preventDefault();
                          const v = Math.max(1, (field.value || 2) - 1);
                          field.onChange(v);
                          (e.currentTarget.parentElement?.children[v - 1] as HTMLElement)?.focus();
                        }
                      }}
                      className="rounded-md p-1 transition-transform hover:scale-110"
                    >
                      <Star className={cn("h-8 w-8 transition-colors", active ? "fill-gold text-gold" : "text-gold/40")} strokeWidth={1.4} />
                    </button>
                  );
                })}
              </div>
              <span className="text-sm text-ink-soft" aria-live="polite">{LABELS[hover || field.value || 0]}</span>
            </div>
          )}
        />
        {errors.rating && <p role="alert" className="mt-1 text-sm text-red-700">{errors.rating.message}</p>}
      </fieldset>

      <Select label="Usluga (opciono)" {...register("serviceId")}>
        <option value="">— Izaberite uslugu —</option>
        {categories.map((c) => (
          <optgroup key={c.id} label={c.name}>
            {c.services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </optgroup>
        ))}
      </Select>

      <Textarea
        label="Vaš utisak"
        required
        maxLength={500}
        placeholder="Podelite svoje iskustvo sa nama…"
        error={errors.text?.message}
        hint={`${textLen}/500 karaktera (najmanje 10)`}
        {...register("text")}
      />

      {serverError && (
        <p role="alert" className="rounded-2xl bg-red-50 p-3 text-sm text-red-800">
          {serverError}
        </p>
      )}
      <Button type="submit" fullWidth size="lg" disabled={isSubmitting}>
        {isSubmitting ? "Šaljem…" : "Pošalji recenziju"}
      </Button>
      <p className="text-center text-xs text-ink-soft">Recenzije se objavljuju nakon provere. Prikazujemo samo ime i prvo slovo prezimena.</p>
    </form>
  );
}
