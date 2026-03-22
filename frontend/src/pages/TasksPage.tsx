import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Plus,
  Search,
  Filter,
  SlidersHorizontal,
  ChevronDown,
  Calendar,
  Play,
  MoreHorizontal,
  CheckCircle2,
  Circle,
  Briefcase,
  BookOpen,
  User,
  Timer,
  Check,
  Pencil,
  Trash2,
} from "lucide-react";

import {
  CreateTaskModal,
  type CreateTaskPayload,
} from "@/components/CreateTaskModal";

import { Badge } from "@/components/common/Badge";
import { ProgressBar } from "@/components/common/ProgressBar";
import { cn } from "@/lib/cn";

type TaskStatus = "pendente" | "em_progresso" | "concluida";

type Task = {
  id: string;
  title: string;
  description?: string;
  category: "estudo" | "trabalho" | "pessoal";
  priority: "alta" | "media" | "baixa";
  dueLabel: string;
  pomodoroDone: number;
  pomodoroTotal: number;
  progress?: number; // 0..1
  status: TaskStatus;
  subtasks?: string[];
};

/* =========================
   Small hook: click outside
========================= */
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
  widthClassName,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<SelectOption<T>>;
  placeholder?: string;
  leftIcon?: React.ReactNode;
  widthClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(open, () => setOpen(false));

  const selected = useMemo(
    () => options.find((o) => o.value === value),
    [options, value],
  );

  return (
    <div className={cn("relative", widthClassName)} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm outline-none",
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
          className={cn(
            "h-5 w-5 text-slate-400 transition",
            open ? "rotate-180" : "",
          )}
        />
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-60 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
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
                  className={cn(
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
                        className={cn(
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
   Row Menu
========================= */
function RowMenu({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  const btnRef = React.useRef<HTMLButtonElement | null>(null);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

 useEffect(() => {
  const id = requestAnimationFrame(() => setMounted(true));
  return () => cancelAnimationFrame(id);
}, []);

  const computePos = () => {
    const el = btnRef.current;
    if (!el) return null;

    const r = el.getBoundingClientRect();

    const menuWidth = 224;
    const menuHeight = 140;
    const gap = 10;
    const padding = 12;

    let left = r.right - menuWidth;
    let top = r.bottom + gap;

    left = Math.max(
      padding,
      Math.min(left, window.innerWidth - menuWidth - padding),
    );

    const spaceBelow = window.innerHeight - (r.bottom + gap);
    if (spaceBelow < menuHeight + padding) {
      top = r.top - gap - menuHeight;
      top = Math.max(padding, top);
    }

    return { top, left };
  };

  const openMenu = () => {
    if (typeof window === "undefined") return;
    const p = computePos();
    if (!p) return;
    setPos(p);
    setOpen(true);
  };

  const closeMenu = () => setOpen(false);

  useEffect(() => {
    if (!open) return;

    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      const b = btnRef.current;
      const m = menuRef.current;

      if (b && b.contains(t)) return;
      if (m && m.contains(t)) return;

      closeMenu();
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };

    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onRelayout = () => {
      const p = computePos();
      if (p) setPos(p);
    };

    window.addEventListener("scroll", onRelayout, true);
    window.addEventListener("resize", onRelayout);
    return () => {
      window.removeEventListener("scroll", onRelayout, true);
      window.removeEventListener("resize", onRelayout);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (open) closeMenu();
          else openMenu();
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        className="grid h-10 w-10 place-items-center rounded-xl bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
        aria-label="Mais ações"
        title="Mais"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreHorizontal className="h-5 w-5" />
      </button>

      {mounted && open && pos
        ? createPortal(
            <div
              ref={menuRef}
              className="fixed z-9999 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
              style={{ top: pos.top, left: pos.left }}
              role="menu"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    closeMenu();
                    onEdit();
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-800 hover:bg-slate-50"
                  role="menuitem"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-50 ring-1 ring-slate-200 text-slate-600">
                    <Pencil className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block">Editar</span>
                    <span className="block text-xs font-medium text-slate-500">
                      Alterar detalhes da tarefa
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    closeMenu();
                    onDelete();
                  }}
                  className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-rose-700 hover:bg-rose-50"
                  role="menuitem"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-rose-50 ring-1 ring-rose-100 text-rose-700">
                    <Trash2 className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block">Excluir</span>
                    <span className="block text-xs font-medium text-rose-600/80">
                      Remover permanentemente
                    </span>
                  </span>
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function CategoryIcon({ category }: { category: Task["category"] }) {
  if (category === "trabalho") return <Briefcase className="h-4 w-4" />;
  if (category === "pessoal") return <User className="h-4 w-4" />;
  return <BookOpen className="h-4 w-4" />;
}

function TaskRow({
  task,
  onEdit,
  onDelete,
}: {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isDone = task.status === "concluida";
  const isPending = task.status === "pendente";

  const categoryTone =
    task.category === "trabalho"
      ? "info"
      : task.category === "pessoal"
        ? "success"
        : "neutral";

  const priorityTone =
    task.priority === "alta"
      ? "danger"
      : task.priority === "media"
        ? "warning"
        : "neutral";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      {isPending ? (
        <div className="absolute left-0 top-0 h-full w-1.5 bg-rose-500" />
      ) : null}

      <div
        className={cn(
          "flex items-start justify-between gap-3",
          isPending ? "pl-2" : "",
        )}
      >
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-slate-50 ring-1 ring-slate-200">
            {isDone ? (
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            ) : (
              <Circle
                className={cn(
                  "h-6 w-6",
                  isPending ? "text-rose-400" : "text-blue-500",
                )}
              />
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {task.title}
            </p>

            {task.description ? (
              <p className="mt-1 line-clamp-1 text-sm text-slate-500">
                {task.description}
              </p>
            ) : null}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge tone={categoryTone}>
                <span className="inline-flex items-center gap-1">
                  <CategoryIcon category={task.category} />
                  <span className="capitalize">{task.category}</span>
                </span>
              </Badge>

              <Badge tone={priorityTone}>
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                  {task.priority}
                </span>
              </Badge>

              <Badge tone="neutral">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {task.dueLabel}
                </span>
              </Badge>

              <Badge tone="neutral">
                <span className="inline-flex items-center gap-1">
                  <Timer className="h-4 w-4" />
                  {task.pomodoroDone}/{task.pomodoroTotal}
                </span>
              </Badge>
            </div>

            {typeof task.progress === "number" ? (
              <div className="mt-4 flex items-center gap-3">
                <div className="flex-1">
                  <ProgressBar
                    value={task.progress}
                    barClassName="bg-emerald-500"
                  />
                </div>
                <span className="text-xs font-medium text-slate-600">
                  {Math.round(task.progress * 100)}%
                </span>
              </div>
            ) : null}

            {task.subtasks?.length ? (
              <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600 ring-1 ring-slate-200">
                <span className="font-semibold text-slate-800">
                  Subtarefas:
                </span>{" "}
                {task.subtasks.slice(0, 3).join(" • ")}
                {task.subtasks.length > 3 ? " • ..." : ""}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-xl bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            aria-label="Iniciar pomodoro nesta tarefa"
            title="Iniciar"
          >
            <Play className="h-5 w-5" />
          </button>

          <RowMenu onEdit={onEdit} onDelete={onDelete} />
        </div>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const [createOpen, setCreateOpen] = useState(false);

  const [tab, setTab] = useState<
    "todas" | "pendentes" | "em_progresso" | "concluidas"
  >("todas");

  const [q, setQ] = useState("");

  const [filterCategory, setFilterCategory] = useState<
    "todas" | Task["category"]
  >("todas");

  const [filterPriority, setFilterPriority] = useState<
    "todas" | Task["priority"]
  >("todas");

  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "t1",
      title: "Ler artigos sobre Machine Learning",
      category: "estudo",
      priority: "media",
      dueLabel: "27 de fev",
      pomodoroDone: 3,
      pomodoroTotal: 2,
      status: "pendente",
    },
    {
      id: "t2",
      title: "Estudar Cálculo II - Derivadas",
      description:
        "Revisar capítulos 3 e 4 do livro, resolver exercícios práticos",
      category: "estudo",
      priority: "alta",
      dueLabel: "24 de fev",
      pomodoroDone: 4,
      pomodoroTotal: 4,
      status: "pendente",
    },
    {
      id: "t3",
      title: "Atualizar currículo",
      category: "trabalho",
      priority: "media",
      dueLabel: "Hoje",
      pomodoroDone: 1,
      pomodoroTotal: 1,
      status: "concluida",
    },
    {
      id: "t4",
      title: "Academia - Treino de pernas",
      category: "pessoal",
      priority: "baixa",
      dueLabel: "23 de fev",
      pomodoroDone: 0,
      pomodoroTotal: 2,
      status: "concluida",
    },
    {
      id: "t5",
      title: "Preparar apresentação de TCC",
      description: "Criar slides para a defesa parcial",
      category: "estudo",
      priority: "alta",
      dueLabel: "Hoje",
      pomodoroDone: 0,
      pomodoroTotal: 3,
      progress: 1 / 3,
      status: "pendente",
    },
  ]);


  const counts = useMemo(() => {
    const pend = tasks.filter((t) => t.status !== "concluida").length;
    const done = tasks.filter((t) => t.status === "concluida").length;
    return { pend, done };
  }, [tasks]);

  const filtered = useMemo(() => {
    let list = [...tasks];

    if (tab === "pendentes") list = list.filter((t) => t.status === "pendente");
    if (tab === "em_progresso")
      list = list.filter((t) => t.status === "em_progresso");
    if (tab === "concluidas")
      list = list.filter((t) => t.status === "concluida");

    if (q.trim()) {
      const qq = q.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(qq) ||
          (t.description ?? "").toLowerCase().includes(qq),
      );
    }

    if (filterCategory !== "todas") {
      list = list.filter((t) => t.category === filterCategory);
    }

    if (filterPriority !== "todas") {
      list = list.filter((t) => t.priority === filterPriority);
    }

    return list;
  }, [tasks, tab, q, filterCategory, filterPriority]);

  const categoryFilterOptions: Array<SelectOption<"todas" | Task["category"]>> =
    [
      {
        label: "Todas",
        value: "todas",
        icon: <Filter className="h-4 w-4" />,
        meta: "",
      },
      {
        label: "Estudo",
        value: "estudo",
        icon: <BookOpen className="h-4 w-4" />,
        meta: "",
      },
      {
        label: "Trabalho",
        value: "trabalho",
        icon: <Briefcase className="h-4 w-4" />,
        meta: "",
      },
      {
        label: "Pessoal",
        value: "pessoal",
        icon: <User className="h-4 w-4" />,
        meta: "",
      },
    ];

  const priorityFilterOptions: Array<SelectOption<"todas" | Task["priority"]>> =
    [
      {
        label: "Todas",
        value: "todas",
        icon: <SlidersHorizontal className="h-4 w-4" />,
        meta: "",
      },
      {
        label: "Alta",
        value: "alta",
        icon: <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />,
        meta: "",
      },
      {
        label: "Média",
        value: "media",
        icon: <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />,
        meta: "",
      },
      {
        label: "Baixa",
        value: "baixa",
        icon: <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />,
        meta: "",
      },
    ];

  function handleDeleteTask(taskId: string) {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }

  function handleEditTask(taskId: string) {
    alert(`Editar tarefa: ${taskId} (implementar modal de edição)`);
  }

    return (
    <>
      <div className="mb-4 lg:hidden">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Minhas Tarefas
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {counts.pend} pendentes • {counts.done} concluídas
            </p>
          </div>

          <button
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            type="button"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Nova Tarefa
          </button>
        </div>
      </div>

      <div className="hidden items-start justify-between gap-4 lg:flex">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Minhas Tarefas
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {counts.pend} pendentes • {counts.done} concluídas
          </p>
        </div>

        <button
          className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          type="button"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Nova Tarefa
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar tarefas..."
            className="w-full rounded-2xl border border-slate-200 bg-white px-10 py-3 text-sm text-slate-900 outline-none ring-blue-200 focus:border-blue-500 focus:ring-4"
          />
        </div>

        <div className="flex gap-3">
          <SelectPro
            value={filterCategory}
            onChange={(v) => setFilterCategory(v)}
            options={categoryFilterOptions}
            leftIcon={<Filter className="h-4 w-4" />}
            placeholder="Categoria"
            widthClassName="w-full sm:w-44"
          />

          <SelectPro
            value={filterPriority}
            onChange={(v) => setFilterPriority(v)}
            options={priorityFilterOptions}
            leftIcon={<SlidersHorizontal className="h-4 w-4" />}
            placeholder="Prioridade"
            widthClassName="w-full sm:w-44"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {[
          { id: "todas", label: "Todas" },
          { id: "pendentes", label: "Pendentes" },
          { id: "em_progresso", label: "Em Progresso" },
          { id: "concluidas", label: "Concluídas" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() =>
              setTab(
                t.id as "todas" | "pendentes" | "em_progresso" | "concluidas",
              )
            }
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition",
              tab === t.id
                ? "bg-white text-slate-900 ring-1 ring-slate-200 shadow-sm"
                : "text-slate-600 hover:bg-white hover:ring-1 hover:ring-slate-200",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-3 pb-10">
        {filtered.map((t) => (
          <TaskRow
            key={t.id}
            task={t}
            onEdit={() => handleEditTask(t.id)}
            onDelete={() => handleDeleteTask(t.id)}
          />
        ))}
      </div>

      <CreateTaskModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={(payload: CreateTaskPayload) => {
          setTasks((prev) => [
            {
              id: String(Date.now()),
              title: payload.title,
              description: payload.description,
              category: payload.category,
              priority: payload.priority,
              dueLabel: payload.dueLabel,
              pomodoroDone: 0,
              pomodoroTotal: payload.pomodoros,
              progress: 0,
              status: "pendente",
              subtasks: payload.subtasks,
            },
            ...prev,
          ]);
        }}
      />
    </>
  );
}
