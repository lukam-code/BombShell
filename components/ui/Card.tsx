import { cn } from "@/lib/cn";

export function Card({
  className,
  children,
  as: Tag = "div",
  ...rest
}: React.HTMLAttributes<HTMLElement> & { as?: "div" | "article" | "section" | "li" }) {
  return (
    <Tag
      className={cn(
        "rounded-2xl border border-rose-light/80 bg-white p-6 shadow-card transition-shadow duration-300",
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
