import Image from 'next/image';
import { config } from '@/lib/config';
import { Placeholder } from '../Placeholder';

export function Events() {
  return (
    <section id="dogadjaji" className="bg-surface/50 scroll-mt-16">
      <div className="section">
        <p className="eyebrow">Događaji</p>
        <h2 className="h2 mt-3">Šta se sprema</h2>
        <ul className="mt-12 grid gap-6 md:grid-cols-3">
          {config.events.map((e, i) => (
            <li key={e.title} className="card overflow-hidden">
              <div className="relative h-40">{e.image ? <Image src={e.image} alt="" fill loading="lazy" sizes="(max-width:768px) 100vw, 33vw" className="object-cover" /> : <Placeholder label="Plakat" hue={i} />}</div>
              <div className="p-6">
                <p className="text-sm font-semibold uppercase tracking-widest text-accent">{e.when}</p>
                <h3 className="mt-2 font-display text-2xl font-bold">{e.title}</h3>
                <p className="mt-2 text-muted">{e.desc}</p>
                <a href="#rezervacija" className="mt-5 inline-block font-semibold text-gold hover:underline">Rezerviši sto →</a>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
