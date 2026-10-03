import { Reveal } from "@/components/ui/Reveal";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { SmartImage } from "@/components/ui/SmartImage";
import { siteConfig } from "@/lib/siteConfig";

export function About() {
  const img = siteConfig.images.about;
  return (
    <section id="o-nama" aria-labelledby="o-nama-naslov" className="bg-white py-20 sm:py-28">
      <div className="container-page grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <Reveal className="relative">
          <div className="absolute -left-4 -top-4 h-full w-full rounded-4xl border border-gold/60" aria-hidden />
          <div className="relative aspect-[4/5] overflow-hidden rounded-4xl shadow-soft sm:aspect-[5/4] lg:aspect-[4/5]">
            <SmartImage src={img.src} alt={img.alt} sizes="(min-width: 1024px) 50vw, 100vw" label="BOMBSHELL" />
          </div>
        </Reveal>
        <Reveal delay={0.15}>
          <SectionTitle id="o-nama-naslov" eyebrow="O nama" title="Mesto gde se lepota neguje" align="left" className="mb-8" />
          <p className="text-lg leading-relaxed text-ink-soft">{siteConfig.about.text}</p>
          <p className="mt-8 font-serif text-3xl italic text-rose-deeper">{siteConfig.about.signature}</p>
        </Reveal>
      </div>
    </section>
  );
}
