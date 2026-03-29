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
  AlertCircle,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { CreateTaskModal } from "@/components/CreateTaskModal";
import { Badge } from "@/components/common/Badge";
import { cn } from "@/lib/cn";
import {
  listTasks,
  createTask,
  updateTask,
  deleteTask,
  type Task,
  type CreateTaskRequest,
  type UpdateTaskRequest,
} from "@/services/tasks";

// --- NOVOS IMPORTS PARA GAMIFICAÇÃO ---
import { api } from "@/services/api";
import { useGameStore } from "@/store/useGameStore";

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
          "cursor-pointer flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm outline-none transition hover:border-slate-300 hover:bg-slate-50",
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
        <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
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
                    "cursor-pointer flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition",
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
  open,
  onOpen,
  onClose,
  onEdit,
  onDelete,
}: {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
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
    onOpen();
  };

  useEffect(() => {
    if (!open) return;

    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      const b = btnRef.current;
      const m = menuRef.current;

      if (b && b.contains(t)) return;
      if (m && m.contains(t)) return;

      onClose();
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

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
          if (open) onClose();
          else openMenu();
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        className="cursor-pointer grid h-10 w-10 place-items-center rounded-xl bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
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
              className="fixed z-9999 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl"
              style={{ top: pos.top, left: pos.left }}
              role="menu"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose();
                  onEdit();
                }}
                className="cursor-pointer flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-800 hover:bg-slate-50"
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
                  onClose();
                  onDelete();
                }}
                className="cursor-pointer mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-rose-700 hover:bg-rose-50"
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

/* =========================
   TaskRow (Visual Card)
========================= */
function TaskRow({
  task,
  onEdit,
  onDelete,
  onToggleComplete,
  menuOpen,
  onOpenMenu,
  onCloseMenu,
}: {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onToggleComplete: () => void;
  menuOpen: boolean;
  onOpenMenu: () => void;
  onCloseMenu: () => void;
}) {
  const navigate = useNavigate();
  
  const isDone = task.status === "concluida";
  const isPending = task.status === "pendente"; // Pendente = Atrasada
  const isActive = (task.status as string) === "em_andamento"; // Bypass TS2367 temp

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
    <div className={cn(
      "group relative overflow-hidden rounded-2xl border p-4 shadow-sm transition hover:shadow-md",
      isPending ? "border-rose-200 bg-rose-50/40" : "border-slate-200 bg-white",
      isDone && "opacity-70"
    )}>
      {/* Indicador lateral */}
      {(isActive || isPending) ? (
        <div className={cn("absolute left-0 top-0 h-full w-1.5", isPending ? "bg-rose-500" : "bg-blue-400")} />
      ) : null}

      <div
        className={cn(
          "flex items-start justify-between gap-3",
          (isActive || isPending) ? "pl-2" : "",
        )}
      >
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <button
            type="button"
            onClick={onToggleComplete}
            className="cursor-pointer mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-slate-50 ring-1 ring-slate-200 transition hover:bg-white"
            aria-label={
              isDone
                ? "Desmarcar tarefa concluída"
                : "Marcar tarefa como concluída"
            }
            title={isDone ? "Desmarcar concluída" : "Marcar concluída"}
          >
            {isDone ? (
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            ) : (
              <Circle
                className={cn(
                  "h-6 w-6 transition",
                  isPending ? "text-rose-500" : "text-slate-300 group-hover:text-blue-500",
                )}
              />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className={cn("truncate text-sm font-semibold text-slate-900", isDone && "line-through opacity-60")}>
                {task.title}
              </p>
              {isPending && (
                <span title="Atrasada" className="flex items-center shrink-0">
                  <AlertCircle className="h-4 w-4 text-rose-500" />
                </span>
              )}
            </div>

            {task.description ? (
              <p className="mt-1 line-clamp-2 text-sm text-slate-500">
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

              <Badge tone={isPending ? "danger" : "neutral"}>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {isPending ? `Atrasada: ${task.dueLabel}` : task.dueLabel}
                </span>
              </Badge>

              <Badge tone={isActive ? "info" : "neutral"}>
                <span className="inline-flex items-center gap-1">
                  <Timer className="h-4 w-4" />
                  {task.pomodoroCompleted}/{task.pomodoroEstimated}
                </span>
              </Badge>
            </div>

            {/* Barra de Progresso Nativa Tailwind */}
            {typeof task.progress === "number" ? (
              <div className="mt-4 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 ring-1 ring-inset ring-slate-200/50">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-500 ease-out", 
                      isDone ? "bg-emerald-500" : "bg-blue-500"
                    )}
                    style={{ width: `${Math.max(0, Math.min(100, task.progress))}%` }} 
                  />
                </div>
                <span className="w-8 text-right text-xs font-bold text-slate-600">
                  {Math.round(task.progress)}%
                </span>
              </div>
            ) : null}

            {task.subtasks?.length ? (
              <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600 ring-1 ring-slate-200">
                <span className="font-semibold text-slate-800">
                  Subtarefas:
                </span>{" "}
                {task.subtasks
                  .slice(0, 3)
                  .map((subtask) => subtask.title)
                  .join(" • ")}
                {task.subtasks.length > 3 ? " • ..." : ""}
              </div>
            ) : null}
          </div>
        </div>

        <div
          className={cn(
            "flex shrink-0 items-center gap-2 self-start",
            "opacity-100 translate-y-0 pointer-events-auto",
            "lg:opacity-0 lg:translate-y-1 lg:pointer-events-none",
            "lg:group-hover:opacity-100 lg:group-hover:translate-y-0 lg:group-hover:pointer-events-auto",
            menuOpen ? "lg:opacity-100 lg:translate-y-0 lg:pointer-events-auto" : "",
          )}
        >
          {!isDone && (
            <button
              type="button"
              className="cursor-pointer grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100 transition hover:bg-blue-100"
              aria-label="Iniciar pomodoro nesta tarefa"
              title="Iniciar"
              // NAVEGAÇÃO COM O STATE ENVIANDO O ID
              onClick={() => navigate("/pomodoropage", { state: { selectedTaskId: task.id } })}
            >
              <Play className="h-5 w-5 fill-current" />
            </button>
          )}

          <RowMenu
            open={menuOpen}
            onOpen={onOpenMenu}
            onClose={onCloseMenu}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      </div>
    </div>
  );
}

/* =========================
   Empty State
========================= */
function EmptyTasksState({
  hasFilters,
  onCreateTask,
  onClearFilters,
}: {
  hasFilters: boolean;
  onCreateTask: () => void;
  onClearFilters: () => void;
}) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-10 shadow-sm sm:px-10 sm:py-14">
      <div className="mx-auto flex max-w-xl flex-col items-center text-center">
        <div className="grid h-20 w-20 place-items-center rounded-full bg-slate-100 ring-8 ring-slate-50">
          <CheckCircle2 className="h-8 w-8 text-slate-500" />
        </div>

        <h3 className="mt-6 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
          {hasFilters ? "Nenhuma tarefa encontrada" : "Nenhuma tarefa pendente"}
        </h3>

        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 sm:text-base">
          {hasFilters
            ? "Tente ajustar os filtros ou a busca para localizar as suas tarefas com mais facilidade."
            : "Crie uma nova tarefa para começar a organizar a sua rotina e produzir melhor."}
        </p>

        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row">
          {!hasFilters ? (
            <button
              type="button"
              onClick={onCreateTask}
              className="cursor-pointer inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Criar tarefa
            </button>
          ) : null}

          {hasFilters ? (
            <button
              type="button"
              onClick={onClearFilters}
              className="cursor-pointer inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              Limpar filtros
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openMenuTaskId, setOpenMenuTaskId] = useState<number | null>(null);

  // Abas
  const [tab, setTab] = useState<
    "todas" | "pendentes" | "em_andamento" | "concluidas"
  >("todas");

  const [q, setQ] = useState("");

  const [filterCategory, setFilterCategory] = useState<
    "todas" | Task["category"]
  >("todas");

  const [filterPriority, setFilterPriority] = useState<
    "todas" | Task["priority"]
  >("todas");

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadTasks() {
      try {
        setLoading(true);
        setErrorMessage("");
        const data = await listTasks();
        setTasks(data);
      } catch {
        setErrorMessage("Não foi possível carregar as tarefas.");
      } finally {
        setLoading(false);
      }
    }

    loadTasks();
  }, []);

  const filtered = useMemo(() => {
    let list = [...tasks];

    // LÓGICA DE FILTRAGEM
    if (tab === "pendentes") {
      list = list.filter((t) => t.status === "pendente"); // Significa Atrasadas
    } else if (tab === "em_andamento") {
      list = list.filter((t) => (t.status as string) === "em_andamento"); // Bypass TS2367 temp
    } else if (tab === "concluidas") {
      list = list.filter((t) => t.status === "concluida"); // Finalizadas
    }

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

  const hasActiveFilters =
    tab !== "todas" ||
    q.trim() !== "" ||
    filterCategory !== "todas" ||
    filterPriority !== "todas";

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

  async function handleCreateTask(
    payload: CreateTaskRequest | UpdateTaskRequest,
  ) {
    try {
      setIsSubmitting(true);

      const newTask = await createTask(payload as CreateTaskRequest);

      setTasks((prev) => [newTask, ...prev]);
      setCreateOpen(false);
    } catch {
      alert("Não foi possível criar a tarefa.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleOpenEdit(task: Task) {
    setSelectedTask(task);
    setEditOpen(true);
  }

  async function handleEditTask(payload: CreateTaskRequest | UpdateTaskRequest) {
    if (!selectedTask) return;

    try {
      setIsSubmitting(true);

      const updated = await updateTask(
        selectedTask.id,
        payload as UpdateTaskRequest,
      );

      setTasks((prev) =>
        prev.map((task) => (task.id === updated.id ? updated : task)),
      );

      setSelectedTask(updated);
      setEditOpen(false);
    } catch {
      alert("Não foi possível atualizar a tarefa.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteTask(taskId: number) {
    try {
      await deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));

      if (selectedTask?.id === taskId) {
        setSelectedTask(null);
        setEditOpen(false);
      }
    } catch {
      alert("Não foi possível excluir a tarefa.");
    }
  }

  async function handleToggleComplete(task: Task) {
    try {
      const isCurrentlyDone = task.status === "concluida";

      const updated = await updateTask(task.id, {
        completedAt: isCurrentlyDone ? null : new Date().toISOString(),
      });

      setTasks((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );

      if (selectedTask?.id === updated.id) {
        setSelectedTask(updated);
      }

      // --- 🚀 INÍCIO DA GAMIFICAÇÃO DA TAREFA ---
      if (!isCurrentlyDone) {
        try {
          await api.post("/gamification/actions/complete-task/");
          // Atualiza a Sidebar instantaneamente!
          await useGameStore.getState().fetchStatus(); 
        } catch (error) {
          console.error("Erro ao resgatar XP da tarefa:", error);
        }
      }
      // --- FIM DA GAMIFICAÇÃO ---

    } catch {
      alert("Não foi possível atualizar a conclusão da tarefa.");
    }
  }

  function handleClearFilters() {
    setTab("todas");
    setQ("");
    setFilterCategory("todas");
    setFilterPriority("todas");
  }

  return (
    <>
      <div className="mb-4 lg:hidden">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              As Minhas Tarefas
            </h1>
          </div>

          <button
            className="cursor-pointer inline-flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.97]"
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
            As Minhas Tarefas
          </h1>
        </div>

        <button
          className="cursor-pointer inline-flex shrink-0 items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.97]"
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
            placeholder="Pesquisar tarefas..."
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
          { id: "em_andamento", label: "Em Andamento" },
          { id: "pendentes", label: "Pendentes" },
          { id: "concluidas", label: "Concluídas" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() =>
              setTab(
                t.id as "todas" | "pendentes" | "em_andamento" | "concluidas",
              )
            }
            className={cn(
              "cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition",
              tab === t.id
                ? "bg-white text-slate-900 ring-1 ring-slate-200 shadow-sm"
                : "text-slate-600 hover:bg-white hover:ring-1 hover:ring-slate-200",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-5 pb-10">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
            A carregar tarefas...
          </div>
        ) : errorMessage ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-sm">
            {errorMessage}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyTasksState
            hasFilters={hasActiveFilters || tasks.length > 0}
            onCreateTask={() => setCreateOpen(true)}
            onClearFilters={handleClearFilters}
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((t) => (
              <TaskRow
                key={t.id}
                task={t}
                onEdit={() => {
                  setOpenMenuTaskId(null);
                  handleOpenEdit(t);
                }}
                onDelete={() => {
                  setOpenMenuTaskId(null);
                  handleDeleteTask(t.id);
                }}
                onToggleComplete={() => handleToggleComplete(t)}
                menuOpen={openMenuTaskId === t.id}
                onOpenMenu={() => setOpenMenuTaskId(t.id)}
                onCloseMenu={() =>
                  setOpenMenuTaskId((prev) => (prev === t.id ? null : prev))
                }
              />
            ))}
          </div>
        )}
      </div>

      <CreateTaskModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreateTask}
        mode="create"
        isSubmitting={isSubmitting}
      />

      <CreateTaskModal
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setSelectedTask(null);
        }}
        onSubmit={handleEditTask}
        mode="edit"
        initialData={selectedTask}
        isSubmitting={isSubmitting}
      />
    </>
  );
}