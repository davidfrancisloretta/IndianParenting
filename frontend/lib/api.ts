export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type Child = { id: string; name: string; date_of_birth?: string | null; avatar_color: string };
export type Chore = {
  id: string;
  family_id: string | null;
  category: "Habit" | "Fun" | "Health" | "Chores" | "Skills";
  name: string;
  duration_minutes?: number | null;
  time_slot?: string | null;
  type: "BOOLEAN" | "SCORE" | "TIME_BASED";
  max_score?: number | null;
  fixed_points: number;
  score_multiplier: number;
  minutes_per_point: number;
  is_active: boolean;
};
export type DailyLog = {
  id: string;
  log_date: string;
  child_id: string;
  chore: Chore;
  status: "TODO" | "SUBMITTED" | "APPROVED" | "REJECTED";
  submitted_value?: number | null;
  approved_value?: number | null;
  points_awarded: number;
  note?: string | null;
};
export type ParentProfile = {
  user: {
    id: string;
    full_name?: string | null;
    email: string;
    phone_number?: string | null;
    date_of_birth?: string | null;
    role: "PARENT" | "ADMIN";
  };
  family: {
    id: string;
    name: string;
    point_to_rupee_rate: number;
  };
  children: Child[];
};
export type ChoreAnalytics = {
  chore_id: string;
  chore_name: string;
  category: string;
  type: string;
  total_logs: number;
  submitted: number;
  approved: number;
  rejected: number;
  points: number;
  completion_rate: number;
  approval_rate: number;
  average_value?: number | null;
  insight: string;
};
export type Analytics = {
  child: Child;
  period: string;
  start_date: string;
  end_date: string;
  total_points: number;
  total_logs: number;
  completion_rate: number;
  approval_rate: number;
  strengths: ChoreAnalytics[];
  focus_areas: ChoreAnalytics[];
  trend: {
    label: string;
    start_date: string;
    end_date: string;
    completion_rate: number;
    approval_rate: number;
    points: number;
  }[];
  ai_summary: string[];
  chores: ChoreAnalytics[];
};

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const detailRaw = body?.detail ?? body?.error ?? (Object.keys(body).length ? body : null);
    const detail = typeof detailRaw === "string" ? detailRaw : detailRaw ? JSON.stringify(detailRaw) : null;
    throw new Error(detail ?? `Request failed: ${response.status}`);
  }
  return response.json();
}

export async function login(identifier: string, password: string) {
  // Backend expects `email` (LoginIn). Use `identifier` as email when it contains '@'.
  const payload = identifier.includes("@") ? { email: identifier, password } : { email: identifier, password };
  const data = await api<{ access_token: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  window.localStorage.setItem("token", data.access_token);
  return data;
}
