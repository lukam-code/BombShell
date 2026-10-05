import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * Next.js <Image> sa elegantnim roze gradijent placeholderom kada slika još nije ubačena
 * (src = null u siteConfig.ts).
 */
export function SmartImage({
  src,
  alt,
  className,
  sizes,
  priority,
  label,
  fit = "cover",
}: {
  src: string | null;
  alt: string;
  className?: string;
  sizes: string;
  priority?: boolean;
  label?: string;
  fit?: "cover" | "contain";
}) {
  if (src) {
    return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={cn(fit === "contain" ? "object-contain" : "object-cover", className)} />;
  }
  return (
    <div role="img" aria-label={alt} className={cn("placeholder-gradient absolute inset-0 overflow-hidden", className)}>
      <div className="absolute inset-0 opacity-40 [background:repeating-linear-gradient(135deg,transparent_0_22px,rgba(255,255,255,.35)_22px_23px)]" />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-serif text-3xl tracking-[0.3em] text-white/80 drop-shadow-sm sm:text-4xl">
          {label ?? "B"}
        </span>
      </div>
    </div>
  );
}
