import { Play, Pause, RotateCcw, SkipForward } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
  const isRunning = runningSession && !isPaused;

  return (
    <div className="h-screen w-full bg-slate-950 text-white flex flex-col overflow-hidden">

      <section className="flex flex-1 flex-col items-center justify-between py-6 px-6 text-center">

        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center gap-2"
        >
          <AnimatePresence mode="wait">
            <motion.p
              key={sessionType}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs sm:text-sm font-medium text-slate-400 uppercase tracking-widest"
            >
              {sessionType === "focus"
                ? "Tarefa atual"
                : "Momento de descanso"}
            </motion.p>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.h2
              key={
                sessionType === "focus"
                  ? runningSession?.task_title || selectedTaskLabel
                  : "descanso"
              }
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-xl text-lg sm:text-xl font-semibold"
            >
              {sessionType === "focus"
                ? runningSession?.task_title ||
                  selectedTaskLabel ||
                  "Nenhuma tarefa selecionada"
                : "Respire, alongue-se e desacelere um pouco."}
            </motion.h2>
          </AnimatePresence>
        </motion.div>


        {/* RELÓGIO CENTRAL */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="relative flex items-center justify-center"
        >
          {/* pulso animado */}
          <motion.div
            animate={
              isRunning
                ? { scale: [1, 1.15, 1], opacity: [0.1, 0.3, 0.1] }
                : { scale: 1, opacity: 0 }
            }
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-0 rounded-full border border-white/20 bg-white/5"
          />

          <div
            className="
              relative z-10
              flex items-center justify-center
              rounded-full border border-white/10
              bg-white/10 backdrop-blur-sm shadow-2xl
            "
            style={{
              width: "clamp(220px, 35vh, 300px)",
              height: "clamp(220px, 35vh, 300px)",
            }}
          >
            <span className="text-[clamp(2.8rem,6vh,4.5rem)] font-semibold tracking-tight tabular-nums">
              {timeLabel}
            </span>
          </div>
        </motion.div>


        {/* CONTROLES */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-6"
        >
          <motion.button
            whileTap={{ scale: 0.9 }}
            type="button"
            onClick={onReset}
            disabled={isFinishing}
            className="grid h-14 w-14 place-items-center rounded-full bg-white/10 hover:bg-white/15"
          >
            <RotateCcw className="h-5 w-5" />
          </motion.button>


          <AnimatePresence mode="wait">
            {!runningSession ? (
              <motion.button
                key="start"
                initial={{ scale: 0.6 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.6 }}
                whileTap={{ scale: 0.9 }}
                onClick={onStart}
                disabled={isStarting}
                className="grid h-20 w-20 place-items-center rounded-full bg-blue-600 shadow-[0_0_30px_rgba(37,99,235,0.4)]"
              >
                <Play className="ml-1 h-8 w-8 fill-current" />
              </motion.button>
            ) : (
              <motion.button
                key="pause-play"
                initial={{ scale: 0.6 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.6 }}
                whileTap={{ scale: 0.9 }}
                onClick={onTogglePause}
                disabled={isFinishing}
                className={cn(
                  "grid h-20 w-20 place-items-center rounded-full shadow-lg",
                  isPaused
                    ? "bg-blue-600"
                    : "bg-amber-500"
                )}
              >
                {isPaused ? (
                  <Play className="ml-1 h-8 w-8 fill-current" />
                ) : (
                  <Pause className="h-8 w-8 fill-current" />
                )}
              </motion.button>
            )}
          </AnimatePresence>


          <motion.button
            whileTap={{ scale: 0.9 }}
            type="button"
            onClick={onSkip}
            disabled={isFinishing}
            className="grid h-14 w-14 place-items-center rounded-full bg-white/10 hover:bg-white/15"
          >
            <SkipForward className="h-5 w-5" />
          </motion.button>
        </motion.div>


        {/* PROGRESSO CICLOS */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-1"
        >
          {(() => {
            const fullCycles = Math.floor(
              completedFocusCycles / cyclesBeforeLongBreak
            );

            const currentProgress =
              completedFocusCycles % cyclesBeforeLongBreak;

            return (
              <>
                <p className="text-sm text-slate-400">
                  {fullCycles} ciclos completos
                </p>

                <div className="flex gap-1">
                  {Array.from({
                    length: cyclesBeforeLongBreak,
                  }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-2 w-2 rounded-full",
                        i < currentProgress
                          ? "bg-blue-500"
                          : "bg-white/20"
                      )}
                    />
                  ))}
                </div>

                <p className="text-xs text-slate-500">
                  Sessões para pausa longa
                </p>
              </>
            );
          })()}
        </motion.div>

      </section>
    </div>
  );
}import { Play, Pause, RotateCcw, SkipForward } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
  const isRunning = !!runningSession && !isPaused;

  const taskTitle =
    sessionType === "focus"
      ? runningSession?.task_title ||
        selectedTaskLabel ||
        "Nenhuma tarefa selecionada"
      : "Respire, alongue-se e desacelere um pouco.";

  const fullCycles = Math.floor(completedFocusCycles / cyclesBeforeLongBreak);
  const currentProgress = completedFocusCycles % cyclesBeforeLongBreak;

  return (
    <div className="h-screen w-full overflow-hidden bg-slate-950 text-white">
      <section className="flex h-full flex-col items-center justify-between px-4 py-4 text-center sm:px-6 sm:py-5">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex flex-col items-center gap-1.5"
        >
          <AnimatePresence mode="wait">
            <motion.p
              key={sessionType}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400 sm:text-xs"
            >
              {sessionType === "focus"
                ? "Tarefa atual"
                : "Momento de descanso"}
            </motion.p>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.h2
              key={taskTitle}
              initial={{ opacity: 0, filter: "blur(4px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(4px)" }}
              transition={{ duration: 0.35 }}
              className="max-w-[42rem] text-base font-semibold leading-snug text-white/95 sm:text-lg md:text-xl"
            >
              {taskTitle}
            </motion.h2>
          </AnimatePresence>
        </motion.div>

        {/* Timer */}
        <motion.div
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55 }}
          className="relative flex items-center justify-center"
        >
          <motion.div
            animate={
              isRunning
                ? { scale: [1, 1.12, 1], opacity: [0.08, 0.22, 0.08] }
                : { scale: 1, opacity: 0 }
            }
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-0 rounded-full border border-white/15 bg-white/5"
          />

          <motion.div
            animate={
              isRunning
                ? { scale: [1, 1.2, 1], opacity: [0.04, 0.12, 0.04] }
                : { scale: 1, opacity: 0 }
            }
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.8,
            }}
            className="absolute inset-0 rounded-full border border-white/10"
          />

          <div
            className="relative z-10 flex items-center justify-center rounded-full border border-white/10 bg-white/10 shadow-2xl backdrop-blur-sm"
            style={{
              width: "clamp(200px, 30vh, 280px)",
              height: "clamp(200px, 30vh, 280px)",
            }}
          >
            <span className="text-[clamp(2.5rem,5.4vh,4.25rem)] font-semibold tracking-tight tabular-nums">
              {timeLabel}
            </span>
          </div>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="flex items-center gap-4 sm:gap-5"
        >
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.92 }}
            type="button"
            onClick={onReset}
            disabled={isFinishing}
            className="grid h-12 w-12 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Reiniciar"
          >
            <RotateCcw className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
          </motion.button>

          <AnimatePresence mode="wait">
            {!runningSession ? (
              <motion.button
                key="start"
                initial={{ scale: 0.55, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.55, opacity: 0 }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.94 }}
                type="button"
                onClick={onStart}
                disabled={isStarting}
                className="grid h-16 w-16 place-items-center rounded-full bg-blue-600 shadow-[0_0_30px_rgba(37,99,235,0.35)] transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:h-18 sm:w-18"
                aria-label="Iniciar"
              >
                <Play className="ml-0.5 h-7 w-7 fill-current sm:h-8 sm:w-8" />
              </motion.button>
            ) : (
              <motion.button
                key="pause-play"
                initial={{ scale: 0.55, opacity: 0, rotate: -90 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 0.55, opacity: 0, rotate: 90 }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.94 }}
                type="button"
                onClick={onTogglePause}
                disabled={isFinishing}
                className={cn(
                  "grid h-16 w-16 place-items-center rounded-full shadow-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:h-18 sm:w-18",
                  isPaused
                    ? "bg-blue-600 hover:bg-blue-700 shadow-[0_0_30px_rgba(37,99,235,0.35)]"
                    : "bg-amber-500 hover:bg-amber-600 shadow-[0_0_30px_rgba(245,158,11,0.35)]"
                )}
                aria-label={isPaused ? "Retomar" : "Pausar"}
              >
                <AnimatePresence mode="wait">
                  {isPaused ? (
                    <motion.div
                      key="play-icon"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <Play className="ml-0.5 h-7 w-7 fill-current sm:h-8 sm:w-8" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="pause-icon"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <Pause className="h-7 w-7 fill-current sm:h-8 sm:w-8" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.92 }}
            type="button"
            onClick={onSkip}
            disabled={isFinishing}
            className="grid h-12 w-12 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Pular"
          >
            <SkipForward className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
          </motion.button>
        </motion.div>

        {/* Progress */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col items-center gap-1"
        >
          <p className="text-xs font-medium text-slate-400 sm:text-sm">
            {fullCycles} {fullCycles === 1 ? "ciclo completo" : "ciclos completos"}
          </p>

          <div className="mt-1 flex items-center gap-1.5">
            {Array.from({ length: cyclesBeforeLongBreak }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-2 w-2 rounded-full transition-all duration-500",
                  i < currentProgress ? "bg-blue-500" : "bg-white/20"
                )}
              />
            ))}
          </div>

          <p className="text-[11px] text-slate-500 sm:text-xs">
            Sessões para a pausa longa
          </p>
        </motion.div>
      </section>
    </div>
  );
}