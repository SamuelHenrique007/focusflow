export type SessionType = "focus" | "short_break" | "long_break";

export type PomodoroSession = {
  id: number;
  task: number | null;
  task_title?: string;
  session_type: SessionType;
  planned_minutes: number;
  started_at: string;
  ended_at: string | null;
  status: "running" | "completed" | "skipped" | "cancelled";
  earned_points: number;
};