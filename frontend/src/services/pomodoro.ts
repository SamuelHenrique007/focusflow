import {api} from "./api"

export interface PomodoroSettings {
  focus_minutes: number
  short_break_minutes: number
  long_break_minutes: number
  cycles_before_long_break: number
  updated_at?: string
}

export interface PomodoroSession {
  id: number
  task: number | null
  task_title?: string
  session_type: "focus" | "short_break" | "long_break"
  planned_minutes: number
  started_at: string
  ended_at: string | null
  status: "running" | "completed" | "skipped" | "cancelled"
  earned_points: number
}

export interface PomodoroStats {
  pomodoros: number
  minutes: number
  points: number
  running_session: PomodoroSession | null
}

export async function getPomodoroSettings() {
  const { data } = await api.get<PomodoroSettings>("/pomodoro/settings/me/")
  return data
}

export async function updatePomodoroSettings(payload: Partial<PomodoroSettings>) {
  const { data } = await api.patch<PomodoroSettings>("/pomodoro/settings/me/", payload)
  return data
}

export async function startPomodoroSession(payload: {
  task_id?: number | null
  session_type: "focus" | "short_break" | "long_break"
  planned_minutes: number
}) {
  const { data } = await api.post<PomodoroSession>("/pomodoro/sessions/start/", payload)
  return data
}

export async function finishPomodoroSession(sessionId: number, completed = true) {
  const { data } = await api.post<PomodoroSession>(
    `/pomodoro/sessions/${sessionId}/finish/`,
    { completed }
  )
  return data
}

export async function getPomodoroHistory() {
  const { data } = await api.get<PomodoroSession[]>("/pomodoro/sessions/history/")
  return data
}

export async function getPomodoroStats() {
  const { data } = await api.get<PomodoroStats>("/pomodoro/stats/")
  return data
}