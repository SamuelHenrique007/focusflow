import { useEffect, useMemo, useState } from "react";
import {
  Play,
  Flame,
  Plus,
  Sparkles,
  Target,
  Clock,
  CheckCircle2,
  Circle,
  BookOpen,
  Briefcase,
  User,
  Calendar,
  Timer,
  AlertCircle,
  Rocket,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { CreateTaskModal } from "@/components/CreateTaskModal";
import { Badge } from "@/components/common/Badge";
import { ProgressBar } from "@/components/common/ProgressBar";
import { StatCard } from "@/components/common/StatCard";
import { cn } from "@/lib/cn";
import { useAuth } from "@/hooks/useAuth";
import {
  listTasks,
  createTask,
  updateTask,
  type Task,
  type CreateTaskRequest,
  type UpdateTaskRequest,
} from "@/services/tasks";

function normalizeNameParts(name?: string) {
  if (!name?.trim()) return [];

  const connectors = ["de", "da", "do", "dos", "das", "e"];

  return name
    .trim()
    .split(" ")
    .filter((word) => word && !connectors.includes(word.toLowerCase()));
}

function getFirstAndSecondName(name?: string) {
  const parts = normalizeNameParts(name);

  if (parts.length === 0) return "Usuário";
  if (parts.length === 1) return parts[0];

  return `${parts[0]} ${parts[1]}`;
}

function CategoryIcon({ category }: { category: Task["category"] }) {
  if (category === "trabalho") return <Briefcase className="h-4 w-4" />;
  if (category === "pessoal") return <User className="h-4 w-4" />;
  return <BookOpen className="h-4 w-4" />;
}

function isToday(dateString?: string | null) {
  if (!dateString) return false;

  const date = new Date(dateString);
  const today = new Date();

  return date.toDateString() === today.toDateString();
}

function isOverdue(dateString?: string | null) {
  if (!dateString) return false;

  const due = new Date(dateString);
  const now = new Date();

  due.setSeconds(0, 0);
  now.setSeconds(0, 0);

  return due < now && !isToday(dateString);
}

/**
 * Regra do dashboard:
 * - mostrar tarefas do dia
 * - mostrar tarefas pendentes
 * - nunca mostrar concluídas
 */
function shouldShowOnDashboard(task: Task) {
  if (task.status === "concluida") return false;

  const taskIsToday = !!task.dueDate && isToday(task.dueDate);
  const taskIsPending = task.status === "pendente";

  return taskIsToday || taskIsPending;
}

function TaskRow({
  task,
  onToggleComplete,
}: {
  task: Task;
  onToggleComplete: () => void;
}) {
  const priorityTone =
    task.priority === "alta"
      ? "danger"
      : task.priority === "media"
        ? "warning"
        : "neutral";

  const categoryTone =
    task.category === "trabalho"
      ? "info"
      : task.category === "pessoal"
        ? "success"
        : "neutral";

  const isInProgress = task.status === "em_progresso";
  const isDone = task.status === "concluida";
  const overdue = !isDone && isOverdue(task.dueDate);

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md">
      {!isDone ? (
        <div
          className={cn(
            "absolute left-0 top-0 h-full w-1.5",
            overdue
              ? "bg-rose-600"
              : isInProgress
                ? "bg-blue-500"
                : "bg-amber-500",
          )}
        />
      ) : null}

      <div className={cn("flex items-start gap-3", !isDone ? "pl-2" : "")}>
        <button
          type="button"
          onClick={onToggleComplete}
          className="mt-0.5 grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-2xl bg-slate-50 ring-1 ring-slate-200 transition hover:bg-white"
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
                overdue
                  ? "text-rose-500"
                  : isInProgress
                    ? "text-blue-500"
                    : "text-amber-500",
              )}
            />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold text-slate-900">
              {task.title}
            </p>

            <div className="flex flex-wrap items-center gap-2">
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
                  {task.pomodoroCompleted}/{task.pomodoroEstimated}
                </span>
              </Badge>

              {overdue ? (
                <Badge tone="danger">atrasada</Badge>
              ) : (
                <Badge tone={isDone ? "success" : isInProgress ? "info" : "warning"}>
                  {isDone
                    ? "concluída"
                    : isInProgress
                      ? "em progresso"
                      : "pendente"}
                </Badge>
              )}
            </div>
          </div>

          {typeof task.progress === "number" ? (
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1">
                <ProgressBar value={task.progress} />
              </div>
              <span className="text-xs font-medium text-slate-600">
                {task.progress}%
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function DashboardEmptyState({
  onCreateTask,
  onStartPomodoro,
}: {
  onCreateTask: () => void;
  onStartPomodoro: () => void;
}) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-10 shadow-sm sm:px-10 sm:py-14">
      <div className="mx-auto flex max-w-xl flex-col items-center text-center">
        <div className="grid h-20 w-20 place-items-center rounded-full bg-slate-100 ring-8 ring-slate-50">
          <CheckCircle2 className="h-8 w-8 text-slate-500" />
        </div>

        <h3 className="mt-6 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
          Nenhuma tarefa para hoje
        </h3>

        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 sm:text-base">
          Você está com o painel livre no momento. Crie uma nova tarefa para
          começar a produzir ou inicie uma sessão de foco.
        </p>

        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onCreateTask}
            className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-slate-300 hover:bg-slate-100 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Criar Tarefa
          </button>

          <button
            type="button"
            onClick={onStartPomodoro}
            className="inline-flex cursor-pointer items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <Play className="h-4 w-4" />
            Iniciar Pomodoro
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FocusFlowDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadDashboardTasks() {
      try {
        setLoadingTasks(true);
        setErrorMessage("");
        const data = await listTasks();
        setTasks(data);
      } catch {
        setErrorMessage("Não foi possível carregar as tarefas do dashboard.");
      } finally {
        setLoadingTasks(false);
      }
    }

    loadDashboardTasks();
  }, []);

  function getGreeting() {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) return "Bom dia";
    if (hour >= 12 && hour < 18) return "Boa tarde";
    return "Boa noite";
  }

  function getTodayLabel() {
    const today = new Date();

    return today.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }

  const userName = useMemo(() => getFirstAndSecondName(user?.name), [user?.name]);
  const todayLabel = getTodayLabel();

  const xpCurrent = 0;
  const xpTotal = 100;
  const xpPct = xpTotal ? (xpCurrent / xpTotal) * 100 : 0;

  /**
   * Aqui ficam SOMENTE as tarefas que devem aparecer no dashboard:
   * - tarefas do dia
   * - tarefas pendentes
   */
  const dashboardTasks = useMemo(() => {
    return tasks.filter(shouldShowOnDashboard);
  }, [tasks]);

  const overdueTasks = useMemo(() => {
    return dashboardTasks.filter(
      (task) =>
        task.status !== "concluida" &&
        !!task.dueDate &&
        isOverdue(task.dueDate),
    );
  }, [dashboardTasks]);

  const todayTasks = useMemo(() => {
    return dashboardTasks.filter((task) => !!task.dueDate && isToday(task.dueDate));
  }, [dashboardTasks]);

  const pendingTasks = useMemo(() => {
    return dashboardTasks.filter((task) => task.status === "pendente");
  }, [dashboardTasks]);

  const inProgressTodayTasks = useMemo(() => {
    return dashboardTasks.filter(
      (task) =>
        task.status === "em_progresso" &&
        !!task.dueDate &&
        isToday(task.dueDate),
    );
  }, [dashboardTasks]);

  const stats = useMemo(() => {
    const completedTodayTasks = tasks.filter(
      (task) => task.status === "concluida" && !!task.completedAt && isToday(task.completedAt),
    );

    const tempoFocadoMin = dashboardTasks.reduce(
      (total, task) => total + task.pomodoroCompleted * 25,
      0,
    );

    const metaDiaTotalMin = 120;
    const metaDiaPct = Math.min(
      100,
      Math.round((tempoFocadoMin / metaDiaTotalMin) * 100),
    );

    return {
      metaDiaPct,
      metaDiaTotalMin,
      tempoFocadoMin,
      concluidasHoje: completedTodayTasks.length,
      pendentesTotal: pendingTasks.length,
      tarefasDoDia: todayTasks.length,
    };
  }, [tasks, dashboardTasks, pendingTasks, todayTasks]);

  const dailyProgressMin = stats.tempoFocadoMin;
  const dailyGoalMin = stats.metaDiaTotalMin;
  const dailyProgressPct = dailyGoalMin
    ? (dailyProgressMin / dailyGoalMin) * 100
    : 0;

  const highlightTasks = useMemo(() => {
    return [...dashboardTasks]
      .sort((a, b) => {
        const getOrder = (task: Task) => {
          if (task.dueDate && isOverdue(task.dueDate)) return 0;
          if (task.status === "pendente") return 1;
          if (task.dueDate && isToday(task.dueDate)) return 2;
          if (task.status === "em_progresso") return 3;
          return 4;
        };

        const diff = getOrder(a) - getOrder(b);
        if (diff !== 0) return diff;

        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      })
      .slice(0, 5);
  }, [dashboardTasks]);

  const focusCard = useMemo(() => {
    const overdueCount = overdueTasks.length;
    const pendingCount = pendingTasks.length;
    const inProgressCount = inProgressTodayTasks.length;
    const todayCount = todayTasks.length;

    if (overdueCount > 0) {
      return {
        title: "Tarefas atrasadas",
        description: `Você tem ${overdueCount} tarefa(s) atrasada(s). Vale priorizar isso agora.`,
        containerClass: "bg-linear-to-r from-rose-600 to-red-700",
        icon: <AlertCircle className="h-6 w-6" />,
      };
    }

    if (pendingCount > 0 && todayCount > 0) {
      return {
        title: "Resumo do dashboard",
        description: `Você tem ${todayCount} tarefa(s) do dia e ${pendingCount} pendente(s).`,
        containerClass: "bg-linear-to-r from-amber-500 to-orange-600",
        icon: <AlertCircle className="h-6 w-6" />,
      };
    }

    if (pendingCount > 0) {
      return {
        title: "Tarefas pendentes",
        description: `Você tem ${pendingCount} tarefa(s) pendente(s) no dashboard.`,
        containerClass: "bg-linear-to-r from-amber-500 to-orange-600",
        icon: <AlertCircle className="h-6 w-6" />,
      };
    }

    if (inProgressCount > 0) {
      return {
        title: "Bom ritmo!",
        description: `Você tem ${inProgressCount} tarefa(s) em progresso para hoje.`,
        containerClass: "bg-linear-to-r from-blue-600 to-indigo-600",
        icon: <Rocket className="h-6 w-6" />,
      };
    }

    return {
      title: "Continue assim!",
      description: "Você não tem tarefas do dia ou pendentes no momento.",
      containerClass: "bg-linear-to-r from-emerald-500 to-green-600",
      icon: <Sparkles className="h-6 w-6" />,
    };
  }, [overdueTasks.length, pendingTasks.length, inProgressTodayTasks.length, todayTasks.length]);

  async function handleCreateTask(
    payload: CreateTaskRequest | UpdateTaskRequest,
  ) {
    try {
      setIsSubmitting(true);
      const newTask = await createTask(payload as CreateTaskRequest);
      setTasks((prev) => [newTask, ...prev]);
      setNewTaskOpen(false);
    } catch {
      alert("Não foi possível criar a tarefa.");
    } finally {
      setIsSubmitting(false);
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
    } catch {
      alert("Não foi possível atualizar a conclusão da tarefa.");
    }
  }

  return (
    <>
      <div className="mb-4 lg:hidden">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {getGreeting()}, {userName}! 👋
        </h1>
        <p className="mt-1 text-sm text-slate-500 capitalize">{todayLabel}</p>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Badge tone="warning">
            <span className="inline-flex items-center gap-1">
              <Flame className="h-4 w-4" />
              {stats.concluidasHoje} dias
            </span>
          </Badge>

          <button
            className="ml-auto inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            type="button"
            onClick={() => setNewTaskOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Nova Tarefa
          </button>
        </div>
      </div>

      <div className="hidden items-start justify-between gap-4 lg:flex">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            {getGreeting()}, {userName}! 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500 capitalize">{todayLabel}</p>
        </div>

        <div className="flex items-center gap-3">
          <Badge tone="warning">
            <span className="inline-flex items-center gap-1">
              <Flame className="h-4 w-4" />
              {stats.concluidasHoje} dias
            </span>
          </Badge>

          <button
            className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            type="button"
            onClick={() => setNewTaskOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Nova Tarefa
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-linear-to-r from-slate-50 to-indigo-50 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <Badge tone="info">
            <span className="inline-flex items-center gap-1">
              <Sparkles className="h-4 w-4" />
              Nível 1
            </span>
          </Badge>
          <p className="text-xs font-medium text-slate-500">
            {xpCurrent}/{xpTotal} XP
          </p>
        </div>

        <div className="mt-3">
          <ProgressBar value={xpPct} />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Meta do Dia"
          value={`${stats.metaDiaPct}%`}
          subtitle={`${dailyProgressMin}/${stats.metaDiaTotalMin} min`}
          icon={<Target className="h-5 w-5" />}
          iconTone="bg-blue-50 text-blue-700"
        />
        <StatCard
          title="Tempo Focado"
          value={`${stats.tempoFocadoMin} min`}
          subtitle="hoje"
          icon={<Clock className="h-5 w-5" />}
          iconTone="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          title="Concluídas"
          value={`${stats.concluidasHoje}`}
          subtitle="hoje"
          icon={<CheckCircle2 className="h-5 w-5" />}
          iconTone="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          title="Pendentes"
          value={`${stats.pendentesTotal}`}
          subtitle="total"
          icon={<Target className="h-5 w-5" />}
          iconTone="bg-amber-50 text-amber-800"
        />
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Progresso Diário
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Meta: {dailyGoalMin} min de foco
            </p>
          </div>

          <button
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-blue-700 ring-1 ring-slate-200 hover:bg-slate-50"
            type="button"
            onClick={() => navigate("/pomodoro")}
          >
            Iniciar Pomodoro <span aria-hidden>→</span>
          </button>
        </div>

        <div className="mt-4">
          <ProgressBar value={dailyProgressPct} />
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>{dailyProgressMin} min</span>
            <span>{dailyGoalMin} min</span>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 p-5 text-white shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-lg font-semibold">Começar a Focar</p>
              <p className="mt-1 text-sm/relaxed text-white/85">
                Inicie uma sessão Pomodoro agora
              </p>
            </div>

            <button
              className="grid h-12 w-12 cursor-pointer place-items-center rounded-full bg-white/15 ring-1 ring-white/25 hover:bg-white/20"
              type="button"
              aria-label="Iniciar"
              onClick={() => navigate("/pomodoro")}
            >
              <Play className="h-6 w-6 fill-white" />
            </button>
          </div>
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        </div>

        <div
          className={cn(
            "relative overflow-hidden rounded-2xl p-5 text-white shadow-sm transition",
            focusCard.containerClass,
          )}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-lg font-semibold">{focusCard.title}</p>
              <p className="mt-1 text-sm/relaxed text-white/85">
                {focusCard.description}
              </p>
            </div>

            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/25">
              {focusCard.icon}
            </div>
          </div>
          <div className="pointer-events-none absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-white/10" />
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">
            Tarefas de Hoje
          </h2>
          <button
            className="cursor-pointer text-sm font-semibold text-blue-700 hover:text-blue-800"
            type="button"
            onClick={() => navigate("/tasks")}
          >
            Ver todas <span aria-hidden>→</span>
          </button>
        </div>

        {loadingTasks ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
            Carregando tarefas...
          </div>
        ) : errorMessage ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-sm">
            {errorMessage}
          </div>
        ) : highlightTasks.length === 0 ? (
          <DashboardEmptyState
            onCreateTask={() => setNewTaskOpen(true)}
            onStartPomodoro={() => navigate("/pomodoro")}
          />
        ) : (
          <div className="space-y-3">
            {highlightTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggleComplete={() => handleToggleComplete(task)}
              />
            ))}
          </div>
        )}
      </div>

      <CreateTaskModal
        open={newTaskOpen}
        onClose={() => setNewTaskOpen(false)}
        onSubmit={handleCreateTask}
        mode="create"
        isSubmitting={isSubmitting}
      />
    </>
  );
}