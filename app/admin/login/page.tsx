"use client";

import { Lock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getBrowserSupabase } from "@/lib/supabase/client";

// Supabase Auth koristi email; korisničko ime (npr. "Sanela") se pretvara u sanela@bomb-shell.com.
const USERNAME_DOMAIN = "bomb-shell.com";
function toLoginEmail(value: string) {
  const v = value.trim().toLowerCase();
  return v.includes("@") ? v : `${v}@${USERNAME_DOMAIN}`;
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    params.get("greska") === "konfiguracija" || !isSupabaseConfigured() ? "Supabase nije podešen (proverite .env promenljive)." : null,
  );
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: err } = await getBrowserSupabase().auth.signInWithPassword({ email: toLoginEmail(email), password });
    setBusy(false);
    if (err) {
      setError(err.message.toLowerCase().includes("invalid") ? "Pogrešno korisničko ime ili lozinka." : "Prijava nije uspela. Pokušajte ponovo.");
      return;
    }
    const next = params.get("next");
    router.replace(next && next.startsWith("/admin") ? next : "/admin");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Input
        label="Korisničko ime"
        type="text"
        autoComplete="username"
        autoCapitalize="none"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input label="Lozinka" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      )}
      <Button type="submit" fullWidth size="lg" disabled={busy || !email || !password}>
        {busy ? "Prijavljivanje…" : "Prijavi se"}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main id="sadrzaj" className="flex min-h-screen items-center justify-center bg-gradient-to-b from-rose-light to-cream px-4">
      <div className="w-full max-w-sm rounded-4xl bg-white p-8 shadow-soft">
        <div className="mb-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-light text-rose-deeper">
            <Lock className="h-6 w-6" aria-hidden />
          </span>
          <h1 className="mt-4 font-serif text-2xl font-semibold tracking-[0.18em]">BOMBSHELL</h1>
          <p className="mt-1 text-sm text-ink-soft">Prijava u admin panel</p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
