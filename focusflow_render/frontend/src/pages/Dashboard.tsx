import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Play,
  Flame,
  Plus,
  Sparkles,
  Target,
  Clock,
  CheckCircle2,
  BookOpen,
  Briefcase,
  User,
  Calendar,
  Timer,
  AlertCircle,
  Rocket,
  Star,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { CreateTaskModal } from "@/components/CreateTaskModal";
import { Badge } from "@/components/common/Badge";
import { StatCard } from "@/components/common/StatCard";
import { cn } from "@/lib/cn";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import {
  listTasks,
  createTask,
  type Task,
  type CreateTaskRequest,
  type UpdateTaskRequest,
} from "@/services/tasks";
import { useGameStore } from "@/store/useGameStore";

/* =========================
   Cores Estáticas (Imunes ao Tema)
========================= */
const PRIORITY_COLORS: Record<string, string> = {
  alta: "bg-red-500",
  media: "bg-amber-500",
  baixa: "bg-slate-400",
};

const CATEGORY_COLORS: Record<string, string> = {
  trabalho: "text-blue-500",
  pessoal: "text-emerald-500",
  estudo: "text-purple-500",
};

const CATEGORY_BG_COLORS: Record<string, string> = {
  trabalho: "bg-blue-500",
  pessoal: "bg-emerald-500",
  estudo: "bg-purple-500",
};

type PomodoroSession = {
  id: number;
  task: number | null;
  task_title?: string;
  session_type: "focus" | "short_break" | "long_break";
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
  active_days: number;
  running_session: PomodoroSession | null;
};

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
  const colorClass = CATEGORY_COLORS[category as string] || "text-slate-500";

  if (category === "trabalho") return <Briefcase className={cn("h-4 w-4", colorClass)} />;
  if (category === "pessoal") return <User className={cn("h-4 w-4", colorClass)} />;
  return <BookOpen className={cn("h-4 w-4", colorClass)} />;
}

function isToday(dateString?: string | null) {
  if (!dateString) return false;

  const date = new Date(dateString);
  const today = new Date();

  return date.toDateString() === today.toDateString();
}

/**
 * Regras do dashboard:
 * - mostrar tarefas do dia
 * - mostrar tarefas atrasadas (pendentes)
 * - nunca mostrar concluídas
 */
function shouldShowOnDashboard(task: Task) {
  if (task.status === "concluida") return false;

  const taskIsToday = !!task.dueDate && isToday(task.dueDate);
  const isOverdue = task.status === "pendente";

  return taskIsToday || isOverdue;
}

function TaskRow({ task }: { task: Task }) {
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

  const isDone = task.status === "concluida";
  const isOverdue = task.status === "pendente";
  const isActive = task.status === "em_andamento";

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border p-4 shadow-sm transition-all hover:shadow-md",
        isOverdue ? "border-red-500/30 bg-red-500/10" : "border-slate-200 bg-white",
      )}
    >
      {!isDone ? (
        <motion.div
          layoutId={`indicator-${task.id}`}
          className={cn(
            "absolute left-0 top-0 h-full w-1.5",
            isOverdue 
              ? "bg-red-500" 
              : CATEGORY_BG_COLORS[task.category as string] || "bg-blue-500",
          )}
        />
      ) : null}

      <div className="flex items-start gap-3 pl-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold text-slate-900 transition-colors">
                {task.title}
              </p>
              {isOverdue && (
                <span title="Atrasada" className="flex shrink-0 items-center">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                </span>
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2 sm:mt-0">
              <Badge tone={categoryTone}>
                <span className="inline-flex items-center gap-1">
                  <CategoryIcon category={task.category} />
                  <span className="capitalize">{task.category}</span>
                </span>
              </Badge>

              <Badge tone={priorityTone}>
                <span className="inline-flex items-center gap-1">
                  <span 
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      PRIORITY_COLORS[task.priority as string] || "bg-current opacity-70"
                    )} 
                  />
                  {task.priority}
                </span>
              </Badge>

              <Badge tone={isOverdue ? "danger" : "neutral"}>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {isOverdue ? `Atrasada: ${task.dueLabel}` : task.dueLabel}
                </span>
              </Badge>

              <Badge tone={isActive ? "info" : "neutral"}>
                <span className="inline-flex items-center gap-1">
                  <Timer className="h-4 w-4" />
                  {task.pomodoroCompleted}/{task.pomodoroEstimated}
                </span>
              </Badge>
            </div>
          </div>

          {typeof task.progress === "number" ? (
            <div className="mt-4 flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 ring-1 ring-inset ring-slate-200/50">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.max(0, Math.min(100, task.progress))}%`,
                  }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={cn(
                    "h-full rounded-full",
                    isDone ? "bg-emerald-500" : "bg-blue-500",
                  )}
                />
              </div>
              <span className="w-8 text-right text-xs font-bold text-slate-600">
                {Math.round(task.progress)}%
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
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className="rounded-[28px] border border-slate-200 bg-white px-6 py-10 shadow-sm sm:px-10 sm:py-14"
    >
      <div className="mx-auto flex max-w-xl flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className="grid h-20 w-20 place-items-center rounded-full bg-slate-100 ring-8 ring-slate-50"
        >
          <CheckCircle2 className="h-8 w-8 text-slate-500" />
        </motion.div>

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
            className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-slate-300 hover:bg-slate-100 hover:scale-105 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Criar Tarefa
          </button>

          <button
            type="button"
            onClick={onStartPomodoro}
            className="inline-flex cursor-pointer items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 hover:scale-105 active:scale-95"
          >
            <Play className="h-4 w-4" />
            Iniciar Pomodoro
          </button>
        </div>
      </div>
    </motion.div>
  );
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

export default function FocusFlowDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { stats: gameStats, fetchStatus } = useGameStore();

  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  const [pomodoroStats, setPomodoroStats] = useState<PomodoroStats>({
    pomodoros: 0,
    minutes: 0,
    points: 0,
    active_days: 0,
    running_session: null,
  });

  const [loadingPomodoro, setLoadingPomodoro] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // Usamos o useCallback para estabilizar a referência da função e usá-la no useEffect
  const loadDashboardData = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) {
        setLoadingTasks(true);
        setLoadingPomodoro(true);
      }
      setErrorMessage("");

      const [tasksData, pomodoroResponse] = await Promise.all([
        listTasks(),
        api.get<PomodoroStats>("/pomodoro/stats/"),
      ]);

      setTasks(tasksData);
      setPomodoroStats(pomodoroResponse.data);
    } catch {
      if (!isBackground) {
        setErrorMessage("Não foi possível carregar os dados do dashboard.");
      }
    } finally {
      if (!isBackground) {
        setLoadingTasks(false);
        setLoadingPomodoro(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    loadDashboardData(); // Carregamento inicial

    // 1. Polling Automático a cada 30 segundos
    const intervalId = setInterval(() => {
      loadDashboardData(true); // true = isBackground (não pisca a tela)
    }, 30000);

    // 2. Listener para atualizar quando o usuário voltar para a aba
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchStatus();
        loadDashboardData(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Limpeza dos eventos quando o componente for desmontado
    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchStatus, loadDashboardData]);

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

  const xpCurrent = gameStats?.current_xp || 0;
  const xpTotal = gameStats?.xp_to_next_level || 100;
  const userLevel = gameStats?.level || 1;
  const xpPct = xpTotal ? Math.min((xpCurrent / xpTotal) * 100, 100) : 0;

  const dashboardTasks = useMemo(() => {
    return tasks.filter(shouldShowOnDashboard);
  }, [tasks]);

  const overdueTasks = useMemo(() => {
    return dashboardTasks.filter((task) => task.status === "pendente");
  }, [dashboardTasks]);

  const todayTasks = useMemo(() => {
    return dashboardTasks.filter((task) => !!task.dueDate && isToday(task.dueDate));
  }, [dashboardTasks]);

  const inProgressTodayTasks = useMemo(() => {
    return dashboardTasks.filter(
      (task) =>
        task.status === "em_andamento" &&
        !!task.dueDate &&
        isToday(task.dueDate),
    );
  }, [dashboardTasks]);

  const stats = useMemo(() => {
    const completedTodayTasks = tasks.filter(
      (task) =>
        task.status === "concluida" &&
        !!task.completedAt &&
        isToday(task.completedAt),
    );

    const tempoFocadoReal = pomodoroStats.minutes ?? 0;
    const pomodorosConcluidos = pomodoroStats.pomodoros ?? 0;
    const pontos = pomodoroStats.points ?? 0;

    const metaDiaTotalMin = gameStats?.daily_goal_minutes ?? 120;
    const tempoFocadoMeta = Math.min(tempoFocadoReal, metaDiaTotalMin);

    const metaDiaPct =
      metaDiaTotalMin > 0
        ? Math.round((tempoFocadoMeta / metaDiaTotalMin) * 100)
        : 0;

    return {
      metaDiaPct,
      metaDiaTotalMin,
      tempoFocadoMin: tempoFocadoReal,
      tempoFocadoMeta,
      pomodorosConcluidos,
      pontos,
      concluidasHoje: completedTodayTasks.length,
      pendentesTotal: overdueTasks.length,
      tarefasDoDia: todayTasks.length,
    };
  }, [tasks, gameStats, pomodoroStats, overdueTasks, todayTasks]);

  const dailyProgressMin = stats.tempoFocadoMeta;
  const dailyGoalMin = stats.metaDiaTotalMin;
  const dailyProgressPct = stats.metaDiaPct;

  const highlightTasks = useMemo(() => {
    return [...dashboardTasks]
      .sort((a, b) => {
        const getOrder = (task: Task) => {
          if (task.status === "pendente") return 0;
          if (task.dueDate && isToday(task.dueDate)) return 1;
          if (task.status === "em_andamento") return 2;
          return 3;
        };

        const diff = getOrder(a) - getOrder(b);
        if (diff !== 0) return diff;

        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      })
      .slice(0, 5);
  }, [dashboardTasks]);

  const focusCard = useMemo(() => {
    const overdueCount = overdueTasks.length;
    const inProgressCount = inProgressTodayTasks.length;
    const todayCount = todayTasks.length;

    if (overdueCount > 0) {
      return {
        title: "Atenção: Atrasos",
        description: `Você tem ${overdueCount} tarefa(s) atrasada(s). Vale priorizar isso agora.`,
        containerClass: "bg-gradient-to-r from-rose-600 to-red-700",
        icon: <AlertCircle className="h-6 w-6" />,
      };
    }

    if (inProgressCount > 0) {
      return {
        title: "Bom ritmo!",
        description: `Você tem ${inProgressCount} tarefa(s) em andamento para hoje.`,
        containerClass: "bg-gradient-to-r from-blue-600 to-indigo-600",
        icon: <Rocket className="h-6 w-6" />,
      };
    }

    if (todayCount > 0) {
      return {
        title: "Foco no Dia",
        description: `Você tem ${todayCount} tarefa(s) planejadas para hoje.`,
        containerClass: "bg-gradient-to-r from-amber-500 to-orange-600",
        icon: <Target className="h-6 w-6" />,
      };
    }

    return {
      title: "Tudo tranquilo!",
      description: "Você não tem tarefas atrasadas ou urgentes no momento.",
      containerClass: "bg-gradient-to-r from-emerald-500 to-green-600",
      icon: <Sparkles className="h-6 w-6" />,
    };
  }, [overdueTasks.length, inProgressTodayTasks.length, todayTasks.length]);

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

  const isLoading = loadingTasks || loadingPomodoro;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="mb-4 lg:hidden">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {getGreeting()}, {userName}! 👋
          </h1>
          <p className="mt-1 text-sm capitalize text-slate-500">{todayLabel}</p>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Badge tone="warning">
              <span className="inline-flex items-center gap-1">
                <Flame className="h-4 w-4" />
                {pomodoroStats.active_days} dias com foco
              </span>
            </Badge>

            <button
              className="ml-auto inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:scale-105 active:scale-95"
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
            <p className="mt-1 text-sm capitalize text-slate-500">{todayLabel}</p>
          </div>

          <div className="flex items-center gap-3">
            <Badge tone="warning">
              <span className="inline-flex items-center gap-1">
                <Flame className="h-4 w-4" />
                {pomodoroStats.active_days} dias com foco
              </span>
            </Badge>

            <button
              className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:scale-105 active:scale-95"
              type="button"
              onClick={() => setNewTaskOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Nova Tarefa
            </button>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-4 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface)] p-4 sm:p-5"
      >
        <div className="flex items-center justify-between gap-3">
          <Badge tone="info">
            <span className="inline-flex items-center gap-1">
              <Star className="h-4 w-4" />
              Nível {userLevel}
            </span>
          </Badge>
          <p className="tabular-nums text-xs font-medium text-[var(--ff-text-muted)]">
            {xpCurrent} / {xpTotal} XP
          </p>
        </div>

        <div className="mt-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--ff-surface-soft)] ring-1 ring-inset ring-[var(--ff-border)]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(0, Math.min(100, xpPct))}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="h-full rounded-full bg-[var(--ff-primary)]"
            />
          </div>
        </div>
      </motion.div>

      {isLoading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-5 space-y-6"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-25 animate-pulse rounded-2xl bg-slate-100/80 ring-1 ring-slate-200/50"
              />
            ))}
          </div>
          <div className="h-25 animate-pulse rounded-2xl bg-slate-100/80 ring-1 ring-slate-200/50" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="h-30 animate-pulse rounded-2xl bg-slate-100/80 ring-1 ring-slate-200/50" />
            <div className="h-30 animate-pulse rounded-2xl bg-slate-100/80 ring-1 ring-slate-200/50" />
          </div>
        </motion.div>
      ) : (
        <>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            {[
              {
                title: "Meta do Dia",
                value: `${stats.metaDiaPct}%`,
                subtitle: `${stats.tempoFocadoMeta}/${stats.metaDiaTotalMin} min`,
                icon: <Target className="h-5 w-5" />,
                tone: "bg-blue-50 text-blue-700",
              },
              {
                title: "Tempo Focado",
                value: `${stats.tempoFocadoMin} min`,
                subtitle: "hoje",
                icon: <Clock className="h-5 w-5" />,
                tone: "bg-emerald-50 text-emerald-700",
              },
              {
                title: "Concluídas",
                value: `${stats.concluidasHoje}`,
                subtitle: "hoje",
                icon: <CheckCircle2 className="h-5 w-5" />,
                tone: "bg-emerald-50 text-emerald-700",
              },
              {
                title: "Atrasadas",
                value: `${stats.pendentesTotal}`,
                subtitle: "total",
                icon: <AlertCircle className="h-5 w-5" />,
                tone: "bg-rose-50 text-rose-700",
              },
            ].map((stat, i) => (
              <motion.div key={i} variants={itemVariants}>
                <StatCard
                  title={stat.title}
                  value={stat.value}
                  subtitle={stat.subtitle}
                  icon={stat.icon}
                  iconTone={stat.tone}
                />
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
          >
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
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-blue-700 ring-1 ring-slate-200 transition hover:bg-slate-50 hover:scale-105 active:scale-95"
                type="button"
                onClick={() => navigate("/pomodoropage")}
              >
                Iniciar Pomodoro <span aria-hidden>→</span>
              </button>
            </div>

            <div className="mt-4">
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 ring-1 ring-inset ring-slate-200/50">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.max(0, Math.min(100, dailyProgressPct))}%`,
                  }}
                  transition={{ duration: 1.5, ease: "easeOut", delay: 0.4 }}
                  className="h-full rounded-full bg-blue-500"
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span>{dailyProgressMin} min</span>
                <span>{dailyGoalMin} min</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2"
          >
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -4, scale: 1.01 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white shadow-sm transition-transform hover:shadow-md"
            >
              <div className="relative z-10 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-lg font-semibold">Começar a Focar</p>
                  <p className="mt-1 text-sm/relaxed text-white/85">
                    Inicie uma sessão Pomodoro agora
                  </p>
                </div>

                <button
                  className="grid h-14 w-14 cursor-pointer place-items-center rounded-full bg-white/15 ring-1 ring-white/25 transition hover:bg-white/25 hover:scale-110 active:scale-95"
                  type="button"
                  aria-label="Iniciar"
                  onClick={() => navigate("/pomodoropage")}
                >
                  <Play className="ml-1 h-6 w-6 fill-white" />
                </button>
              </div>
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 transition-transform duration-700 hover:scale-110" />
            </motion.div>

            <motion.div
              variants={itemVariants}
              whileHover={{ y: -4, scale: 1.01 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className={cn(
                "relative overflow-hidden rounded-2xl p-5 text-white shadow-sm transition hover:shadow-md",
                focusCard.containerClass,
              )}
            >
              <div className="relative z-10 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-lg font-semibold">{focusCard.title}</p>
                  <p className="mt-1 text-sm/relaxed text-white/85">
                    {focusCard.description}
                  </p>
                </div>

                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/25">
                  {focusCard.icon}
                </div>
              </div>
              <div className="pointer-events-none absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-white/10" />
            </motion.div>
          </motion.div>

          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">
                Prioridades
              </h2>
              <button
                className="cursor-pointer text-sm font-semibold text-blue-700 transition hover:text-blue-800 hover:underline"
                type="button"
                onClick={() => navigate("/tasks")}
              >
                Ver todas <span aria-hidden>→</span>
              </button>
            </div>

            {errorMessage ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-sm"
              >
                {errorMessage}
              </motion.div>
            ) : highlightTasks.length === 0 ? (
              <DashboardEmptyState
                onCreateTask={() => setNewTaskOpen(true)}
                onStartPomodoro={() => navigate("/pomodoropage")}
              />
            ) : (
              <motion.div layout className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {highlightTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                      transition={{ duration: 0.3, type: "spring", bounce: 0.3 }}
                    >
                      <TaskRow task={task} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </>
      )}

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