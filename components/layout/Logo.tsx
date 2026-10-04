import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";

/** Zlatni BOMBSHELL logo (lik u krugu + natpis). Veličinu određuje visina iz `className`. */
export function Logo({
  className,
  imgClassName = "h-14 sm:h-[3.75rem]",
  onClick,
  priority = false,
}: {
  className?: string;
  imgClassName?: string;
  onClick?: () => void;
  priority?: boolean;
}) {
  return (
    <Link href="/" onClick={onClick} className={cn("inline-flex shrink-0 items-center", className)}>
      <Image
        src="/images/logo.webp"
        alt="BOMBSHELL – Salon lepote"
        width={600}
        height={494}
        priority={priority}
        sizes="(min-width: 640px) 160px, 120px"
        className={cn("w-auto drop-shadow-[0_1px_2px_rgba(45,45,45,0.15)]", imgClassName)}
      />
      <span className="sr-only">, početna strana</span>
    </Link>
  );
}
