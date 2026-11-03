import { config } from '@/lib/config';
import { Logo } from '../Logo';

export function Footer() {
  return (
    <footer className="border-t border-white/5 px-4 py-10 pb-28 text-center text-sm text-muted sm:pb-10">
      <Logo className="text-sm" />
      <p className="mt-3">© {new Date().getFullYear()} {config.name}. Sva prava zadržana.</p>
      {config.isDraft && (
        <p className="mx-auto mt-4 max-w-md rounded-lg border border-gold/30 bg-gold/5 px-3 py-2 text-gold">
          Radna verzija: tekstovi, cene, radno vreme i kontakt su primeri (lib/config.ts).
        </p>
      )}
    </footer>
  );
}
