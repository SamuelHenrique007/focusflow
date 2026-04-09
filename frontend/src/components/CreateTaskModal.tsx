import React, { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  Loader2,
} from "lucide-react";
import type {
  Task,
  TaskCategory,
  TaskPriority,
  TaskSubtask,
  CreateTaskRequest,
  UpdateTaskRequest,
} from "@/services/tasks";

/* =========================
   Types
========================= */
type TaskModalMode = "create" | "edit";
type TaskModalPayload = CreateTaskRequest | UpdateTaskRequest;

type CreateTaskModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: TaskModalPayload) => Promise<void> | void;
  mode?: TaskModalMode;
  initialData?: Task | null;
  isSubmitting?: boolean;
};

type FormState = {
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  dueDate: Date | null;
  dueTime: string;
  pomodoroEstimated: "1" | "2" | "3" | "4" | "5";
  subEnabled: boolean;
  subtasks: TaskSubtask[];
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

function fromIsoToDateAndTime(iso?: string | null) {
  if (!iso) {
    return {
      date: null,
      time: "",
    };
  }

  const d = new Date(iso);

  return {
    date: d,
    time: `${String(d.getHours()).padStart(2, "0")}:${String(
      d.getMinutes(),
    ).padStart(2, "0")}`,
  };
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

  React.useEffect(() => {
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

function createEmptyFormState(): FormState {
  return {
    title: "",
    description: "",
    category: "estudo",
    priority: "media",
    dueDate: null,
    dueTime: "",
    pomodoroEstimated: "1",
    subEnabled: false,
    subtasks: [{ title: "", isCompleted: false }],
  };
}

function createFormStateFromTask(task?: Task | null): FormState {
  if (!task) return createEmptyFormState();

  const dateInfo = fromIsoToDateAndTime(task.dueDate);

  const loadedSubtasks =
    task.subtasks?.length > 0
      ? task.subtasks.map((subtask) => ({
          id: subtask.id,
          title: subtask.title,
          isCompleted: subtask.isCompleted ?? false,
        }))
      : [{ title: "", isCompleted: false }];

  return {
    title: task.title ?? "",
    description: task.description ?? "",
    category: task.category ?? "estudo",
    priority: task.priority ?? "media",
    dueDate: dateInfo.date,
    dueTime: dateInfo.time,
    pomodoroEstimated: String(
      Math.min(Math.max(task.pomodoroEstimated ?? 1, 1), 5),
    ) as "1" | "2" | "3" | "4" | "5",
    subEnabled: loadedSubtasks.some((item) => item.title.trim().length > 0),
    subtasks: loadedSubtasks,
  };
}

/* =========================
   Theme helpers
========================= */
const tone = {
  surface: "bg-[var(--ff-surface)]",
  surfaceSoft: "bg-[var(--ff-surface-soft)]",
  surfaceMuted: "bg-[var(--ff-surface-muted)]",
  border: "border-[var(--ff-border)]",
  text: "text-[var(--ff-text)]",
  textSoft: "text-[var(--ff-text-soft)]",
  textMuted: "text-[var(--ff-text-muted)]",
  primaryBg: "bg-[var(--ff-primary)]",
  primaryHover: "hover:bg-[var(--ff-primary-strong)]",
  primaryText: "text-[var(--ff-primary)]",
  primaryRing: "focus:ring-[var(--ff-ring)]",
  primaryBorder: "focus:border-[var(--ff-primary)]",
};

function inputBaseClass() {
  return cx(
    "mt-2 w-full rounded-2xl border px-4 py-3 text-sm shadow-sm outline-none transition",
    tone.border,
    tone.surface,
    tone.text,
    "placeholder:text-[var(--ff-text-muted)]",
    "ring-[var(--ff-ring)]",
    tone.primaryBorder,
    "focus:ring-4",
  );
}

function subtleButtonClass() {
  return cx(
    "cursor-pointer transition active:scale-95",
    tone.surfaceSoft,
    tone.textSoft,
    "hover:bg-[var(--ff-surface-muted)]",
  );
}

/* =========================
   Portal Helpers
========================= */
function useBodyScrollLock(locked: boolean) {
  React.useEffect(() => {
    if (!locked) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prev;
    };
  }, [locked]);
}

function useEscToClose(open: boolean, onClose: () => void) {
  React.useEffect(() => {
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

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999]"
        >
          <div
            className="absolute inset-0 cursor-pointer bg-black/45 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <div className="pointer-events-none relative flex h-full w-full items-start justify-center p-4 sm:items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
              className={cx(
                "pointer-events-auto flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-3xl shadow-2xl",
                tone.surface,
              )}
              role="dialog"
              aria-modal="true"
              aria-label={title}
            >
              <style>{`
                .hide-scrollbar::-webkit-scrollbar {
                  display: none;
                }
                .hide-scrollbar {
                  -ms-overflow-style: none;
                  scrollbar-width: none;
                }
              `}</style>

              <div
                className={cx(
                  "flex items-center justify-between border-b px-6 py-4",
                  tone.border,
                )}
              >
                <p className={cx("text-lg font-semibold", tone.text)}>{title}</p>
                <button
                  type="button"
                  onClick={onClose}
                  className={cx(
                    "grid h-10 w-10 cursor-pointer place-items-center rounded-xl transition hover:scale-105 active:scale-95",
                    subtleButtonClass(),
                  )}
                  aria-label="Fechar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="hide-scrollbar overflow-y-auto px-6 py-6">
                {children}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
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
      <label className={cx("text-sm font-semibold", tone.text)}>
        {children} {required ? <span className="text-rose-600">*</span> : null}
      </label>
      {hint ? (
        <span className={cx("text-xs font-medium", tone.textMuted)}>{hint}</span>
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
      className={inputBaseClass()}
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
      className={cx(inputBaseClass(), "resize-none font-medium")}
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
        "relative inline-flex h-7 w-12 cursor-pointer items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[var(--ff-primary)] focus:ring-offset-2 focus:ring-offset-[var(--ff-surface)]",
        checked ? "bg-[var(--ff-primary)]" : "bg-[var(--ff-surface-muted)]",
      )}
      aria-label="Alternar"
      aria-pressed={checked}
    >
      <motion.span
        layout
        className="inline-block h-6 w-6 rounded-full bg-white shadow-sm"
        animate={{ x: checked ? 22 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
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
  hideScrollbar = false,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<SelectOption<T>>;
  placeholder?: string;
  leftIcon?: React.ReactNode;
  hideScrollbar?: boolean;
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
          "flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-sm outline-none transition",
          tone.border,
          tone.surface,
          tone.text,
          "hover:border-[var(--ff-primary)]/40",
          "ring-[var(--ff-ring)] focus:border-[var(--ff-primary)] focus:ring-4",
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="inline-flex min-w-0 items-center gap-2">
          {/* Renderiza o ícone com a cor nativa dele sem forçar text-muted */}
          {leftIcon ? <span className="flex items-center justify-center text-[var(--ff-text-muted)] [&>svg]:!text-current">{leftIcon}</span> : null}
          <span className="min-w-0 truncate">
            {selected ? (
              selected.label
            ) : (
              <span className={cx("font-semibold", tone.textMuted)}>
                {placeholder}
              </span>
            )}
          </span>
        </span>

        <ChevronDown
          className={cx(
            "h-5 w-5 transition-transform duration-300",
            tone.textMuted,
            open ? "rotate-180" : "",
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className={cx(
              "absolute left-0 right-0 top-[calc(100%+8px)] z-[10000] overflow-hidden rounded-2xl border shadow-2xl",
              tone.border,
              tone.surface,
            )}
          >
            <div
              className={cx(
                "max-h-64 overflow-y-auto p-2",
                hideScrollbar && "hide-scrollbar",
              )}
            >
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
                      "flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                      isActive
                        ? "bg-[color-mix(in_srgb,var(--ff-primary)_12%,var(--ff-surface))] text-[var(--ff-primary)]"
                        : "hover:bg-[var(--ff-surface-soft)]",
                      !isActive && tone.text,
                    )}
                    role="option"
                    aria-selected={isActive}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      {o.icon ? (
                        <span
                          className={cx(
                            "grid h-9 w-9 place-items-center rounded-xl ring-1 transition-colors",
                            isActive
                              ? "bg-[var(--ff-surface)] text-[var(--ff-primary)] ring-[color-mix(in_srgb,var(--ff-primary)_20%,var(--ff-border))]"
                              : "bg-[var(--ff-surface-soft)] text-[var(--ff-text-soft)] ring-[var(--ff-border)]",
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
                          <span className={cx("block truncate text-xs font-medium", tone.textMuted)}>
                            {o.meta}
                          </span>
                        ) : null}
                      </span>
                    </span>

                    {isActive && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="grid h-8 w-8 place-items-center rounded-xl bg-[var(--ff-surface)] ring-1 ring-[color-mix(in_srgb,var(--ff-primary)_20%,var(--ff-border))]"
                      >
                        <Check className="h-4 w-4 text-[var(--ff-primary)]" />
                      </motion.span>
                    )}
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

/* =========================
   DateTime Picker
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

  useBodyScrollLock(open);
  useEscToClose(open, () => setOpen(false));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cx(
          "mt-2 flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-sm outline-none transition",
          tone.border,
          tone.surface,
          "hover:border-[var(--ff-primary)]/40",
          "ring-[var(--ff-ring)] focus:border-[var(--ff-primary)] focus:ring-4",
        )}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className={cx("inline-flex items-center gap-2", tone.text)}>
          <Calendar className={cx("h-4 w-4", tone.textMuted)} />
          {value ? (
            <span className="capitalize">
              {timeValue
                ? `${formatPtBR(value)} às ${timeValue}`
                : formatPtBR(value)}
            </span>
          ) : (
            <span className={tone.textMuted}>{placeholder}</span>
          )}
        </span>

        <ChevronDown className={cx("h-5 w-5", tone.textMuted)} />
      </button>

      {typeof document !== "undefined" &&
        createPortal(
          <DateTimePickerContent
            open={open}
            initialDate={value}
            initialTime={timeValue}
            onClose={() => setOpen(false)}
            onApply={(date, time) => {
              onChangeDate(date);
              onChangeTime(time);
              setOpen(false);
            }}
          />,
          document.body,
        )}
    </>
  );
}

function DateTimePickerContent({
  open,
  initialDate,
  initialTime,
  onClose,
  onApply,
}: {
  open: boolean;
  initialDate: Date | null;
  initialTime: string;
  onClose: () => void;
  onApply: (date: Date | null, time: string) => void;
}) {
  const [view, setView] = useState<Date>(() => initialDate ?? new Date());
  const [tempDate, setTempDate] = useState<Date | null>(initialDate);
  const [tempTime, setTempTime] = useState<string>(initialTime);

  React.useEffect(() => {
    if (open) {
      setView(initialDate ?? new Date());
      setTempDate(initialDate);
      setTempTime(initialTime);
    }
  }, [open, initialDate, initialTime]);

  const days = buildCalendarGrid(view);

  const monthLabel = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(view);

  const dow = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10001] flex items-center justify-center p-4"
        >
          <div
            className="absolute inset-0 cursor-pointer bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            transition={{ type: "spring", bounce: 0.4 }}
            className={cx(
              "relative z-10 w-full max-w-md overflow-hidden rounded-3xl border shadow-2xl",
              tone.border,
              tone.surface,
            )}
          >
            <div className={cx("flex items-center justify-between border-b px-5 py-4", tone.border)}>
              <p className={cx("text-sm font-semibold", tone.text)}>
                Data e horário
              </p>
              <button
                type="button"
                onClick={onClose}
                className={cx(
                  "grid h-9 w-9 cursor-pointer place-items-center rounded-xl transition hover:scale-105 active:scale-95",
                  subtleButtonClass(),
                )}
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    setTempDate(d);
                    setTempTime("");
                  }}
                  className="cursor-pointer rounded-full bg-[color-mix(in_srgb,var(--ff-primary)_12%,var(--ff-surface))] px-3 py-1.5 text-xs font-semibold text-[var(--ff-primary)] transition hover:bg-[color-mix(in_srgb,var(--ff-primary)_18%,var(--ff-surface))] hover:scale-105 active:scale-95"
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
                  className={cx(
                    "cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold hover:scale-105 active:scale-95",
                    subtleButtonClass(),
                  )}
                >
                  Amanhã
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTempDate(null);
                    setTempTime("");
                  }}
                  className="ml-auto cursor-pointer rounded-full bg-[color-mix(in_srgb,#ef4444_10%,var(--ff-surface))] px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-[color-mix(in_srgb,#ef4444_16%,var(--ff-surface))] hover:scale-105 active:scale-95"
                >
                  Limpar
                </button>
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setView((v) => addMonths(v, -1))}
                  className={cx(
                    "cursor-pointer rounded-xl px-3 py-2 text-xs font-semibold hover:scale-105 active:scale-95",
                    subtleButtonClass(),
                  )}
                >
                  ←
                </button>

                <div className={cx("text-sm font-semibold capitalize", tone.text)}>
                  {monthLabel}
                </div>

                <button
                  type="button"
                  onClick={() => setView((v) => addMonths(v, 1))}
                  className={cx(
                    "cursor-pointer rounded-xl px-3 py-2 text-xs font-semibold hover:scale-105 active:scale-95",
                    subtleButtonClass(),
                  )}
                >
                  →
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {dow.map((d) => (
                  <div
                    key={d}
                    className={cx("pb-1 text-center text-[10px] font-semibold", tone.textMuted)}
                  >
                    {d}
                  </div>
                ))}

                {days.map((d) => {
                  const muted = !isSameMonth(d, view);
                  const selected = tempDate ? isSameDay(d, tempDate) : false;
                  const isToday = isSameDay(d, new Date());

                  return (
                    <button
                      key={`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`}
                      type="button"
                      onClick={() => setTempDate(d)}
                      className={cx(
                        "h-9 cursor-pointer rounded-xl text-xs font-semibold transition-all hover:scale-105 active:scale-95",
                        muted
                          ? "text-[var(--ff-text-muted)] hover:bg-[var(--ff-surface-soft)]"
                          : "text-[var(--ff-text)] hover:bg-[var(--ff-surface-soft)]",
                        isToday && !selected
                          ? "bg-[color-mix(in_srgb,var(--ff-primary)_12%,var(--ff-surface))] text-[var(--ff-primary)]"
                          : "",
                        selected
                          ? "bg-[var(--ff-primary)] text-white shadow-md hover:bg-[var(--ff-primary-strong)]"
                          : "",
                      )}
                    >
                      {pad2(d.getDate())}
                    </button>
                  );
                })}
              </div>

              <div>
                <label className={cx("mb-2 flex items-center gap-2 text-sm font-semibold", tone.text)}>
                  <Clock3 className={cx("h-4 w-4", tone.textMuted)} />
                  Horário
                </label>

                <input
                  type="time"
                  value={tempTime}
                  onChange={(e) => setTempTime(e.target.value)}
                  className={cx(
                    "w-full cursor-pointer rounded-2xl border px-4 py-3 text-sm font-semibold outline-none transition",
                    tone.border,
                    tone.surface,
                    tone.text,
                    "ring-[var(--ff-ring)] focus:border-[var(--ff-primary)] focus:ring-4",
                  )}
                />
              </div>

              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className={cx(
                    "cursor-pointer rounded-xl px-5 py-2.5 text-sm font-semibold ring-1 transition hover:scale-105 active:scale-95",
                    tone.surface,
                    tone.textSoft,
                    "ring-[var(--ff-border)] hover:bg-[var(--ff-surface-soft)]",
                  )}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={() => onApply(tempDate, tempTime)}
                  className="cursor-pointer rounded-xl bg-[var(--ff-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--ff-primary-strong)] hover:scale-105 active:scale-95"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* =========================
   Main Component
========================= */
export function CreateTaskModal(props: CreateTaskModalProps) {
  const { open, onClose, mode = "create", initialData = null } = props;

  const formKey = `${mode}-${initialData?.id ?? "new"}`;

  return (
    <ModalPortal
      open={open}
      onClose={onClose}
      title={mode === "edit" ? "Editar Tarefa" : "Nova Tarefa"}
    >
      <CreateTaskModalForm key={formKey} {...props} />
    </ModalPortal>
  );
}

function CreateTaskModalForm({
  onClose,
  onSubmit,
  mode = "create",
  initialData = null,
  isSubmitting = false,
}: Omit<CreateTaskModalProps, "open">) {
  const [form, setForm] = useState<FormState>(() =>
    mode === "edit" && initialData
      ? createFormStateFromTask(initialData)
      : createEmptyFormState(),
  );

  const canSubmit = form.title.trim().length > 0;

  function normalizeSubtasks(list: TaskSubtask[]) {
    return list
      .map((subtask) => ({
        id: subtask.id,
        title: subtask.title.trim(),
        isCompleted: subtask.isCompleted ?? false,
      }))
      .filter((subtask) => subtask.title.length > 0);
  }

  async function handleSubmit() {
    if (!canSubmit || isSubmitting) return;

    const cleanedSubtasks = form.subEnabled
      ? normalizeSubtasks(form.subtasks)
      : [];

    const payload: TaskModalPayload = {
      title: form.title.trim(),
      description: form.description.trim()
        ? form.description.trim()
        : undefined,
      category: form.category,
      priority: form.priority,
      dueDate: toIsoDateTime(form.dueDate, form.dueTime),
      pomodoroEstimated: Number(form.pomodoroEstimated) || 1,
      subtasks: cleanedSubtasks,
    };

    await onSubmit(payload);
    onClose();
  }

  // Cores estáticas da Categoria aplicadas diretamente via Tailwind
  const categoryOptions: Array<SelectOption<TaskCategory>> = [
    {
      label: "Estudo",
      value: "estudo",
      icon: <BookOpen className="h-4 w-4 text-purple-500" />,
      meta: "Aprendizado, leitura, exercícios",
    },
    {
      label: "Trabalho",
      value: "trabalho",
      icon: <Briefcase className="h-4 w-4 text-blue-500" />,
      meta: "Projetos, entregas, reuniões",
    },
    {
      label: "Pessoal",
      value: "pessoal",
      icon: <User className="h-4 w-4 text-emerald-500" />,
      meta: "Rotina, saúde, organização",
    },
  ];

  // Cores estáticas da Prioridade aplicadas diretamente via Tailwind
  const priorityOptions: Array<SelectOption<TaskPriority>> = [
    {
      label: "Baixa",
      value: "baixa",
      icon: <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />,
      meta: "Pode esperar",
    },
    {
      label: "Média",
      value: "media",
      icon: <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />,
      meta: "Importante",
    },
    {
      label: "Alta",
      value: "alta",
      icon: <span className="h-2.5 w-2.5 rounded-full bg-red-500" />,
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
    <div className="space-y-6">
      <div>
        <FieldLabel required hint="Obrigatório">
          Nome da tarefa
        </FieldLabel>

        <Input
          placeholder="Ex: Estudar Cálculo II"
          value={form.title}
          onChange={(value) =>
            setForm((prev) => ({
              ...prev,
              title: value,
            }))
          }
        />

        <AnimatePresence>
          {!canSubmit && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden text-xs font-medium text-rose-600"
            >
              <span className="mt-2 block">
                Informe o nome da tarefa para continuar.
              </span>
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div>
        <FieldLabel hint="Opcional">Descrição</FieldLabel>
        <Textarea
          placeholder="Adicione detalhes sobre a tarefa..."
          value={form.description}
          onChange={(value) =>
            setForm((prev) => ({
              ...prev,
              description: value,
            }))
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <FieldLabel>Categoria</FieldLabel>
          <SelectPro
            value={form.category}
            onChange={(value) =>
              setForm((prev) => ({
                ...prev,
                category: value,
              }))
            }
            options={categoryOptions}
            // Exibe a cor correspondente no Select Fechado dinamicamente
            leftIcon={categoryOptions.find(o => o.value === form.category)?.icon || <BookOpen className="h-4 w-4" />}
            placeholder="Selecione a categoria"
          />
        </div>

        <div>
          <FieldLabel>Prioridade</FieldLabel>
          <SelectPro
            value={form.priority}
            onChange={(value) =>
              setForm((prev) => ({
                ...prev,
                priority: value,
              }))
            }
            options={priorityOptions}
            // Exibe a cor correspondente no Select Fechado dinamicamente
            leftIcon={priorityOptions.find(o => o.value === form.priority)?.icon || <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />}
            placeholder="Selecione a prioridade"
          />
        </div>

        <div>
          <FieldLabel>Prazo</FieldLabel>
          <DateTimePicker
            value={form.dueDate}
            timeValue={form.dueTime}
            onChangeDate={(date) =>
              setForm((prev) => ({
                ...prev,
                dueDate: date,
              }))
            }
            onChangeTime={(time) =>
              setForm((prev) => ({
                ...prev,
                dueTime: time,
              }))
            }
            placeholder="Selecionar data e horário"
          />
        </div>

        <div>
          <FieldLabel>Pomodoros estimados</FieldLabel>
          <SelectPro
            value={form.pomodoroEstimated}
            onChange={(value) =>
              setForm((prev) => ({
                ...prev,
                pomodoroEstimated: value,
              }))
            }
            options={pomodoroOptions}
            leftIcon={<Timer className="h-4 w-4" />}
            placeholder="Defina a estimativa"
            hideScrollbar
          />
        </div>
      </div>

      <div
        className={cx(
          "rounded-3xl border p-5",
          tone.border,
          tone.surfaceSoft,
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className={cx("text-sm font-semibold", tone.text)}>Subtarefas</p>
            <p className={cx("mt-1 text-xs font-medium", tone.textMuted)}>
              Adicione etapas para facilitar a execução
            </p>
          </div>

          <Toggle
            checked={form.subEnabled}
            onChange={(value) =>
              setForm((prev) => ({
                ...prev,
                subEnabled: value,
                subtasks:
                  value && prev.subtasks.length === 0
                    ? [{ title: "", isCompleted: false }]
                    : prev.subtasks,
              }))
            }
          />
        </div>

        <AnimatePresence>
          {form.subEnabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-5 space-y-3">
                <AnimatePresence mode="popLayout">
                  {form.subtasks.map((subtask, idx) => {
                    const uniqueKey = subtask.id ?? `temp-${idx}`;

                    return (
                      <motion.div
                        layout
                        key={uniqueKey}
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        className="flex items-center gap-2"
                      >
                        <div className="flex-1">
                          <input
                            value={subtask.title}
                            onChange={(e) => {
                              const value = e.target.value;

                              setForm((prev) => {
                                const next = [...prev.subtasks];
                                next[idx] = {
                                  ...next[idx],
                                  title: value,
                                };

                                return {
                                  ...prev,
                                  subtasks: next,
                                };
                              });
                            }}
                            placeholder={`Subtarefa ${idx + 1}`}
                            className={cx(
                              "w-full rounded-2xl border px-4 py-3 text-sm font-semibold shadow-sm outline-none transition",
                              tone.border,
                              tone.surface,
                              tone.text,
                              "placeholder:text-[var(--ff-text-muted)]",
                              "ring-[var(--ff-ring)] focus:border-[var(--ff-primary)] focus:ring-4",
                            )}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setForm((prev) => {
                              const next = prev.subtasks.filter((_, i) => i !== idx);

                              return {
                                ...prev,
                                subtasks: next.length
                                  ? next
                                  : [{ title: "", isCompleted: false }],
                              };
                            })
                          }
                          className={cx(
                            "grid h-12 w-12 cursor-pointer place-items-center rounded-2xl ring-1 transition hover:scale-105 active:scale-95",
                            tone.surface,
                            tone.textSoft,
                            "ring-[var(--ff-border)] hover:bg-[var(--ff-surface-soft)] hover:text-rose-600 hover:ring-rose-200",
                          )}
                          aria-label="Remover subtarefa"
                          title="Remover"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                <div className="flex items-center justify-between gap-3 pt-2">
                  <p className={cx("text-xs font-medium", tone.textMuted)}>
                    Dica: use frases curtas e objetivas.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        subtasks: [
                          ...prev.subtasks,
                          { title: "", isCompleted: false },
                        ],
                      }))
                    }
                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[var(--ff-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--ff-primary-strong)] hover:scale-105 active:scale-95"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className={cx(
            "cursor-pointer rounded-2xl px-6 py-3.5 text-sm font-semibold ring-1 transition hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100",
            tone.surface,
            tone.textSoft,
            "ring-[var(--ff-border)] hover:bg-[var(--ff-surface-soft)]",
          )}
        >
          Cancelar
        </button>

        <button
          type="button"
          disabled={!canSubmit || isSubmitting}
          onClick={handleSubmit}
          className={cx(
            "inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all",
            canSubmit && !isSubmitting
              ? "cursor-pointer bg-[var(--ff-primary)] hover:bg-[var(--ff-primary-strong)] hover:scale-105 active:scale-95"
              : "cursor-not-allowed bg-[var(--ff-surface-muted)] text-[var(--ff-text-muted)] shadow-none",
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : mode === "edit" ? (
            "Salvar alterações"
          ) : (
            "Criar tarefa"
          )}
        </button>
      </div>
    </div>
  );
}