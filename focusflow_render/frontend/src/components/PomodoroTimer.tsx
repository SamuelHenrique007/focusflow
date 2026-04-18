import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  ChevronDown,
  Circle,
  Clock,
  ListTodo,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Settings,
  SkipForward,
  Star,
  Target,
  X,
} from "lucide-react";

import { StatCard } from "@/components/common/StatCard";
import PomodoroFocusView from "@/components/pomodoro/PomodoroFocusView";
import { getSoundFileByKey } from "@/lib/soundCatalog";
import { api } from "@/services/api";
import { useGameStore } from "@/store/useGameStore";
import { useSoundStore } from "@/store/useSoundStore";

type TaskStatus = "pendente" | "em_andamento" | "concluida";

type Task = {
  id: number;
  title: string;
  description?: string;
  category?: "estudo" | "trabalho" | "pessoal";
  priority?: "alta" | "media" | "baixa";
  status: TaskStatus;
  dueLabel?: string;
  dueDate?: string | null;
  pomodoroEstimated: number;
  pomodoroCompleted: number;
  progress?: number;
  completedAt?: string | null;
  subtasks?: Array<{
    id?: number;
    title: string;
    isCompleted?: boolean;
  }>;
  createdAt?: string;
  updatedAt?: string;
};

type TaskOption = {
  label: string;
  value: string;
};

type PomodoroSettings = {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  cyclesBeforeLongBreak: number;
};

type PresetKey = "minimo" | "padrao" | "maximo";
type SessionType = "focus" | "short_break" | "long_break";

type PomodoroSession = {
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

type PomodoroStats = {
  pomodoros: number;
  minutes: number;
  points: number;
  running_session: PomodoroSession | null;
};

const POMODORO_PRESETS = {
  minimo: {
    focusMinutes: 15,
    shortBreakMinutes: 3,
    longBreakMinutes: 10,
    cyclesBeforeLongBreak: 2,
  },
  padrao: {
    focusMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    cyclesBeforeLongBreak: 4,
  },
  maximo: {
    focusMinutes: 60,
    shortBreakMinutes: 15,
    longBreakMinutes: 30,
    cyclesBeforeLongBreak: 6,
  },
} satisfies Record<PresetKey, PomodoroSettings>;

type TaskSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: TaskOption[];
  disabled?: boolean;
};

function TaskSelect({
  value,
  onChange,
  options,
  disabled = false,
}: TaskSelectProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const selected = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    if (open) {
      window.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <button
        type="button"
        onClick={() => {
          if (!disabled) setOpen((prev) => !prev);
        }}
        disabled={disabled}
        className={`flex h-14.5 w-full items-center justify-between rounded-[18px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 text-left shadow-sm transition-all ${
          disabled
            ? "cursor-not-allowed opacity-60"
            : "cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 ring-blue-200 focus:border-blue-500 focus:ring-4 dark:ring-blue-900"
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-500 dark:text-slate-400">
            <ListTodo className="h-5 w-5" />
          </div>

          <span className="truncate text-[15px] font-medium text-slate-500 dark:text-slate-200">
            {selected?.label ?? "Selecione uma tarefa"}
          </span>
        </div>

        <ChevronDown
          className={`h-5 w-5 shrink-0 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {open && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-[18px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl"
          >
            <div className="max-h-64 overflow-y-auto p-2">
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-3 text-left transition-colors ${
                  value === ""
                    ? "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
                role="option"
                aria-selected={value === ""}
              >
                <span className="truncate text-sm font-medium">
                  Sem tarefa vinculada
                </span>
                {value === "" && <Check className="h-4 w-4 text-slate-600 dark:text-slate-400" />}
              </button>

              {options.map((option) => {
                const isSelected = option.value === value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-3 text-left transition-colors ${
                      isSelected
                        ? "bg-blue-50 dark:bg-blue-900 text-blue-900 dark:text-blue-200"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                    }`}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <span className="truncate text-sm font-medium">
                      {option.label}
                    </span>

                    {isSelected && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type SettingControlProps = {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  suffix: string;
  onDecrease: () => void;
  onIncrease: () => void;
};

function SettingControl({
  label,
  description,
  value,
  min,
  max,
  suffix,
  onDecrease,
  onIncrease,
}: SettingControlProps) {
  const canDecrease = value > min;
  const canIncrease = value < max;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 sm:p-3">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="mb-1 sm:mb-0">
          <p className="text-[15px] font-semibold text-slate-800 dark:text-slate-100 sm:text-sm">{label}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p>
          <p className="mt-2 inline-block rounded-md bg-white dark:bg-slate-900 px-2 py-0.5 text-[10px] font-medium text-slate-400 dark:text-slate-500 ring-1 ring-slate-200 dark:ring-slate-700">
            Mín: {min} • Máx: {max} {suffix}
          </p>
        </div>

        <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
          <button
            type="button"
            onClick={onDecrease}
            disabled={!canDecrease}
            className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ring-1 transition-all sm:h-10 sm:w-10 ${
              canDecrease
                ? "cursor-pointer bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 ring-slate-200 dark:ring-slate-600 hover:scale-105 hover:bg-slate-50 dark:hover:bg-slate-950 active:scale-95"
                : "cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 ring-slate-100 dark:ring-slate-700"
            }`}
            aria-label={`Diminuir ${label}`}
          >
            <Minus className="h-4 w-4 sm:h-4 sm:w-4" />
          </button>

          <div className="flex-1 rounded-xl bg-white dark:bg-slate-900 px-3 py-2 text-center ring-1 ring-slate-200 dark:ring-slate-600 sm:min-w-[5.5rem] sm:flex-none sm:rounded-2xl">
            <motion.div
              key={value}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-lg font-bold text-slate-800 dark:text-white"
            >
              {value}
            </motion.div>
            <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 sm:text-xs">{suffix}</div>
          </div>

          <button
            type="button"
            onClick={onIncrease}
            disabled={!canIncrease}
            className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ring-1 transition-all sm:h-10 sm:w-10 ${
              canIncrease
                ? "cursor-pointer bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 ring-slate-200 dark:ring-slate-600 hover:scale-105 hover:bg-slate-50 dark:hover:bg-slate-950 active:scale-95"
                : "cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 ring-slate-100 dark:ring-slate-700"
            }`}
            aria-label={`Aumentar ${label}`}
          >
            <Plus className="h-4 w-4 sm:h-4 sm:w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

type PomodoroTimerProps = {
  variant?: "default" | "focus";
};

export default function PomodoroTimer({
  variant = "default",
}: PomodoroTimerProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchStatus } = useGameStore();

  const equippedSoundKey = useSoundStore((state) => state.equippedSoundKey);

  const isFocusVariant = variant === "focus";
  const [selectedTask, setSelectedTask] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [activePreset, setActivePreset] = useState<PresetKey | null>("padrao");

  const [taskOptions, setTaskOptions] = useState<TaskOption[]>([]);
  const [settings, setSettings] = useState<PomodoroSettings>(
    POMODORO_PRESETS.padrao,
  );

  const [stats, setStats] = useState<PomodoroStats>({
    pomodoros: 0,
    minutes: 0,
    points: 0,
    running_session: null,
  });

  const [runningSession, setRunningSession] = useState<PomodoroSession | null>(
    null,
  );

  const [sessionType, setSessionType] = useState<SessionType>("focus");
  const [completedFocusCycles, setCompletedFocusCycles] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(
    POMODORO_PRESETS.padrao.focusMinutes * 60,
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  const [isPaused, setIsPaused] = useState(false);
  
  // Refs para controle do timer
  const expectedEndTimeRef = useRef<number | null>(null);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    if (location.state?.selectedTaskId) {
      setSelectedTask(String(location.state.selectedTaskId));
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const selectedTaskLabel = useMemo(() => {
    return (
      taskOptions.find((task: TaskOption) => task.value === selectedTask)
        ?.label ?? ""
    );
  }, [taskOptions, selectedTask]);

  const timeLabel = useMemo(() => {
    const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
    const ss = String(secondsLeft % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  }, [secondsLeft]);

  useEffect(() => {
    document.title = `${timeLabel} - FocusFlow`;
    return () => {
      document.title = "FocusFlow";
    };
  }, [timeLabel]);

  const playFinishSound = useCallback(() => {
    const file =
      getSoundFileByKey(equippedSoundKey) ||
      "/sounds/floraphonic-marimba-ringtone-1-185152.mp3";

    const audio = new Audio(file);
    audio.currentTime = 0;
    audio.play().catch((error) => {
      console.log("Áudio bloqueado pelo navegador:", error);
    });
  }, [equippedSoundKey]);

  const getDurationBySessionType = useCallback(
    (type: SessionType) => {
      if (type === "focus") return settings.focusMinutes * 60;
      if (type === "short_break") return settings.shortBreakMinutes * 60;
      return settings.longBreakMinutes * 60;
    },
    [settings],
  );

  function detectActivePreset(currentSettings: PomodoroSettings) {
    const foundPreset =
      (Object.entries(POMODORO_PRESETS).find(([, preset]) => {
        return (
          preset.focusMinutes === currentSettings.focusMinutes &&
          preset.shortBreakMinutes === currentSettings.shortBreakMinutes &&
          preset.longBreakMinutes === currentSettings.longBreakMinutes &&
          preset.cyclesBeforeLongBreak ===
            currentSettings.cyclesBeforeLongBreak
        );
      })?.[0] as PresetKey | undefined) ?? null;

    setActivePreset(foundPreset);
  }

  const advancePomodoroCycle = useCallback(
    (markFocusAsCompleted: boolean) => {
      let nextCompletedFocusCycles = completedFocusCycles;

      if (sessionType === "focus" && markFocusAsCompleted) {
        nextCompletedFocusCycles = completedFocusCycles + 1;
        setCompletedFocusCycles(nextCompletedFocusCycles);
      }

      let nextType: SessionType = "focus";

      if (sessionType === "focus") {
        const shouldGoToLongBreak =
          markFocusAsCompleted &&
          nextCompletedFocusCycles > 0 &&
          nextCompletedFocusCycles % settings.cyclesBeforeLongBreak === 0;

        nextType = shouldGoToLongBreak ? "long_break" : "short_break";
      }

      setSessionType(nextType);
      setSecondsLeft(getDurationBySessionType(nextType));
    },
    [
      completedFocusCycles,
      sessionType,
      getDurationBySessionType,
      settings.cyclesBeforeLongBreak,
    ],
  );

  function updateSetting<K extends keyof PomodoroSettings>(
    key: K,
    value: PomodoroSettings[K],
  ) {
    setSettings((prev) => {
      const updated = {
        ...prev,
        [key]: value,
      };

      detectActivePreset(updated);
      return updated;
    });
  }

  function applyPreset(presetKey: PresetKey) {
    const preset = POMODORO_PRESETS[presetKey];
    setSettings(preset);
    setActivePreset(presetKey);
  }

  function getPresetButtonClass(presetKey: PresetKey) {
    const isActive = activePreset === presetKey;

    return isActive
      ? "w-full cursor-pointer rounded-xl bg-blue-600 py-2.5 px-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:py-2"
      : "w-full cursor-pointer rounded-xl py-2.5 px-2 text-xs font-semibold text-slate-700 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-700 transition hover:scale-[1.02] hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98] sm:py-2";
  }

  async function refreshTasks() {
    try {
      const { data } = await api.get<Task[]>("/tasks/?active_only=true");
      setTaskOptions(
        data.map((task) => ({
          label: task.title,
          value: String(task.id),
        })),
      );
      return data;
    } catch (error) {
      console.error("Erro ao atualizar tarefas:", error);
      return null;
    }
  }

  async function refreshStats() {
    try {
      const { data } = await api.get<PomodoroStats>("/pomodoro/stats/");
      setStats(data);
      return data;
    } catch (error) {
      console.error("Erro ao atualizar estatísticas:", error);
      return null;
    }
  }

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [tasksResponse, settingsResponse, statsResponse] =
          await Promise.all([
            api.get<Task[]>("/tasks/?active_only=true"),
            api.get("/pomodoro/settings/me/"),
            api.get<PomodoroStats>("/pomodoro/stats/"),
          ]);

        setTaskOptions(
          tasksResponse.data.map((task) => ({
            label: task.title,
            value: String(task.id),
          })),
        );

        const loadedSettings: PomodoroSettings = {
          focusMinutes: settingsResponse.data.focus_minutes,
          shortBreakMinutes: settingsResponse.data.short_break_minutes,
          longBreakMinutes: settingsResponse.data.long_break_minutes,
          cyclesBeforeLongBreak:
            settingsResponse.data.cycles_before_long_break,
        };

        setSettings(loadedSettings);
        detectActivePreset(loadedSettings);

        const loadedStats = statsResponse.data;
        setStats(loadedStats);

        setCompletedFocusCycles(loadedStats.pomodoros);

        if (loadedStats.running_session) {
          const session = loadedStats.running_session;
          setRunningSession(session);
          setSessionType(session.session_type);

          if (session.task && !location.state?.selectedTaskId) {
            setSelectedTask(String(session.task));
          }

          const startedAt = new Date(session.started_at).getTime();
          const now = Date.now();
          const elapsedSeconds = Math.floor((now - startedAt) / 1000);
          const totalSeconds = session.planned_minutes * 60;
          const remaining = Math.max(totalSeconds - elapsedSeconds, 0);

          setSecondsLeft(remaining);
        } else {
          setSessionType("focus");
          setSecondsLeft(loadedSettings.focusMinutes * 60);
        }
      } catch (error) {
        console.error("Erro ao carregar dados do Pomodoro:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadInitialData();
  }, [location.state]);

  const handleFinish = useCallback(
    async (completed: boolean, shouldAdvance = false) => {
      // Bloqueia execuções simultâneas
      if (isProcessingRef.current) return;

      if (!runningSession) {
        if (shouldAdvance) {
          advancePomodoroCycle(completed && sessionType === "focus");
        }
        return;
      }

      try {
        isProcessingRef.current = true;
        setIsFinishing(true);

        const sessionFinishedByTimer =
          sessionType === "focus" && secondsLeft <= 1;

        const isActuallyCompleted =
          sessionType === "focus" ? sessionFinishedByTimer : completed;

        await api.post(`/pomodoro/sessions/${runningSession.id}/finish/`, {
          completed: isActuallyCompleted,
        });

        const completedFocus =
          isActuallyCompleted && sessionType === "focus";

        if (completedFocus) {
          try {
            await fetchStatus({ notifyChanges: true });
          } catch (error) {
            console.error(
              "Erro ao atualizar status da gamificação:",
              error,
            );
          }
        }

        setRunningSession(null);
        setIsPaused(false);
        expectedEndTimeRef.current = null;

        if (shouldAdvance) {
          advancePomodoroCycle(completedFocus);
        } else {
          setSecondsLeft(getDurationBySessionType(sessionType));
        }

        await Promise.all([refreshStats(), refreshTasks()]);
      } catch (error) {
        console.error("Erro ao finalizar sessão:", error);
      } finally {
        setIsFinishing(false);
        isProcessingRef.current = false;
      }
    },
    [
      runningSession,
      sessionType,
      secondsLeft,
      getDurationBySessionType,
      advancePomodoroCycle,
      fetchStatus,
    ],
  );

  useEffect(() => {
    if (runningSession || isLoading) return;
    setSecondsLeft(getDurationBySessionType(sessionType));
  }, [
    settings,
    sessionType,
    runningSession,
    isLoading,
    getDurationBySessionType,
  ]);

  useEffect(() => {
    if (!runningSession || isPaused || isFinishing) {
      expectedEndTimeRef.current = null;
      return;
    }

    if (!expectedEndTimeRef.current) {
      expectedEndTimeRef.current = Date.now() + secondsLeft * 1000;
    }

    const timer = window.setInterval(() => {
      if (!expectedEndTimeRef.current) return;

      const now = Date.now();
      const remaining = Math.round((expectedEndTimeRef.current - now) / 1000);

      if (remaining <= 0) {
        window.clearInterval(timer);
        expectedEndTimeRef.current = null;
        setSecondsLeft(0);

        playFinishSound();
        void handleFinish(true, true);
      } else {
        setSecondsLeft(remaining);
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [runningSession, isPaused, handleFinish, playFinishSound, isFinishing]);

  async function handleSaveSettings() {
    try {
      setIsSavingSettings(true);

      await api.patch("/pomodoro/settings/me/", {
        focus_minutes: settings.focusMinutes,
        short_break_minutes: settings.shortBreakMinutes,
        long_break_minutes: settings.longBreakMinutes,
        cycles_before_long_break: settings.cyclesBeforeLongBreak,
      });

      if (!runningSession) {
        setSecondsLeft(getDurationBySessionType(sessionType));
      }

      setShowSettings(false);
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
    } finally {
      setIsSavingSettings(false);
    }
  }

  async function handleStart() {
    try {
      setIsStarting(true);
      setIsPaused(false);
      expectedEndTimeRef.current = null;

      const plannedMinutes = Math.floor(
        getDurationBySessionType(sessionType) / 60,
      );

      const { data } = await api.post<PomodoroSession>(
        "/pomodoro/sessions/start/",
        {
          task_id:
            sessionType === "focus" && selectedTask
              ? Number(selectedTask)
              : null,
          session_type: sessionType,
          planned_minutes: plannedMinutes,
        },
      );

      setRunningSession(data);

      setSecondsLeft(getDurationBySessionType(sessionType));

      await refreshStats();
    } catch (error) {
      console.error("Erro ao iniciar sessão:", error);
    } finally {
      setIsStarting(false);
    }
  }

  async function handleSkip() {
    if (runningSession) {
      await handleFinish(false, true);
      return;
    }

    advancePomodoroCycle(false);
  }

  async function handleReset() {
    if (runningSession) {
      await handleFinish(false, false);
      return;
    }

    setSecondsLeft(getDurationBySessionType(sessionType));
  }

  const togglePause = () => {
    setIsPaused((prev) => !prev);
  };

  if (isLoading) {
    return (
      <div
        className={
          isFocusVariant
            ? "flex min-h-screen items-center justify-center bg-slate-950 text-white"
            : "rounded-[28px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm"
        }
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="h-24 w-24 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800 ring-4 ring-slate-50 dark:ring-slate-900" />
          <p
            className={
              isFocusVariant ? "text-sm text-slate-400" : "text-sm text-slate-500 dark:text-slate-400"
            }
          >
            Carregando Pomodoro...
          </p>
        </motion.div>
      </div>
    );
  }

  if (isFocusVariant) {
    return (
      <PomodoroFocusView
        sessionType={sessionType}
        timeLabel={timeLabel}
        runningSession={runningSession}
        selectedTaskLabel={selectedTaskLabel}
        completedFocusCycles={completedFocusCycles}
        cyclesBeforeLongBreak={settings.cyclesBeforeLongBreak}
        isStarting={isStarting}
        isFinishing={isFinishing}
        isPaused={isPaused}
        onStart={handleStart}
        onTogglePause={togglePause}
        onReset={handleReset}
        onSkip={handleSkip}
      />
    );
  }

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[28px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm sm:p-6"
      >
        <div className="mt-4 flex items-stretch gap-3">
          <div className="flex-1">
            <TaskSelect
              value={selectedTask}
              onChange={setSelectedTask}
              options={taskOptions}
              disabled={!!runningSession || sessionType !== "focus"}
            />
          </div>

          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="grid h-14.5 w-14.5 shrink-0 cursor-pointer place-items-center rounded-[18px] bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 transition-all hover:scale-[1.03] hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-[0.97]"
            aria-label="Configurações"
          >
            <Settings className="h-5 w-5 transition-transform duration-300 hover:rotate-90" />
          </button>
        </div>

        <div className="mt-7 flex flex-col items-center text-center">
          <motion.div 
            key={sessionType}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2 rounded-full bg-blue-50 dark:bg-blue-900 px-4 py-1.5 text-sm font-semibold text-blue-600 dark:text-blue-300"
          >
            <Circle className="h-2.5 w-2.5 fill-current stroke-0" />
            {sessionType === "focus"
              ? "Foco"
              : sessionType === "short_break"
                ? "Pausa curta"
                : "Pausa longa"}
          </motion.div>

          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 sm:text-[15px]">
            Trabalhando em:{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {sessionType === "focus"
                ? runningSession?.task_title ||
                  selectedTaskLabel ||
                  "Nenhuma tarefa selecionada"
                : "Momento de descanso"}
            </span>
          </p>

          <div className="relative mt-6 flex h-52 w-52 items-center justify-center sm:h-60 sm:w-60">
            <motion.div 
              animate={
                runningSession && !isPaused
                  ? { scale: [1, 1.05, 1], opacity: [0.7, 1, 0.7] }
                  : { scale: 1, opacity: 1 }
              }
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full border-8 border-slate-100 dark:border-slate-800" 
            />
            
            <div className="flex h-40 w-40 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800 shadow-inner sm:h-48 sm:w-48">
              <span className="tabular-nums text-4xl font-medium tracking-tight text-slate-700 dark:text-slate-100 sm:text-5xl">
                {timeLabel}
              </span>
            </div>
          </div>

          <motion.div layout className="mt-5 flex items-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              disabled={isFinishing}
              className="grid h-11 w-11 cursor-pointer place-items-center rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 transition hover:scale-110 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
              aria-label="Reiniciar"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            <AnimatePresence mode="popLayout">
              {!runningSession ? (
                <motion.button
                  key="start"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  type="button"
                  onClick={handleStart}
                  disabled={isStarting}
                  className="grid h-14 w-14 cursor-pointer place-items-center rounded-full bg-blue-600 text-white shadow-md transition hover:scale-[1.05] hover:bg-blue-700 active:scale-[0.95] disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="Iniciar"
                >
                  <Play className="ml-0.5 h-5 w-5 fill-current" />
                </motion.button>
              ) : (
                <motion.button
                  key="pause"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  type="button"
                  onClick={togglePause}
                  disabled={isFinishing}
                  className={`grid h-14 w-14 cursor-pointer place-items-center rounded-full text-white shadow-md transition hover:scale-[1.05] active:scale-[0.95] disabled:cursor-not-allowed disabled:opacity-60 ${
                    isPaused
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-amber-500 hover:bg-amber-600"
                  }`}
                  aria-label={isPaused ? "Retomar" : "Pausar"}
                >
                  {isPaused ? (
                    <Play className="ml-0.5 h-5 w-5 fill-current" />
                  ) : (
                    <Pause className="h-5 w-5 fill-current" />
                  )}
                </motion.button>
              )}
            </AnimatePresence>

            <button
              type="button"
              onClick={handleSkip}
              disabled={isFinishing}
              className="grid h-11 w-11 cursor-pointer place-items-center rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 transition hover:scale-110 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
              aria-label="Próximo ciclo"
            >
              <SkipForward className="h-4 w-4" />
            </button>
          </motion.div>

          {(() => {
            const fullCycles = Math.floor(
              completedFocusCycles / settings.cyclesBeforeLongBreak,
            );
            const currentProgress =
              completedFocusCycles % settings.cyclesBeforeLongBreak;

            return (
              <div className="mt-5 flex flex-col items-center gap-1">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {fullCycles}{" "}
                  {fullCycles === 1 ? "ciclo completo" : "ciclos completos"}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Sessões: {currentProgress} / {settings.cyclesBeforeLongBreak}{" "}
                  para a pausa longa
                </p>
              </div>
            );
          })()}

          <button
            type="button"
            onClick={() =>
              navigate("/pomodoro/focus", {
                state: { selectedTaskId: selectedTask },
              })
            }
            className="mt-4 cursor-pointer text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Entrar no Modo Foco
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[
            {
              title: "Pomodoros",
              value: String(stats.pomodoros),
              subtitle: "sessões concluídas",
              icon: <Target className="h-5 w-5" />,
              iconTone: "bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
            },
            {
              title: "Minutos",
              value: String(stats.minutes),
              subtitle: "tempo focado",
              icon: <Clock className="h-5 w-5" />,
              iconTone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
            },
            {
              title: "Pontos",
              value: String(stats.points),
              subtitle: "XP acumulado",
              icon: <Star className="h-5 w-5" />,
              iconTone: "bg-amber-50 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className={
                i === 2
                  ? "w-full sm:col-span-2 sm:mx-auto sm:w-[calc(50%-0.5rem)] xl:col-span-1 xl:w-full"
                  : "w-full"
              }
            >
              <StatCard {...stat} />
            </motion.div>
          ))}
        </div>
      </motion.div>

      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 backdrop-blur-sm sm:p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
              className="scrollbar-hide max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[28px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow-2xl sm:p-6"
              style={{
                msOverflowStyle: "none",
                scrollbarWidth: "none",
              }}
            >
              <style>
                {`
                  .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                  }
                `}
              </style>

              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                    Configurações
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Ajuste os tempos das sessões.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="grid h-10 w-10 cursor-pointer place-items-center rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 ring-1 ring-slate-200 dark:ring-slate-700 transition hover:scale-105 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 sm:h-9 sm:w-9"
                  aria-label="Fechar configurações"
                >
                  <X className="h-5 w-5 sm:h-4 sm:w-4" />
                </button>
              </div>

              <div className="mt-6">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Presets rápidos
                </p>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => applyPreset("minimo")}
                    className={getPresetButtonClass("minimo")}
                  >
                    Mínimo
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset("padrao")}
                    className={getPresetButtonClass("padrao")}
                  >
                    Padrão
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset("maximo")}
                    className={getPresetButtonClass("maximo")}
                  >
                    Máximo
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:gap-3">
                <SettingControl
                  label="Tempo de foco"
                  description="Duração da sessão."
                  value={settings.focusMinutes}
                  min={15}
                  max={60}
                  suffix="min"
                  onDecrease={() =>
                    updateSetting(
                      "focusMinutes",
                      Math.max(15, settings.focusMinutes - 1),
                    )
                  }
                  onIncrease={() =>
                    updateSetting(
                      "focusMinutes",
                      Math.min(60, settings.focusMinutes + 1),
                    )
                  }
                />

                <SettingControl
                  label="Pausa curta"
                  description="Descanso entre ciclos."
                  value={settings.shortBreakMinutes}
                  min={3}
                  max={15}
                  suffix="min"
                  onDecrease={() =>
                    updateSetting(
                      "shortBreakMinutes",
                      Math.max(3, settings.shortBreakMinutes - 1),
                    )
                  }
                  onIncrease={() =>
                    updateSetting(
                      "shortBreakMinutes",
                      Math.min(15, settings.shortBreakMinutes + 1),
                    )
                  }
                />

                <SettingControl
                  label="Pausa longa"
                  description="Descanso após ciclos."
                  value={settings.longBreakMinutes}
                  min={10}
                  max={30}
                  suffix="min"
                  onDecrease={() =>
                    updateSetting(
                      "longBreakMinutes",
                      Math.max(10, settings.longBreakMinutes - 1),
                    )
                  }
                  onIncrease={() =>
                    updateSetting(
                      "longBreakMinutes",
                      Math.min(30, settings.longBreakMinutes + 1),
                    )
                  }
                />

                <SettingControl
                  label="Ciclos até pausa"
                  description="Sessões antes da pausa longa."
                  value={settings.cyclesBeforeLongBreak}
                  min={2}
                  max={6}
                  suffix="ciclos"
                  onDecrease={() =>
                    updateSetting(
                      "cyclesBeforeLongBreak",
                      Math.max(2, settings.cyclesBeforeLongBreak - 1),
                    )
                  }
                  onIncrease={() =>
                    updateSetting(
                      "cyclesBeforeLongBreak",
                      Math.min(6, settings.cyclesBeforeLongBreak + 1),
                    )
                  }
                />
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  disabled={isSavingSettings}
                  className="w-full cursor-pointer rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:scale-[1.02] hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:py-2.5"
                >
                  {isSavingSettings ? "Salvando..." : "Concluir"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}