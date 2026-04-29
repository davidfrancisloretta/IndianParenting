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
    let errorMsg = `HTTP ${response.status}`;
    try {
      const body = await response.json().catch(() => null);
      if (!body) {
        errorMsg = `Request failed: ${response.status}`;
      } else {
        // Try to extract a readable message from the response
        if (typeof body.detail === "string") {
          errorMsg = body.detail;
        } else if (typeof body.detail === "object" && body.detail !== null) {
          // Likely a Pydantic validation error array
          errorMsg = body.detail
            .filter((item: any) => item?.msg)
            .map((item: any) => `${item.msg}`)
            .join("; ") || JSON.stringify(body.detail);
        } else if (typeof body.error === "string") {
          errorMsg = body.error;
        } else if (body.message && typeof body.message === "string") {
          errorMsg = body.message;
        } else if (typeof body === "object") {
          const firstKey = Object.keys(body)[0];
          const firstVal = body[firstKey];
          if (typeof firstVal === "string") {
            errorMsg = firstVal;
          } else if (typeof firstVal === "object" && firstVal?.msg) {
            errorMsg = firstVal.msg;
          } else {
            errorMsg = JSON.stringify(body);
          }
        }
      }
    } catch (parseErr) {
      errorMsg = `Request failed: ${response.status}`;
    }
    // Ensure we never pass an object as the error message
    const finalMsg = String(errorMsg || `Request failed: ${response.status}`).trim();
    throw new Error(finalMsg);
  }
  return response.json();
}

export async function login(identifier: string, password: string) {
  // Backend expects `email` (LoginIn schema) and `password`
  const payload = { email: identifier, password };
  console.log("Sending login payload:", payload);
  try {
    const data = await api<{ access_token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    window.localStorage.setItem("token", data.access_token);
    return data;
  } catch (err) {
    console.error("Login API error:", err, err instanceof Error ? err.message : "");
    throw err;
  }
}
