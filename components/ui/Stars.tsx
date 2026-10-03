import { Star } from "lucide-react";
import { cn } from "@/lib/cn";

export function Stars({ rating, size = "h-4 w-4", className }: { rating: number; size?: string; className?: string }) {
  const rounded = Math.round(rating * 2) / 2;
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} role="img" aria-label={`Ocena ${rating.toFixed(1).replace(".", ",")} od 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = rounded >= i ? 1 : rounded >= i - 0.5 ? 0.5 : 0;
        return (
          <span key={i} className="relative inline-block">
            <Star className={cn(size, "text-gold/40")} strokeWidth={1.5} aria-hidden />
            {fill > 0 && (
              <span className="absolute inset-0 overflow-hidden" style={{ width: fill === 1 ? "100%" : "50%" }}>
                <Star className={cn(size, "fill-gold text-gold")} strokeWidth={1.5} aria-hidden />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}
