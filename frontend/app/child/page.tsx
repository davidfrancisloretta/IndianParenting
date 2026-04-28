"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Clock, Sparkles, Star } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { api, Child, DailyLog } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const categoryTheme: Record<string, { card: string; badge: string; detail: string }> = {
  Fun: {
    card: "border-pink-200/80 bg-white/95 hover:border-fuchsia-300",
    badge: "bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white",
    detail: "text-fuchsia-600",
  },
  Habit: {
    card: "border-sky-200/80 bg-white/95 hover:border-cyan-300",
    badge: "bg-gradient-to-r from-blue-500 to-cyan-400 text-white",
    detail: "text-blue-600",
  },
  Chores: {
    card: "border-orange-200/80 bg-white/95 hover:border-amber-300",
    badge: "bg-gradient-to-r from-orange-500 to-amber-400 text-white",
    detail: "text-orange-600",
  },
  Health: {
    card: "border-emerald-200/80 bg-white/95 hover:border-green-300",
    badge: "bg-gradient-to-r from-emerald-500 to-lime-400 text-white",
    detail: "text-emerald-600",
  },
  Skills: {
    card: "border-violet-200/80 bg-white/95 hover:border-indigo-300",
    badge: "bg-gradient-to-r from-violet-500 to-indigo-500 text-white",
    detail: "text-violet-600",
  },
};

function pointLabel(log: DailyLog) {
  const chore = log.chore;
  if (chore.type === "BOOLEAN") return `${chore.fixed_points} pt`;
  if (chore.type === "SCORE") {
    const maxScore = chore.max_score ?? 2;
    return `Up to ${maxScore * chore.score_multiplier} pts`;
  }
  if (!chore.duration_minutes) return "Time pts";
  return `${Math.floor(chore.duration_minutes / chore.minutes_per_point)} pts`;
}

function detailLabel(log: DailyLog) {
  const parts = [];
  if (log.chore.time_slot) parts.push(log.chore.time_slot);
  if (log.chore.type === "TIME_BASED" && log.chore.duration_minutes) parts.push(`${log.chore.duration_minutes} min`);
  if (log.chore.type === "SCORE") parts.push(`Score 0-${log.chore.max_score ?? 2}`);
  return parts.join(" - ");
}

export default function ChildPage() {
  return (
    <Suspense fallback={<main className="p-6">Loading child profile...</main>}>
      <ChildProfile />
    </Suspense>
  );
}

function ChildProfile() {
  const params = useSearchParams();
  const childId = params.get("childId");
  const [children, setChildren] = useState<Child[]>([]);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [error, setError] = useState("");

  async function load() {
    if (!childId) return;
    try {
      const [childrenData, logsData] = await Promise.all([
        api<Child[]>("/children"),
        api<DailyLog[]>(`/children/${childId}/daily-logs`),
      ]);
      setChildren(childrenData);
      setLogs(logsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load child profile");
    }
  }

  useEffect(() => {
    load();
  }, [childId]);

  async function submit(log: DailyLog) {
    const value = log.chore.type === "BOOLEAN" ? 1 : log.chore.duration_minutes ?? log.chore.max_score ?? 1;
    await api(`/daily-logs/${log.id}/submit`, {
      method: "POST",
      body: JSON.stringify({ value }),
    });
    await load();
  }

  const child = children.find((item) => item.id === childId);
  const completed = logs.filter((log) => ["SUBMITTED", "APPROVED"].includes(log.status)).length;
  const approvedPoints = logs.reduce((sum, log) => sum + log.points_awarded, 0);
  const progress = useMemo(() => (logs.length ? (completed / logs.length) * 100 : 0), [completed, logs.length]);

  if (!childId) {
    return <main className="p-6">Choose a child from the parent dashboard.</main>;
  }

  if (error) {
    return <main className="mx-auto max-w-4xl px-5 py-8 text-coral">{error}</main>;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="mx-auto max-w-4xl px-5 py-6">
        <header className="mb-6">
          <Link className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-violet-700" href="/parent">
            <ArrowLeft size={16} /> Parent dashboard
          </Link>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="flex items-center gap-1 text-xs font-black uppercase tracking-wide text-pink-500">
                <Sparkles size={14} /> Child profile
              </p>
              <h1 className="bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500 bg-clip-text text-5xl font-black text-transparent">
                {child?.name ?? "Today"}
              </h1>
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-2xl font-black text-white shadow-lg shadow-violet-500/25">
              {child?.name.slice(0, 1) ?? "?"}
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <Card className="border-2 border-violet-300/80 bg-white/85 transition hover:-translate-y-1 hover:shadow-xl">
            <CheckCircle2 className="mb-3 text-violet-500" />
            <p className="text-sm font-semibold text-violet-600">Progress</p>
            <p className="text-4xl font-black text-violet-600">
              {completed}/{logs.length}
            </p>
          </Card>
          <Card className="border-2 border-amber-300/90 bg-white/85 transition hover:-translate-y-1 hover:shadow-xl">
            <Star className="mb-3 text-amber-500" />
            <p className="text-sm font-semibold text-amber-600">Approved points</p>
            <p className="text-4xl font-black text-amber-600">{approvedPoints}</p>
          </Card>
          <Card className="border-2 border-emerald-300/90 bg-white/85 transition hover:-translate-y-1 hover:shadow-xl">
            <Clock className="mb-3 text-emerald-500" />
            <p className="text-sm font-semibold text-emerald-600">Streak</p>
            <p className="text-4xl font-black text-emerald-600">Today</p>
          </Card>
        </section>

        <div className="my-6">
          <Progress value={progress} />
        </div>

        <section className="grid gap-3 pb-10">
          {logs.map((log) => {
            const theme = categoryTheme[log.chore.category] ?? categoryTheme.Habit;
            const isComplete = log.status === "SUBMITTED" || log.status === "APPROVED";
            return (
              <Card
                key={log.id}
                className={`flex flex-col gap-3 border-2 transition duration-200 hover:-translate-y-1 hover:shadow-xl sm:flex-row sm:items-center sm:justify-between ${theme.card}`}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-black text-slate-900">{log.chore.name}</p>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-black shadow-sm ${theme.badge}`}>
                      {log.chore.category}
                    </span>
                    <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-black text-white shadow-sm">
                      {pointLabel(log)}
                    </span>
                  </div>
                  {detailLabel(log) ? (
                    <p className={`mt-1 text-xs font-black uppercase ${theme.detail}`}>{detailLabel(log)}</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-500">{log.status}</span>
                  {isComplete ? (
                    <Button
                      variant="secondary"
                      disabled
                      className="border-0 bg-gradient-to-r from-emerald-500 to-green-500 text-white opacity-100 disabled:opacity-100"
                    >
                      <CheckCircle2 size={18} /> Done
                    </Button>
                  ) : (
                    <Button onClick={() => submit(log)}>
                      <CheckCircle2 size={18} /> Done
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </section>
      </div>
    </main>
  );
}
