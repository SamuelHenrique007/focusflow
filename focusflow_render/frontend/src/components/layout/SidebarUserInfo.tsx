import { memo } from "react";
import UserAvatar from "@/components/UserAvatar";
import { useGameStore } from "@/store/useGameStore";

const SidebarUserInfo = memo(function SidebarUserInfo() {
  const username = useGameStore((state) => state.stats?.username ?? "Usuário");
  const level = useGameStore((state) => state.stats?.level ?? 1);

  return (
    <div className="flex items-center gap-3">
      <UserAvatar size="sm" />

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-800">
          {username}
        </p>

        <p className="text-xs text-slate-500">
          Nível {level}
        </p>
      </div>
    </div>
  );
});

export default SidebarUserInfo;