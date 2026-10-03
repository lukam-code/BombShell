import { cn } from "@/lib/cn";
import { siteConfig } from "@/lib/siteConfig";

// lucide-react više ne sadrži brend ikonice, pa su Instagram i Facebook jednostavni SVG-ovi.
export function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.9v3h2.6V21h3z" />
    </svg>
  );
}

export function SocialIcons({ className, variant = "default" }: { className?: string; variant?: "default" | "light" }) {
  const cls = cn(
    "flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-300 hover:-translate-y-0.5",
    variant === "light"
      ? "border-white/30 text-white hover:bg-white hover:text-rose-deeper"
      : "border-gold/50 text-gold-dark hover:border-rose-deep hover:bg-rose-deep hover:text-white",
  );
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <a href={siteConfig.social.instagram} target="_blank" rel="noopener noreferrer" className={cls} aria-label="Bombshell na Instagramu">
        <InstagramIcon className="h-5 w-5" />
      </a>
      <a href={siteConfig.social.facebook} target="_blank" rel="noopener noreferrer" className={cls} aria-label="Bombshell na Facebooku">
        <FacebookIcon className="h-5 w-5" />
      </a>
    </div>
  );
}
