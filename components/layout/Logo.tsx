import Link from "next/link";
import { cn } from "@/lib/cn";

export function Logo({ className, light = false, onClick }: { className?: string; light?: boolean; onClick?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onClick}
      className={cn("group inline-flex flex-col leading-none", className)}
    >
      <span
        className={cn(
          "font-serif text-2xl font-semibold tracking-[0.18em] transition-colors sm:text-[1.7rem]",
          light ? "text-white" : "text-ink",
        )}
      >
        BOMBSHELL
      </span>
      <span
        className={cn(
          "mt-1 text-[0.6rem] font-medium uppercase tracking-[0.45em]",
          light ? "text-white/90" : "text-gold-dark",
        )}
      >
        Salon lepote
      </span>
      <span className="sr-only">, početna strana</span>
    </Link>
  );
}
