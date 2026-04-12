export type NotificationType =
  | "task_overdue"
  | "task_due_today"
  | "daily_goal_completed"
  | "chest_ready"
  | "focus_coins_ready"
  | "level_up"
  | "streak_warning"
  | "no_focus_today"
  | "good_progress_today"
  | "streak_congrats"
  | "task_completed";

export type NotificationPriority = "low" | "medium" | "high";

export type AppNotification = {
  id: string | number;
  type: NotificationType;
  title: string;
  description: string;
  priority: NotificationPriority;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  expiresAt?: string | null;
  metadata?: Record<string, unknown>;
};