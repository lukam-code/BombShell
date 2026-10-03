import { Clock, MapPin, Phone } from "lucide-react";
import { siteConfig } from "@/lib/siteConfig";

export function InfoBar() {
  const items = [
    { icon: Clock, label: "Radno vreme", value: siteConfig.openingHoursShort, href: undefined },
    { icon: MapPin, label: "Adresa", value: `${siteConfig.address.street}, ${siteConfig.address.city}`, href: siteConfig.navigationUrl },
    { icon: Phone, label: "Telefon", value: siteConfig.phone.display, href: siteConfig.phone.href },
  ];
  return (
    <section aria-label="Osnovne informacije" className="relative z-10 -mt-16 px-5">
      <div className="mx-auto grid max-w-5xl divide-y divide-rose-light rounded-2xl bg-white shadow-soft sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {items.map(({ icon: Icon, label, value, href }) => {
          const content = (
            <>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-light text-rose-deeper">
                <Icon className="h-5 w-5" aria-hidden strokeWidth={1.6} />
              </span>
              <span>
                <span className="block text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-gold-dark">{label}</span>
                <span className="mt-0.5 block text-sm font-medium text-ink">{value}</span>
              </span>
            </>
          );
          return href ? (
            <a
              key={label}
              href={href}
              {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="flex items-center gap-4 px-6 py-5 transition-colors hover:bg-rose-50 sm:justify-center first:rounded-t-2xl last:rounded-b-2xl sm:first:rounded-l-2xl sm:first:rounded-tr-none sm:last:rounded-r-2xl sm:last:rounded-bl-none"
            >
              {content}
            </a>
          ) : (
            <div key={label} className="flex items-center gap-4 px-6 py-5 sm:justify-center">
              {content}
            </div>
          );
        })}
      </div>
    </section>
  );
}
