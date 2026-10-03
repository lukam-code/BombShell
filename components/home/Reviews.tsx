"use client";

import { AnimatePresence, m, useReducedMotion, type PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight, MessageSquareHeart, Quote } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Reveal } from "@/components/ui/Reveal";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Stars } from "@/components/ui/Stars";
import { cn } from "@/lib/cn";
import { reviewsWord } from "@/lib/plural";
import { siteConfig } from "@/lib/siteConfig";
import { formatBelgrade } from "@/lib/time";
import type { CategoryWithServices, PublicReview, ReviewsSummary } from "@/lib/types";
import dynamic from "next/dynamic";

// Forma (sa Supabase klijentom i validacijom) se učitava tek kada se modal otvori.
const ReviewForm = dynamic(() => import("./ReviewForm").then((mod) => mod.ReviewForm), {
  ssr: false,
  loading: () => <p className="py-8 text-center text-sm text-ink-soft">Učitavanje…</p>,
});

function usePerPage() {
  const [perPage, setPerPage] = useState(1);
  useEffect(() => {
    const update = () => setPerPage(window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return perPage;
}

export function Reviews({
  reviews,
  summary,
  categories,
}: {
  reviews: PublicReview[];
  summary: ReviewsSummary;
  categories: CategoryWithServices[];
}) {
  const [formOpen, setFormOpen] = useState(false);
  const hasReviews = reviews.length > 0;

  return (
    <section id="recenzije" aria-labelledby="recenzije-naslov" className="overflow-hidden bg-gradient-to-b from-cream to-rose-50 py-20 sm:py-28">
      <div className="container-page">
        <Reveal>
          <SectionTitle id="recenzije-naslov" eyebrow="Recenzije" title="Šta kažu naše klijentkinje" />
        </Reveal>

        {hasReviews ? (
          <>
            <Reveal className="-mt-4 mb-10 flex flex-col items-center gap-2 text-center">
              <div className="flex items-center gap-3">
                <span className="font-serif text-5xl text-ink">{summary.average.toFixed(1).replace(".", ",")}</span>
                <Stars rating={summary.average} size="h-6 w-6" />
              </div>
              <p className="text-sm text-ink-soft">
                Na osnovu {summary.count} {reviewsWord(summary.count)}
              </p>
            </Reveal>
            <Carousel reviews={reviews} />
          </>
        ) : (
          <Reveal className="mx-auto max-w-lg rounded-4xl border border-rose-light bg-white p-10 text-center shadow-card">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-light text-rose-deeper">
              <MessageSquareHeart className="h-8 w-8" strokeWidth={1.5} aria-hidden />
            </span>
            <p className="mt-6 font-serif text-2xl text-ink">Budite prva koja će podeliti utisak</p>
            <p className="mt-3 text-sm text-ink-soft">Vaše mišljenje nam mnogo znači i pomaže drugim klijentkinjama da nas upoznaju.</p>
          </Reveal>
        )}

        <Reveal className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button onClick={() => setFormOpen(true)}>
            <MessageSquareHeart className="h-5 w-5" aria-hidden /> Ostavite recenziju
          </Button>
          {siteConfig.googleReviewsUrl && (
            <ButtonLink href={siteConfig.googleReviewsUrl} external variant="secondary">
              Pogledajte nas na Google-u
            </ButtonLink>
          )}
        </Reveal>
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Ostavite recenziju">
        {formOpen && <ReviewForm categories={categories} onDone={() => setFormOpen(false)} />}
      </Modal>
    </section>
  );
}

function Carousel({ reviews }: { reviews: PublicReview[] }) {
  const perPage = usePerPage();
  const reduce = useReducedMotion();
  const pages = Math.max(1, Math.ceil(reviews.length / perPage));
  const [page, setPage] = useState(0);
  const [dir, setDir] = useState(1);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (page >= pages) setPage(0);
  }, [pages, page]);

  const go = useCallback(
    (delta: number) => {
      setDir(delta);
      setPage((p) => (p + delta + pages) % pages);
    },
    [pages],
  );

  // Auto-play (isključen za prefers-reduced-motion i dok je korisnik iznad/dodiruje karusel)
  useEffect(() => {
    if (reduce || paused || pages <= 1) return;
    const t = setInterval(() => go(1), 6000);
    return () => clearInterval(t);
  }, [reduce, paused, pages, go]);

  const current = reviews.slice(page * perPage, page * perPage + perPage);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -50) go(1);
    else if (info.offset.x > 50) go(-1);
  };

  return (
    <div
      role="region"
      aria-roledescription="karusel"
      aria-label="Recenzije klijentkinja"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setTimeout(() => setPaused(false), 4000)}
      className="relative"
    >
      <div className="relative min-h-[280px]">
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <m.ul
            key={`${page}-${perPage}`}
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            initial={reduce ? { opacity: 0 } : { opacity: 0, x: dir * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, x: dir * -60 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            drag={pages > 1 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.4}
            onDragEnd={onDragEnd}
            aria-live={paused ? "polite" : "off"}
          >
            {current.map((r, i) => (
              <m.li
                key={r.id}
                initial={reduce ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduce ? 0 : i * 0.08 }}
                className="relative flex h-full flex-col rounded-2xl border border-rose-light bg-white p-7 shadow-card"
              >
                <Quote className="absolute right-6 top-6 h-8 w-8 text-rose-light" aria-hidden />
                <Stars rating={r.rating} />
                <p className="mt-4 flex-1 text-[0.95rem] leading-relaxed text-ink">„{r.text}”</p>
                <div className="mt-6 border-t border-rose-light pt-4">
                  <p className="font-serif text-lg text-ink">{r.display_name}</p>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    {r.services?.name && <span>{r.services.name} · </span>}
                    <time dateTime={r.created_at}>{formatBelgrade(r.created_at, "d. MMMM yyyy.")}</time>
                  </p>
                </div>
              </m.li>
            ))}
          </m.ul>
        </AnimatePresence>
      </div>

      {pages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => go(-1)}
            className="rounded-full border border-rose-light bg-white p-2.5 text-rose-deeper transition-colors hover:bg-rose-light"
            aria-label="Prethodne recenzije"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex gap-2">
            {Array.from({ length: pages }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setDir(i > page ? 1 : -1);
                  setPage(i);
                }}
                aria-label={`Strana ${i + 1} od ${pages}`}
                aria-current={i === page}
                className="flex h-6 w-6 items-center justify-center"
              >
                <span className={cn("block h-2 rounded-full transition-all duration-300", i === page ? "w-6 bg-rose-deep" : "w-2 bg-rose")} />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => go(1)}
            className="rounded-full border border-rose-light bg-white p-2.5 text-rose-deeper transition-colors hover:bg-rose-light"
            aria-label="Sledeće recenzije"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}
