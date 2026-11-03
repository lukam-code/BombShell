import { config } from '@/lib/config';

export function Menu() {
  return (
    <section id="meni" className="bg-surface/50 scroll-mt-16">
      <div className="section">
        <p className="eyebrow">Ponuda</p>
        <h2 className="h2 mt-3">Meni i koktel karta</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {config.menu.map((cat) => (
            <div key={cat.category} className="card p-6">
              <h3 className="font-display text-xl font-bold text-gold">{cat.category}</h3>
              <ul className="mt-5 space-y-4">
                {cat.items.map((it) => (
                  <li key={it.name} className="flex items-baseline justify-between gap-3 border-b border-white/5 pb-3 last:border-0">
                    <div><p className="font-semibold">{it.name}</p><p className="text-sm text-muted">{it.desc}</p></div>
                    <span className="shrink-0 text-sm text-accent">{it.price == null ? 'cena uskoro' : `${it.price} RSD`}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
