import { CalendarHeart } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";

export function CtaSection() {
  return (
    <section aria-labelledby="cta-naslov" className="relative overflow-hidden bg-rose-light py-20 sm:py-24">
      <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/50 blur-3xl" aria-hidden />
      <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-rose/30 blur-3xl" aria-hidden />
      <Reveal className="container-page relative text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-dark">Online zakazivanje 24/7</p>
        <h2 id="cta-naslov" className="mx-auto mt-4 max-w-2xl text-3xl font-medium sm:text-5xl">
          Zakažite svoj prvi tretman
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-ink-soft">
          Izaberite uslugu, datum i vreme koje Vam odgovara – potvrdu dobijate odmah.
        </p>
        <ButtonLink href="/zakazivanje" size="lg" className="mt-9">
          <CalendarHeart className="h-5 w-5" aria-hidden /> Zakaži online
        </ButtonLink>
      </Reveal>
    </section>
  );
}
