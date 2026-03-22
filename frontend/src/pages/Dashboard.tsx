import { useMemo, useState } from "react";
import {
  Play,
  Flame,
  Plus,
  Sparkles,
  Target,
  Clock,
  CheckCircle2,
} from "lucide-react";

import {
  CreateTaskModal,
  type CreateTaskPayload,
} from "@/components/CreateTaskModal";
import { Badge } from "@/components/common/Badge";
import { ProgressBar } from "@/components/common/ProgressBar";
import { StatCard } from "@/components/common/StatCard";
import { cn } from "@/lib/cn";
import { useAuth } from "@/hooks/useAuth";

type Task = {
  id: string;
  title: string;
  category: string;
  priority: "alta" | "media" | "baixa";
  dueLabel: string;
  pomodoroDone: number;
  pomodoroTotal: number;
  progress?: number;
  status: "pendente" | "concluida";
};

function TaskRow({ task }: { task: Task }) {
  const priorityTone =
    task.priority === "alta"
      ? "danger"
      : task.priority === "media"
        ? "warning"
        : "neutral";

  const isPending = task.status === "pendente";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      {isPending ? (
        <div className="absolute left-0 top-0 h-full w-1.5 bg-rose-500" />
      ) : null}

      <div className={cn("flex items-start gap-3", isPending ? "pl-2" : "")}>
        <div
          className={cn(
            "mt-1 h-5 w-5 rounded-full border-2",
            isPending ? "border-rose-400" : "border-slate-300",
          )}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold text-slate-900">
              {task.title}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="info">
                <span className="inline-flex items-center gap-1">
                  📚 <span className="capitalize">{task.category}</span>
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
                  📅 {task.dueLabel}
                </span>
              </Badge>

              <Badge tone="neutral">
                <span className="inline-flex items-center gap-1">
                  🕒 {task.pomodoroDone}/{task.pomodoroTotal}
                </span>
              </Badge>

              <Badge tone={isPending ? "danger" : "success"}>
                {isPending ? "pendente" : "concluída"}
              </Badge>
            </div>
          </div>

          {typeof task.progress === "number" ? (
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1">
                <ProgressBar value={task.progress} />
              </div>
              <span className="text-xs font-medium text-slate-600">
                {Math.round(task.progress * 100)}%
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function FocusFlowDashboard() {
  const { user } = useAuth();
  const [newTaskOpen, setNewTaskOpen] = useState(false);

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

  const userName = user?.username ?? "Usuário";
  const todayLabel = getTodayLabel();

  const xpCurrent = 0;
  const xpTotal = 100;
  const xpPct = xpTotal ? xpCurrent / xpTotal : 0;

  const stats = useMemo(
    () => ({
      metaDiaPct: 0,
      metaDiaTotalMin: 120,
      tempoFocadoMin: 0,
      concluidasHoje: 0,
      pendentesTotal: 3,
    }),
    [],
  );

  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "1",
      title: "Estudar Cálculo II - Derivadas",
      category: "estudo",
      priority: "alta",
      dueLabel: "24 de fev",
      pomodoroDone: 4,
      pomodoroTotal: 4,
      status: "concluida",
    },
    {
      id: "2",
      title: "Preparar apresentação de TCC",
      category: "estudo",
      priority: "alta",
      dueLabel: "Hoje",
      pomodoroDone: 0,
      pomodoroTotal: 3,
      progress: 1 / 3,
      status: "pendente",
    },
  ]);

  const dailyProgressMin = stats.tempoFocadoMin;
  const dailyGoalMin = stats.metaDiaTotalMin;
  const dailyProgressPct = dailyGoalMin ? dailyProgressMin / dailyGoalMin : 0;

  return (
    <>
      <div className="mb-4 lg:hidden">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {getGreeting()}, {userName}! 👋
        </h1>
        <p className="mt-1 text-sm text-slate-500">{todayLabel}</p>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Badge tone="warning">
            <span className="inline-flex items-center gap-1">
              <Flame className="h-4 w-4" />1 dia
            </span>
          </Badge>

          <button
            className="ml-auto inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
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
          <p className="mt-1 text-sm text-slate-500">{todayLabel}</p>
        </div>

        <div className="flex items-center gap-3">
          <Badge tone="warning">
            <span className="inline-flex items-center gap-1">
              <Flame className="h-4 w-4" />1 dia
            </span>
          </Badge>

          <button
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
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
          subtitle={`0/${stats.metaDiaTotalMin} min`}
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
            <p className="mt-1 text-xs text-slate-500">Meta: 2 horas de foco</p>
          </div>

          <button
            className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-blue-700 ring-1 ring-slate-200 hover:bg-slate-50"
            type="button"
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
              className="grid h-12 w-12 place-items-center rounded-full bg-white/15 ring-1 ring-white/25 hover:bg-white/20"
              type="button"
              aria-label="Iniciar"
            >
              <Play className="h-6 w-6 fill-white" />
            </button>
          </div>
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-emerald-500 to-green-600 p-5 text-white shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-lg font-semibold">Continue assim!</p>
              <p className="mt-1 text-sm/relaxed text-white/85">
                Complete sua primeira tarefa do dia!
              </p>
            </div>

            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/25">
              <Sparkles className="h-6 w-6" />
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
            className="text-sm font-semibold text-blue-700 hover:text-blue-800"
            type="button"
          >
            Ver todas <span aria-hidden>→</span>
          </button>
        </div>

        <div className="space-y-3">
          {tasks.map((t) => (
            <TaskRow key={t.id} task={t} />
          ))}
        </div>
      </div>

      <CreateTaskModal
        open={newTaskOpen}
        onClose={() => setNewTaskOpen(false)}
        onCreate={(payload: CreateTaskPayload) => {
          setTasks((prev) => [
            {
              id: String(Date.now()),
              title: payload.title,
              category: payload.category,
              priority: payload.priority,
              dueLabel: payload.dueLabel,
              pomodoroDone: 0,
              pomodoroTotal: payload.pomodoros,
              progress: 0,
              status: "pendente",
            },
            ...prev,
          ]);
        }}
      />
    </>
  );
}