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
}