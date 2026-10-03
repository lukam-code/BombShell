"use client";

import { m, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { CalendarHeart, ChevronDown, Phone } from "lucide-react";
import { useRef } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { SmartImage } from "@/components/ui/SmartImage";
import { Stars } from "@/components/ui/Stars";
import { reviewsWord } from "@/lib/plural";
import { siteConfig } from "@/lib/siteConfig";
import type { ReviewsSummary } from "@/lib/types";

export function Hero({ summary }: { summary: ReviewsSummary }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.3]);
  const img = siteConfig.images.hero;

  return (
    <section
      ref={ref}
      id="pocetna"
      aria-labelledby="hero-naslov"
      className="relative flex min-h-[100svh] items-center overflow-hidden"
    >
      <m.div className="absolute inset-0 -top-[5%] h-[115%]" style={reduce ? undefined : { y }}>
        {/* Niska rezolucija izvornih fotografija se maskira blagim blur-om i roze overlay-em */}
        <SmartImage src={img.src} alt={img.alt} sizes="100vw" priority className="scale-105 blur-[2px]" label=" " />
      </m.div>
      <div className="absolute inset-0 bg-gradient-to-b from-rose-light/70 via-rose/45 to-rose-dark/70" aria-hidden />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(45,45,45,0.08),rgba(45,45,45,0.28))]" aria-hidden />

      <m.div className="container-page relative z-10 py-28 text-center text-white" style={reduce ? undefined : { opacity }}>
        <p style={{ animationDelay: "0.1s" }} className="motion-safe:animate-fade-up mb-5 text-xs font-semibold uppercase tracking-[0.4em] text-white drop-shadow sm:text-sm">
          Salon lepote · Novi Sad
        </p>
        <h1
          id="hero-naslov" className="motion-safe:animate-rise mx-auto max-w-4xl text-4xl font-medium leading-[1.1] drop-shadow-[0_2px_12px_rgba(45,45,45,0.35)] sm:text-6xl lg:text-7xl"
        >
          Vaša lepota je naš prioritet
        </h1>
        <div style={{ animationDelay: "0.3s" }} className="motion-safe:animate-fade-up mx-auto mt-6 flex items-center justify-center gap-3" aria-hidden>
          <span className="h-px w-12 bg-white/80" />
          <span className="h-1.5 w-1.5 rotate-45 bg-gold-light" />
          <span className="h-px w-12 bg-white/80" />
        </div>
        <p style={{ animationDelay: "0.4s" }} className="motion-safe:animate-fade-up mx-auto mt-6 max-w-xl text-lg font-medium drop-shadow-[0_1px_6px_rgba(45,45,45,0.4)] sm:text-xl">
          Iz našeg salona izaći ćete uvek negovane i lepe.
        </p>
        <div style={{ animationDelay: "0.55s" }} className="motion-safe:animate-fade-up mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <ButtonLink href="/zakazivanje" size="lg" className="w-full sm:w-auto">
            <CalendarHeart className="h-5 w-5" aria-hidden /> Zakaži termin
          </ButtonLink>
          <ButtonLink href={siteConfig.phone.href} variant="outline-light" size="lg" className="w-full sm:w-auto">
            <Phone className="h-5 w-5" aria-hidden /> Pozovi nas
          </ButtonLink>
        </div>
        {summary.count > 0 && (
          <a href="#recenzije"
            style={{ animationDelay: "0.7s" }} className="motion-safe:animate-fade-up mt-8 inline-flex items-center gap-3 rounded-full bg-white/90 px-5 py-2.5 text-sm text-ink shadow-soft backdrop-blur"
          >
            <Stars rating={summary.average} />
            <span className="font-semibold">{summary.average.toFixed(1).replace(".", ",")}</span>
            <span className="text-ink-soft">
              ({summary.count} {reviewsWord(summary.count)})
            </span>
          </a>
        )}
      </m.div>

      <a
        href="#usluge"
        aria-label="Skrolujte do usluga"
        className="absolute bottom-24 left-1/2 z-10 -translate-x-1/2 rounded-full p-2 text-white"
      >
        <ChevronDown className="h-8 w-8 animate-bounce-soft drop-shadow" />
      </a>
    </section>
  );
}
