import { cn } from "@/lib/cn";

export function SectionTitle({
  eyebrow,
  title,
  subtitle,
  align = "center",
  id,
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
  id?: string;
  className?: string;
}) {
  const center = align === "center";
  return (
    <div className={cn("mb-10 sm:mb-14", center ? "text-center" : "text-left", className)}>
      {eyebrow && (
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-gold-dark">{eyebrow}</p>
      )}
      <h2 id={id} className="text-3xl font-medium leading-tight text-ink sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      <div className={cn("mt-5 flex items-center gap-3", center ? "justify-center" : "justify-start")} aria-hidden>
        <span className="gold-line" />
        <span className="h-1.5 w-1.5 rotate-45 bg-gold" />
        <span className="gold-line" />
      </div>
      {subtitle && (
        <p className={cn("mt-5 max-w-2xl text-base leading-relaxed text-ink-soft sm:text-lg", center && "mx-auto")}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
