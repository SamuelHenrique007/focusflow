import { Play, Pause, RotateCcw, SkipForward } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/cn"
import type { PomodoroSession, SessionType } from "./types"

type Props = {
  sessionType: SessionType
  timeLabel: string
  runningSession: PomodoroSession | null
  selectedTaskLabel?: string
  completedFocusCycles: number
  cyclesBeforeLongBreak: number
  isStarting: boolean
  isFinishing: boolean
  isPaused: boolean
  onStart: () => void
  onTogglePause: () => void
  onReset: () => void
  onSkip: () => void
}

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

  const isRunning = runningSession && !isPaused

  const taskTitle =
    sessionType === "focus"
      ? runningSession?.task_title ||
        selectedTaskLabel ||
        "Nenhuma tarefa selecionada"
      : "Respire, alongue-se e desacelere um pouco."

  const fullCycles =
    Math.floor(completedFocusCycles / cyclesBeforeLongBreak)

  const currentProgress =
    completedFocusCycles % cyclesBeforeLongBreak

  return (

    <div className="h-screen w-full overflow-hidden bg-slate-950 text-white">

      <div className="flex h-full flex-col items-center justify-center gap-10 px-6 text-center">

        {/* HEADER */}
        <div>

          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            {sessionType === "focus"
              ? "Tarefa atual"
              : "Momento de descanso"}
          </p>

          <h2 className="mt-2 max-w-xl text-lg font-semibold text-white sm:text-xl">
            {taskTitle}
          </h2>

        </div>


        {/* TIMER */}
        <div className="relative flex items-center justify-center">

          {/* animação respiração */}
          <motion.div
            animate={
              isRunning
                ? {
                    scale: [1, 1.15, 1],
                    opacity: [0.08, 0.25, 0.08],
                  }
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
              width: "clamp(220px, 32vh, 300px)",
              height: "clamp(220px, 32vh, 300px)",
            }}
          >

            <span className="text-[clamp(3rem,6vh,4.5rem)] font-semibold tabular-nums">
              {timeLabel}
            </span>

          </div>

        </div>


        {/* CONTROLES */}
        <div className="flex items-center gap-6">

          <button
            onClick={onReset}
            disabled={isFinishing}
            className="grid h-14 w-14 place-items-center rounded-full bg-white/10 hover:bg-white/15"
          >
            <RotateCcw size={20} />
          </button>


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
                className="
                  grid h-20 w-20 place-items-center
                  rounded-full bg-cyan-500
                  shadow-[0_0_30px_rgba(6,182,212,0.4)]
                  hover:bg-cyan-600
                "
              >

                <Play size={32} />

              </motion.button>

            ) : (

              <motion.button
                key="pause"
                initial={{ scale: 0.6 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.6 }}
                whileTap={{ scale: 0.9 }}
                onClick={onTogglePause}
                disabled={isFinishing}
                className={cn(
                  "grid h-20 w-20 place-items-center rounded-full shadow-lg",

                  isPaused
                    ? "bg-cyan-500 hover:bg-cyan-600"
                    : "bg-amber-500 hover:bg-amber-600"
                )}
              >

                {isPaused
                  ? <Play size={32} />
                  : <Pause size={32} />}

              </motion.button>

            )}

          </AnimatePresence>


          <button
            onClick={onSkip}
            disabled={isFinishing}
            className="grid h-14 w-14 place-items-center rounded-full bg-white/10 hover:bg-white/15"
          >
            <SkipForward size={20} />
          </button>

        </div>


        {/* PROGRESSO */}
        <div className="flex flex-col items-center gap-1">

          <p className="text-sm text-slate-400">
            {fullCycles} ciclos completos
          </p>

          <div className="flex gap-1.5">

            {Array.from({
              length: cyclesBeforeLongBreak,
            }).map((_, i) => (

              <div
                key={i}
                className={cn(
                  "h-2 w-2 rounded-full",

                  i < currentProgress
                    ? "bg-cyan-500"
                    : "bg-white/20"
                )}
              />

            ))}

          </div>

          <p className="text-xs text-slate-500">
            Sessões para pausa longa
          </p>

        </div>

      </div>

    </div>
  )
}