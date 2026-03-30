import UserAvatar from "@/components/UserAvatar";
import { useGameStore } from "@/store/useGameStore";

export default function SidebarUserInfo() {
  const stats = useGameStore((state) => state.stats);

  return (
    <div className="flex items-center gap-3">
      <UserAvatar size="sm" />

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-800">
          {stats?.username || "Usuário"}
        </p>

        <p className="text-xs text-slate-500">
          Nível {stats?.level || 1}
        </p>
      </div>
    </div>
  );
}