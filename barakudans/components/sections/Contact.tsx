import { config } from '@/lib/config';

export function Contact() {
  const c = config.contact;
  const q = encodeURIComponent(`${config.name} ${c.address}`);
  const embed = c.mapsEmbedSrc || `https://www.google.com/maps?q=${q}&output=embed`;
  const nav = c.mapsLink || `https://www.google.com/maps/search/?api=1&query=${q}`;
  return (
    <section id="kontakt" className="section scroll-mt-16">
      <p className="eyebrow">Lokacija i kontakt</p>
      <h2 className="h2 mt-3">Dođi kod nas</h2>
      <div className="mt-12 grid gap-8 md:grid-cols-2">
        <div className="card overflow-hidden">
          <iframe title={`Mapa – ${config.name}`} src={embed} loading="lazy" referrerPolicy="no-referrer-when-downgrade"
            className="h-72 w-full border-0 [filter:invert(.9)_hue-rotate(180deg)_saturate(.7)] md:h-full md:min-h-96" />
        </div>
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="font-display text-lg font-bold text-gold">Adresa i kontakt</h3>
            <address className="mt-3 not-italic leading-loose text-muted">
              {c.address}<br />
              <a className="text-fg hover:text-accent" href={`tel:${c.phone.replace(/\s/g, '')}`}>{c.phone}</a><br />
              <a className="text-fg hover:text-accent" href={`mailto:${c.email}`}>{c.email}</a>
            </address>
            <div className="mt-5 flex flex-wrap gap-3">
              <a href={nav} target="_blank" rel="noopener noreferrer" className="btn-primary">Navigacija</a>
              {config.social.instagram && <a href={config.social.instagram} target="_blank" rel="noopener noreferrer" className="btn-ghost">Instagram</a>}
              {config.social.facebook && <a href={config.social.facebook} target="_blank" rel="noopener noreferrer" className="btn-ghost">Facebook</a>}
            </div>
          </div>
          <div className="card p-6">
            <h3 className="font-display text-lg font-bold text-gold">Radno vreme</h3>
            <dl className="mt-3 divide-y divide-white/5">
              {config.hours.map((h) => (
                <div key={h.day} className="flex justify-between py-2"><dt className="text-muted">{h.label}</dt><dd>{h.open ? `${h.open} – ${h.close}` : 'Zatvoreno'}</dd></div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
