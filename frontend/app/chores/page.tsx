"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, Save, Settings } from "lucide-react";
import Link from "next/link";

import { api, Chore } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const categories = ["Habit", "Fun", "Health", "Chores", "Skills"] as const;
const types = ["BOOLEAN", "SCORE", "TIME_BASED"] as const;

export default function ChoresPage() {
  const [chores, setChores] = useState<Chore[]>([]);
  const [error, setError] = useState("");

  async function load() {
    try {
      setChores(await api<Chore[]>("/chores"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load chores");
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (error) {
    return <main className="mx-auto max-w-6xl px-5 py-8 text-coral">{error}</main>;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="mx-auto max-w-6xl px-5 py-6">
        <Link className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-violet-700" href="/parent">
          <ArrowLeft size={16} /> Parent dashboard
        </Link>
        <header className="mb-8">
          <p className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-pink-500">
            <Settings size={18} /> Chore rules
          </p>
          <h1 className="mt-2 text-5xl font-black text-slate-950">Edit Chores & Points</h1>
          <p className="mt-2 max-w-2xl text-base font-medium text-slate-600">
            Change task names, categories, minutes, scoring rules, and point values.
          </p>
        </header>

        <section className="grid gap-4 pb-10">
          {chores.map((chore) => (
            <ChoreEditor key={chore.id} chore={chore} onSaved={load} />
          ))}
        </section>
      </div>
    </main>
  );
}

function ChoreEditor({ chore, onSaved }: { chore: Chore; onSaved: () => Promise<void> }) {
  const [draft, setDraft] = useState(chore);
  const [saved, setSaved] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    await api<Chore>(`/chores/${chore.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        name: draft.name,
        category: draft.category,
        type: draft.type,
        duration_minutes: draft.duration_minutes,
        time_slot: draft.time_slot || null,
        max_score: draft.max_score,
        fixed_points: draft.fixed_points,
        score_multiplier: draft.score_multiplier,
        minutes_per_point: draft.minutes_per_point,
        is_active: draft.is_active,
      }),
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1500);
    await onSaved();
  }

  return (
    <Card className="border-2 border-white/80 bg-white/90 p-5">
      <form className="grid gap-4" onSubmit={submit}>
        <div className="grid gap-3 lg:grid-cols-[1.4fr_150px_160px_130px]">
          <label className="text-sm font-black text-slate-700">
            Chore
            <input
              className="mt-2 h-12 w-full rounded-2xl border border-violet-100 px-4 outline-none focus:ring-2 focus:ring-violet-400"
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            />
          </label>
          <label className="text-sm font-black text-slate-700">
            Category
            <select
              className="mt-2 h-12 w-full rounded-2xl border border-violet-100 px-4 outline-none focus:ring-2 focus:ring-violet-400"
              value={draft.category}
              onChange={(event) => setDraft({ ...draft, category: event.target.value as Chore["category"] })}
            >
              {categories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-black text-slate-700">
            Type
            <select
              className="mt-2 h-12 w-full rounded-2xl border border-violet-100 px-4 outline-none focus:ring-2 focus:ring-violet-400"
              value={draft.type}
              onChange={(event) => setDraft({ ...draft, type: event.target.value as Chore["type"] })}
            >
              {types.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-black text-slate-700">
            Active
            <select
              className="mt-2 h-12 w-full rounded-2xl border border-violet-100 px-4 outline-none focus:ring-2 focus:ring-violet-400"
              value={draft.is_active ? "yes" : "no"}
              onChange={(event) => setDraft({ ...draft, is_active: event.target.value === "yes" })}
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-5">
          <NumberField label="Boolean pts" value={draft.fixed_points} onChange={(value) => setDraft({ ...draft, fixed_points: value })} />
          <NumberField label="Score max" value={draft.max_score ?? 2} onChange={(value) => setDraft({ ...draft, max_score: value })} />
          <NumberField
            label="Score multiplier"
            value={draft.score_multiplier}
            onChange={(value) => setDraft({ ...draft, score_multiplier: value })}
          />
          <NumberField
            label="Minutes"
            value={draft.duration_minutes ?? 0}
            onChange={(value) => setDraft({ ...draft, duration_minutes: value || null })}
          />
          <NumberField
            label="Min / point"
            value={draft.minutes_per_point}
            onChange={(value) => setDraft({ ...draft, minutes_per_point: Math.max(1, value) })}
          />
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <label className="w-full text-sm font-black text-slate-700 md:max-w-sm">
            Time slot
            <input
              className="mt-2 h-12 w-full rounded-2xl border border-violet-100 px-4 outline-none focus:ring-2 focus:ring-violet-400"
              placeholder="Optional"
              value={draft.time_slot ?? ""}
              onChange={(event) => setDraft({ ...draft, time_slot: event.target.value })}
            />
          </label>
          <Button className="h-12 min-w-36">
            <Save size={18} /> {saved ? "Saved" : "Save"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="text-sm font-black text-slate-700">
      {label}
      <input
        className="mt-2 h-12 w-full rounded-2xl border border-violet-100 px-4 outline-none focus:ring-2 focus:ring-violet-400"
        min={0}
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
