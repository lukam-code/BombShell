"use client";

import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { CalendarHeart, Menu, Phone, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { useFocusTrap } from "@/components/ui/Modal";
import { cn } from "@/lib/cn";
import { siteConfig } from "@/lib/siteConfig";
import { Logo } from "./Logo";

export function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  useFocusTrap(open, menuRef, () => setOpen(false));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Providna samo na vrhu početne strane (preko hero slike)
  const solid = scrolled || !isHome;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        solid ? "border-b border-rose-light/70 bg-white/80 shadow-card backdrop-blur-lg" : "bg-transparent",
      )}
    >
      <nav aria-label="Glavna navigacija" className="container-page flex h-[4.5rem] items-center justify-between gap-6">
        <Logo />
        <ul className="hidden items-center gap-7 lg:flex">
          {siteConfig.nav.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="group relative py-2 text-sm font-medium text-ink transition-colors hover:text-rose-deeper"
              >
                {item.label}
                <span className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-gold transition-transform duration-300 group-hover:scale-x-100" />
              </a>
            </li>
          ))}
        </ul>
        <div className="hidden lg:block">
          <ButtonLink href="/zakazivanje" size="sm" className="px-5 py-2.5">
            <CalendarHeart className="h-4 w-4" aria-hidden />
            Zakaži termin
          </ButtonLink>
        </div>
        <button
          type="button"
          className="-mr-2 rounded-full p-2.5 text-ink transition-colors hover:bg-rose-light lg:hidden"
          aria-label="Otvori meni"
          aria-expanded={open}
          aria-controls="mobilni-meni"
          onClick={() => setOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <m.div
            id="mobilni-meni"
            ref={menuRef}
            role="dialog"
            aria-modal="true"
            aria-label="Meni"
            className="fixed inset-0 z-[60] flex h-[100dvh] flex-col bg-cream lg:hidden"
            initial={reduce ? { opacity: 0 } : { clipPath: "circle(0% at calc(100% - 2.5rem) 2.25rem)" }}
            animate={reduce ? { opacity: 1 } : { clipPath: "circle(150% at calc(100% - 2.5rem) 2.25rem)" }}
            exit={reduce ? { opacity: 0 } : { clipPath: "circle(0% at calc(100% - 2.5rem) 2.25rem)" }}
            transition={{ duration: reduce ? 0.15 : 0.55, ease: [0.65, 0, 0.35, 1] }}
          >
            <div className="container-page flex h-[4.5rem] items-center justify-between">
              <Logo onClick={() => setOpen(false)} />
              <button
                type="button"
                className="-mr-2 rounded-full p-2.5 text-ink hover:bg-rose-light"
                aria-label="Zatvori meni"
                onClick={() => setOpen(false)}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="container-page flex flex-1 flex-col justify-center overflow-y-auto pb-10">
              <ul className="space-y-1">
                {siteConfig.nav.map((item, i) => (
                  <m.li
                    key={item.href}
                    initial={reduce ? false : { opacity: 0, x: -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: reduce ? 0 : 0.15 + i * 0.06 }}
                  >
                    <a
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="block py-2.5 font-serif text-3xl text-ink transition-colors hover:text-rose-deeper"
                    >
                      {item.label}
                    </a>
                  </m.li>
                ))}
              </ul>
              <m.div
                className="mt-10 space-y-3"
                initial={reduce ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduce ? 0 : 0.55 }}
              >
                <ButtonLink href="/zakazivanje" size="lg" fullWidth onClick={() => setOpen(false)}>
                  <CalendarHeart className="h-5 w-5" aria-hidden /> Zakaži termin
                </ButtonLink>
                <ButtonLink href={siteConfig.phone.href} variant="secondary" size="lg" fullWidth>
                  <Phone className="h-5 w-5" aria-hidden /> {siteConfig.phone.display}
                </ButtonLink>
              </m.div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </header>
  );
}
