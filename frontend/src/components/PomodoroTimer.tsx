
import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  CheckSquare,
  Timer,
  X,
  ChevronDown,
  Settings,
  Play,
  RotateCcw,
  SkipForward,
} from "lucide-react";


import { ProgressBar } from "@/components/common/ProgressBar";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
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

export default function PomodoroTimer() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [focusMin, setFocusMin] = useState("25");
  const [shortBreakMin, setShortBreakMin] = useState("5");
  const [longBreakMin, setLongBreakMin] = useState("15");
  const [cyclesBeforeLong, setCyclesBeforeLong] = useState("4");

  const mode = "Foco";
  const focusedTodayMin = 0;

  const totalSeconds = 25 * 60;
  const remainingSeconds = 25 * 60;
  const progress = 1 - remainingSeconds / totalSeconds;

  const cyclesCompleted = 0;
  const selectedTask = "Selecione uma tarefa (opcional)";

  const stats = useMemo(
    () => ({
      pomodoros: 0,
      minutes: 0,
      points: 100,
    }),
    [],
  );

  const mm = String(Math.floor(remainingSeconds / 60)).padStart(2, "0");
  const ss = String(remainingSeconds % 60).padStart(2, "0");

  return (
    <>
      <>
        <div className="mb-4 lg:hidden">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
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

        <div className="mt-2 flex justify-center">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-700">
                  <CheckSquare className="h-5 w-5" />
                </span>
                <span className="truncate text-sm font-medium text-slate-700">
                  {selectedTask}
                </span>
              </div>
              <ChevronDown className="h-5 w-5 text-slate-400" />
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center pb-16 sm:pb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 ring-1 ring-blue-100">
            <span className="h-2 w-2 rounded-full bg-blue-600" />
            {mode}
          </div>

          <div className="relative mt-6 grid place-items-center">
            <div className="relative">
              <div className="sm:hidden">
                <ProgressRing size={220} stroke={12} value={progress} />
              </div>
              <div className="hidden sm:block">
                <ProgressRing size={320} stroke={14} value={progress} />
              </div>
            </div>

            <div className="absolute grid place-items-center">
              <div className="text-5xl font-light tracking-tight text-slate-900">
                {mm}:{ss}
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-4 sm:mt-8">
            <button
              className="grid h-12 w-12 place-items-center rounded-full bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
              type="button"
              aria-label="Reiniciar"
            >
              <RotateCcw className="h-5 w-5" />
            </button>

            <button
              className="grid h-16 w-16 place-items-center rounded-full bg-blue-600 text-white shadow-sm hover:bg-blue-700"
              type="button"
              aria-label="Iniciar"
            >
              <Play className="h-7 w-7 fill-white" />
            </button>

            <button
              className="grid h-12 w-12 place-items-center rounded-full bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
              type="button"
              aria-label="Próximo"
            >
              <SkipForward className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 flex flex-col items-center gap-3 sm:mt-5">
            <div className="flex items-center gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <span
                  key={i}
                  className={cx(
                    "h-2 w-2 rounded-full",
                    i < cyclesCompleted ? "bg-blue-600" : "bg-slate-200",
                  )}
                />
              ))}
            </div>

            <p className="text-sm text-slate-500">
              {cyclesCompleted} ciclos completos
            </p>

            <button
              type="button"
              className="text-sm font-semibold text-slate-700 hover:text-slate-900"
            >
              Entrar no Modo Foco
            </button>
          </div>

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

          <div className="mt-5 grid w-full max-w-4xl grid-cols-1 gap-4 sm:mt-10 sm:grid-cols-3">
            <StatMiniCard
              value={`${stats.pomodoros}`}
              label="Pomodoros"
              valueClassName="text-blue-600"
            />
            <StatMiniCard
              value={`${stats.minutes}`}
              label="Minutos"
              valueClassName="text-emerald-600"
            />
            <StatMiniCard
              value={`${stats.points}`}
              label="Pontos"
              valueClassName="text-orange-500"
            />
          </div>
        </div>
      </>

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
              className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              onClick={() => setSettingsOpen(false)}
            >
              Salvar Configurações
            </button>
          </div>
        </div>
      </SettingsModal>
    </>
  );
}
