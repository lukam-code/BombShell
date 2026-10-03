"use client";

import { AnimatePresence, m, useReducedMotion, type PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { useFocusTrap } from "@/components/ui/Modal";
import { fadeUp, Reveal, StaggerGroup } from "@/components/ui/Reveal";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { SmartImage } from "@/components/ui/SmartImage";
import { InstagramIcon } from "@/components/layout/SocialIcons";
import { cn } from "@/lib/cn";
import { siteConfig } from "@/lib/siteConfig";

const images = siteConfig.images.gallery;

export function Gallery() {
  const [index, setIndex] = useState<number | null>(null);

  return (
    <section id="galerija" aria-labelledby="galerija-naslov" className="py-20 sm:py-28">
      <div className="container-page">
        <Reveal>
          <SectionTitle
            id="galerija-naslov"
            eyebrow="Galerija"
            title="Zavirite u naš salon"
            subtitle="Prijatan ambijent, pažljivo odabrani detalji i rezultati na koje smo ponosni."
          />
        </Reveal>
        <StaggerGroup as="ul" className="columns-2 gap-3 sm:gap-5 lg:columns-3 [&>li]:mb-3 sm:[&>li]:mb-5">
          {images.map((img, i) => (
            <m.li key={i} variants={fadeUp} className="break-inside-avoid">
              <button
                type="button"
                onClick={() => setIndex(i)}
                className={cn(
                  "group relative block w-full overflow-hidden rounded-2xl shadow-card",
                  img.tall ? "aspect-[3/4]" : "aspect-square",
                )}
                aria-label={`Otvori sliku: ${img.alt}`}
              >
                <span className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-110">
                  <SmartImage src={img.src} alt={img.alt} sizes="(min-width: 1024px) 33vw, 50vw" label={String(i + 1).padStart(2, "0")} />
                </span>
                <span className="absolute inset-0 bg-rose-dark/0 transition-colors duration-500 group-hover:bg-rose-dark/20" aria-hidden />
              </button>
            </m.li>
          ))}
        </StaggerGroup>
        <Reveal className="mt-10 text-center">
          <ButtonLink href={siteConfig.social.instagram} external variant="secondary">
            <InstagramIcon className="h-5 w-5" /> Pratite nas na Instagramu
          </ButtonLink>
        </Reveal>
      </div>
      <Lightbox index={index} onClose={() => setIndex(null)} onChange={setIndex} />
    </section>
  );
}

function Lightbox({
  index,
  onClose,
  onChange,
}: {
  index: number | null;
  onClose: () => void;
  onChange: (i: number) => void;
}) {
  const open = index !== null;
  const ref = useRef<HTMLDivElement>(null);
  const [dir, setDir] = useState(0);
  const reduce = useReducedMotion();
  useFocusTrap(open, ref, onClose);

  const go = useCallback(
    (delta: number) => {
      if (index === null) return;
      setDir(delta);
      onChange((index + delta + images.length) % images.length);
    },
    [index, onChange],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, go]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -60 || info.velocity.x < -400) go(1);
    else if (info.offset.x > 60 || info.velocity.x > 400) go(-1);
  };

  return (
    <AnimatePresence>
      {open && index !== null && (
        <m.div
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-label="Galerija slika"
          className="fixed inset-0 z-[85] flex items-center justify-center bg-ink/90 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/25"
            aria-label="Zatvori galeriju"
          >
            <X className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
            className="absolute left-2 z-10 hidden rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/25 sm:left-6 sm:block"
            aria-label="Prethodna slika"
          >
            <ChevronLeft className="h-7 w-7" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
            className="absolute right-2 z-10 hidden rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/25 sm:right-6 sm:block"
            aria-label="Sledeća slika"
          >
            <ChevronRight className="h-7 w-7" />
          </button>

          <AnimatePresence initial={false} custom={dir} mode="popLayout">
            <m.div
              key={index}
              custom={dir}
              className="relative aspect-[4/5] w-[88vw] max-w-3xl cursor-grab overflow-hidden rounded-2xl shadow-2xl active:cursor-grabbing sm:aspect-[4/3] sm:w-[80vw]"
              initial={reduce ? { opacity: 0 } : { opacity: 0, x: dir >= 0 ? 120 : -120, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, x: dir >= 0 ? -120 : 120, scale: 0.96 }}
              transition={{ type: "spring", damping: 30, stiffness: 260 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.6}
              onDragEnd={onDragEnd}
              onClick={(e) => e.stopPropagation()}
            >
              <SmartImage src={images[index].src} alt={images[index].alt} sizes="90vw" label={String(index + 1).padStart(2, "0")} />
            </m.div>
          </AnimatePresence>

          <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm text-white/90" aria-live="polite">
            {index + 1} / {images.length}
          </p>
        </m.div>
      )}
    </AnimatePresence>
  );
}
