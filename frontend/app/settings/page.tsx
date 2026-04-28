"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  LogOut,
  Plus,
  Save,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { api, Child, ParentProfile } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

function ageFromDob(dob?: string | null) {
  if (!dob) return null;
  const birth = new Date(`${dob}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDelta = today.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}

function ageGap(parentDob?: string | null, childDob?: string | null) {
  const parentAge = ageFromDob(parentDob);
  const childAge = ageFromDob(childDob);
  if (parentAge === null || childAge === null) return "Add both DOBs";
  return `${parentAge - childAge} years`;
}

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ParentProfile | null>(null);
  const [familyName, setFamilyName] = useState("");
  const [rewardRate, setRewardRate] = useState(1);
  const [parentName, setParentName] = useState("");
  const [parentDob, setParentDob] = useState("");
  const [newChildName, setNewChildName] = useState("");
  const [newChildDob, setNewChildDob] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    try {
      const data = await api<ParentProfile>("/me");
      setProfile(data);
      setFamilyName(data.family.name);
      setRewardRate(data.family.point_to_rupee_rate);
      setParentName(data.user.full_name ?? "");
      setParentDob(data.user.date_of_birth ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load settings");
    }
  }

  useEffect(() => {
    load();
  }, []);

  function flash(text: string) {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 1800);
  }

  function logout() {
    window.localStorage.removeItem("token");
    router.push("/");
  }

  async function saveFamily(event: FormEvent) {
    event.preventDefault();
    await api("/families/me", {
      method: "PATCH",
      body: JSON.stringify({ name: familyName, point_to_rupee_rate: rewardRate }),
    });
    await load();
    flash("Family settings saved");
  }

  async function saveParent(event: FormEvent) {
    event.preventDefault();
    await api("/me/profile", {
      method: "PATCH",
      body: JSON.stringify({ full_name: parentName || null, date_of_birth: parentDob || null }),
    });
    await load();
    flash("Parent profile saved");
  }

  async function addChild(event: FormEvent) {
    event.preventDefault();
    await api<Child>("/children", {
      method: "POST",
      body: JSON.stringify({
        name: newChildName,
        date_of_birth: newChildDob || null,
        avatar_color: "violet",
      }),
    });
    setNewChildName("");
    setNewChildDob("");
    await load();
    flash("Child added");
  }

  const parentAge = useMemo(() => ageFromDob(parentDob), [parentDob]);

  if (error) {
    return <main className="mx-auto max-w-5xl px-5 py-8 text-coral">{error}</main>;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="mx-auto max-w-6xl px-5 py-6">
        <Link className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-violet-700" href="/parent">
          <ArrowLeft size={16} /> Parent dashboard
        </Link>

        <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-pink-500">
              <Settings size={18} /> Settings
            </p>
            <h1 className="mt-2 text-5xl font-black text-slate-950">Family Settings</h1>
            <p className="mt-2 max-w-2xl text-base font-medium text-slate-600">
              Edit family profile, parent details, child profiles, and add more children.
            </p>
          </div>
          {message ? (
            <div className="rounded-2xl bg-emerald-100 px-4 py-3 text-sm font-black text-emerald-700">{message}</div>
          ) : null}
        </header>

        <section className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
          <Card className="border-2 border-white/80 bg-white/90 p-6">
            <div className="mb-5 flex items-center gap-4">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 text-white shadow-lg shadow-violet-500/25">
                <UserRound size={30} />
              </span>
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-violet-600">Parent profile</p>
                <p className="text-2xl font-black text-slate-950">{parentName || profile?.user.email || "Parent"}</p>
                <p className="text-sm font-semibold text-slate-600">
                  {profile?.user.email} {profile?.user.phone_number ? `- ${profile.user.phone_number}` : ""}
                </p>
              </div>
            </div>

            <form className="grid gap-4" onSubmit={saveParent}>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-sm font-black text-slate-700">
                  Parent name
                  <input
                    className="mt-2 h-12 w-full rounded-2xl border border-violet-100 px-4 outline-none focus:ring-2 focus:ring-violet-400"
                    value={parentName}
                    onChange={(event) => setParentName(event.target.value)}
                    placeholder="Parent full name"
                  />
                </label>
                <label className="text-sm font-black text-slate-700">
                  Parent date of birth
                  <input
                    className="mt-2 h-12 w-full rounded-2xl border border-violet-100 px-4 outline-none focus:ring-2 focus:ring-violet-400"
                    value={parentDob}
                    onChange={(event) => setParentDob(event.target.value)}
                    type="date"
                  />
                </label>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <ReadOnlyTile label="Email" value={profile?.user.email ?? "-"} />
                <ReadOnlyTile label="Phone" value={profile?.user.phone_number ?? "-"} />
                <ReadOnlyTile label="Parent age" value={parentAge === null ? "Add DOB" : `${parentAge} years`} />
              </div>

              <Button className="h-12 w-fit">
                <Save size={18} /> Save parent profile
              </Button>
            </form>
          </Card>

          <Card className="border-2 border-white/80 bg-white/90 p-6">
            <ShieldCheck className="mb-4 text-emerald-600" size={30} />
            <h2 className="text-2xl font-black text-slate-950">Account Actions</h2>
            <div className="mt-5 grid gap-3">
              <Link href="/chores">
                <Button variant="secondary" className="h-12 w-full justify-start rounded-2xl border-0">
                  <SlidersHorizontal size={18} /> Edit chores and points
                </Button>
              </Link>
              <Link href="/analytics">
                <Button variant="secondary" className="h-12 w-full justify-start rounded-2xl border-0">
                  <BarChart3 size={18} /> View analytics
                </Button>
              </Link>
              <Button variant="danger" className="h-12 w-full justify-start rounded-2xl" onClick={logout}>
                <LogOut size={18} /> Logout
              </Button>
            </div>
          </Card>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="border-2 border-white/80 bg-white/90 p-6">
            <h2 className="text-2xl font-black text-slate-950">Family</h2>
            <form className="mt-5 grid gap-4" onSubmit={saveFamily}>
              <label className="text-sm font-black text-slate-700">
                Family name
                <input
                  className="mt-2 h-12 w-full rounded-2xl border border-violet-100 px-4 outline-none focus:ring-2 focus:ring-violet-400"
                  value={familyName}
                  onChange={(event) => setFamilyName(event.target.value)}
                />
              </label>
              <label className="text-sm font-black text-slate-700">
                Reward conversion
                <input
                  className="mt-2 h-12 w-full rounded-2xl border border-violet-100 px-4 outline-none focus:ring-2 focus:ring-violet-400"
                  min={1}
                  type="number"
                  value={rewardRate}
                  onChange={(event) => setRewardRate(Number(event.target.value))}
                />
              </label>
              <Button className="h-12 w-fit">
                <Save size={18} /> Save family
              </Button>
            </form>
          </Card>

          <Card className="border-2 border-white/80 bg-white/90 p-6">
            <h2 className="text-2xl font-black text-slate-950">Add Child</h2>
            <form className="mt-5 grid gap-4 md:grid-cols-[1fr_180px_auto]" onSubmit={addChild}>
              <input
                className="h-12 rounded-2xl border border-violet-100 px-4 outline-none focus:ring-2 focus:ring-violet-400"
                placeholder="Child name"
                value={newChildName}
                onChange={(event) => setNewChildName(event.target.value)}
                required
              />
              <input
                className="h-12 rounded-2xl border border-violet-100 px-4 outline-none focus:ring-2 focus:ring-violet-400"
                value={newChildDob}
                onChange={(event) => setNewChildDob(event.target.value)}
                type="date"
              />
              <Button className="h-12">
                <Plus size={18} /> Add
              </Button>
            </form>
          </Card>
        </section>

        <section className="mt-5 pb-10">
          <h2 className="mb-4 text-2xl font-black text-slate-950">Children Profiles</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {(profile?.children ?? []).map((child) => (
              <ChildProfileCard key={child.id} child={child} parentDob={parentDob} onSaved={load} onMessage={flash} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function ChildProfileCard({
  child,
  parentDob,
  onSaved,
  onMessage,
}: {
  child: Child;
  parentDob: string;
  onSaved: () => Promise<void>;
  onMessage: (message: string) => void;
}) {
  const [name, setName] = useState(child.name);
  const [dob, setDob] = useState(child.date_of_birth ?? "");

  async function save(event: FormEvent) {
    event.preventDefault();
    await api<Child>(`/children/${child.id}`, {
      method: "PATCH",
      body: JSON.stringify({ name, date_of_birth: dob || null }),
    });
    await onSaved();
    onMessage(`${name} saved`);
  }

  const childAge = ageFromDob(dob);

  return (
    <Card className="border-2 border-white/80 bg-white/90 p-6">
      <form className="grid gap-4" onSubmit={save}>
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 font-black text-white">
            {name.slice(0, 1).toUpperCase() || "C"}
          </span>
          <div>
            <p className="text-lg font-black text-slate-950">{name || child.name}</p>
            <p className="text-xs font-bold text-slate-500">Child profile</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm font-black text-slate-700">
            Child name
            <input
              className="mt-2 h-12 w-full rounded-2xl border border-violet-100 px-4 outline-none focus:ring-2 focus:ring-violet-400"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label className="text-sm font-black text-slate-700">
            Date of birth
            <input
              className="mt-2 h-12 w-full rounded-2xl border border-violet-100 px-4 outline-none focus:ring-2 focus:ring-violet-400"
              value={dob}
              onChange={(event) => setDob(event.target.value)}
              type="date"
            />
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <ReadOnlyTile label="Child age" value={childAge === null ? "Add DOB" : `${childAge} years`} />
          <ReadOnlyTile label="Parent-child age gap" value={ageGap(parentDob, dob)} />
        </div>

        <Button className="h-12 w-fit">
          <Save size={18} /> Save child
        </Button>
      </form>
    </Card>
  );
}

function ReadOnlyTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-violet-50 p-4">
      <div className="flex items-center gap-2">
        <CalendarDays size={15} className="text-violet-600" />
        <p className="text-xs font-black uppercase tracking-wide text-violet-600">{label}</p>
      </div>
      <p className="mt-1 text-base font-black text-slate-950">{value}</p>
    </div>
  );
}
