import { useEffect, useMemo, useState } from "react";
import {
  Trophy,
  Gift,
  Lock,
  Flame,
  Clock,
  Target,
  Zap,
  Shield,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { cn } from "@/lib/cn";
import {
  gamificationService,
  type BadgeStatus,
  type ChestStatus,
} from "@/services/gamificationService";
import { useGameStore } from "@/store/useGameStore";

function badgeIcon(icon: BadgeStatus["icon"]) {
  switch (icon) {
    case "target":
      return <Target className="h-6 w-6" />;
    case "clock":
      return <Clock className="h-6 w-6" />;
    case "flame":
      return <Flame className="h-6 w-6" />;
    case "zap":
      return <Zap className="h-6 w-6" />;
    case "shield":
      return <Shield className="h-6 w-6" />;
    default:
      return <Trophy className="h-6 w-6" />;
  }
}

function badgeColor(color: BadgeStatus["color"]) {
  return {
    blue: { text: "text-blue-600", bg: "bg-blue-100" },
    amber: { text: "text-amber-600", bg: "bg-amber-100" },
    orange: { text: "text-orange-600", bg: "bg-orange-100" },
    purple: { text: "text-purple-600", bg: "bg-purple-100" },
    emerald: { text: "text-emerald-600", bg: "bg-emerald-100" },
  }[color];
}

export default function ConquistasPage() {
  const { stats, fetchStatus } = useGameStore();

  const [claimingChest, setClaimingChest] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 3500);
    return () => clearTimeout(timer);
  }, [message]);

  
  const progressPercentage = useMemo(() => {
  const current = Array.isArray(stats?.chests) ? stats.chests[0]?.current_minutes ?? 0 : 0;
  const goal = stats?.daily_goal_minutes ?? 1;
  return Math.min((current / goal) * 100, 100);
}, [stats?.chests, stats?.daily_goal_minutes]);

  const chests: ChestStatus[] = Array.isArray(stats?.chests) ? stats.chests : [];
  const badges: BadgeStatus[] = Array.isArray(stats?.badges) ? stats.badges : [];

  async function handleClaimChest(chestKey: "wood" | "silver" | "gold") {
    try {
      setClaimingChest(chestKey);
      const response = await gamificationService.claimChest(chestKey);

      setMessage({
        type: "success",
        text: response.message || "Baú resgatado com sucesso.",
      });

      await fetchStatus();
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };

      setMessage({
        type: "error",
        text: err.response?.data?.error || "Não foi possível resgatar o baú.",
      });
    } finally {
      setClaimingChest(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12">
      {message && (
        <div
          className={cn(
            "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-sm",
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          )}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          {message.text}
        </div>
      )}

      <div>
        <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          <Trophy className="h-8 w-8 text-amber-500" />
          Conquistas & Recompensas
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Acompanhe seu progresso diário, abra baús e desbloqueie medalhas.
        </p>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Trilha de Foco</h2>
            <p className="text-sm text-slate-500">
              Complete a meta diária para liberar os baús.
            </p>
          </div>

          <div className="text-right">
            <span className="text-2xl font-semibold text-violet-600">
              {progressPercentage.toFixed(0)}%
            </span>
            <span className="text-sm font-semibold text-slate-300"> / 100%</span>
          </div>
        </div>

        <div className="relative mt-10 px-4 pb-24 sm:px-12 sm:pb-28">
          <div className="relative h-12 w-full">
            <div className="absolute left-0 top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-slate-100" />

            <div
              className="absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-violet-500 transition-all duration-700"
              style={{ width: `${progressPercentage}%` }}
            />

            {chests.map((chest) => {
              const isReady = chest.ready_to_claim;
              const isClaimed = chest.claimed;
              const isLocked = !chest.unlocked;

              return (
                <div
                  key={chest.key}
                  className="absolute flex flex-col items-center"
                  style={{
                    left: `${chest.threshold_percent}%`,
                    transform: "translateX(-50%)",
                  }}
                >
                  <div
                    className={cn(
                      "z-10 grid h-12 w-12 place-items-center rounded-2xl border-4 border-white shadow-md transition-all duration-300",
                      isClaimed
                        ? "bg-slate-200 text-slate-400"
                        : isReady
                        ? "bg-amber-400 text-white ring-4 ring-amber-100"
                        : "bg-slate-50 text-slate-300"
                    )}
                  >
                    {isLocked ? <Lock className="h-5 w-5" /> : <Gift className="h-6 w-6" />}
                  </div>

                  <div className="mt-4 w-28 text-center">
                    <p className="text-xs font-semibold text-slate-900">
                      {chest.type_label}
                    </p>

                    <p className="text-[10px] font-semibold uppercase tracking-tighter text-slate-400">
                      {chest.threshold_percent}% · {chest.reward_label}
                    </p>

                    {isReady && (
                      <button
                        onClick={() => handleClaimChest(chest.key)}
                        disabled={claimingChest === chest.key}
                        className="mt-3 whitespace-nowrap rounded-full bg-amber-500 px-4 py-1.5 text-[10px] font-black text-white shadow-lg shadow-amber-200 transition hover:bg-amber-600 active:scale-95 disabled:opacity-50"
                      >
                        {claimingChest === chest.key ? "RESGATANDO..." : "RESGATAR"}
                      </button>
                    )}

                    {isClaimed && (
                      <span className="mt-3 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black text-emerald-700">
                        RESGATADO
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="pt-4">
        <h2 className="mb-6 text-xl font-semibold text-slate-800">
          Medalhas de Honra
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {badges.map((badge) => {
            const color = badgeColor(badge.color);

            return (
              <div
                key={badge.key}
                className={cn(
                  "relative flex flex-col gap-4 rounded-3xl border p-6 transition-all hover:shadow-lg",
                  badge.unlocked
                    ? "border-slate-100 bg-white"
                    : "border-slate-100 bg-slate-50/60 opacity-80 grayscale"
                )}
              >
                <div className="flex items-start justify-between">
                  <div
                    className={cn(
                      "grid h-12 w-12 place-items-center rounded-2xl shadow-sm",
                      color.bg,
                      color.text
                    )}
                  >
                    {badgeIcon(badge.icon)}
                  </div>

                  {badge.unlocked && (
                    <div className="rounded-full bg-emerald-100 p-1">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-slate-800">{badge.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    {badge.description}
                  </p>
                </div>

                {!badge.unlocked && (
                  <div className="mt-auto pt-2">
                    <div className="mb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase text-slate-400">
                      <span>Progresso</span>
                      <span>
                        {badge.current} / {badge.target}
                      </span>
                    </div>

                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-violet-400"
                        style={{ width: `${badge.progress_percent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}