import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Clock3,
  AlertTriangle,
  CheckCircle2,
  Gift,
  Coins,
  Trophy,
  Flame,
  Zap,
} from "lucide-react";

import { listTasks, type Task } from "@/services/tasks";
import { useGameStore } from "@/store/useGameStore";

type NotificationType =
  | "task_overdue"
  | "task_due_today"
  | "daily_goal_completed"
  | "chest_ready"
  | "focus_coins_ready"
  | "level_up"
  | "streak_warning"
  | "no_focus_today"
  | "good_progress_today"
  | "streak_congrats";

type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  createdAt: string;
};

function getTodayBounds() {
  const now = new Date();

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function isDueToday(dateString?: string | null) {
  if (!dateString) return false;

  const dueDate = new Date(dateString);
  const { start, end } = getTodayBounds();

  return dueDate >= start && dueDate <= end;
}

function isOverdue(dateString?: string | null) {
  if (!dateString) return false;

  const dueDate = new Date(dateString);
  const { start } = getTodayBounds();

  return dueDate < start;
}

function NotificationIcon({ type }: { type: NotificationType }) {
  switch (type) {
    case "task_overdue":
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    case "task_due_today":
      return <Clock3 className="h-5 w-5 text-amber-500" />;
    case "daily_goal_completed":
      return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
    case "chest_ready":
      return <Gift className="h-5 w-5 text-violet-500" />;
    case "focus_coins_ready":
      return <Coins className="h-5 w-5 text-yellow-500" />;
    case "level_up":
      return <Trophy className="h-5 w-5 text-blue-500" />;
    case "streak_warning":
      return <AlertTriangle className="h-5 w-5 text-orange-500" />;
    case "no_focus_today":
      return <Bell className="h-5 w-5 text-slate-500" />;
    case "good_progress_today":
      return <Zap className="h-5 w-5 text-cyan-500" />;
    case "streak_congrats":
      return <Flame className="h-5 w-5 text-pink-500" />;
    default:
      return <Bell className="h-5 w-5 text-[var(--ff-primary)]" />;
  }
}

function NotificationCard({ notification }: { notification: AppNotification }) {
  return (
    <div className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface)] p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--ff-surface-soft)]">
          <NotificationIcon type={notification.type} />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-[var(--ff-text)]">{notification.title}</h3>
          <p className="mt-1 text-sm text-[var(--ff-text-soft)]">
            {notification.description}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const { stats, fetchStatus } = useGameStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        await fetchStatus();
        const taskList = await listTasks();
        setTasks(taskList);
      } catch (error) {
        console.error("Erro ao carregar notificações", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [fetchStatus]);

  const notifications = useMemo<AppNotification[]>(() => {
    const items: AppNotification[] = [];
    const nowIso = new Date().toISOString();

    for (const task of tasks) {
      if (task.status === "concluida") continue;

      if (isOverdue(task.dueDate)) {
        items.push({
          id: `task-overdue-${task.id}`,
          type: "task_overdue",
          title: "Tarefa atrasada",
          description: `A tarefa "${task.title}" está atrasada.`,
          createdAt: task.updatedAt || task.createdAt || nowIso,
        });
        continue;
      }

      if (isDueToday(task.dueDate)) {
        items.push({
          id: `task-due-today-${task.id}`,
          type: "task_due_today",
          title: "Tarefa vence hoje",
          description: `A tarefa "${task.title}" vence hoje.`,
          createdAt: task.dueDate || task.updatedAt || task.createdAt || nowIso,
        });
      }
    }

    if (stats) {
      if (stats.daily_goal_progress >= 100) {
        items.push({
          id: "daily-goal-completed",
          type: "daily_goal_completed",
          title: "Meta diária concluída",
          description: "Parabéns! Você cumpriu sua meta diária de foco.",
          createdAt: nowIso,
        });
      }

      if (stats.pending_focus_minutes > 0) {
        items.push({
          id: "focus-coins-ready",
          type: "focus_coins_ready",
          title: "Minutos prontos para moedas",
          description: `Você tem ${stats.pending_focus_minutes} min de foco disponíveis para converter em moedas.`,
          createdAt: nowIso,
        });
      }

      const chests = Array.isArray(stats.chests) ? stats.chests : [];
      for (const chest of chests) {
        if (chest.ready_to_claim) {
          items.push({
            id: `chest-${chest.key}`,
            type: "chest_ready",
            title: "Baú disponível",
            description: `Seu baú ${chest.type_label.toLowerCase()} está disponível para coleta.`,
            createdAt: nowIso,
          });
        }
      }

      items.push({
        id: `level-current-${stats.level}`,
        type: "level_up",
        title: `Nível atual: ${stats.level}`,
        description: "Continue focando para subir de nível e desbloquear novas recompensas.",
        createdAt: nowIso,
      });

      if (stats.daily_goal_progress === 0) {
        items.push({
          id: "no-focus-today",
          type: "no_focus_today",
          title: "Você ainda não focou hoje",
          description: "Comece uma sessão de foco para iniciar seu progresso diário.",
          createdAt: nowIso,
        });
      }

      if (stats.daily_goal_progress >= 50 && stats.daily_goal_progress < 100) {
        items.push({
          id: "good-progress-today",
          type: "good_progress_today",
          title: "Você já avançou bem hoje",
          description: `Você já concluiu ${Math.round(stats.daily_goal_progress)}% da meta diária.`,
          createdAt: nowIso,
        });
      }

      if (stats.streak > 0 && stats.daily_goal_progress === 0) {
        items.push({
          id: "streak-warning",
          type: "streak_warning",
          title: "Sua sequência está em risco",
          description: `Você está com ${stats.streak} dia(s) de sequência. Faça uma sessão hoje para não perder.`,
          createdAt: nowIso,
        });
      }

      if (stats.streak > 0 && stats.daily_goal_progress > 0) {
        items.push({
          id: "streak-congrats",
          type: "streak_congrats",
          title: "Parabéns pela sua sequência",
          description: `Você mantém uma sequência de ${stats.streak} dia(s). Continue assim!`,
          createdAt: nowIso,
        });
      }
    }

    return items.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [tasks, stats]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      <div className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface)] p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--ff-primary-soft)] text-[var(--ff-primary)]">
            <Bell className="h-5 w-5" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-[var(--ff-text)]">Notificações</h1>
            <p className="mt-1 text-sm text-[var(--ff-text-soft)]">
              Acompanhe avisos de tarefas, gamificação e engajamento.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface)] p-8 text-center text-sm text-[var(--ff-text-soft)] shadow-sm">
          Carregando notificações...
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[var(--ff-border)] bg-[var(--ff-surface-soft)] p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-[var(--ff-primary-soft)] text-[var(--ff-primary)]">
            <Clock3 className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-[var(--ff-text)]">
            Nenhuma notificação no momento
          </h2>
          <p className="mt-2 text-sm text-[var(--ff-text-soft)]">
            Quando houver tarefas, metas ou recompensas importantes, elas aparecerão aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <NotificationCard key={notification.id} notification={notification} />
          ))}
        </div>
      )}
    </div>
  );
}