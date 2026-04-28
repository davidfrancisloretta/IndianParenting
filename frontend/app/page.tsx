"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

import { login } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("parent@example.com");
  const [password, setPassword] = useState("ChangeMe123!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      router.push("/parent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-8">
      <div className="mb-8">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-ink text-white">
          <ShieldCheck size={28} />
        </div>
        <h1 className="text-4xl font-black tracking-normal text-ink">Family Rewards</h1>
        <p className="mt-3 text-base text-ink/70">Daily chores, kind habits, parent approval, and weekly rupee payouts.</p>
      </div>

      <Card>
        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="block text-sm font-semibold">
            Email
            <input
              className="mt-2 h-12 w-full rounded-lg border border-black/10 px-3 outline-none focus:ring-2 focus:ring-pool"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
            />
          </label>
          <label className="block text-sm font-semibold">
            Password
            <input
              className="mt-2 h-12 w-full rounded-lg border border-black/10 px-3 outline-none focus:ring-2 focus:ring-pool"
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
      </Card>
    </main>
  );
}
