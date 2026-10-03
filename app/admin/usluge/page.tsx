"use client";

import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Plus, Save, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge, ErrorNote, PageHeader, Panel, SmallButton, Spinner, inputCls, labelCls } from "@/components/admin/ui";
import { errorMessage, fetchAllServices } from "@/lib/adminData";
import { cn } from "@/lib/cn";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { formatDuration, formatPrice } from "@/lib/time";
import type { CategoryWithServices, Service } from "@/lib/types";

type Draft = { name: string; description: string; duration_minutes: string; price_rsd: string };

const toDraft = (s?: Service): Draft => ({
  name: s?.name ?? "",
  description: s?.description ?? "",
  duration_minutes: String(s?.duration_minutes ?? 60),
  price_rsd: s?.price_rsd == null ? "" : String(s.price_rsd),
});

function validate(d: Draft) {
  if (d.name.trim().length < 2) return "Unesite naziv usluge.";
  const dur = Number(d.duration_minutes);
  if (!Number.isInteger(dur) || dur < 5 || dur > 600) return "Trajanje mora biti između 5 i 600 minuta.";
  if (dur % 15 !== 0) return "Trajanje mora biti deljivo sa 15 (termini su na 15 minuta).";
  if (d.price_rsd !== "" && (!Number.isInteger(Number(d.price_rsd)) || Number(d.price_rsd) < 0)) return "Cena mora biti ceo broj (ili prazno za „Cena na upit”).";
  return null;
}

export default function ServicesAdminPage() {
  const [cats, setCats] = useState<CategoryWithServices[] | null>(null);
  const [editing, setEditing] = useState<string | null>(null); // service id ili "new:<categoryId>"
  const [draft, setDraft] = useState<Draft>(toDraft());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => fetchAllServices().then(setCats).catch((e) => setError(errorMessage(e))), []);
  useEffect(() => {
    load();
  }, [load]);

  const sb = () => getBrowserSupabase().from("services");

  async function run(fn: () => PromiseLike<{ error: unknown }>) {
    setBusy(true);
    setError(null);
    const { error: err } = await fn();
    setBusy(false);
    if (err) {
      setError(errorMessage(err));
      return false;
    }
    await load();
    return true;
  }

  async function save(categoryId: string, service?: Service) {
    const v = validate(draft);
    if (v) return setError(v);
    const payload = {
      name: draft.name.trim(),
      description: draft.description.trim() || null,
      duration_minutes: Number(draft.duration_minutes),
      price_rsd: draft.price_rsd === "" ? null : Number(draft.price_rsd),
    };
    const ok = service
      ? await run(() => sb().update(payload).eq("id", service.id))
      : await run(() => {
          const cat = cats?.find((c) => c.id === categoryId);
          const sort = Math.max(0, ...(cat?.services.map((s) => s.sort_order) ?? [0])) + 1;
          return sb().insert({ ...payload, category_id: categoryId, sort_order: sort, is_active: true });
        });
    if (ok) setEditing(null);
  }

  async function move(cat: CategoryWithServices, index: number, dir: -1 | 1) {
    const list = [...cat.services];
    const j = index + dir;
    if (j < 0 || j >= list.length) return;
    [list[index], list[j]] = [list[j], list[index]];
    await run(async () => {
      for (let i = 0; i < list.length; i++) {
        const { error: err } = await sb().update({ sort_order: i + 1 }).eq("id", list[i].id);
        if (err) return { error: err };
      }
      return { error: null };
    });
  }

  function editor(categoryId: string, service?: Service) {
    return (
      <div className="space-y-3 rounded-xl border border-rose bg-rose-50 p-4">
        <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
          <div>
            <label className={labelCls} htmlFor="s-name">Naziv</label>
            <input id="s-name" className={inputCls} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </div>
          <div>
            <label className={labelCls} htmlFor="s-dur">Trajanje (min)</label>
            <input id="s-dur" type="number" min={15} step={15} className={inputCls} value={draft.duration_minutes} onChange={(e) => setDraft({ ...draft, duration_minutes: e.target.value })} />
          </div>
          <div>
            <label className={labelCls} htmlFor="s-price">Cena od (RSD)</label>
            <input id="s-price" type="number" min={0} step={100} placeholder="na upit" className={inputCls} value={draft.price_rsd} onChange={(e) => setDraft({ ...draft, price_rsd: e.target.value })} />
          </div>
        </div>
        <div>
          <label className={labelCls} htmlFor="s-desc">Kratak opis</label>
          <textarea id="s-desc" rows={2} className={inputCls} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
        </div>
        <div className="flex gap-2">
          <SmallButton tone="primary" disabled={busy} onClick={() => save(categoryId, service)}>
            <Save className="h-4 w-4" aria-hidden /> Sačuvaj
          </SmallButton>
          <SmallButton onClick={() => setEditing(null)}>
            <X className="h-4 w-4" aria-hidden /> Odustani
          </SmallButton>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Usluge" subtitle="Cene, trajanja, redosled i vidljivost na sajtu. Prazna cena prikazuje „Cena na upit”." />
      <div className="mb-4">
        <ErrorNote>{error}</ErrorNote>
      </div>
      {cats === null ? (
        <Spinner />
      ) : (
        <div className="space-y-5">
          {cats.map((cat) => (
            <Panel
              key={cat.id}
              title={cat.name}
              action={
                <SmallButton
                  onClick={() => {
                    setDraft(toDraft());
                    setEditing(`new:${cat.id}`);
                  }}
                >
                  <Plus className="h-4 w-4" aria-hidden /> Dodaj
                </SmallButton>
              }
            >
              <ul className="divide-y divide-rose-light">
                {cat.services.map((s, i) => (
                  <li key={s.id} className="py-3">
                    {editing === s.id ? (
                      editor(cat.id, s)
                    ) : (
                      <div className={cn("flex flex-wrap items-center gap-3", !s.is_active && "opacity-60")}>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">
                            {s.name} {!s.is_active && <Badge>sakrivena</Badge>}
                          </p>
                          <p className="text-xs text-ink-soft">
                            {formatDuration(s.duration_minutes)} · {formatPrice(s.price_rsd)}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <SmallButton aria-label={`Pomeri gore: ${s.name}`} disabled={busy || i === 0} onClick={() => move(cat, i, -1)} className="px-2.5">
                            <ArrowUp className="h-4 w-4" />
                          </SmallButton>
                          <SmallButton aria-label={`Pomeri dole: ${s.name}`} disabled={busy || i === cat.services.length - 1} onClick={() => move(cat, i, 1)} className="px-2.5">
                            <ArrowDown className="h-4 w-4" />
                          </SmallButton>
                          <SmallButton
                            aria-label={s.is_active ? `Sakrij: ${s.name}` : `Prikaži: ${s.name}`}
                            disabled={busy}
                            onClick={() => run(() => sb().update({ is_active: !s.is_active }).eq("id", s.id))}
                            className="px-2.5"
                          >
                            {s.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </SmallButton>
                          <SmallButton
                            aria-label={`Izmeni: ${s.name}`}
                            onClick={() => {
                              setDraft(toDraft(s));
                              setEditing(s.id);
                            }}
                            className="px-2.5"
                          >
                            <Pencil className="h-4 w-4" />
                          </SmallButton>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
                {editing === `new:${cat.id}` && <li className="py-3">{editor(cat.id)}</li>}
              </ul>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
