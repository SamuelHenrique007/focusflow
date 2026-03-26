import { Play, Check, RotateCcw, SkipForward } from "lucide-react";
import type { PomodoroSession, SessionType } from "./types";

type Props = {
  sessionType: SessionType;
  timeLabel: string;
  runningSession: PomodoroSession | null;
  selectedTaskLabel?: string;
  completedFocusCycles: number;
  isStarting: boolean;
  isFinishing: boolean;
  onStart: () => void;
  onFinish: () => void;
  onReset: () => void;
  onSkip: () => void;
};
export default function PomodoroFocusView({
  sessionType,
  timeLabel,
  runningSession,
  selectedTaskLabel,
  completedFocusCycles,
  isStarting,
  isFinishing,
  onStart,
  onFinish,
  onReset,
  onSkip,
}: Props) {
  return (
    <div className="flex flex-1 flex-col bg-slate-950 text-white">
      <section className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-slate-400">
          {sessionType === "focus" ? "Tarefa atual" : "Momento de descanso"}
        </p>

        <h2 className="mt-2 max-w-2xl text-xl font-semibold sm:text-2xl">
          {sessionType === "focus"
            ? runningSession?.task_title ||
              selectedTaskLabel ||
              "Nenhuma tarefa selecionada"
            : "Respire, alongue-se e desacelere um pouco."}
        </h2>

        <div className="mt-10 flex h-72 w-72 items-center justify-center rounded-full border border-white/10 bg-white/5 shadow-2xl sm:h-80 sm:w-80">
          <span className="text-6xl font-semibold tracking-tight sm:text-7xl">
            {timeLabel}
          </span>
        </div>

        <div className="mt-10 flex items-center gap-4">
          <button
            onClick={onReset}
            disabled={isFinishing}
            className="cursor-pointer grid h-12 w-12 place-items-center rounded-full bg-white/10 transition hover:bg-white/15 disabled:opacity-50"
          >
            <RotateCcw className="h-5 w-5" />
          </button>

          {!runningSession ? (
            <button
              onClick={onStart}
              disabled={isStarting}
              className="cursor-pointer grid h-16 w-16 place-items-center rounded-full bg-blue-600 transition hover:bg-blue-700 disabled:opacity-50"
            >
              <Play className="ml-0.5 h-6 w-6 fill-current" />
            </button>
          ) : (
            <button
              onClick={onFinish}
              disabled={isFinishing}
              className="cursor-pointer grid h-16 w-16 place-items-center rounded-full bg-emerald-600 transition hover:bg-emerald-700 disabled:opacity-50"
            >
              <Check className="h-6 w-6" />
            </button>
          )}

          <button
            onClick={onSkip}
            disabled={isFinishing}
            className="grid h-12 w-12 place-items-center rounded-full bg-white/10 transition hover:bg-white/15 disabled:opacity-50"
          >
            <SkipForward className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-8 text-sm text-slate-500">
          {completedFocusCycles} ciclos de foco concluídos
        </p>
      </section>
    </div>
  );
}