import type { Metadata } from "next";
import { CalendarX2, Phone } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { CANCELLATION_HOURS, siteConfig } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "Politika otkazivanja",
  description: `Termin u salonu Bombshell možete otkazati ili pomeriti najkasnije ${CANCELLATION_HOURS} sata pre zakazanog vremena.`,
  alternates: { canonical: "/politika-otkazivanja" },
};

export default function CancellationPolicyPage() {
  return (
    <div className="container-page max-w-3xl pb-20 pt-32 sm:pt-40">
      <SectionTitle eyebrow="Zakazivanje" title="Politika otkazivanja" />
      <div className="rounded-4xl border border-rose-light bg-white p-7 shadow-card sm:p-10">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-light text-rose-deeper">
          <CalendarX2 className="h-7 w-7" strokeWidth={1.5} aria-hidden />
        </span>
        <p className="mt-6 text-lg leading-relaxed text-ink">{siteConfig.cancellationPolicy}</p>
        <ul className="mt-8 space-y-3 border-t border-rose-light pt-6 text-sm text-ink-soft">
          <li>• Link za otkazivanje nalazi se u SMS/Viber i email potvrdi termina.</li>
          <li>• Online otkazivanje je moguće do {CANCELLATION_HOURS} sata pre termina; nakon toga nas pozovite.</li>
          <li>• Otkazani termin se odmah oslobađa za druge klijentkinje.</li>
        </ul>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href={siteConfig.phone.href}>
            <Phone className="h-4 w-4" aria-hidden /> {siteConfig.phone.display}
          </ButtonLink>
          <ButtonLink href="/zakazivanje" variant="secondary">
            Zakaži termin
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
