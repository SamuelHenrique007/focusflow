import React, { useEffect } from "react";
import { motion } from "framer-motion"; // <-- Importação adicionada
import {
  LayoutDashboard,
  CheckSquare,
  Timer,
  BarChart3,
  Trophy,
  Bell,
  LogOut,
  Store,
  Settings,
} from "lucide-react";
import { Link } from "react-router-dom";

import { cn } from "@/lib/cn";
import { useGameStore } from "@/store/useGameStore";
import { useAuth } from "@/hooks/useAuth";
import { useAvatarStore } from "@/store/useAvatarStore";
import { useNotificationsStore } from "@/store/useNotificationsStore";

export type NavKey =
  | "dashboard"
  | "tasks"
  | "pomodoro"
  | "stats"
  | "achievements"
  | "store"
  | "notifications"
  | "settings"
  | "logout";

const MAIN_NAV: Array<{ key: NavKey; label: string; icon: React.ReactNode }> = [
  { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { key: "tasks", label: "Tarefas", icon: <CheckSquare className="h-4 w-4" /> },
  { key: "pomodoro", label: "Pomodoro", icon: <Timer className="h-4 w-4" /> },
  { key: "stats", label: "Estatísticas", icon: <BarChart3 className="h-4 w-4" /> },
  { key: "achievements", label: "Desafios e conquistas", icon: <Trophy className="h-4 w-4" /> },
  { key: "store", label: "Loja", icon: <Store className="h-4 w-4" /> },
];

const ROUTES: Record<Exclude<NavKey, "logout">, string> = {
  dashboard: "/dashboard",
  tasks: "/tasks",
  pomodoro: "/pomodoropage",
  stats: "/stats",
  achievements: "/achievements",
  store: "/store",
  notifications: "/notifications",
  settings: "/settings",
};

// --- VARIÁVEIS DE ANIMAÇÃO ---
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05, // Atraso entre a entrada de cada item
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 }, // Começa invisível e levemente para a esquerda
  show: { opacity: 1, x: 0 },     // Termina visível e na posição original
};
// ------------------------------

function getFirstAndSecondName(name?: string) {
  if (!name?.trim()) return "Usuário";

  const connectors = ["de", "da", "do", "dos", "das", "e"];
  const parts = name
    .trim()
    .split(" ")
    .filter((word) => word && !connectors.includes(word.toLowerCase()));

  if (parts.length === 0) return "Usuário";
  if (parts.length === 1) return parts[0];

  return `${parts[0]} ${parts[1]}`;
}

function SidebarItem({
  active,
  icon,
  label,
  to,
  onClick,
  danger,
  showIndicator,
}: {
  active?: boolean;
  icon: React.ReactNode;
  label: string;
  to?: string;
  onClick?: () => void;
  danger?: boolean;
  showIndicator?: boolean;
}) {
  const content = (
    <>
      <span
        className={cn(
          "relative grid h-8 w-8 place-items-center rounded-xl transition-colors",
          active ? "bg-white shadow-sm" : danger ? "bg-rose-50" : "bg-slate-100"
        )}
      >
        {icon}
        {showIndicator && (
          <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
        )}
      </span>
      <span className="truncate">{label}</span>
    </>
  );

  const classes = cn(
    "flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
    active
      ? "bg-blue-50 text-blue-700"
      : danger
        ? "text-rose-600 hover:bg-rose-50"
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
  );

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ scale: 1.02, x: 4 }} // Efeito de hover: cresce um pouco e move para direita
      whileTap={{ scale: 0.98 }}         // Efeito de clique: "afunda" o botão
      className="w-full"
    >
      {to ? (
        <Link to={to} className={classes} onClick={onClick}>
          {content}
        </Link>
      ) : (
        <button className={classes} type="button" onClick={onClick}>
          {content}
        </button>
      )}
    </motion.div>
  );
}

function UserAvatar({ size = "sm" }: { size?: "sm" | "md" | "lg" }) {
  const avatar = useAvatarStore((state) => state.equippedAvatar);

  const sizeClasses = {
    sm: "h-10 w-10 text-xl",
    md: "h-14 w-14 text-2xl",
    lg: "h-20 w-20 text-4xl",
  };

  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center rounded-full border border-blue-100 bg-blue-50 shadow-sm",
        sizeClasses[size]
      )}
    >
      <span>{avatar || "🙂"}</span>
    </div>
  );
}

function UserGamerCard() {
  const level = useGameStore((state) => state.stats?.level ?? 1);
  const fetchStatus = useGameStore((state) => state.fetchStatus);
  const { user } = useAuth();
  const loadAvatar = useAvatarStore((state) => state.loadAvatar);

  useEffect(() => {
    void fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    void loadAvatar();
  }, [loadAvatar]);

  const userName = getFirstAndSecondName(user?.name);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.4 }} // Entra logo após os itens do menu
      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-xs hover:shadow-sm transition-shadow cursor-pointer"
    >
      <UserAvatar size="sm" />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm leading-tight font-semibold text-slate-900">
          {userName}
        </span>
        <span className="text-[11px] font-medium text-blue-600">
          Nível: {level}
        </span>
      </div>
    </motion.div>
  );
}

export function SidebarNav({
  activeKey,
  onSelect,
}: {
  activeKey: NavKey;
  onSelect?: (key: NavKey) => void;
}) {
  const hasUnreadNotifications = useNotificationsStore(
    (state) => state.hasUnreadNotifications
  );
  const fetchUnreadCount = useNotificationsStore(
    (state) => state.fetchUnreadCount
  );

  useEffect(() => {
    void fetchUnreadCount();

    const handleWindowFocus = () => {
      void fetchUnreadCount();
    };

    const interval = window.setInterval(() => {
      void fetchUnreadCount();
    }, 5000);

    window.addEventListener("focus", handleWindowFocus);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [fetchUnreadCount]);

  return (
    <div className="flex h-full flex-col justify-between">
      {/* Container Pai gerenciando a cascata de animações */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <nav className="space-y-0.5">
          {MAIN_NAV.map((item) => (
            <SidebarItem
              key={item.key}
              active={item.key === activeKey}
              icon={item.icon}
              label={item.label}
              to={ROUTES[item.key as Exclude<NavKey, "logout">]}
              onClick={onSelect ? () => onSelect(item.key) : undefined}
            />
          ))}
        </nav>

        <div className="mt-4 space-y-0.5 border-t border-slate-200 pt-3">
          <SidebarItem
            active={activeKey === "notifications"}
            icon={<Bell className="h-4 w-4" />}
            label="Notificações"
            showIndicator={hasUnreadNotifications}
            to={ROUTES.notifications}
            onClick={onSelect ? () => onSelect("notifications") : undefined}
          />

          <SidebarItem
            active={activeKey === "settings"}
            icon={<Settings className="h-4 w-4" />}
            label="Configurações"
            to={ROUTES.settings}
            onClick={onSelect ? () => onSelect("settings") : undefined}
          />

          <SidebarItem
            icon={<LogOut className="h-4 w-4" />}
            label="Sair"
            danger
            onClick={onSelect ? () => onSelect("logout") : undefined}
          />
        </div>
      </motion.div>

      <div className="pt-4">
        <UserGamerCard />
      </div>
    </div>
  );
}