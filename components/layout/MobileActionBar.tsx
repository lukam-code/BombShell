"use client";

import { CalendarHeart, Phone } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/lib/siteConfig";

/** Fiksna traka na dnu ekrana (samo mobilni). Sakrivena na /zakazivanje i u admin panelu. */
export function MobileActionBar() {
  const pathname = usePathname();
  if (pathname.startsWith("/zakazivanje") || pathname.startsWith("/admin")) return null;
  return (
    <>
      <div className="h-20 lg:hidden" aria-hidden />
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-rose-light bg-white/90 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-lg lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-2 gap-3">
          <Link
            href="/zakazivanje"
            className="flex items-center justify-center gap-2 rounded-full bg-rose-deep py-3 text-sm font-semibold text-white shadow-soft active:scale-[0.98]"
          >
            <CalendarHeart className="h-4 w-4" aria-hidden /> Zakaži
          </Link>
          <a
            href={siteConfig.phone.href}
            className="flex items-center justify-center gap-2 rounded-full border border-rose-dark bg-white py-3 text-sm font-semibold text-rose-deeper active:scale-[0.98]"
          >
            <Phone className="h-4 w-4" aria-hidden /> Pozovi
          </a>
        </div>
      </div>
    </>
  );
}
