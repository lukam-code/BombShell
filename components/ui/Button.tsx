"use client";

import Link from "next/link";
import { m, useReducedMotion } from "framer-motion";
import { forwardRef } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "outline-light";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-wide transition-[background-color,color,box-shadow,border-color] duration-300 disabled:cursor-not-allowed disabled:opacity-50 select-none";

const variants: Record<Variant, string> = {
  primary: "bg-rose-deep text-white shadow-soft hover:bg-rose-deeper hover:shadow-glow",
  secondary:
    "border border-rose-dark bg-white text-rose-deeper hover:border-rose-deep hover:bg-rose-light hover:shadow-soft",
  ghost: "text-rose-deeper hover:bg-rose-light",
  "outline-light":
    "border border-white/90 bg-white/10 text-white backdrop-blur-sm hover:bg-white hover:text-rose-deeper hover:shadow-soft",
};

const sizes: Record<Size, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-sm sm:text-base",
  lg: "px-8 py-4 text-base sm:text-lg",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
  fullWidth?: boolean;
};

type ButtonProps = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd" | "style"> & {
    href?: undefined;
  };

type LinkProps = CommonProps & {
  href: string;
  external?: boolean;
  "aria-label"?: string;
  onClick?: () => void;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className, children, fullWidth, ...rest },
  ref,
) {
  const reduce = useReducedMotion();
  return (
    <m.button
      ref={ref}
      whileHover={reduce || rest.disabled ? undefined : { scale: 1.03 }}
      whileTap={reduce || rest.disabled ? undefined : { scale: 0.98 }}
      className={cn(base, variants[variant], sizes[size], fullWidth && "w-full", className)}
      {...rest}
    >
      {children}
    </m.button>
  );
});

const MotionLink = m.create(Link);

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  fullWidth,
  external,
  ...rest
}: LinkProps) {
  const reduce = useReducedMotion();
  const cls = cn(base, variants[variant], sizes[size], fullWidth && "w-full", className);
  const motionProps = reduce ? {} : { whileHover: { scale: 1.03 }, whileTap: { scale: 0.98 } };
  const isRaw = external || /^(tel:|mailto:|https?:)/.test(href);
  if (isRaw) {
    return (
      <m.a
        href={href}
        className={cls}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        {...motionProps}
        {...rest}
      >
        {children}
      </m.a>
    );
  }
  return (
    <MotionLink href={href} className={cls} {...motionProps} {...rest}>
      {children}
    </MotionLink>
  );
}
