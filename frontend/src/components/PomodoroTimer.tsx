import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  ChevronDown,
  Circle,
  Clock,
  ListTodo,
  Minus,
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
import { api } from "@/services/api";

type TaskStatus = "pendente" | "em_progresso" | "concluida";

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
        className={`flex h-[58px] w-full items-center justify-between rounded-[18px] border border-slate-200 bg-white px-4 text-left shadow-sm transition ${
          disabled
            ? "cursor-not-allowed opacity-60"
            : "cursor-pointer hover:border-slate-300"
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-500">
            <ListTodo className="h-5 w-5" />
          </div>

          <span className="truncate text-[15px] font-medium text-slate-500">
            {selected?.label ?? "Selecione uma tarefa"}
          </span>
        </div>

        <ChevronDown
          className={`h-5 w-5 shrink-0 text-slate-400 transition ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && !disabled && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-xl">
          <div className="max-h-64 overflow-y-auto p-2">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-3 text-left transition ${
                value === ""
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
              role="option"
              aria-selected={value === ""}
            >
              <span className="truncate text-sm font-medium">
                Sem tarefa vinculada
              </span>
              {value === "" && <Check className="h-4 w-4 text-slate-600" />}
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
                  className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-3 text-left transition ${
                    isSelected
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                  role="option"
                  aria-selected={isSelected}
                >
                  <span className="truncate text-sm font-medium">
                    {option.label}
                  </span>

                  {isSelected && <Check className="h-4 w-4 text-slate-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
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
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800">{label}</p>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
          <p className="mt-2 text-[11px] font-medium text-slate-400">
            Mín: {min} {suffix} • Máx: {max} {suffix}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onDecrease}
            disabled={!canDecrease}
            className={`grid h-10 w-10 place-items-center rounded-xl ring-1 transition ${
              canDecrease
                ? "cursor-pointer bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                : "cursor-not-allowed bg-slate-100 text-slate-300 ring-slate-100"
            }`}
            aria-label={`Diminuir ${label}`}
          >
            <Minus className="h-4 w-4" />
          </button>

          <div className="min-w-[90px] rounded-2xl bg-white px-4 py-2 text-center ring-1 ring-slate-200">
            <div className="text-lg font-bold text-slate-800">{value}</div>
            <div className="text-xs font-medium text-slate-500">{suffix}</div>
          </div>

          <button
            type="button"
            onClick={onIncrease}
            disabled={!canIncrease}
            className={`grid h-10 w-10 place-items-center rounded-xl ring-1 transition ${
              canIncrease
                ? "cursor-pointer bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                : "cursor-not-allowed bg-slate-100 text-slate-300 ring-slate-100"
            }`}
            aria-label={`Aumentar ${label}`}
          >
            <Plus className="h-4 w-4" />
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
  const isFocusVariant = variant === "focus";
  const [selectedTask, setSelectedTask] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [activePreset, setActivePreset] = useState<PresetKey | null>("padrao");

  const [tasks, setTasks] = useState<Task[]>([]);
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

  function getNextSessionType(
    currentType: SessionType,
    nextCompletedFocusCycles: number,
  ): SessionType {
    if (currentType === "focus") {
      const shouldGoToLongBreak =
        nextCompletedFocusCycles > 0 &&
        nextCompletedFocusCycles % settings.cyclesBeforeLongBreak === 0;

      return shouldGoToLongBreak ? "long_break" : "short_break";
    }

    return "focus";
  }

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
      ? "cursor-pointer rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
      : "cursor-pointer rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50";
  }

  const advancePomodoroCycle = useCallback(
    (markFocusAsCompleted: boolean) => {
      let nextCompletedFocusCycles = completedFocusCycles;

      if (sessionType === "focus" && markFocusAsCompleted) {
        nextCompletedFocusCycles = completedFocusCycles + 1;
        setCompletedFocusCycles(nextCompletedFocusCycles);
      }

      const nextType = getNextSessionType(sessionType, nextCompletedFocusCycles);
      setSessionType(nextType);
      setSecondsLeft(getDurationBySessionType(nextType));
    },
    [completedFocusCycles, sessionType, getDurationBySessionType],
  );


  async function refreshTasks() {
    try {
      const { data } = await api.get<Task[]>("/tasks/");
      setTasks(data);
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
            api.get<Task[]>("/tasks/"),
            api.get("/pomodoro/settings/me/"),
            api.get<PomodoroStats>("/pomodoro/stats/"),
          ]);

        setTasks(tasksResponse.data);
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

        if (loadedStats.running_session) {
          const session = loadedStats.running_session;
          setRunningSession(session);
          setSessionType(session.session_type);

          if (session.task) {
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
  }, []);

  const handleFinish = useCallback(
    async (completed: boolean, shouldAdvance = false) => {
      if (!runningSession) {
        if (shouldAdvance) {
          advancePomodoroCycle(completed && sessionType === "focus");
        }
        return;
      }

      try {
        setIsFinishing(true);

        const sessionFinishedByTimer =
          sessionType === "focus" && secondsLeft <= 1;

        await api.post(`/pomodoro/sessions/${runningSession.id}/finish/`, {
          completed,
        });

        const completedFocus =
          completed && sessionType === "focus" && sessionFinishedByTimer;

        setRunningSession(null);
        setSelectedTask("");

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
      }
    },
    [
      runningSession,
      sessionType,
      secondsLeft,
      getDurationBySessionType,
      tasks,
      advancePomodoroCycle,
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
    if (!runningSession) return;

    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          void handleFinish(true, true);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [runningSession, sessionType, handleFinish]);

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
      setSecondsLeft(plannedMinutes * 60);

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

      if (sessionType === "focus") {
        setCompletedFocusCycles((prev) => {
          const nextCompletedFocusCycles = prev + 1;
          const nextType =
            nextCompletedFocusCycles % settings.cyclesBeforeLongBreak === 0
              ? "long_break"
              : "short_break";

          setSessionType(nextType);
          setSecondsLeft(getDurationBySessionType(nextType));
          return nextCompletedFocusCycles;
        });
      }

      return;
    }

    if (sessionType === "focus") {
      setCompletedFocusCycles((prev) => {
        const nextCompletedFocusCycles = prev + 1;
        const nextType =
          nextCompletedFocusCycles % settings.cyclesBeforeLongBreak === 0
            ? "long_break"
            : "short_break";

        setSessionType(nextType);
        setSecondsLeft(getDurationBySessionType(nextType));
        return nextCompletedFocusCycles;
      });

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

  if (isLoading) {
    return (
      <div
        className={
          isFocusVariant
            ? "flex min-h-screen items-center justify-center bg-slate-950 text-white"
            : "rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
        }
      >
        <p
          className={
            isFocusVariant ? "text-sm text-slate-400" : "text-sm text-slate-500"
          }
        >
          Carregando Pomodoro...
        </p>
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
        isStarting={isStarting}
        isFinishing={isFinishing}
        onStart={handleStart}
        onFinish={() => handleFinish(true, true)}
        onReset={handleReset}
        onSkip={handleSkip}
      />
    );
  }

  return (
    <>
      <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
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
            className="grid h-[58px] w-[52px] shrink-0 place-items-center rounded-[18px] bg-white text-slate-600 ring-1 ring-slate-200 shadow-sm transition hover:bg-slate-50 sm:w-[58px]"
            aria-label="Configurações"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-7 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-600">
            <Circle className="h-2.5 w-2.5 fill-current stroke-0" />
            {sessionType === "focus"
              ? "Foco"
              : sessionType === "short_break"
              ? "Pausa curta"
              : "Pausa longa"}
          </div>

          <p className="mt-3 text-sm text-slate-500 sm:text-[15px]">
            Trabalhando em:{" "}
            <span className="font-semibold text-slate-700">
              {sessionType === "focus"
                ? runningSession?.task_title ||
                  selectedTaskLabel ||
                  "Nenhuma tarefa selecionada"
                : "Momento de descanso"}
            </span>
          </p>
          <div className="relative mt-6 flex h-52 w-52 items-center justify-center sm:h-60 sm:w-60">
            <div className="absolute inset-0 rounded-full border-8 border-slate-100" />
            <div className="flex h-40 w-40 items-center justify-center rounded-full bg-slate-50 sm:h-48 sm:w-48">
              <span className="text-4xl font-medium tracking-tight text-slate-700 sm:text-5xl">
                {timeLabel}
              </span>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              disabled={isFinishing}
              className="grid h-11 w-11 cursor-pointer place-items-center rounded-full bg-white text-slate-600 ring-1 ring-slate-200 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Reiniciar"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            {!runningSession ? (
              <button
                type="button"
                onClick={handleStart}
                disabled={isStarting}
                className="grid h-14 w-14 cursor-pointer place-items-center rounded-full bg-blue-600 text-white shadow-sm transition hover:scale-[1.02] hover:bg-blue-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Iniciar"
              >
                <Play className="ml-0.5 h-5 w-5 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleFinish(true, true)}
                disabled={isFinishing}
                className="grid h-14 w-14 cursor-pointer place-items-center rounded-full bg-emerald-600 text-white shadow-sm transition hover:scale-[1.02] hover:bg-emerald-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Concluir"
              >
                <Check className="h-5 w-5" />
              </button>
            )}

            <button
              type="button"
              onClick={handleSkip}
              disabled={isFinishing}
              className="grid h-11 w-11 cursor-pointer place-items-center rounded-full bg-white text-slate-600 ring-1 ring-slate-200 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Próximo ciclo"
            >
              <SkipForward className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-5 text-sm text-slate-400">
            {completedFocusCycles} ciclos de foco concluídos
          </p>

          <button
            type="button"
            onClick={() => navigate("/pomodoro/focus")}
            className="mt-4 cursor-pointer text-sm font-semibold text-blue-600 transition hover:text-blue-700"
          >
            Entrar no Modo Foco
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            title="Pomodoros"
            value={String(stats.pomodoros)}
            subtitle="sessões concluídas"
            icon={<Target className="h-5 w-5" />}
            iconTone="bg-blue-50 text-blue-700"
          />

          <StatCard
            title="Minutos"
            value={String(stats.minutes)}
            subtitle="tempo focado"
            icon={<Clock className="h-5 w-5" />}
            iconTone="bg-emerald-50 text-emerald-700"
          />

          <StatCard
            title="Pontos"
            value={String(stats.points)}
            subtitle="XP acumulado"
            icon={<Star className="h-5 w-5" />}
            iconTone="bg-amber-50 text-amber-700"
          />
        </div>
      </div>

      {showSettings && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]">
          <div
            className="scrollbar-hide max-h-[80vh] w-full max-w-md overflow-y-auto rounded-[15px] border border-slate-200 bg-white p-4 shadow-2xl sm:p-5"
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
                <h2 className="text-base font-semibold text-slate-800">
                  Configurações do Pomodoro
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Ajuste os tempos das sessões.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="grid h-9 w-9 cursor-pointer place-items-center rounded-xl bg-white text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50"
                aria-label="Fechar configurações"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Presets rápidos
              </p>

              <div className="mt-2 flex flex-wrap gap-2">
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

            <div className="mt-4 grid gap-3">
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
                label="Ciclos até pausa longa"
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

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={isSavingSettings}
                className="cursor-pointer rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingSettings ? "Salvando..." : "Concluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}