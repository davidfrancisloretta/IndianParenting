"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, Facebook, Mail, Phone, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

import { API_URL, login } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("parent@example.com");
  const [password, setPassword] = useState("ChangeMe123!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(identifier, password);
      router.push("/parent");
    } catch (err) {
      console.error("Login error caught:", err, typeof err);
      let errorText = "Login failed";
      if (err instanceof Error) {
        errorText = String(err.message || err).trim() || "Login failed";
      } else if (typeof err === "string") {
        errorText = err.trim() || "Login failed";
      } else if (err && typeof err === "object") {
        try {
          errorText = JSON.stringify(err);
        } catch {
          errorText = String(err) || "Login failed";
        }
      }
      // Final safety: ensure no [object Object] slips through
      if (errorText === "[object Object]") {
        errorText = "Login failed";
      }
      setError(errorText);
    } finally {
      setLoading(false);
    }
  }

  function startOAuth(provider: "google" | "facebook") {
    window.location.href = `${API_URL}/auth/oauth/${provider}/start`;
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-8">
      <div className="mb-8">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-ink text-white">
          <ShieldCheck size={28} />
        </div>
        <h1 className="text-4xl font-black tracking-normal text-ink">Family Rewards</h1>
        <p className="mt-3 text-base text-ink/70">Daily chores, kind habits, parent approval, and weekly rupee payouts.</p>
      </div>

      <Card className="p-5">
        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="block text-sm font-semibold">
            Email or phone number
            <div className="mt-2 flex h-14 items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 focus-within:ring-2 focus-within:ring-violet-400">
              {identifier.includes("@") ? <Mail size={18} className="text-slate-400" /> : <Phone size={18} className="text-slate-400" />}
              <input
                className="h-full w-full bg-transparent font-semibold outline-none"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder="parent@example.com or 9876543210"
                type="text"
              />
            </div>
          </label>
          <label className="block text-sm font-semibold">
            Password
            <input
              className="mt-2 h-14 w-full rounded-2xl border border-black/10 px-4 font-semibold outline-none focus:ring-2 focus:ring-violet-400"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
            />
          </label>
          {error ? <p className="text-sm font-semibold text-coral">{error}</p> : null}
          <Button className="w-full" disabled={loading}>
            {loading ? "Signing in" : "Open dashboard"} <ArrowRight size={18} />
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-black/10" />
          <span className="text-xs font-black uppercase tracking-wide text-slate-400">or continue with</span>
          <div className="h-px flex-1 bg-black/10" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white text-sm font-black text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            onClick={() => startOAuth("google")}
            type="button"
          >
            <span className="text-lg font-black text-blue-600">G</span>
            Google
          </button>
          <button
            className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white text-sm font-black text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            onClick={() => startOAuth("facebook")}
            type="button"
          >
            <Facebook size={18} className="text-blue-700" />
            Facebook
          </button>
        </div>

        <p className="mt-4 text-xs font-medium text-slate-500">
          Local test phone: <span className="font-black">9876543210</span>. OAuth requires provider credentials in the backend environment.
        </p>
      </Card>
    </main>
  );
}
