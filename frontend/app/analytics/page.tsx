"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Brain, CalendarDays, Target, TrendingUp } from "lucide-react";
import Link from "next/link";

import { Analytics, api, Child } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const periods = [
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "quarterly", label: "Quarterly" },
  { key: "half_yearly", label: "Half yearly" },
  { key: "yearly", label: "Yearly" },
];

export default function AnalyticsPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [childId, setChildId] = useState("");
  const [period, setPeriod] = useState("weekly");
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Child[]>("/children")
      .then((data) => {
        setChildren(data);
        setChildId((current) => current || data[0]?.id || "");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load children"));
  }, []);

  useEffect(() => {
    if (!childId) return;
    api<Analytics>(`/analytics/children/${childId}?period=${period}`)
      .then(setAnalytics)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load analytics"));
  }, [childId, period]);

  if (error) {
    return <main className="mx-auto max-w-6xl px-5 py-8 text-coral">{error}</main>;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="mx-auto max-w-6xl px-5 py-6">
        <Link className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-violet-700" href="/parent">
          <ArrowLeft size={16} /> Parent dashboard
        </Link>

        <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-pink-500">
              <Brain size={18} /> AI behavior analytics
            </p>
            <h1 className="mt-2 text-5xl font-black text-slate-950">Strengths & Focus Areas</h1>
            <p className="mt-2 max-w-2xl text-base font-medium text-slate-600">
              Deterministic analytics from approvals, submissions, points, and chore trends.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              className="h-12 rounded-2xl border border-violet-100 bg-white px-4 font-bold outline-none focus:ring-2 focus:ring-violet-400"
              value={childId}
              onChange={(event) => setChildId(event.target.value)}
            >
              {children.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.name}
                </option>
              ))}
            </select>
            <div className="flex flex-wrap gap-2">
              {periods.map((item) => (
                <button
                  key={item.key}
                  className={`h-12 rounded-2xl px-4 text-sm font-black transition ${
                    period === item.key
                      ? "bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-lg"
                      : "bg-white text-slate-700"
                  }`}
                  onClick={() => setPeriod(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        <section className="grid gap-5 md:grid-cols-3">
          <Card className="border-2 border-violet-200 bg-white/90 p-6">
            <TrendingUp className="mb-3 text-violet-600" />
            <p className="text-sm font-bold text-violet-600">Completion rate</p>
            <p className="text-4xl font-black text-slate-950">{analytics?.completion_rate ?? 0}%</p>
          </Card>
          <Card className="border-2 border-emerald-200 bg-white/90 p-6">
            <Target className="mb-3 text-emerald-600" />
            <p className="text-sm font-bold text-emerald-600">Approval rate</p>
            <p className="text-4xl font-black text-slate-950">{analytics?.approval_rate ?? 0}%</p>
          </Card>
          <Card className="border-2 border-amber-200 bg-white/90 p-6">
            <CalendarDays className="mb-3 text-amber-600" />
            <p className="text-sm font-bold text-amber-600">Approved points</p>
            <p className="text-4xl font-black text-slate-950">{analytics?.total_points ?? 0}</p>
          </Card>
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-[1fr_1fr]">
          <Card className="border-2 border-white/80 bg-white/90 p-6">
            <h2 className="text-2xl font-black text-slate-950">AI Summary</h2>
            <div className="mt-4 grid gap-3">
              {(analytics?.ai_summary ?? []).map((item) => (
                <p key={item} className="rounded-2xl bg-violet-50 p-4 font-semibold text-slate-700">
                  {item}
                </p>
              ))}
            </div>
          </Card>
          <Card className="border-2 border-white/80 bg-white/90 p-6">
            <h2 className="text-2xl font-black text-slate-950">Trend</h2>
            <div className="mt-5 grid gap-4">
              {(analytics?.trend ?? []).map((bucket) => (
                <div key={bucket.label}>
                  <div className="mb-2 flex justify-between text-xs font-bold text-slate-600">
                    <span>{bucket.start_date}</span>
                    <span>{bucket.points} pts</span>
                  </div>
                  <Progress value={bucket.completion_rate} />
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-2">
          <InsightList title="Strengths" rows={analytics?.strengths ?? []} color="emerald" />
          <InsightList title="Focus Areas" rows={analytics?.focus_areas ?? []} color="pink" />
        </section>

        <section className="mt-6 pb-10">
          <h2 className="mb-4 text-2xl font-black text-slate-950">Chore Behavior Detail</h2>
          <div className="grid gap-3">
            {(analytics?.chores ?? []).map((row) => (
              <Card key={row.chore_id} className="border-2 border-white/80 bg-white/90 p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-black text-slate-950">{row.chore_name}</p>
                      <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-violet-700">
                        {row.category}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-slate-600">{row.insight}</p>
                  </div>
                  <div className="grid min-w-72 grid-cols-3 gap-3 text-center">
                    <Metric label="Done" value={`${row.completion_rate}%`} />
                    <Metric label="Approved" value={`${row.approval_rate}%`} />
                    <Metric label="Points" value={`${row.points}`} />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function InsightList({ title, rows, color }: { title: string; rows: Analytics["strengths"]; color: "emerald" | "pink" }) {
  const colorClass = color === "emerald" ? "border-emerald-200 text-emerald-700 bg-emerald-50" : "border-pink-200 text-pink-700 bg-pink-50";
  return (
    <Card className="border-2 border-white/80 bg-white/90 p-6">
      <h2 className="text-2xl font-black text-slate-950">{title}</h2>
      <div className="mt-4 grid gap-3">
        {rows.length === 0 ? (
          <p className="font-medium text-slate-600">No data yet for this period.</p>
        ) : (
          rows.map((row) => (
            <div key={row.chore_id} className={`rounded-2xl border p-4 ${colorClass}`}>
              <p className="font-black">{row.chore_name}</p>
              <p className="text-sm font-semibold">
                {row.completion_rate}% done, {row.approval_rate}% approved, {row.points} pts
              </p>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-3 py-2">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="text-lg font-black text-slate-950">{value}</p>
    </div>
  );
}
