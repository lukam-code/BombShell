import Image from 'next/image';
import { config } from '@/lib/config';
import { Placeholder } from '../Placeholder';

// Raspored "mozaika" – prvi i četvrti element su veći.
const spans = ['sm:col-span-2 sm:row-span-2', '', '', 'sm:col-span-2', '', ''];

export function Gallery() {
  return (
    <section id="galerija" className="section scroll-mt-16">
      <p className="eyebrow">Galerija</p>
      <h2 className="h2 mt-3">Kako izgleda noć kod nas</h2>
      <div className="mt-12 grid auto-rows-[160px] grid-cols-2 gap-3 sm:auto-rows-[200px] sm:grid-cols-4">
        {config.gallery.map((g, i) => (
          <figure key={g.alt} className={`relative overflow-hidden rounded-2xl border border-white/5 ${spans[i % spans.length]}`}>
            {g.src ? (
              <Image src={g.src} alt={g.alt} fill loading="lazy" sizes="(max-width:640px) 50vw, 25vw" className="object-cover transition duration-500 hover:scale-105" />
            ) : (
              <Placeholder hue={i} />
            )}
          </figure>
        ))}
      </div>
      {config.social.instagram && (
        <a href={config.social.instagram} target="_blank" rel="noopener noreferrer" className="btn-ghost mt-8">Još na Instagramu →</a>
      )}
    </section>
  );
}
