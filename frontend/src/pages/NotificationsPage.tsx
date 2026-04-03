import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
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
  CheckCheck,
  MailOpen,
  CircleAlert,
  Trash2,
  Filter,
} from "lucide-react";

import { notificationsService } from "@/services/notifications";
import type { AppNotification, NotificationType } from "@/types/notification";

type FilterKey = "all" | "unread" | "high";

function emitNotificationsChanged() {
  window.dispatchEvent(new Event("notifications:changed"));
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
      return <CircleAlert className="h-5 w-5 text-orange-500" />;
    case "no_focus_today":
      return <Bell className="h-5 w-5 text-slate-500" />;
    case "good_progress_today":
      return <Zap className="h-5 w-5 text-cyan-500" />;
    case "streak_congrats":
      return <Flame className="h-5 w-5 text-pink-500" />;
    case "task_completed":
      return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
    default:
      return <Bell className="h-5 w-5 text-(--ff-primary)" />;
  }
}

function getPriorityLabel(priority: AppNotification["priority"]) {
  switch (priority) {
    case "high":
      return "Alta";
    case "medium":
      return "Média";
    case "low":
      return "Baixa";
    default:
      return "Normal";
  }
}

function formatNotificationDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
}

function PriorityBadge({
  priority,
}: {
  priority: AppNotification["priority"];
}) {
  const classes =
    priority === "high"
      ? "border-red-200 bg-red-100 text-red-700"
      : priority === "medium"
        ? "border-amber-200 bg-amber-100 text-amber-700"
        : "border-slate-200 bg-slate-100 text-slate-700";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${classes}`}
    >
      Prioridade {getPriorityLabel(priority)}
    </span>
  );
}

function FilterButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={[
        "inline-flex cursor-pointer items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition-colors",
        active
          ? "border-[var(--ff-primary)] bg-[var(--ff-primary-soft)] text-[var(--ff-primary)]"
          : "border-[var(--ff-border)] bg-[var(--ff-surface-soft)] text-[var(--ff-text)] hover:bg-[var(--ff-surface)] hover:text-[var(--ff-text)]",
      ].join(" ")}
    >
      {children}
    </motion.button>
  );
}

// Variantes de animação para os cards devidamente tipadas
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
};

function NotificationCard({
  notification,
  onMarkAsRead,
  onMarkAsUnread,
  onDelete,
}: {
  notification: AppNotification;
  onMarkAsRead: (id: string | number) => void;
  onMarkAsUnread: (id: string | number) => void;
  onDelete: (id: string | number) => void;
}) {
  return (
    <motion.div
      layout
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={`rounded-3xl border p-5 shadow-sm transition-colors duration-300 ${
        notification.isRead
          ? "border-(--ff-border) bg-(--ff-surface) opacity-70"
          : "border-(--ff-primary-soft) bg-(--ff-surface)"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="relative grid h-11 w-11 place-items-center rounded-2xl bg-(--ff-surface-soft)">
          <NotificationIcon type={notification.type} />
          <AnimatePresence>
            {!notification.isRead && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"
              />
            )}
          </AnimatePresence>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h3 className="font-semibold text-(--ff-text)">
                {notification.title}
              </h3>

              <p className="mt-1 text-sm text-(--ff-text-soft)">
                {notification.description}
              </p>
            </div>

            <PriorityBadge priority={notification.priority} />
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs font-medium text-(--ff-text-soft)">
              {formatNotificationDate(notification.createdAt)}
            </span>

            <div className="flex flex-wrap gap-2">
              {!notification.isRead ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => onMarkAsRead(notification.id)}
                  className="cursor-pointer inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                >
                  <MailOpen className="h-4 w-4" />
                  Marcar como lida
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => onMarkAsUnread(notification.id)}
                  className="cursor-pointer inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                >
                  <Bell className="h-4 w-4" />
                  Marcar como não lida
                </motion.button>
              )}

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => onDelete(notification.id)}
                className="cursor-pointer inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100"
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Variantes para o contêiner da lista (faz o efeito cascata) tipadas
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08 // Tempo entre a animação de cada item
    }
  }
};

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  async function loadNotifications() {
    try {
      setLoading(true);
      const data = await notificationsService.list();
      setNotifications(data.items ?? []);
      emitNotificationsChanged();
    } catch (error) {
      console.error("Erro ao carregar notificações", error);
      setNotifications([]);
      emitNotificationsChanged();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadNotifications();
  }, []);

  const unreadCount = useMemo(() => {
    return notifications.filter((item) => !item.isRead).length;
  }, [notifications]);

  const visibleNotifications = useMemo(() => {
    if (activeFilter === "unread") {
      return notifications.filter((item) => !item.isRead);
    }

    if (activeFilter === "high") {
      return notifications.filter((item) => item.priority === "high");
    }

    return notifications;
  }, [notifications, activeFilter]);

  async function handleMarkAsRead(id: string | number) {
    const now = new Date().toISOString();

    setNotifications((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isRead: true, readAt: now } : item
      )
    );
    emitNotificationsChanged();

    if (typeof id !== "number") return;

    try {
      await notificationsService.markAsRead(id);
    } catch (error) {
      console.error("Erro ao marcar notificação como lida", error);
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, isRead: false, readAt: null } : item
        )
      );
      emitNotificationsChanged();
    }
  }

  async function handleMarkAsUnread(id: string | number) {
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isRead: false, readAt: null } : item
      )
    );
    emitNotificationsChanged();

    if (typeof id !== "number") return;

    try {
      await notificationsService.markAsUnread(id);
    } catch (error) {
      console.error("Erro ao marcar notificação como não lida", error);
      const now = new Date().toISOString();
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, isRead: true, readAt: now } : item
        )
      );
      emitNotificationsChanged();
    }
  }

  async function handleMarkAllAsRead() {
    const now = new Date().toISOString();
    const previousNotifications = notifications;

    setNotifications((prev) =>
      prev.map((item) => ({
        ...item,
        isRead: true,
        readAt: now,
      }))
    );
    emitNotificationsChanged();

    const hasBackendNotifications = notifications.some(
      (item) => typeof item.id === "number"
    );

    if (!hasBackendNotifications) return;

    try {
      await notificationsService.markAllAsRead();
    } catch (error) {
      console.error("Erro ao marcar todas como lidas", error);
      setNotifications(previousNotifications);
      emitNotificationsChanged();
    }
  }

  async function handleDelete(id: string | number) {
    const previousNotifications = notifications;

    setNotifications((prev) => prev.filter((item) => item.id !== id));
    emitNotificationsChanged();

    if (typeof id !== "number") return;

    try {
      await notificationsService.remove(id);
    } catch (error) {
      console.error("Erro ao excluir notificação", error);
      setNotifications(previousNotifications);
      emitNotificationsChanged();
    }
  }

  async function handleClearRead() {
    const previousNotifications = notifications;

    setNotifications((prev) => prev.filter((item) => !item.isRead));
    emitNotificationsChanged();

    try {
      await notificationsService.clearRead();
    } catch (error) {
      console.error("Erro ao limpar notificações lidas", error);
      setNotifications(previousNotifications);
      emitNotificationsChanged();
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      {/* Header e Controles */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-(--ff-border) bg-(--ff-surface) p-6 shadow-sm"
      >
        <div className="flex flex-col gap-6">
          {/* Topo do Header: Título separado das ações globais */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-(--ff-border) pb-6">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-(--ff-primary-soft) text-(--ff-primary)">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-(--ff-text)">
                    Notificações
                  </h1>
                  <AnimatePresence mode="popLayout">
                    {unreadCount > 0 && (
                      <motion.span 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700"
                      >
                        {unreadCount} novas
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <p className="mt-1 text-sm text-(--ff-text-soft)">
                  Acompanhe alertas importantes e seu progresso diário.
                </p>
              </div>
            </div>

            {/* Ações Globais agrupadas e alinhadas à direita em desktop */}
            <div className="flex flex-wrap items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={notifications.length === 0 || unreadCount === 0}
                className="cursor-pointer inline-flex items-center gap-2 rounded-2xl border border-(--ff-border) bg-(--ff-surface-soft) px-4 py-2 text-sm font-semibold text-(--ff-text) transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCheck className="h-4 w-4" />
                Marcar todas lidas
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={handleClearRead}
                disabled={!notifications.some((item) => item.isRead)}
                className="cursor-pointer inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Limpar lidas
              </motion.button>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-(--ff-text-soft) mr-2">
              <Filter className="h-4 w-4" />
              Filtros:
            </span>

            <FilterButton
              active={activeFilter === "all"}
              onClick={() => setActiveFilter("all")}
            >
              Todas
            </FilterButton>

            <FilterButton
              active={activeFilter === "unread"}
              onClick={() => setActiveFilter("unread")}
            >
              Não lidas
            </FilterButton>

            <FilterButton
              active={activeFilter === "high"}
              onClick={() => setActiveFilter("high")}
            >
              Prioridade alta
            </FilterButton>
          </div>
        </div>
      </motion.div>

      {/* Container de Notificações */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-3xl border border-(--ff-border) bg-(--ff-surface) p-8 text-center text-sm text-(--ff-text-soft) shadow-sm"
          >
            Carregando notificações...
          </motion.div>
        ) : notifications.length === 0 ? (
          <motion.div
            key="empty-all"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="rounded-3xl border border-dashed border-(--ff-border) bg-(--ff-surface) p-10 text-center shadow-sm"
          >
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-(--ff-surface-soft) text-(--ff-text-soft)">
              <Bell className="h-6 w-6" />
            </div>

            <h2 className="mt-4 text-lg font-semibold text-(--ff-text)">
              Nenhuma notificação no momento
            </h2>
            <p className="mt-2 text-sm text-(--ff-text-soft)">
              Quando houver alertas, progresso relevante ou recompensas disponíveis, eles aparecerão aqui.
            </p>
          </motion.div>
        ) : visibleNotifications.length === 0 ? (
          <motion.div
            key="empty-filtered"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="rounded-3xl border border-dashed border-(--ff-border) bg-(--ff-surface) p-10 text-center shadow-sm"
          >
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-(--ff-surface-soft) text-(--ff-text-soft)">
              <Filter className="h-6 w-6" />
            </div>

            <h2 className="mt-4 text-lg font-semibold text-(--ff-text)">
              Nenhuma notificação nesse filtro
            </h2>
            <p className="mt-2 text-sm text-(--ff-text-soft)">
              Tente visualizar todas ou outro filtro disponível.
            </p>
          </motion.div>
        ) : (
          <motion.div 
            key="list" 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            <AnimatePresence initial={false}>
              {visibleNotifications.map((notification) => (
                <NotificationCard
                  key={String(notification.id)}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onMarkAsUnread={handleMarkAsUnread}
                  onDelete={handleDelete}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}