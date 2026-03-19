import React from "react";
import {
  LayoutDashboard,
  CheckSquare,
  Timer,
  BarChart3,
  Trophy,
  Bell,
  LogOut,
} from "lucide-react";

import { cn } from "@/lib/cn";

export type NavKey =
  | "dashboard"
  | "tasks"
  | "pomodoro"
  | "stats"
  | "achievements"
  | "notifications"
  | "logout";

const MAIN_NAV: Array<{ key: NavKey; label: string; icon: React.ReactNode }> = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    key: "tasks",
    label: "Tarefas",
    icon: <CheckSquare className="h-5 w-5" />,
  },
  {
    key: "pomodoro",
    label: "Pomodoro",
    icon: <Timer className="h-5 w-5" />,
  },
  {
    key: "stats",
    label: "Estatísticas",
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    key: "achievements",
    label: "Conquistas",
    icon: <Trophy className="h-5 w-5" />,
  },
];

function SidebarItem({
  active,
  icon,
  label,
  onClick,
  danger,
}: {
  active?: boolean;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  danger?: boolean;
}) {
  return (
    <button
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
        active
          ? "bg-blue-50 text-blue-700"
          : danger
            ? "text-rose-600 hover:bg-rose-50"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
      )}
      type="button"
      onClick={onClick}
    >
      <span
        className={cn(
          "grid h-9 w-9 place-items-center rounded-xl",
          active ? "bg-white" : danger ? "bg-rose-50" : "bg-slate-100",
        )}
      >
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </button>
  );
}

export function SidebarNav({
  activeKey,
  onSelect,
}: {
  activeKey: NavKey;
  onSelect?: (key: NavKey) => void;
}) {
  return (
    <>
      {/* MENU PRINCIPAL */}
      <nav className="mt-8 space-y-2">
        {MAIN_NAV.map((item) => (
          <SidebarItem
            key={item.key}
            active={item.key === activeKey}
            icon={item.icon}
            label={item.label}
            onClick={onSelect ? () => onSelect(item.key) : undefined}
          />
        ))}
      </nav>

      {/* AÇÕES DA CONTA */}
      <div className="mt-6 space-y-2 border-t border-slate-200 pt-4">
        <SidebarItem
          icon={<Bell className="h-5 w-5" />}
          label="Notificações"
          onClick={onSelect ? () => onSelect("notifications") : undefined}
        />

        <SidebarItem
          icon={<LogOut className="h-5 w-5" />}
          label="Sair"
          danger
          onClick={onSelect ? () => onSelect("logout") : undefined}
        />
      </div>
    </>
  );
}
