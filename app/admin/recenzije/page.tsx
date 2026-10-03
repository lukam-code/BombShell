"use client";

import { Check, EyeOff, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Empty, ErrorNote, PageHeader, Panel, SmallButton, Spinner } from "@/components/admin/ui";
import { Stars } from "@/components/ui/Stars";
import { errorMessage } from "@/lib/adminData";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { formatBelgrade } from "@/lib/time";
import type { Review } from "@/lib/types";

export default function ReviewsAdminPage() {
  const [list, setList] = useState<Review[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error: err } = await getBrowserSupabase()
      .from("reviews")
      .select("id, customer_name, display_name, rating, text, service_id, is_approved, created_at, services(name)")
      .order("created_at", { ascending: false });
    if (err) setError(errorMessage(err));
    setList((data ?? []) as unknown as Review[]);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function act(id: string, action: "approve" | "hide" | "delete") {
    setError(null);
    const t = getBrowserSupabase().from("reviews");
    const { error: err } =
      action === "delete" ? await t.delete().eq("id", id) : await t.update({ is_approved: action === "approve" }).eq("id", id);
    if (err) setError(errorMessage(err));
    setConfirmDelete(null);
    load();
  }

  const pending = list?.filter((r) => !r.is_approved) ?? [];
  const published = list?.filter((r) => r.is_approved) ?? [];

  const item = (r: Review) => (
    <li key={r.id} className="py-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{r.customer_name}</span>
        <span className="text-xs text-ink-soft">(na sajtu: {r.display_name})</span>
        <Stars rating={r.rating} />
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm">{r.text}</p>
      <p className="mt-1 text-xs text-ink-soft">
        {r.services?.name && `${r.services.name} · `}
        {formatBelgrade(r.created_at, "d.M.yyyy. HH:mm")}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {r.is_approved ? (
          <SmallButton onClick={() => act(r.id, "hide")}>
            <EyeOff className="h-4 w-4" aria-hidden /> Sakrij
          </SmallButton>
        ) : (
          <SmallButton tone="primary" onClick={() => act(r.id, "approve")}>
            <Check className="h-4 w-4" aria-hidden /> Odobri
          </SmallButton>
        )}
        {confirmDelete === r.id ? (
          <>
            <SmallButton tone="danger" onClick={() => act(r.id, "delete")}>Potvrdi brisanje</SmallButton>
            <SmallButton onClick={() => setConfirmDelete(null)}>Odustani</SmallButton>
          </>
        ) : (
          <SmallButton tone="danger" onClick={() => setConfirmDelete(r.id)}>
            <Trash2 className="h-4 w-4" aria-hidden /> Obriši
          </SmallButton>
        )}
      </div>
    </li>
  );

  return (
    <div>
      <PageHeader title="Recenzije" subtitle="Na sajtu se prikazuju samo odobrene recenzije, sa imenom i prvim slovom prezimena." />
      <ErrorNote>{error}</ErrorNote>
      {list === null ? (
        <Spinner />
      ) : (
        <div className="space-y-5">
          <Panel title={`Na čekanju (${pending.length})`}>
            {pending.length ? <ul className="divide-y divide-rose-light">{pending.map(item)}</ul> : <Empty>Nema recenzija na čekanju.</Empty>}
          </Panel>
          <Panel title={`Objavljene (${published.length})`}>
            {published.length ? <ul className="divide-y divide-rose-light">{published.map(item)}</ul> : <Empty>Još nema objavljenih recenzija.</Empty>}
          </Panel>
        </div>
      )}
    </div>
  );
}
