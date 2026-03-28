import { Play, Pause, RotateCcw, SkipForward } from "lucide-react";
import { cn } from "@/lib/cn";
import type { PomodoroSession, SessionType } from "./types";

type Props = {
  sessionType: SessionType;
  timeLabel: string;
  runningSession: PomodoroSession | null;
  selectedTaskLabel?: string;
  completedFocusCycles: number;
  cyclesBeforeLongBreak: number;
  isStarting: boolean;
  isFinishing: boolean;
  isPaused: boolean;
  onStart: () => void;
  onTogglePause: () => void;
  onReset: () => void;
  onSkip: () => void;
};

export default function PomodoroFocusView({
  sessionType,
  timeLabel,
  runningSession,
  selectedTaskLabel,
  completedFocusCycles,
  cyclesBeforeLongBreak,
  isStarting,
  isFinishing,
  isPaused,
  onStart,
  onTogglePause,
  onReset,
  onSkip,
}: Props) {
  return (
    <div className="flex flex-1 flex-col bg-slate-950 text-white">
      <section className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="text-sm font-medium text-slate-400 uppercase tracking-widest">
          {sessionType === "focus" ? "Tarefa atual" : "Momento de descanso"}
        </p>

        <h2 className="mt-3 max-w-2xl text-xl font-semibold sm:text-2xl">
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
            type="button"
            onClick={onReset}
            disabled={isFinishing}
            className="grid h-12 w-12 cursor-pointer place-items-center rounded-full bg-white/10 transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Reiniciar"
          >
            <RotateCcw className="h-5 w-5" />
          </button>

          {!runningSession ? (
            <button
              type="button"
              onClick={onStart}
              disabled={isStarting}
              className="grid h-16 w-16 cursor-pointer place-items-center rounded-full bg-blue-600 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Iniciar"
            >
              <Play className="ml-0.5 h-6 w-6 fill-current" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onTogglePause}
              disabled={isFinishing}
              className={cn(
                "grid h-16 w-16 cursor-pointer place-items-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-50",
                isPaused
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-amber-500 hover:bg-amber-600"
              )}
              aria-label={isPaused ? "Retomar" : "Pausar"}
            >
              {isPaused ? (
                <Play className="ml-0.5 h-6 w-6 fill-current" />
              ) : (
                <Pause className="h-6 w-6 fill-current" />
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onSkip}
            disabled={isFinishing}
            className="grid h-12 w-12 cursor-pointer place-items-center rounded-full bg-white/10 transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Pular"
          >
            <SkipForward className="h-5 w-5" />
          </button>
        </div>

        {(() => {
          const fullCycles = Math.floor(completedFocusCycles / cyclesBeforeLongBreak);
          const currentProgress = completedFocusCycles % cyclesBeforeLongBreak;

          return (
            <div className="mt-8 flex flex-col items-center gap-1">
              <p className="text-sm font-medium text-slate-400">
                {fullCycles} {fullCycles === 1 ? "ciclo completo" : "ciclos completos"}
              </p>
              <p className="text-xs text-slate-500/70">
                Sessões: {currentProgress} / {cyclesBeforeLongBreak} para a pausa longa
              </p>
            </div>
          );
        })()}
      </section>
    </div>
  );
}