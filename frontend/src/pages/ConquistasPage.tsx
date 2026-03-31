import { useEffect, useMemo, useState } from "react";
import { motion, type Variants } from "framer-motion";
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
  Coins,
} from "lucide-react";

import { cn } from "@/lib/cn";
import {
  gamificationService,
  type BadgeStatus,
  type ChestStatus,
  type ChallengeStatus,
} from "@/services/gamificationService";
import { useGameStore } from "@/store/useGameStore";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

function badgeIcon(icon: BadgeStatus["icon"] | ChallengeStatus["icon"]) {
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

function chestButtonClass(chest: ChestStatus) {
  if (chest.claimed) {
    return "bg-slate-200 text-slate-400";
  }

  if (chest.ready_to_claim) {
    if (chest.key === "wood") {
      return "bg-amber-500 text-white ring-4 ring-amber-100";
    }
    if (chest.key === "silver") {
      return "bg-slate-400 text-white ring-4 ring-slate-100";
    }
    return "bg-yellow-400 text-white ring-4 ring-yellow-100";
  }

  return "bg-slate-50 text-slate-300";
}

function chestRewardTone(chest: ChestStatus) {
  if (chest.key === "wood") return "text-amber-600";
  if (chest.key === "silver") return "text-slate-600";
  return "text-yellow-600";
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
    const current = Array.isArray(stats?.chests)
      ? stats.chests[0]?.current_minutes ?? 0
      : 0;
    const goal = stats?.daily_goal_minutes ?? 1;
    return Math.min((current / goal) * 100, 100);
  }, [stats?.chests, stats?.daily_goal_minutes]);

  const chests: ChestStatus[] = Array.isArray(stats?.chests) ? stats.chests : [];
  const badges: BadgeStatus[] = Array.isArray(stats?.badges) ? stats.badges : [];
  const challenges: ChallengeStatus[] = Array.isArray(stats?.challenges)
    ? stats.challenges
    : [];

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
    <motion.div
      className="mx-auto max-w-5xl space-y-8 pb-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
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
        </motion.div>
      )}

      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          <motion.div
            initial={{ rotate: -8, scale: 0.9 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ duration: 0.35 }}
          >
            <Trophy className="h-8 w-8 text-amber-500" />
          </motion.div>
          Conquistas & Recompensas
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Acompanhe seu progresso diário, abra baús e desbloqueie medalhas.
        </p>
      </motion.div>

      <motion.section
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      >
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

        <div className="relative mt-10 px-6 pb-24 sm:px-10 sm:pb-28">
  <div className="relative h-32 w-full">
    <div className="absolute left-0 top-6 h-1.5 w-full rounded-full bg-slate-100" />

    <motion.div
      className="absolute left-0 top-6 h-1.5 rounded-full bg-violet-500"
      initial={{ width: 0 }}
      animate={{ width: `${progressPercentage}%` }}
      transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
    />

    {chests.map((chest, index) => {
      const isReady = chest.ready_to_claim;
      const isClaimed = chest.claimed;
      const isLocked = !chest.unlocked;

      const isFirst = index === 0;
      const isLast = index === chests.length - 1;

      return (
        <motion.div
          key={chest.key}
          className={cn(
            "absolute top-0 flex flex-col items-center",
            isFirst
              ? "translate-x-0"
              : isLast
              ? "-translate-x-full"
              : "-translate-x-1/2"
          )}
          style={{
            left: `${chest.threshold_percent}%`,
          }}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.35,
            delay: 0.15 + index * 0.08,
          }}
        >
          <motion.div
            animate={
              isReady && !isClaimed
                ? {
                    y: [0, -6, 0],
                    scale: [1, 1.06, 1],
                    boxShadow: [
                      "0px 0px 0px rgba(0,0,0,0)",
                      "0px 10px 25px rgba(245,158,11,0.25)",
                      "0px 0px 0px rgba(0,0,0,0)",
                    ],
                  }
                : {}
            }
            transition={
              isReady && !isClaimed
                ? {
                    duration: 1.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }
                : { duration: 0.2 }
            }
            whileHover={{ y: -4, scale: 1.06 }}
            className={cn(
              "z-10 grid h-12 w-12 place-items-center rounded-2xl border-4 border-white shadow-md transition-all duration-300",
              chestButtonClass(chest)
            )}
          >
            {isLocked ? (
              <Lock className="h-5 w-5" />
            ) : (
              <motion.div
                animate={
                  isReady && !isClaimed
                    ? { rotate: [0, -8, 8, -4, 4, 0] }
                    : {}
                }
                transition={
                  isReady && !isClaimed
                    ? {
                        duration: 1.2,
                        repeat: Infinity,
                        repeatDelay: 1.2,
                      }
                    : undefined
                }
              >
                <Gift className="h-6 w-6" />
              </motion.div>
            )}
          </motion.div>

          <div className="mt-4 w-32 text-center">
            <p className="text-xs font-semibold text-slate-900">
              {chest.type_label}
            </p>

            <p
              className={cn(
                "text-[10px] font-semibold uppercase leading-tight tracking-tight",
                isReady && !isClaimed
                  ? chestRewardTone(chest)
                  : "text-slate-400"
              )}
            >
              {chest.threshold_percent}% · {chest.reward_label}
            </p>

            {isReady && (
              <motion.button
                onClick={() => handleClaimChest(chest.key)}
                disabled={claimingChest === chest.key}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.94 }}
                className="mt-3 whitespace-nowrap rounded-full bg-amber-500 px-4 py-1.5 text-[10px] font-black text-white shadow-lg shadow-amber-200 transition hover:bg-amber-600 disabled:opacity-50"
              >
                {claimingChest === chest.key ? "RESGATANDO..." : "RESGATAR"}
              </motion.button>
            )}

            {isClaimed && (
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-3 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black text-emerald-700"
              >
                RESGATADO
              </motion.span>
            )}
          </div>
        </motion.div>
      );
    })}
  </div>
</div>
      </motion.section>

      <motion.section
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Desafios do Dia</h2>
            <p className="text-sm text-slate-500">
              Complete os objetivos diários para receber recompensas automáticas.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Hoje
            </p>
            <p className="text-sm font-semibold text-slate-700">
              Recompensa automática
            </p>
          </div>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-4 lg:grid-cols-3"
        >
          {challenges.map((challenge) => (
            <motion.div
              key={challenge.key}
              variants={fadeUp}
              whileHover={{ y: -4 }}
              className={cn(
                "rounded-3xl border p-5 shadow-sm transition-all",
                challenge.claimed
                  ? "border-emerald-100 bg-emerald-50/60"
                  : challenge.completed
                  ? "border-violet-200 bg-violet-50/60"
                  : "border-slate-200 bg-white"
              )}
            >
              <div className="mb-4 flex items-start justify-between">
                <motion.div
                  whileHover={{ scale: 1.06, rotate: 4 }}
                  className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-700"
                >
                  {badgeIcon(challenge.icon)}
                </motion.div>

                {challenge.claimed ? (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black text-emerald-700">
                    CONCLUÍDO
                  </span>
                ) : challenge.completed ? (
                  <span className="rounded-full bg-violet-100 px-3 py-1 text-[10px] font-black text-violet-700">
                    RECOMPENSA LIBERADA
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black text-slate-500">
                    EM PROGRESSO
                  </span>
                )}
              </div>

              <h3 className="font-semibold text-slate-800">{challenge.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{challenge.description}</p>

              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase text-slate-400">
                  <span>Progresso</span>
                  <span>
                    {challenge.current} / {challenge.target}
                  </span>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <motion.div
                    className="h-full rounded-full bg-violet-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${challenge.progress_percent}%` }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3 text-sm font-semibold text-slate-600">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-amber-700">
                  <Coins className="h-4 w-4" /> +{challenge.reward_coins}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-3 py-1 text-violet-700">
                  <Zap className="h-4 w-4" /> +{challenge.reward_xp} XP
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      <motion.section
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="pt-4"
      >
        <h2 className="mb-6 text-xl font-semibold text-slate-800">
          Medalhas de Honra
        </h2>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {badges.map((badge) => {
            const color = badgeColor(badge.color);

            return (
              <motion.div
                key={badge.key}
                variants={fadeUp}
                whileHover={{ y: -4, scale: 1.01 }}
                className={cn(
                  "relative flex flex-col gap-4 rounded-3xl border p-6 transition-all hover:shadow-lg",
                  badge.unlocked
                    ? "border-slate-100 bg-white"
                    : "border-slate-100 bg-slate-50/60 opacity-80 grayscale"
                )}
              >
                <div className="flex items-start justify-between">
                  <motion.div
                    whileHover={{ scale: 1.08, rotate: 5 }}
                    className={cn(
                      "grid h-12 w-12 place-items-center rounded-2xl shadow-sm",
                      color.bg,
                      color.text
                    )}
                  >
                    {badgeIcon(badge.icon)}
                  </motion.div>

                  {badge.unlocked && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="rounded-full bg-emerald-100 p-1"
                    >
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </motion.div>
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
                      <motion.div
                        className="h-full rounded-full bg-violet-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${badge.progress_percent}%` }}
                        transition={{ duration: 0.7 }}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </motion.section>
    </motion.div>
  );
}