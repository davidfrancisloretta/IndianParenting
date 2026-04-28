"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { BarChart3, Check, ChevronRight, CircleDollarSign, ClipboardCheck, Plus, Settings, Trophy, X } from "lucide-react";
import Link from "next/link";

import { api, Child, DailyLog } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type Dashboard = {
  family: { id: string; name: string; point_to_rupee_rate: number };
  children: Child[];
  pending_approvals: number;
  weekly_totals: Record<string, number>;
  leaderboard: { child_id: string; name: string; points: number; rank: number }[];
};

type Payout = {
  child_id: string;
  child_name: string;
  week_start: string;
  week_end: string;
  total_points: number;
  rupees: number;
  status: string;
};

function rupees(value: number) {
  return `\u20b9${value}`;
}

function avatarLetter(name: string) {
  return name.slice(0, 1).toUpperCase();
}

export default function ParentDashboard() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [pending, setPending] = useState<DailyLog[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [error, setError] = useState("");
  const [customOpen, setCustomOpen] = useState(false);

  async function load() {
    try {
      const [dashboardData, pendingData, payoutData] = await Promise.all([
        api<Dashboard>("/dashboard"),
        api<DailyLog[]>("/approvals/pending"),
        api<Payout[]>("/payouts/weekly"),
      ]);
      setDashboard(dashboardData);
      setPending(pendingData);
      setPayouts(payoutData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load dashboard");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function review(log: DailyLog, approved: boolean) {
    const value = approved ? log.submitted_value ?? log.chore.duration_minutes ?? 1 : undefined;
    await api(`/daily-logs/${log.id}/review`, {
      method: "POST",
      body: JSON.stringify({ approved, value }),
    });
    await load();
  }

  const maxPoints = useMemo(() => Math.max(1, ...Object.values(dashboard?.weekly_totals ?? { value: 1 })), [dashboard]);

  if (error) {
    return <main className="mx-auto max-w-6xl px-5 py-8 text-coral">{error}</main>;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="mx-auto max-w-6xl px-5 py-6">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-violet-600">Parent dashboard</p>
            <h1 className="mt-2 text-5xl font-black tracking-normal text-slate-950">
              {dashboard?.family.name ?? "Family Rewards"}
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/analytics">
              <Button variant="secondary" className="h-12 rounded-2xl border-0 px-5">
                <BarChart3 size={18} /> Analytics
              </Button>
            </Link>
            <Link href="/chores">
              <Button variant="secondary" className="h-12 rounded-2xl border-0 px-5">
                <Settings size={18} /> Edit chores
              </Button>
            </Link>
            <Button
              className="h-12 rounded-2xl bg-gradient-to-r from-violet-600 to-pink-600 px-6 shadow-lg shadow-violet-500/25"
              onClick={() => setCustomOpen((open) => !open)}
            >
              <Plus size={18} /> New chore
            </Button>
          </div>
        </header>

        {customOpen ? <CustomChoreForm onSaved={load} /> : null}

        <section className="grid gap-6 md:grid-cols-3">
          <Card className="min-h-36 border-2 border-violet-200/80 bg-white/90 p-6 transition hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                <ClipboardCheck size={24} />
              </span>
              <p className="text-base font-semibold text-slate-800">Pending approvals</p>
            </div>
            <p className="mt-7 text-4xl font-black text-slate-950">{dashboard?.pending_approvals ?? 0}</p>
          </Card>
          <Card className="min-h-36 border-2 border-emerald-200/80 bg-white/90 p-6 transition hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <CircleDollarSign size={24} />
              </span>
              <p className="text-base font-semibold text-slate-800">Conversion</p>
            </div>
            <p className="mt-7 text-4xl font-black text-slate-950">{rupees(dashboard?.family.point_to_rupee_rate ?? 1)} / pt</p>
          </Card>
          <Card className="min-h-36 border-2 border-amber-200/90 bg-white/90 p-6 transition hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                <Trophy size={24} />
              </span>
              <p className="text-base font-semibold text-slate-800">Leader</p>
            </div>
            <p className="mt-7 text-4xl font-black text-slate-950">{dashboard?.leaderboard[0]?.name ?? "-"}</p>
          </Card>
        </section>

        <section className="mt-8 grid gap-6 md:grid-cols-2">
          {dashboard?.children.map((child) => {
            const points = dashboard.weekly_totals[child.name] ?? 0;
            return (
              <Link key={child.id} href={`/child?childId=${child.id}`} className="block">
                <Card className="border-2 border-white/70 bg-white/90 p-6 transition duration-200 hover:-translate-y-1 hover:shadow-xl">
                  <div className="flex items-center justify-between gap-5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-black text-slate-950">{child.name}</p>
                        <ChevronRight size={20} className="text-slate-400" />
                      </div>
                      <p className="mt-1 text-sm font-medium text-slate-600">
                        This week: {points} pts / {rupees(points)}
                      </p>
                      <div className="mt-4">
                        <Progress value={(points / maxPoints) * 100} />
                      </div>
                    </div>
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 text-2xl font-black text-white shadow-lg shadow-violet-500/25">
                      {avatarLetter(child.name)}
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </section>

        <section className="mt-8">
          <h2 className="mb-4 text-2xl font-black text-slate-950">Pending Approval</h2>
          <div className="grid gap-3">
            {pending.length === 0 ? (
              <Card className="flex min-h-40 flex-col items-center justify-center border-2 border-white/70 bg-white/90 text-center">
                <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <ClipboardCheck size={30} />
                </span>
                <p className="text-base font-medium text-slate-600">No chores are waiting for approval.</p>
              </Card>
            ) : (
              pending.map((log) => (
                <Card
                  key={log.id}
                  className="flex flex-col gap-3 border-2 border-white/70 bg-white/90 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-black text-slate-950">{log.chore.name}</p>
                    <p className="text-sm font-medium text-slate-600">
                      {log.chore.category} - submitted {log.submitted_value ?? "done"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => review(log, true)}>
                      <Check size={18} /> Approve
                    </Button>
                    <Button variant="danger" onClick={() => review(log, false)}>
                      <X size={18} /> Reject
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </section>

        <section className="mt-8 pb-10">
          <h2 className="mb-4 text-2xl font-black text-slate-950">Weekly Payout</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {payouts.map((payout) => (
              <Card key={payout.child_id} className="border-2 border-white/70 bg-white/90 p-6 transition hover:-translate-y-1 hover:shadow-xl">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 font-black text-white">
                    {avatarLetter(payout.child_name)}
                  </span>
                  <div>
                    <p className="font-black text-slate-950">{payout.child_name}</p>
                    <p className="text-xs font-medium text-slate-600">
                      {payout.week_start} to {payout.week_end}
                    </p>
                  </div>
                </div>
                <p className="mt-5 text-4xl font-black text-slate-950">{rupees(payout.rupees)}</p>
                <p className="mt-1 text-sm font-medium text-slate-600">{payout.total_points} approved points</p>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function CustomChoreForm({ onSaved }: { onSaved: () => Promise<void> }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Habit");
  const [type, setType] = useState("BOOLEAN");

  async function submit(event: FormEvent) {
    event.preventDefault();
    await api("/chores", {
      method: "POST",
      body: JSON.stringify({
        name,
        category,
        type,
        duration_minutes: type === "TIME_BASED" ? 10 : null,
        max_score: type === "SCORE" ? 2 : null,
      }),
    });
    setName("");
    await onSaved();
  }

  return (
    <Card className="mb-8 border-2 border-white/70 bg-white/90 p-5">
      <form className="grid gap-3 md:grid-cols-[1fr_160px_160px_auto]" onSubmit={submit}>
        <input
          className="h-12 rounded-2xl border border-violet-100 bg-white px-4 outline-none focus:ring-2 focus:ring-violet-400"
          placeholder="New chore name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
        <select
          className="h-12 rounded-2xl border border-violet-100 bg-white px-4 outline-none focus:ring-2 focus:ring-violet-400"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          {["Habit", "Fun", "Health", "Chores", "Skills"].map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <select
          className="h-12 rounded-2xl border border-violet-100 bg-white px-4 outline-none focus:ring-2 focus:ring-violet-400"
          value={type}
          onChange={(event) => setType(event.target.value)}
        >
          {["BOOLEAN", "SCORE", "TIME_BASED"].map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <Button className="h-12">
          <Plus size={18} /> Add
        </Button>
      </form>
    </Card>
  );
}
