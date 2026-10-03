"use client";

import {
  Bell,
  CalendarDays,
  CalendarOff,
  Clock,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareHeart,
  Scissors,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { Spinner } from "./ui";

const NAV = [
  { href: "/admin", label: "Kontrolna tabla", icon: LayoutDashboard },
  { href: "/admin/termini", label: "Termini", icon: CalendarDays },
  { href: "/admin/klijentkinje", label: "Klijentkinje", icon: Users },
  { href: "/admin/usluge", label: "Usluge", icon: Scissors },
  { href: "/admin/radno-vreme", label: "Radno vreme", icon: Clock },
  { href: "/admin/neradni-dani", label: "Neradni dani", icon: CalendarOff },
  { href: "/admin/recenzije", label: "Recenzije", icon: MessageSquareHeart },
  { href: "/admin/obavestenja", label: "Log obaveštenja", icon: Bell },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [state, setState] = useState<"loading" | "ok" | "denied">("loading");
  const [email, setEmail] = useState("");
  const [open, setOpen] = useState(false);
  const isLogin = pathname === "/admin/login";

  useEffect(() => {
    if (isLogin) return;
    const sb = getBrowserSupabase();
    (async () => {
      const { data } = await sb.auth.getUser();
      setEmail(data.user?.email ?? "");
      const { data: isAdmin, error } = await sb.rpc("is_admin");
      setState(!error && isAdmin ? "ok" : "denied");
    })();
  }, [isLogin]);

  useEffect(() => setOpen(false), [pathname]);

  if (isLogin) return <>{children}</>;

  async function logout() {
    await getBrowserSupabase().auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  const nav = (
    <nav aria-label="Admin navigacija" className="flex flex-1 flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active ? "bg-rose-deep text-white shadow-soft" : "text-ink hover:bg-rose-light",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden /> {label}
          </Link>
        );
      })}
      <div className="mt-auto space-y-1 border-t border-rose-light pt-4">
        <Link href="/" target="_blank" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-soft hover:bg-rose-light">
          <ExternalLink className="h-4 w-4" aria-hidden /> Otvori sajt
        </Link>
        <button type="button" onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-soft hover:bg-rose-light">
          <LogOut className="h-4 w-4" aria-hidden /> Odjava
        </button>
        {email && <p className="truncate px-3 pt-1 text-xs text-ink-soft">{email}</p>}
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-cream">
      {/* Mobilno zaglavlje */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-rose-light bg-white/90 px-4 backdrop-blur lg:hidden">
        <Link href="/admin" className="font-serif text-lg font-semibold tracking-[0.15em]">
          BOMBSHELL <span className="text-xs font-sans font-medium tracking-normal text-gold-dark">admin</span>
        </Link>
        <button type="button" onClick={() => setOpen(true)} className="rounded-full p-2 hover:bg-rose-light" aria-label="Otvori meni" aria-expanded={open}>
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin meni">
          <div className="absolute inset-0 bg-ink/30" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-72 flex-col bg-white p-4 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-serif text-lg">Meni</span>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-rose-light" aria-label="Zatvori meni">
                <X className="h-5 w-5" />
              </button>
            </div>
            {nav}
          </div>
        </div>
      )}

      <div className="lg:flex">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-rose-light bg-white p-5 lg:flex">
          <Link href="/admin" className="mb-8 block">
            <span className="font-serif text-xl font-semibold tracking-[0.18em]">BOMBSHELL</span>
            <span className="mt-1 block text-[0.6rem] font-semibold uppercase tracking-[0.35em] text-gold-dark">Admin panel</span>
          </Link>
          {nav}
        </aside>
        <main id="sadrzaj" className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          {state === "loading" && <Spinner />}
          {state === "denied" && (
            <div className="mx-auto max-w-md rounded-2xl bg-white p-8 text-center shadow-card">
              <h1 className="text-2xl">Nemate pristup</h1>
              <p className="mt-3 text-sm text-ink-soft">
                Nalog {email && <strong>{email}</strong>} nije administrator salona. Dodajte ga u tabelu <code>admin_users</code> (vidi README).
              </p>
              <button type="button" onClick={logout} className="mt-6 rounded-full bg-rose-deep px-6 py-2.5 text-sm font-semibold text-white">
                Odjava
              </button>
            </div>
          )}
          {state === "ok" && children}
        </main>
      </div>
    </div>
  );
}
