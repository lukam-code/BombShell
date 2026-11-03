import { config } from '@/lib/config';

/** Wordmark + stilizovana barakuda. Zameni pravim logom (public/images/logo.svg) kad ga imaš. */
export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-display font-extrabold tracking-[.14em] ${className}`}>
      <svg viewBox="0 0 64 40" className="h-5 w-8 text-accent" aria-hidden>
        <path d="M2 20C14 4 30 0 46 12l14-9-5 17 5 17-14-9C30 40 14 36 2 20z" fill="currentColor" />
        <circle cx="17" cy="18" r="2.6" fill="rgb(var(--bg))" />
      </svg>
      {config.name.toUpperCase()}
    </span>
  );
}
