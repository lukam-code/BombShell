import Link from "next/link";
import { siteConfig } from "@/lib/siteConfig";
import { Logo } from "./Logo";
import { SocialIcons } from "./SocialIcons";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-rose-light bg-white">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-2">
          <Logo />
          <p className="mt-5 max-w-sm font-serif text-lg italic leading-relaxed text-ink-soft">„{siteConfig.slogan}”</p>
          <SocialIcons className="mt-6" />
        </div>
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-dark">Brzi linkovi</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {siteConfig.nav.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="text-ink-soft transition-colors hover:text-rose-deeper">
                  {item.label}
                </a>
              </li>
            ))}
            <li>
              <Link href="/zakazivanje" className="text-ink-soft transition-colors hover:text-rose-deeper">
                Zakaži termin
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-dark">Kontakt</h2>
          <ul className="mt-4 space-y-2.5 text-sm text-ink-soft">
            <li>{siteConfig.address.street}</li>
            <li>
              {siteConfig.address.postalCode} {siteConfig.address.city}
            </li>
            <li>
              <a href={siteConfig.phone.href} className="transition-colors hover:text-rose-deeper">
                {siteConfig.phone.display}
              </a>
            </li>
            <li>
              <a href={`mailto:${siteConfig.email}`} className="break-all transition-colors hover:text-rose-deeper">
                {siteConfig.email}
              </a>
            </li>
            <li>{siteConfig.openingHoursShort}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-rose-light/70">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-6 text-xs text-ink-soft sm:flex-row">
          <p>© {year} {siteConfig.fullName}. Sva prava zadržana.</p>
          <Link href="/politika-otkazivanja" className="underline-offset-4 transition-colors hover:text-rose-deeper hover:underline">
            Politika otkazivanja
          </Link>
        </div>
      </div>
    </footer>
  );
}
