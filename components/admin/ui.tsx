"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { STATUS_LABELS, type BookingStatus } from "@/lib/types";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-medium sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ className, children, title, action }: { className?: string; children: React.ReactNode; title?: string; action?: React.ReactNode }) {
  return (
    <section className={cn("rounded-2xl border border-rose-light bg-white p-4 shadow-card sm:p-5", className)}>
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {title && <h2 className="font-serif text-lg">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

const STATUS_STYLES: Record<BookingStatus, string> = {
  pending: "bg-amber-50 text-amber-800 border-amber-200",
  confirmed: "bg-emerald-50 text-emerald-800 border-emerald-200",
  cancelled: "bg-gray-100 text-gray-600 border-gray-200 line-through",
  completed: "bg-sky-50 text-sky-800 border-sky-200",
  no_show: "bg-red-50 text-red-800 border-red-200",
};

export const STATUS_BLOCK: Record<BookingStatus, string> = {
  pending: "bg-amber-50 border-amber-300 text-amber-900",
  confirmed: "bg-rose-light border-rose-dark text-ink",
  cancelled: "bg-gray-50 border-gray-300 text-gray-500 line-through opacity-70",
  completed: "bg-sky-50 border-sky-300 text-sky-900",
  no_show: "bg-red-50 border-red-300 text-red-900",
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", STATUS_STYLES[status])}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export function Badge({ children, tone = "gray" }: { children: React.ReactNode; tone?: "gray" | "green" | "red" | "amber" | "pink" }) {
  const tones = {
    gray: "bg-gray-100 text-gray-700",
    green: "bg-emerald-50 text-emerald-800",
    red: "bg-red-50 text-red-800",
    amber: "bg-amber-50 text-amber-800",
    pink: "bg-rose-light text-rose-deeper",
  };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", tones[tone])}>{children}</span>;
}

export function Spinner({ label = "Učitavanje…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-sm text-ink-soft" role="status">
      <Loader2 className="h-5 w-5 animate-spin text-rose-dark" aria-hidden /> {label}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl bg-rose-50 px-4 py-6 text-center text-sm text-ink-soft">{children}</p>;
}

export function ErrorNote({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
      {children}
    </p>
  );
}

export function SmallButton({
  className,
  tone = "default",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "default" | "primary" | "danger" | "success" }) {
  const tones = {
    default: "border-rose-light bg-white text-ink hover:border-rose-dark hover:bg-rose-50",
    primary: "border-rose-deep bg-rose-deep text-white hover:bg-rose-deeper",
    danger: "border-red-200 bg-white text-red-700 hover:bg-red-50",
    success: "border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50",
  };
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

export const inputCls =
  "block w-full rounded-xl border border-rose-light bg-white px-3 py-2.5 text-sm text-ink focus:border-rose-deep focus:outline-none focus:ring-2 focus:ring-rose/40";
export const labelCls = "mb-1 block text-xs font-semibold uppercase tracking-wider text-ink-soft";
