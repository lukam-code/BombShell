import Image from 'next/image';
import { config } from '@/lib/config';
import { Placeholder } from '../Placeholder';

export function Hero() {
  return (
    <section id="top" className="relative flex min-h-[100svh] items-end overflow-hidden pb-16 pt-28 sm:items-center sm:pb-0">
      <div className="absolute inset-0 -z-10">
        {config.hero.image ? (
          <Image src={config.hero.image} alt={config.hero.imageAlt} fill priority sizes="100vw" className="object-cover opacity-60" />
        ) : (
          <div className="glow-bg h-full w-full" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/60 to-bg/20" />
      </div>
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <p className="eyebrow fade-up">Bar · Koktli · Žurke</p>
        <h1 className="fade-up mt-4 font-display text-[clamp(3rem,13vw,9rem)] font-extrabold leading-[.9] tracking-tight [animation-delay:.1s]">
          {config.name.toUpperCase()}
        </h1>
        <p className="fade-up mt-5 max-w-md text-xl text-gold sm:text-2xl [animation-delay:.2s]">{config.tagline}</p>
        <div className="fade-up mt-9 flex flex-col gap-3 sm:flex-row [animation-delay:.3s]">
          <a href="#rezervacija" className="btn-primary text-lg">Rezerviši sto</a>
          <a href="#meni" className="btn-ghost">Pogledaj ponudu</a>
        </div>
      </div>
      {!config.hero.image && <div className="sr-only"><Placeholder /></div>}
    </section>
  );
}
