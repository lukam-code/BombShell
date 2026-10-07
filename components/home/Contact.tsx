"use client";

import { Mail, MapPin, Navigation, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { SocialIcons } from "@/components/layout/SocialIcons";
import { cn } from "@/lib/cn";
import { siteConfig, TIME_ZONE } from "@/lib/siteConfig";

function todayDow() {
  const name = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: TIME_ZONE }).format(new Date());
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(name);
}

export function Contact() {
  const [today, setToday] = useState<number | null>(null);
  useEffect(() => setToday(todayDow()), []);

  return (
    <section id="kontakt" aria-labelledby="kontakt-naslov" className="bg-white py-20 sm:py-28">
      <div className="container-page">
        <Reveal>
          <SectionTitle id="kontakt-naslov" eyebrow="Kontakt" title="Posetite nas" subtitle="Radujemo se Vašem dolasku u centru Novog Sada." />
        </Reveal>
        <div className="grid gap-10 lg:grid-cols-2">
          <Reveal className="space-y-8">
            <ul className="space-y-5">
              <li className="flex items-start gap-4">
                <Icon><MapPin className="h-5 w-5" /></Icon>
                <div>
                  <p className="text-sm font-semibold text-ink">Adresa</p>
                  <p className="text-ink-soft">{siteConfig.address.full}</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <Icon><Phone className="h-5 w-5" /></Icon>
                <div>
                  <p className="text-sm font-semibold text-ink">Telefon</p>
                  <a href={siteConfig.phone.href} className="text-ink-soft transition-colors hover:text-rose-deeper">
                    {siteConfig.phone.display}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <Icon><Mail className="h-5 w-5" /></Icon>
                <div>
                  <p className="text-sm font-semibold text-ink">Email</p>
                  <a href={`mailto:${siteConfig.email}`} className="break-all text-ink-soft transition-colors hover:text-rose-deeper">
                    {siteConfig.email}
                  </a>
                </div>
              </li>
            </ul>

            <div className="rounded-2xl border border-rose-light bg-cream p-5 sm:p-6">
              <h3 className="mb-3 text-lg font-medium">Radno vreme</h3>
              <table className="w-full text-sm">
                <caption className="sr-only">Radno vreme salona po danima</caption>
                <tbody>
                  {siteConfig.openingHours.map((d) => {
                    const isToday = today === d.dow;
                    return (
                      <tr
                        key={d.day}
                        className={cn("border-b border-rose-light/70 last:border-0", isToday && "font-semibold text-rose-deeper")}
                        aria-current={isToday ? "date" : undefined}
                      >
                        <th scope="row" className="py-2.5 text-left font-[inherit]">
                          {d.day}
                          {isToday && (
                            <span className="ml-2 rounded-full bg-rose-light px-2 py-0.5 text-[0.65rem] uppercase tracking-wider">
                              danas
                            </span>
                          )}
                        </th>
                        <td className={cn("py-2.5 text-right", !isToday && "text-ink-soft")}>{d.hours}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <SocialIcons />
          </Reveal>

          <Reveal delay={0.15} className="flex flex-col gap-4">
            <div className="relative min-h-[320px] flex-1 overflow-hidden rounded-2xl border border-rose-light shadow-card">
              <iframe
                title={`Mapa – lokacija salona Bombshell, ${siteConfig.address.street}, ${siteConfig.address.city}`}
                src={siteConfig.mapsEmbedUrl}
                className="absolute inset-0 h-full w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <ButtonLink href={siteConfig.navigationUrl} external size="lg" fullWidth>
              <Navigation className="h-5 w-5" aria-hidden /> Navigacija do salona
            </ButtonLink>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-light text-rose-deeper" aria-hidden>
      {children}
    </span>
  );
}
