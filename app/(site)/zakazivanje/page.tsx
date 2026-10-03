import type { Metadata } from "next";
import { Phone } from "lucide-react";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { getCategoriesWithServices } from "@/lib/data";
import { siteConfig } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "Online zakazivanje",
  description: "Zakažite termin u salonu lepote Bombshell u Novom Sadu – izaberite uslugu, datum i vreme za manje od minut.",
  alternates: { canonical: "/zakazivanje" },
};

export const revalidate = 60;

export default async function BookingPage({ searchParams }: { searchParams: Promise<{ usluga?: string }> }) {
  const [{ usluga }, categories] = await Promise.all([searchParams, getCategoriesWithServices()]);
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-cream to-cream">
      <div className="container-page max-w-2xl pb-24 pt-28 sm:pt-32">
        {categories === null ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-card">
            <h1 className="text-2xl font-medium">Online zakazivanje</h1>
            <p className="mt-3 text-ink-soft">Online zakazivanje je trenutno nedostupno. Pozovite nas i rado ćemo zakazati termin.</p>
            <a href={siteConfig.phone.href} className="mt-5 inline-flex items-center gap-2 font-semibold text-rose-deeper">
              <Phone className="h-4 w-4" aria-hidden /> {siteConfig.phone.display}
            </a>
          </div>
        ) : (
          <BookingWizard key={usluga ?? "none"} categories={categories} initialServiceId={usluga} />
        )}
        <p className="mt-10 text-center text-sm text-ink-soft">
          Imate pitanje ili Vam ne odgovara nijedan termin?{" "}
          <a href={siteConfig.phone.href} className="font-semibold text-rose-deeper underline-offset-4 hover:underline">
            Pozovite nas
          </a>
        </p>
      </div>
    </div>
  );
}
