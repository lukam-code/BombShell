import { config } from '@/lib/config';

export function About() {
  const a = config.about;
  return (
    <section id="o-nama" className="section scroll-mt-16">
      <div className="grid gap-12 md:grid-cols-2 md:items-center">
        <div>
          <p className="eyebrow">Atmosfera</p>
          <h2 className="h2 mt-3">{a.title}</h2>
          <div className="mt-6 space-y-4 text-lg leading-relaxed text-muted">
            {a.paragraphs.map((p) => <p key={p}>{p}</p>)}
          </div>
        </div>
        <ul className="grid gap-4">
          {a.highlights.map((h, i) => (
            <li key={h.title} className="card flex items-start gap-4 p-5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent/10 font-display font-bold text-accent">{i + 1}</span>
              <div><h3 className="font-display text-lg font-bold">{h.title}</h3><p className="text-muted">{h.text}</p></div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
