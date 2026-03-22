import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  ChevronDown,
  Calendar,
  Timer,
  BookOpen,
  Briefcase,
  User,
  Check,
  Plus,
  Trash2,
  Clock3,
} from "lucide-react";

/* =========================
   Types
========================= */
export type CreateTaskPayload = {
  title: string;
  description?: string;
  category: "estudo" | "trabalho" | "pessoal";
  priority: "alta" | "media" | "baixa";
  dueLabel: string;
  dueDate: string | null;
  pomodoros: number;
  splitSubtasks: boolean;
  subtasks?: string[];
};

/* =========================
   Utils
========================= */
function toIsoDateTime(date: Date | null, timeValue: string) {
  if (!date) return null;

  const result = new Date(date);

  if (timeValue) {
    const [hours, minutes] = timeValue.split(":").map(Number);
    result.setHours(hours || 0, minutes || 0, 0, 0);
  } else {
    result.setHours(0, 0, 0, 0);
  }

  return result.toISOString();
}
function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatPtBR(d: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

function formatDateTimeLabel(d: Date | null, timeValue: string) {
  if (!d) return "Sem prazo";
  const base = formatPtBR(d);
  return timeValue ? `${base} às ${timeValue}` : base;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, delta: number) {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isSameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function buildCalendarGrid(viewDate: Date) {
  const first = startOfMonth(viewDate);
  const startDay = first.getDay();
  const mondayIndex = (startDay + 6) % 7;

  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - mondayIndex);

  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push(d);
  }
  return days;
}

function useClickOutside<T extends HTMLElement>(
  open: boolean,
  onClose: () => void,
) {
  const ref = React.useRef<T | null>(null);

  useEffect(() => {
    if (!open) return;

    const handler = (e: MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) onClose();
    };

    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  return ref;
}

/* =========================
   Portal Helpers
========================= */
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

function ModalPortal({
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
  useBodyScrollLock(open);
  useEscToClose(open, onClose);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-9999">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <div className="relative flex h-full w-full items-start justify-center p-4 sm:items-center">
        <div
          className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
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

          <div className="max-h-[calc(100dvh-9rem)] overflow-y-auto px-5 py-5">
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* =========================
   UI Pieces
========================= */
function FieldLabel({
  children,
  required,
  hint,
}: {
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <label className="text-sm font-semibold text-slate-900">
        {children} {required ? <span className="text-rose-600">*</span> : null}
      </label>
      {hint ? (
        <span className="text-xs font-medium text-slate-500">{hint}</span>
      ) : null}
    </div>
  );
}

function Input({
  placeholder,
  value,
  onChange,
}: {
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm outline-none ring-blue-200 focus:border-blue-500 focus:ring-4"
    />
  );
}

function Textarea({
  placeholder,
  value,
  onChange,
}: {
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={3}
      className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-sm outline-none ring-blue-200 focus:border-blue-500 focus:ring-4"
    />
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cx(
        "relative inline-flex h-7 w-12 items-center rounded-full transition",
        checked ? "bg-blue-600" : "bg-slate-200",
      )}
      aria-label="Alternar"
      aria-pressed={checked}
    >
      <span
        className={cx(
          "inline-block h-6 w-6 transform rounded-full bg-white shadow transition",
          checked ? "translate-x-5" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

/* =========================
   Professional Select
========================= */
type SelectOption<T extends string> = {
  label: string;
  value: T;
  icon?: React.ReactNode;
  meta?: string;
};

function SelectPro<T extends string>({
  value,
  onChange,
  options,
  placeholder = "Selecionar",
  leftIcon,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<SelectOption<T>>;
  placeholder?: string;
  leftIcon?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(open, () => setOpen(false));

  const selected = useMemo(
    () => options.find((o) => o.value === value),
    [options, value],
  );

  return (
    <div className="relative mt-2" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cx(
          "flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm outline-none",
          "ring-blue-200 focus:border-blue-500 focus:ring-4",
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="inline-flex min-w-0 items-center gap-2">
          {leftIcon ? <span className="text-slate-500">{leftIcon}</span> : null}
          <span className="min-w-0 truncate">
            {selected ? (
              selected.label
            ) : (
              <span className="font-semibold text-slate-500">
                {placeholder}
              </span>
            )}
          </span>
        </span>

        <ChevronDown
          className={cx(
            "h-5 w-5 text-slate-400 transition",
            open ? "rotate-180" : "",
          )}
        />
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-10000 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="max-h-64 overflow-y-auto p-2">
            {options.map((o) => {
              const isActive = o.value === value;

              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={cx(
                    "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition",
                    isActive
                      ? "bg-blue-50 text-blue-800"
                      : "text-slate-800 hover:bg-slate-50",
                  )}
                  role="option"
                  aria-selected={isActive}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    {o.icon ? (
                      <span
                        className={cx(
                          "grid h-9 w-9 place-items-center rounded-xl ring-1",
                          isActive
                            ? "bg-white ring-blue-100 text-blue-700"
                            : "bg-slate-50 ring-slate-200 text-slate-600",
                        )}
                      >
                        {o.icon}
                      </span>
                    ) : null}

                    <span className="min-w-0">
                      <span className="block truncate font-semibold">
                        {o.label}
                      </span>
                      {o.meta ? (
                        <span className="block truncate text-xs font-medium text-slate-500">
                          {o.meta}
                        </span>
                      ) : null}
                    </span>
                  </span>

                  {isActive ? (
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-white ring-1 ring-blue-100">
                      <Check className="h-4 w-4 text-blue-700" />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* =========================
   DateTime mini modal
========================= */
function DateTimePicker({
  value,
  timeValue,
  onChangeDate,
  onChangeTime,
  placeholder = "Selecionar data",
}: {
  value: Date | null;
  timeValue: string;
  onChangeDate: (d: Date | null) => void;
  onChangeTime: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<Date>(() => value ?? new Date());
  const [tempDate, setTempDate] = useState<Date | null>(value);
  const [tempTime, setTempTime] = useState<string>(timeValue);

  useBodyScrollLock(open);
  useEscToClose(open, () => setOpen(false));

  const days = buildCalendarGrid(view);

  const monthLabel = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(view);

  const dow = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

  function handleOpen() {
    setTempDate(value);
    setTempTime(timeValue);
    setView(value ?? new Date());
    setOpen(true);
  }

  function applySelection() {
    onChangeDate(tempDate);
    onChangeTime(tempTime);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={cx(
          "mt-2 flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold shadow-sm outline-none",
          "ring-blue-200 focus:border-blue-500 focus:ring-4",
        )}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="inline-flex items-center gap-2 text-slate-900">
          <Calendar className="h-4 w-4 text-slate-500" />
          {value ? (
            <span className="capitalize">
              {timeValue
                ? `${formatPtBR(value)} às ${timeValue}`
                : formatPtBR(value)}
            </span>
          ) : (
            <span className="text-slate-500">{placeholder}</span>
          )}
        </span>

        <ChevronDown className="h-5 w-5 text-slate-400" />
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-10001 flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-black/20"
                onClick={() => setOpen(false)}
              />

              <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">
                    Data e horário
                  </p>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
                    aria-label="Fechar"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-4 p-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        setTempDate(d);
                        setTempTime("");
                      }}
                      className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                    >
                      Hoje
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + 1);
                        setTempDate(d);
                      }}
                      className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                    >
                      Amanhã
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTempDate(null);
                        setTempTime("");
                      }}
                      className="ml-auto rounded-full bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                    >
                      Limpar
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setView((v) => addMonths(v, -1))}
                      className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                    >
                      ←
                    </button>

                    <div className="text-sm font-semibold capitalize text-slate-900">
                      {monthLabel}
                    </div>

                    <button
                      type="button"
                      onClick={() => setView((v) => addMonths(v, 1))}
                      className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                    >
                      →
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {dow.map((d) => (
                      <div
                        key={d}
                        className="pb-1 text-center text-[10px] font-semibold text-slate-500"
                      >
                        {d}
                      </div>
                    ))}

                    {days.map((d) => {
                      const muted = !isSameMonth(d, view);
                      const selected = tempDate
                        ? isSameDay(d, tempDate)
                        : false;

                      return (
                        <button
                          key={`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`}
                          type="button"
                          onClick={() => setTempDate(d)}
                          className={cx(
                            "h-8 rounded-lg text-[11px] font-semibold transition",
                            muted
                              ? "text-slate-400 hover:bg-slate-50"
                              : "text-slate-800 hover:bg-slate-100",
                            selected
                              ? "bg-blue-600 text-white hover:bg-blue-700"
                              : "",
                          )}
                        >
                          {pad2(d.getDate())}
                        </button>
                      );
                    })}
                  </div>

                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <Clock3 className="h-4 w-4 text-slate-500" />
                      Horário
                    </label>

                    <input
                      type="time"
                      value={tempTime}
                      onChange={(e) => setTempTime(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none ring-blue-200 focus:border-blue-500 focus:ring-4"
                    />
                  </div>

                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                    >
                      Cancelar
                    </button>

                    <button
                      type="button"
                      onClick={applySelection}
                      className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

/* =========================
   Component
========================= */
export function CreateTaskModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: CreateTaskPayload) => void;
}) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [cat, setCat] = useState<CreateTaskPayload["category"]>("estudo");
  const [pri, setPri] = useState<CreateTaskPayload["priority"]>("media");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [dueTime, setDueTime] = useState("");
  const [pom, setPom] = useState<"1" | "2" | "3" | "4" | "5">("1");

  const [subEnabled, setSubEnabled] = useState(false);
  const [subtasks, setSubtasks] = useState<string[]>([""]);

  const canCreate = title.trim().length > 0;

  function normalizeSubtasks(list: string[]) {
    return list.map((s) => s.trim()).filter(Boolean);
  }

  function handleCreate() {
    if (!canCreate) return;

    const cleanedSubtasks = subEnabled ? normalizeSubtasks(subtasks) : [];

    onCreate({
      title: title.trim(),
      description: desc.trim() ? desc.trim() : undefined,
      category: cat,
      priority: pri,
      dueLabel: formatDateTimeLabel(dueDate, dueTime),
      dueDate: toIsoDateTime(dueDate, dueTime),
      pomodoros: Number(pom) || 1,
      splitSubtasks: subEnabled,
      subtasks: cleanedSubtasks.length ? cleanedSubtasks : undefined,
    });

    setTitle("");
    setDesc("");
    setCat("estudo");
    setPri("media");
    setDueDate(null);
    setDueTime("");
    setPom("1");
    setSubEnabled(false);
    setSubtasks([""]);

    onClose();
  }

  function handleCancel() {
    setTitle("");
    setDesc("");
    setCat("estudo");
    setPri("media");
    setDueDate(null);
    setDueTime("");
    setPom("1");
    setSubEnabled(false);
    setSubtasks([""]);

    onClose();
  }

  const categoryOptions: Array<SelectOption<CreateTaskPayload["category"]>> = [
    {
      label: "Estudo",
      value: "estudo",
      icon: <BookOpen className="h-4 w-4" />,
      meta: "Aprendizado, leitura, exercícios",
    },
    {
      label: "Trabalho",
      value: "trabalho",
      icon: <Briefcase className="h-4 w-4" />,
      meta: "Projetos, entregas, reuniões",
    },
    {
      label: "Pessoal",
      value: "pessoal",
      icon: <User className="h-4 w-4" />,
      meta: "Rotina, saúde, organização",
    },
  ];

  const priorityOptions: Array<SelectOption<CreateTaskPayload["priority"]>> = [
    {
      label: "Baixa",
      value: "baixa",
      icon: <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />,
      meta: "Pode esperar",
    },
    {
      label: "Média",
      value: "media",
      icon: <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />,
      meta: "Importante",
    },
    {
      label: "Alta",
      value: "alta",
      icon: <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />,
      meta: "Prioridade máxima",
    },
  ];

  const pomodoroOptions: Array<SelectOption<"1" | "2" | "3" | "4" | "5">> = [
    {
      label: "1 pomodoro",
      value: "1",
      icon: <Timer className="h-4 w-4" />,
      meta: "25 min",
    },
    {
      label: "2 pomodoros",
      value: "2",
      icon: <Timer className="h-4 w-4" />,
      meta: "50 min",
    },
    {
      label: "3 pomodoros",
      value: "3",
      icon: <Timer className="h-4 w-4" />,
      meta: "1h15",
    },
    {
      label: "4 pomodoros",
      value: "4",
      icon: <Timer className="h-4 w-4" />,
      meta: "1h40",
    },
    {
      label: "5 pomodoros",
      value: "5",
      icon: <Timer className="h-4 w-4" />,
      meta: "2h05",
    },
  ];

  return (
    <ModalPortal open={open} onClose={handleCancel} title="Nova Tarefa">
      <div className="space-y-5">
        <div>
          <FieldLabel required hint="Obrigatório">
            Nome da tarefa
          </FieldLabel>

          <Input
            placeholder="Ex: Estudar Cálculo II"
            value={title}
            onChange={setTitle}
          />

          {!canCreate ? (
            <p className="mt-2 text-xs font-medium text-rose-600">
              Informe o nome da tarefa para criar.
            </p>
          ) : null}
        </div>

        <div>
          <FieldLabel hint="Opcional">Descrição</FieldLabel>
          <Textarea
            placeholder="Adicione detalhes sobre a tarefa..."
            value={desc}
            onChange={setDesc}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel>Categoria</FieldLabel>
            <SelectPro
              value={cat}
              onChange={(v) => setCat(v)}
              options={categoryOptions}
              leftIcon={<BookOpen className="h-4 w-4" />}
              placeholder="Selecione a categoria"
            />
          </div>

          <div>
            <FieldLabel>Prioridade</FieldLabel>
            <SelectPro
              value={pri}
              onChange={(v) => setPri(v)}
              options={priorityOptions}
              leftIcon={<span className="h-3 w-3 rounded-full bg-amber-400" />}
              placeholder="Selecione a prioridade"
            />
          </div>

          <div>
            <FieldLabel>Prazo</FieldLabel>
            <DateTimePicker
              value={dueDate}
              timeValue={dueTime}
              onChangeDate={setDueDate}
              onChangeTime={setDueTime}
              placeholder="Selecionar data e horário"
            />
          </div>

          <div>
            <FieldLabel>Pomodoros estimados</FieldLabel>
            <SelectPro
              value={pom}
              onChange={(v) => setPom(v)}
              options={pomodoroOptions}
              leftIcon={<Timer className="h-4 w-4" />}
              placeholder="Defina a estimativa"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Subtarefas</p>
              <p className="mt-1 text-xs font-medium text-slate-500">
                Adicione etapas para facilitar a execução
              </p>
            </div>
            <Toggle checked={subEnabled} onChange={setSubEnabled} />
          </div>

          {subEnabled ? (
            <div className="mt-4 space-y-3">
              {subtasks.map((s, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="flex-1">
                    <input
                      value={s}
                      onChange={(e) => {
                        const next = [...subtasks];
                        next[idx] = e.target.value;
                        setSubtasks(next);
                      }}
                      placeholder={`Subtarefa ${idx + 1}`}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm outline-none ring-blue-200 focus:border-blue-500 focus:ring-4"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const next = subtasks.filter((_, i) => i !== idx);
                      setSubtasks(next.length ? next : [""]);
                    }}
                    className="grid h-11 w-11 place-items-center rounded-xl bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                    aria-label="Remover subtarefa"
                    title="Remover"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}

              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-slate-500">
                  Dica: use frases curtas e objetivas.
                </p>

                <button
                  type="button"
                  onClick={() => setSubtasks((prev) => [...prev, ""])}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={!canCreate}
            onClick={handleCreate}
            className={cx(
              "rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-sm",
              canCreate
                ? "bg-blue-600 hover:bg-blue-700"
                : "cursor-not-allowed bg-slate-300",
            )}
          >
            Criar tarefa
          </button>
        </div>
      </div>
    </ModalPortal>
  );
}