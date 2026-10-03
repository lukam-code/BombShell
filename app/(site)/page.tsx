import { About } from "@/components/home/About";
import { Contact } from "@/components/home/Contact";
import { CtaSection } from "@/components/home/CtaSection";
import { Gallery } from "@/components/home/Gallery";
import { Hero } from "@/components/home/Hero";
import { InfoBar } from "@/components/home/InfoBar";
import { Reviews } from "@/components/home/Reviews";
import { Services } from "@/components/home/Services";
import { IntroAnimation } from "@/components/layout/IntroAnimation";
import { getApprovedReviews, getCategoriesWithServices } from "@/lib/data";
import { beautySalonJsonLd } from "@/lib/jsonld";

// Usluge i recenzije se osvežavaju iz Supabase-a najviše jednom u minutu.
export const revalidate = 60;

export default async function HomePage() {
  const [categories, { reviews, summary }] = await Promise.all([getCategoriesWithServices(), getApprovedReviews()]);

  return (
    <>
      <IntroAnimation />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(beautySalonJsonLd(summary)).replace(/</g, "\\u003c") }}
      />
      <Hero summary={summary} />
      <InfoBar />
      <Services categories={categories} />
      <About />
      <Gallery />
      <Reviews reviews={reviews} summary={summary} categories={categories ?? []} />
      <CtaSection />
      <Contact />
    </>
  );
}
