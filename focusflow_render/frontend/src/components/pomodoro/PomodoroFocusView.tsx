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
    <div className="flex h-[100dvh] w-full flex-col bg-slate-950 text-white overflow-hidden">
      <section className="flex h-full w-full flex-col items-center justify-center px-4 sm:px-6 text-center">
        
        {/* Header Animado */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          <AnimatePresence mode="wait">
            <motion.p
              key={sessionType}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="text-xs sm:text-sm font-medium text-slate-400 uppercase tracking-widest"
            >
              {sessionType === "focus" ? "Tarefa atual" : "Momento de descanso"}
            </motion.p>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.h2
              key={sessionType === "focus" ? runningSession?.task_title || selectedTaskLabel : "descanso"}
              initial={{ opacity: 0, filter: "blur(4px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(4px)" }}
              transition={{ duration: 0.4 }}
              className="mt-2 sm:mt-3 max-w-2xl text-lg sm:text-2xl font-semibold line-clamp-2"
            >
              {sessionType === "focus"
                ? runningSession?.task_title ||
                  selectedTaskLabel ||
                  "Nenhuma tarefa selecionada"
                : "Respire, alongue-se e desacelere um pouco."}
            </motion.h2>
          </AnimatePresence>
        </motion.div>

        {/* Relógio com Efeito de Respiração */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, type: "spring", bounce: 0.3 }}
          className="relative mt-8 sm:mt-12 flex items-center justify-center"
        >
          {/* Anéis de pulso de fundo (visíveis apenas rodando) */}
          <motion.div
            animate={isRunning ? { scale: [1, 1.15, 1], opacity: [0.1, 0.3, 0.1] } : { scale: 1, opacity: 0 }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full border border-white/20 bg-white/5"
          />
          <motion.div
            animate={isRunning ? { scale: [1, 1.25, 1], opacity: [0.05, 0.15, 0.05] } : { scale: 1, opacity: 0 }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute inset-0 rounded-full border border-white/10"
          />

          <div className="relative z-10 flex h-64 w-64 items-center justify-center rounded-full border border-white/10 bg-white/10 shadow-2xl backdrop-blur-sm sm:h-80 sm:w-80">
            <span className="text-6xl font-semibold tracking-tight sm:text-7xl tabular-nums">
              {timeLabel}
            </span>
          </div>
        </motion.div>

        {/* Controles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="mt-8 sm:mt-12 flex items-center gap-4 sm:gap-6"
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            type="button"
            onClick={onReset}
            disabled={isFinishing}
            className="grid h-12 w-12 sm:h-14 sm:w-14 cursor-pointer place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white/10"
            aria-label="Reiniciar"
          >
            <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5" />
          </motion.button>

          <AnimatePresence mode="wait">
            {!runningSession ? (
              <motion.button
                key="start"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={onStart}
                disabled={isStarting}
                className="grid h-16 w-16 sm:h-20 sm:w-20 cursor-pointer place-items-center rounded-full bg-blue-600 shadow-[0_0_30px_rgba(37,99,235,0.4)] transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Iniciar"
              >
                <Play className="ml-1 h-6 w-6 sm:h-8 sm:w-8 fill-current" />
              </motion.button>
            ) : (
              <motion.button
                key="pause-play"
                initial={{ scale: 0.5, opacity: 0, rotate: -90 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 0.5, opacity: 0, rotate: 90 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={onTogglePause}
                disabled={isFinishing}
                className={cn(
                  "grid h-16 w-16 sm:h-20 sm:w-20 cursor-pointer place-items-center rounded-full shadow-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                  isPaused
                    ? "bg-blue-600 hover:bg-blue-700 shadow-[0_0_30px_rgba(37,99,235,0.4)]"
                    : "bg-amber-500 hover:bg-amber-600 shadow-[0_0_30px_rgba(245,158,11,0.4)]"
                )}
                aria-label={isPaused ? "Retomar" : "Pausar"}
              >
                <AnimatePresence mode="wait">
                  {isPaused ? (
                    <motion.div key="play-icon" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                      <Play className="ml-1 h-6 w-6 sm:h-8 sm:w-8 fill-current" />
                    </motion.div>
                  ) : (
                    <motion.div key="pause-icon" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                      <Pause className="h-6 w-6 sm:h-8 sm:w-8 fill-current" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            type="button"
            onClick={onSkip}
            disabled={isFinishing}
            className="grid h-12 w-12 sm:h-14 sm:w-14 cursor-pointer place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white/10"
            aria-label="Pular"
          >
            <SkipForward className="h-4 w-4 sm:h-5 sm:w-5" />
          </motion.button>
        </motion.div>

        {/* Progresso de Ciclos */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          {(() => {
            const fullCycles = Math.floor(completedFocusCycles / cyclesBeforeLongBreak);
            const currentProgress = completedFocusCycles % cyclesBeforeLongBreak;

            return (
              <div className="mt-8 sm:mt-10 flex flex-col items-center gap-1.5">
                <p className="text-xs sm:text-sm font-medium text-slate-400">
                  {fullCycles} {fullCycles === 1 ? "ciclo completo" : "ciclos completos"}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  {/* Bolinhas indicadoras de progresso até a pausa longa */}
                  {Array.from({ length: cyclesBeforeLongBreak }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full transition-all duration-500",
                        i < currentProgress ? "bg-blue-500" : "bg-white/20"
                      )}
                    />
                  ))}
                </div>
                <p className="mt-1 text-[10px] sm:text-xs text-slate-500/70 uppercase tracking-wide">
                  Sessões para a pausa longa
                </p>
              </div>
            );
          })()}
        </motion.div>
        
      </section>
    </div>
  );
}