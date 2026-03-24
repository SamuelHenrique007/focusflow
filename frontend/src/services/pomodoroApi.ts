export type PomodoroSettings = {
  focus_duration: number;
  short_break: number;
  long_break: number;
  cycles_before_long_break: number;
};

export type UserStats = {
  total_points: number;
  total_focus_minutes: number;
  total_pomodoros: number;
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
  pomodoro_settings?: PomodoroSettings | null;
};

export type TodayMetrics = {
  date: string;
  total_sessions: number;
  total_minutes: number;
};

export type CompleteFocusPayload = {
  duration_minutes: number;
  task_id?: number;
};

const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000";

function getAccessToken(): string | null {
  return localStorage.getItem("access");
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = "Erro na requisição.";

    try {
      const errorData = await response.json();
      errorMessage =
        errorData?.detail ||
        errorData?.message ||
        JSON.stringify(errorData) ||
        errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }

    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export async function getPomodoroSettings(): Promise<PomodoroSettings> {
  return request<PomodoroSettings>("/api/pomodoro/settings/");
}

export async function updatePomodoroSettings(
  data: PomodoroSettings,
): Promise<PomodoroSettings> {
  return request<PomodoroSettings>("/api/pomodoro/settings/", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function getPomodoroStats(): Promise<UserStats> {
  return request<UserStats>("/api/pomodoro/stats/");
}

export async function getPomodoroTodayMetrics(): Promise<TodayMetrics> {
  return request<TodayMetrics>("/api/pomodoro/today-metrics/");
}

export async function completeFocusSession(
  payload: CompleteFocusPayload,
): Promise<{
  message: string;
  stats: UserStats;
  today_metrics: TodayMetrics;
}> {
  return request("/api/pomodoro/complete-focus/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}