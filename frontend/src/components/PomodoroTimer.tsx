import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  CheckSquare,
  X,
  ChevronDown,
  Settings,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
} from "lucide-react";

type PomodoroMode = "focus" | "short_break" | "long_break";

type PomodoroTimerProps = {
  onFocusModeChange?: (active: boolean) => void;
};

type PomodoroSettings = {
  focus_duration: number;
  short_break: number;
  long_break: number;
  cycles_before_long_break: number;
};

type UserStats = {
  total_points: number;
  total_focus_minutes: number;
  total_pomodoros: number;
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
};

type TodayMetrics = {
  date: string;
  total_sessions: number;
  total_minutes: number;
};

const STORAGE_KEYS = {
  settings: "pomodoro_settings",
  stats: "pomodoro_stats",
  today: "pomodoro_today_metrics",
};

const DEFAULT_SETTINGS: PomodoroSettings = {
  focus_duration: 25,
  short_break: 5,
  long_break: 15,
  cycles_before_long_break: 4,
};

const DEFAULT_STATS: UserStats = {
  total_points: 0,
  total_focus_minutes: 0,
  total_pomodoros: 0,
  current_streak: 0,
  longest_streak: 0,
  last_active_date: null,
};

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const DEFAULT_TODAY_METRICS: TodayMetrics = {
  date: getTodayDateString(),
  total_sessions: 0,
  total_minutes: 0,
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function ProgressBar({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(1, value)) * 100;

  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className="h-full rounded-full bg-blue-600 transition-all duration-300"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}

function ProgressRing({
  size = 280,
  stroke = 14,
  value = 0,
}: {
  size?: number;
  stroke?: number;
  value?: number;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value));
  const dash = c * (1 - pct);

  return (
    <svg width={size} height={size} className="drop-shadow-sm">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        strokeWidth={stroke}
        className="fill-none stroke-slate-100"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        strokeWidth={stroke}
        strokeLinecap="round"
        className="fill-none stroke-blue-600"
        strokeDasharray={c}
        strokeDashoffset={dash}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

function StatMiniCard({
  value,
  label,
  valueClassName,
}: {
  value: string;
  label: string;
  valueClassName?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-blue-600/10 blur-2xl transition group-hover:bg-blue-600/20" />
      <div className="relative">
        <div className={cx("text-2xl font-semibold", valueClassName)}>
          {value}
        </div>
        <div className="mt-1 text-xs text-slate-500">{label}</div>
      </div>
    </div>
  );
}

function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [locked]);
}

function useEscToClose(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
}

function SettingsModal({
  open,
  onClose,
  children,
  title,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
}) {
  const [mounted] = useState(() => typeof window !== "undefined");

  useBodyScrollLock(open);
  useEscToClose(open, onClose);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />

      <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <p className="text-base font-semibold text-slate-900">{title}</p>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[80vh] overflow-y-auto px-5 py-5 sm:px-6">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function SettingField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-800">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none ring-blue-200 focus:border-blue-500 focus:bg-white focus:ring-4"
      />
    </div>
  );
}

function readLocalStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeLocalStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignora erros de storage
  }
}

export default function PomodoroTimer({
  onFocusModeChange,
}: PomodoroTimerProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  const [settingsData, setSettingsData] =
    useState<PomodoroSettings>(DEFAULT_SETTINGS);
  const [stats, setStats] = useState<UserStats>(DEFAULT_STATS);
  const [todayMetrics, setTodayMetrics] =
    useState<TodayMetrics>(DEFAULT_TODAY_METRICS);

  const [focusMin, setFocusMin] = useState("25");
  const [shortBreakMin, setShortBreakMin] = useState("5");
  const [longBreakMin, setLongBreakMin] = useState("15");
  const [cyclesBeforeLong, setCyclesBeforeLong] = useState("4");

  const [mode, setMode] = useState<PomodoroMode>("focus");
  const [timeLeft, setTimeLeft] = useState(DEFAULT_SETTINGS.focus_duration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);

  const intervalRef = useRef<number | null>(null);

  const selectedTask = "Selecione uma tarefa (opcional)";

  const isFocusMode = mode === "focus";
  const isFocusSessionActive = mode === "focus" && isRunning;

  const getSecondsForMode = useCallback(
    (targetMode: PomodoroMode, source = settingsData) => {
      if (targetMode === "focus") return source.focus_duration * 60;
      if (targetMode === "short_break") return source.short_break * 60;
      return source.long_break * 60;
    },
    [settingsData],
  );

  const totalSeconds = useMemo(() => {
    return getSecondsForMode(mode);
  }, [mode, getSecondsForMode]);

  const progress = useMemo(() => {
    if (totalSeconds <= 0) return 0;
    return (totalSeconds - timeLeft) / totalSeconds;
  }, [timeLeft, totalSeconds]);

  const modeLabel = useMemo(() => {
    if (mode === "focus") return "Modo Foco";
    if (mode === "short_break") return "Pausa Curta";
    return "Pausa Longa";
  }, [mode]);

  const focusedTodayMin = todayMetrics.total_minutes;
  const todaySessions = todayMetrics.total_sessions;

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");

  useEffect(() => {
    onFocusModeChange?.(isFocusSessionActive);
  }, [isFocusSessionActive, onFocusModeChange]);

  function clearTimerInterval() {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  const loadPomodoroData = useCallback(async () => {
    try {
      setLoading(true);

      const savedSettings = readLocalStorage<PomodoroSettings>(
        STORAGE_KEYS.settings,
        DEFAULT_SETTINGS,
      );

      const savedStats = readLocalStorage<UserStats>(
        STORAGE_KEYS.stats,
        DEFAULT_STATS,
      );

      const savedToday = readLocalStorage<TodayMetrics>(
        STORAGE_KEYS.today,
        DEFAULT_TODAY_METRICS,
      );

      const today = getTodayDateString();
      const normalizedToday =
        savedToday.date === today
          ? savedToday
          : {
              date: today,
              total_sessions: 0,
              total_minutes: 0,
            };

      setSettingsData(savedSettings);
      setStats(savedStats);
      setTodayMetrics(normalizedToday);

      setFocusMin(String(savedSettings.focus_duration));
      setShortBreakMin(String(savedSettings.short_break));
      setLongBreakMin(String(savedSettings.long_break));
      setCyclesBeforeLong(String(savedSettings.cycles_before_long_break));

      if (mode === "focus") {
        setTimeLeft(savedSettings.focus_duration * 60);
      } else if (mode === "short_break") {
        setTimeLeft(savedSettings.short_break * 60);
      } else {
        setTimeLeft(savedSettings.long_break * 60);
      }

      writeLocalStorage(STORAGE_KEYS.today, normalizedToday);
    } finally {
      setLoading(false);
    }
  }, [mode]);

  const completeFocusSession = useCallback(() => {
    const today = getTodayDateString();

    setStats((prev) => {
      const updatedStats: UserStats = {
        ...prev,
        total_points: prev.total_points + 10,
        total_focus_minutes: prev.total_focus_minutes + settingsData.focus_duration,
        total_pomodoros: prev.total_pomodoros + 1,
        current_streak:
          prev.last_active_date === today || prev.last_active_date === null
            ? prev.current_streak + 1
            : prev.current_streak + 1,
        longest_streak: Math.max(prev.longest_streak, prev.current_streak + 1),
        last_active_date: today,
      };

      writeLocalStorage(STORAGE_KEYS.stats, updatedStats);
      return updatedStats;
    });

    setTodayMetrics((prev) => {
      const updatedToday: TodayMetrics =
        prev.date === today
          ? {
              ...prev,
              total_sessions: prev.total_sessions + 1,
              total_minutes: prev.total_minutes + settingsData.focus_duration,
            }
          : {
              date: today,
              total_sessions: 1,
              total_minutes: settingsData.focus_duration,
            };

      writeLocalStorage(STORAGE_KEYS.today, updatedToday);
      return updatedToday;
    });
  }, [settingsData.focus_duration]);

  const handleComplete = useCallback(() => {
    setIsRunning(false);

    if (mode === "focus") {
      completeFocusSession();

      setCyclesCompleted((prev) => {
        const nextCycles = prev + 1;

        if (nextCycles % settingsData.cycles_before_long_break === 0) {
          setMode("long_break");
          setTimeLeft(settingsData.long_break * 60);
        } else {
          setMode("short_break");
          setTimeLeft(settingsData.short_break * 60);
        }

        return nextCycles;
      });

      return;
    }

    setMode("focus");
    setTimeLeft(settingsData.focus_duration * 60);
  }, [mode, completeFocusSession, settingsData]);

  useEffect(() => {
    void loadPomodoroData();
  }, [loadPomodoroData]);

  useEffect(() => {
    setTimeLeft(totalSeconds);
  }, [totalSeconds]);

  useEffect(() => {
    if (!isRunning) {
      clearTimerInterval();
      return;
    }

    intervalRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearTimerInterval();
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearTimerInterval();
  }, [isRunning, handleComplete]);

  function startTimer() {
    setIsRunning(true);
  }

  function pauseTimer() {
    setIsRunning(false);
  }

  function toggleTimer() {
    if (isRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  }

  function resetCurrentMode() {
    setIsRunning(false);
    setTimeLeft(getSecondsForMode(mode));
  }

  function handleSkip() {
    setIsRunning(false);

    if (mode === "focus") {
      setCyclesCompleted((prev) => {
        const nextCycles = prev + 1;

        if (nextCycles % settingsData.cycles_before_long_break === 0) {
          setMode("long_break");
          setTimeLeft(settingsData.long_break * 60);
        } else {
          setMode("short_break");
          setTimeLeft(settingsData.short_break * 60);
        }

        return nextCycles;
      });

      return;
    }

    setMode("focus");
    setTimeLeft(settingsData.focus_duration * 60);
  }

  function toPositiveInteger(value: string, fallback: number) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 1) return fallback;
    return Math.floor(parsed);
  }

  async function handleSaveSettings() {
    try {
      setSavingSettings(true);

      const payload: PomodoroSettings = {
        focus_duration: toPositiveInteger(
          focusMin,
          settingsData.focus_duration || 25,
        ),
        short_break: toPositiveInteger(
          shortBreakMin,
          settingsData.short_break || 5,
        ),
        long_break: toPositiveInteger(
          longBreakMin,
          settingsData.long_break || 15,
        ),
        cycles_before_long_break: toPositiveInteger(
          cyclesBeforeLong,
          settingsData.cycles_before_long_break || 4,
        ),
      };

      setSettingsData(payload);
      writeLocalStorage(STORAGE_KEYS.settings, payload);

      setFocusMin(String(payload.focus_duration));
      setShortBreakMin(String(payload.short_break));
      setLongBreakMin(String(payload.long_break));
      setCyclesBeforeLong(String(payload.cycles_before_long_break));

      setIsRunning(false);
      setTimeLeft(getSecondsForMode(mode, payload));
      setSettingsOpen(false);
    } finally {
      setSavingSettings(false);
    }
  }

  useEffect(() => {
    return () => clearTimerInterval();
  }, []);

  return (
    <>
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-slate-500">Carregando Pomodoro...</p>
          </div>
        ) : (
          <>
            <div className="lg:hidden">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                    Pomodoro
                  </h1>
                  <p className="mt-1 text-sm text-slate-500">
                    {focusedTodayMin} minutos focados hoje
                  </p>
                </div>

                <button
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                  type="button"
                  onClick={() => setSettingsOpen(true)}
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Configurações</span>
                </button>
              </div>
            </div>

            <div className="hidden items-start justify-between lg:flex">
              <div>
                <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
                  Pomodoro
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  {focusedTodayMin} minutos focados hoje
                </p>
              </div>

              <button
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                type="button"
                onClick={() => setSettingsOpen(true)}
              >
                <Settings className="h-4 w-4" />
                Configurações
              </button>
            </div>
          </>
        )}

        <div className="mt-2 flex justify-center">
          <div
            className={cx(
              "w-full max-w-3xl rounded-2xl border bg-white p-3 shadow-sm transition",
              isFocusMode
                ? "border-blue-200 ring-2 ring-blue-100"
                : "border-slate-200",
            )}
          >
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-700">
                  <CheckSquare className="h-5 w-5" />
                </span>

                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Tarefa atual
                  </p>
                  <span className="truncate text-sm font-medium text-slate-700">
                    {selectedTask}
                  </span>
                </div>
              </div>

              {!isFocusSessionActive && (
                <ChevronDown className="h-5 w-5 text-slate-400" />
              )}
            </button>
          </div>
        </div>

        <div
          className={cx(
            "mt-6 flex flex-col items-center",
            isFocusSessionActive ? "pb-6" : "pb-16 sm:pb-12",
          )}
        >
          <div
            className={cx(
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ring-1",
              mode === "focus"
                ? "bg-blue-50 text-blue-700 ring-blue-100"
                : "bg-emerald-50 text-emerald-700 ring-emerald-100",
            )}
          >
            <span
              className={cx(
                "h-2 w-2 rounded-full",
                mode === "focus" ? "bg-blue-600" : "bg-emerald-600",
              )}
            />
            {modeLabel}
          </div>

          <div className="relative mt-6 grid place-items-center">
            <div className="relative">
              <div className="sm:hidden">
                <ProgressRing size={210} stroke={11} value={progress} />
              </div>
              <div className="hidden sm:block">
                <ProgressRing size={320} stroke={14} value={progress} />
              </div>
            </div>

            <div className="absolute grid place-items-center">
              <div className="text-5xl font-light tracking-tight text-slate-900 sm:text-7xl">
                {mm}:{ss}
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-4 sm:mt-8">
            <button
              className="grid h-12 w-12 place-items-center rounded-full bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
              type="button"
              aria-label="Reiniciar"
              onClick={resetCurrentMode}
            >
              <RotateCcw className="h-5 w-5" />
            </button>

            <button
              className="grid h-16 w-16 place-items-center rounded-full bg-blue-600 text-white shadow-sm hover:bg-blue-700"
              type="button"
              aria-label={isRunning ? "Pausar" : "Iniciar"}
              onClick={toggleTimer}
            >
              {isRunning ? (
                <Pause className="h-7 w-7 fill-white" />
              ) : (
                <Play className="h-7 w-7 fill-white" />
              )}
            </button>

            <button
              className="grid h-12 w-12 place-items-center rounded-full bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
              type="button"
              aria-label="Próximo"
              onClick={handleSkip}
            >
              <SkipForward className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 flex flex-col items-center gap-3 sm:mt-5">
            <div className="flex items-center gap-2">
              {Array.from({
                length: settingsData.cycles_before_long_break,
              }).map((_, i) => (
                <span
                  key={i}
                  className={cx(
                    "h-2 w-2 rounded-full",
                    i < (cyclesCompleted % settingsData.cycles_before_long_break)
                      ? "bg-blue-600"
                      : "bg-slate-200",
                  )}
                />
              ))}
            </div>

            <p className="text-sm text-slate-500">
              {cyclesCompleted} ciclos completos
            </p>

            <p className="text-center text-sm font-medium text-slate-500">
              {isFocusMode
                ? "Concentre-se apenas na tarefa atual até o fim do ciclo."
                : "Aproveite a pausa antes do próximo ciclo de foco."}
            </p>
          </div>

          {!isFocusSessionActive && (
            <>
              <div className="mt-6 w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Progresso da sessão</span>
                  <span className="font-semibold text-slate-700">
                    {Math.round(progress * 100)}%
                  </span>
                </div>
                <div className="mt-2">
                  <ProgressBar value={progress} />
                </div>
              </div>

              <div className="mt-5 grid w-full max-w-4xl grid-cols-1 gap-4 sm:mt-10 sm:grid-cols-4">
                <StatMiniCard
                  value={`${todaySessions}`}
                  label="Sessões hoje"
                  valueClassName="text-violet-600"
                />
                <StatMiniCard
                  value={`${stats.total_pomodoros}`}
                  label="Pomodoros"
                  valueClassName="text-blue-600"
                />
                <StatMiniCard
                  value={`${stats.total_focus_minutes}`}
                  label="Minutos"
                  valueClassName="text-emerald-600"
                />
                <StatMiniCard
                  value={`${stats.total_points}`}
                  label="Pontos"
                  valueClassName="text-orange-500"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {!isFocusSessionActive && (
        <SettingsModal
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          title="Configurações do Pomodoro"
        >
          <div className="space-y-5">
            <SettingField
              label="Duração do Foco (min)"
              value={focusMin}
              onChange={setFocusMin}
            />

            <SettingField
              label="Pausa Curta (min)"
              value={shortBreakMin}
              onChange={setShortBreakMin}
            />

            <SettingField
              label="Pausa Longa (min)"
              value={longBreakMin}
              onChange={setLongBreakMin}
            />

            <SettingField
              label="Ciclos antes da pausa longa"
              value={cyclesBeforeLong}
              onChange={setCyclesBeforeLong}
            />

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                onClick={() => setSettingsOpen(false)}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleSaveSettings}
                disabled={savingSettings}
              >
                {savingSettings ? "Salvando..." : "Salvar Configurações"}
              </button>
            </div>
          </div>
        </SettingsModal>
      )}
    </>
  );
}