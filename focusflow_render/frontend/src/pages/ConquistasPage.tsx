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
import { useToastStore } from "@/store/useToastStore";

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

function badgeTone(color: BadgeStatus["color"]) {
  return {
    blue: {
      text: "text-[var(--ff-primary)]",
      bg: "bg-[color-mix(in_srgb,var(--ff-primary)_14%,var(--ff-surface))]",
    },
    amber: {
      text: "text-amber-600",
      bg: "bg-[color-mix(in_srgb,#f59e0b_16%,var(--ff-surface))]",
    },
    orange: {
      text: "text-orange-600",
      bg: "bg-[color-mix(in_srgb,#f97316_16%,var(--ff-surface))]",
    },
    purple: {
      text: "text-violet-600",
      bg: "bg-[color-mix(in_srgb,#8b5cf6_16%,var(--ff-surface))]",
    },
    emerald: {
      text: "text-emerald-600",
      bg: "bg-[color-mix(in_srgb,#10b981_16%,var(--ff-surface))]",
    },
  }[color];
}

function chestButtonClass(chest: ChestStatus) {
  if (chest.claimed) {
    return "bg-[var(--ff-surface-muted)] text-[var(--ff-text-muted)]";
  }

  if (chest.ready_to_claim) {
    if (chest.key === "wood") {
      return "bg-amber-500 text-white ring-4 ring-amber-100/80";
    }
    if (chest.key === "silver") {
      return "bg-slate-400 text-white ring-4 ring-slate-200/70";
    }
    return "bg-yellow-400 text-white ring-4 ring-yellow-100/80";
  }

  return "bg-[var(--ff-surface-soft)] text-[var(--ff-text-muted)]";
}

function chestRewardTone(chest: ChestStatus) {
  if (chest.key === "wood") return "text-amber-600";
  if (chest.key === "silver") return "text-slate-500";
  return "text-yellow-600";
}

export default function ConquistasPage() {
  const { stats, fetchStatus } = useGameStore();
  const pushToast = useToastStore((state) => state.pushToast);

  const [claimingChest, setClaimingChest] = useState<string | null>(null);

  function showToast(
    variant: "success" | "error" | "info",
    title: string,
    description: string,
  ) {
    pushToast({
      variant,
      title,
      description,
      duration: variant === "error" ? 5000 : 4200,
    });
  }

  function extractApiError(error: unknown, fallback: string) {
    const err = error as {
      response?: {
        data?: {
          error?: string;
          detail?: string;
          message?: string;
        };
      };
    };

    return (
      err?.response?.data?.error ||
      err?.response?.data?.detail ||
      err?.response?.data?.message ||
      fallback
    );
  }

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

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

      showToast(
        "success",
        "Baú resgatado",
        response.message || "Baú resgatado com sucesso.",
      );

      await fetchStatus();
    } catch (error) {
      showToast(
        "error",
        "Falha ao resgatar baú",
        extractApiError(error, "Não foi possível resgatar o baú."),
      );
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
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight text-[var(--ff-text)] sm:text-3xl">
          <motion.div
            initial={{ rotate: -8, scale: 0.9 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ duration: 0.35 }}
          >
            <Trophy className="h-8 w-8 text-amber-500" />
          </motion.div>
          Desafios & Conquistas
        </h1>

        <p className="mt-2 text-sm text-[var(--ff-text-soft)]">
          Acompanhe seu progresso diário, abra baús e desbloqueie medalhas.
        </p>
      </motion.div>

      <motion.section
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface)] p-6 shadow-sm sm:p-8"
      >
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--ff-text)]">
              Trilha de Foco
            </h2>
            <p className="text-sm text-[var(--ff-text-soft)]">
              Complete a meta diária para liberar os baús.
            </p>
          </div>

          <div className="text-right">
            <span className="text-2xl font-semibold text-[var(--ff-primary)]">
              {progressPercentage.toFixed(0)}%
            </span>
            <span className="text-sm font-semibold text-[var(--ff-text-muted)]">
              {" "}
              / 100%
            </span>
          </div>
        </div>

        <div className="hidden sm:block">
          <div className="relative px-6 pt-2">
            <div className="absolute left-6 right-6 top-7 h-1.5 rounded-full bg-[var(--ff-surface-muted)]" />

            <motion.div
              className="absolute left-6 top-7 h-1.5 rounded-full bg-[var(--ff-primary)]"
              initial={{ width: 0 }}
              animate={{ width: `calc((100% - 3rem) * ${progressPercentage / 100})` }}
              transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
            />

            <div className="grid grid-cols-3 gap-6 pt-0">
              {chests.map((chest, index) => {
                const isReady = chest.ready_to_claim;
                const isClaimed = chest.claimed;
                const isLocked = !chest.unlocked;

                return (
                  <motion.div
                    key={chest.key}
                    initial={{ opacity: 0, y: 20, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      duration: 0.35,
                      delay: 0.15 + index * 0.08,
                    }}
                    className="relative flex flex-col items-center"
                  >
                    <div className="flex h-14 items-center">
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
                          "z-10 grid h-12 w-12 place-items-center rounded-2xl border-4 border-[var(--ff-surface)] shadow-md transition-all duration-300",
                          chestButtonClass(chest),
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
                    </div>

                    <div className="mt-4 flex min-h-[148px] w-full flex-col items-center rounded-2xl bg-[var(--ff-surface-soft)] px-3 py-4 text-center">
                      <p className="text-sm font-semibold text-[var(--ff-text)]">
                        {chest.type_label}
                      </p>

                      <p
                        className={cn(
                          "mt-1 text-[11px] font-semibold uppercase leading-snug tracking-tight",
                          isReady && !isClaimed
                            ? chestRewardTone(chest)
                            : "text-[var(--ff-text-muted)]",
                        )}
                      >
                        {chest.threshold_percent}% · {chest.reward_label}
                      </p>

                      <div className="mt-4">
                        {isReady && !isClaimed && (
                          <motion.button
                            onClick={() => handleClaimChest(chest.key)}
                            disabled={claimingChest === chest.key}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.94 }}
                            className="cursor-pointer whitespace-nowrap rounded-full bg-[var(--ff-primary)] px-4 py-2 text-[11px] font-black text-white shadow-lg transition hover:bg-[var(--ff-primary-strong)] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {claimingChest === chest.key ? "RESGATANDO..." : "RESGATAR"}
                          </motion.button>
                        )}

                        {isClaimed && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="inline-flex rounded-full bg-[color-mix(in_srgb,#10b981_18%,var(--ff-surface))] px-3 py-1.5 text-[11px] font-black text-emerald-700"
                          >
                            RESGATADO
                          </motion.span>
                        )}

                        {!isReady && !isClaimed && (
                          <span className="inline-flex rounded-full bg-[var(--ff-surface-muted)] px-3 py-1.5 text-[11px] font-bold text-[var(--ff-text-soft)]">
                            {isLocked ? "BLOQUEADO" : "EM PROGRESSO"}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-4 sm:hidden">
          <div>
            <div className="mb-2 flex items-center justify-between text-xs font-semibold text-[var(--ff-text-muted)]">
              <span>Progresso diário</span>
              <span>{progressPercentage.toFixed(0)}%</span>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--ff-surface-muted)]">
              <motion.div
                className="h-full rounded-full bg-[var(--ff-primary)]"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {chests.map((chest, index) => {
              const isReady = chest.ready_to_claim;
              const isClaimed = chest.claimed;
              const isLocked = !chest.unlocked;

              return (
                <motion.div
                  key={chest.key}
                  initial={{ opacity: 0, y: 20, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    duration: 0.35,
                    delay: 0.15 + index * 0.08,
                  }}
                  className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-soft)] p-4"
                >
                  <div className="flex items-start gap-4">
                    <motion.div
                      animate={
                        isReady && !isClaimed
                          ? {
                              y: [0, -6, 0],
                              scale: [1, 1.06, 1],
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
                      className={cn(
                        "grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-4 border-[var(--ff-surface)] shadow-md transition-all duration-300",
                        chestButtonClass(chest),
                      )}
                    >
                      {isLocked ? <Lock className="h-5 w-5" /> : <Gift className="h-6 w-6" />}
                    </motion.div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[var(--ff-text)]">
                        {chest.type_label}
                      </p>

                      <p
                        className={cn(
                          "mt-1 text-[11px] font-semibold uppercase leading-snug",
                          isReady && !isClaimed
                            ? chestRewardTone(chest)
                            : "text-[var(--ff-text-muted)]",
                        )}
                      >
                        {chest.threshold_percent}% · {chest.reward_label}
                      </p>

                      <div className="mt-3">
                        {isReady && !isClaimed && (
                          <motion.button
                            onClick={() => handleClaimChest(chest.key)}
                            disabled={claimingChest === chest.key}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.96 }}
                            className="cursor-pointer whitespace-nowrap rounded-full bg-[var(--ff-primary)] px-4 py-2 text-[11px] font-black text-white shadow-lg transition hover:bg-[var(--ff-primary-strong)] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {claimingChest === chest.key ? "RESGATANDO..." : "RESGATAR"}
                          </motion.button>
                        )}

                        {isClaimed && (
                          <span className="inline-flex rounded-full bg-[color-mix(in_srgb,#10b981_18%,var(--ff-surface))] px-3 py-1.5 text-[11px] font-black text-emerald-700">
                            RESGATADO
                          </span>
                        )}

                        {!isReady && !isClaimed && (
                          <span className="inline-flex rounded-full bg-[var(--ff-surface-muted)] px-3 py-1.5 text-[11px] font-bold text-[var(--ff-text-soft)]">
                            {isLocked ? "BLOQUEADO" : "EM PROGRESSO"}
                          </span>
                        )}
                      </div>
                    </div>
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
        className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface)] p-6 shadow-sm sm:p-8"
      >
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-[var(--ff-text)]">
              Desafios do Dia
            </h2>
            <p className="text-sm text-[var(--ff-text-soft)]">
              Complete os objetivos diários para receber recompensas automáticas.
            </p>
          </div>

          <div className="rounded-2xl bg-[var(--ff-surface-soft)] px-4 py-3 text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ff-text-muted)]">
              Hoje
            </p>
            <p className="text-sm font-semibold text-[var(--ff-text-soft)]">
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
          {challenges.map((challenge) => {
            // TRAVA APLICADA AQUI PARA OS DESAFIOS
            const cappedCurrent = Math.min(challenge.current, challenge.target);
            const cappedPercent = Math.min(100, challenge.progress_percent);

            return (
              <motion.div
                key={challenge.key}
                variants={fadeUp}
                whileHover={{ y: -4 }}
                className={cn(
                  "rounded-3xl border p-5 shadow-sm transition-all",
                  challenge.claimed
                    ? "border-emerald-200 bg-[color-mix(in_srgb,#10b981_10%,var(--ff-surface))]"
                    : challenge.completed
                      ? "border-[color-mix(in_srgb,var(--ff-primary)_30%,var(--ff-border))] bg-[color-mix(in_srgb,var(--ff-primary)_8%,var(--ff-surface))]"
                      : "border-[var(--ff-border)] bg-[var(--ff-surface)]",
                )}
              >
                <div className="mb-4 flex items-start justify-between">
                  <motion.div
                    whileHover={{ scale: 1.06, rotate: 4 }}
                    className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--ff-surface-soft)] text-[var(--ff-text-soft)]"
                  >
                    {badgeIcon(challenge.icon)}
                  </motion.div>

                  {challenge.claimed ? (
                    <span className="rounded-full bg-[color-mix(in_srgb,#10b981_18%,var(--ff-surface))] px-3 py-1 text-[10px] font-black text-emerald-700">
                      CONCLUÍDO
                    </span>
                  ) : challenge.completed ? (
                    <span className="rounded-full bg-[color-mix(in_srgb,var(--ff-primary)_16%,var(--ff-surface))] px-3 py-1 text-[10px] font-black text-[var(--ff-primary)]">
                      RECOMPENSA LIBERADA
                    </span>
                  ) : (
                    <span className="rounded-full bg-[var(--ff-surface-soft)] px-3 py-1 text-[10px] font-black text-[var(--ff-text-soft)]">
                      EM PROGRESSO
                    </span>
                  )}
                </div>

                <h3 className="font-semibold text-[var(--ff-text)]">{challenge.title}</h3>
                <p className="mt-1 text-sm text-[var(--ff-text-soft)]">
                  {challenge.description}
                </p>

                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase text-[var(--ff-text-muted)]">
                    <span>Progresso</span>
                    <span>
                      {cappedCurrent} / {challenge.target}
                    </span>
                  </div>

                  <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--ff-surface-muted)]">
                    <motion.div
                      className="h-full rounded-full bg-[var(--ff-primary)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${cappedPercent}%` }}
                      transition={{ duration: 0.8, delay: 0.1 }}
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3 text-sm font-semibold text-[var(--ff-text-soft)]">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[color-mix(in_srgb,#f59e0b_14%,var(--ff-surface))] px-3 py-1 text-amber-700">
                    <Coins className="h-4 w-4" /> +{challenge.reward_coins}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[color-mix(in_srgb,var(--ff-primary)_14%,var(--ff-surface))] px-3 py-1 text-[var(--ff-primary)]">
                    <Zap className="h-4 w-4" /> +{challenge.reward_xp} XP
                  </span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.section>

      <motion.section
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="pt-4"
      >
        <h2 className="mb-6 text-xl font-semibold text-[var(--ff-text)]">
          Medalhas de Honra
        </h2>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {badges.map((badge) => {
            const color = badgeTone(badge.color);
            
            // TRAVA APLICADA AQUI PARA AS MEDALHAS
            const cappedCurrent = Math.min(badge.current, badge.target);
            const cappedPercent = Math.min(100, badge.progress_percent);

            return (
              <motion.div
                key={badge.key}
                variants={fadeUp}
                whileHover={{ y: -4, scale: 1.01 }}
                className={cn(
                  "relative flex flex-col gap-4 rounded-3xl border p-6 transition-all hover:shadow-lg",
                  badge.unlocked
                    ? "border-[var(--ff-border)] bg-[var(--ff-surface)]"
                    : "border-[var(--ff-border)] bg-[var(--ff-surface-soft)] opacity-80 grayscale",
                )}
              >
                <div className="flex items-start justify-between">
                  <motion.div
                    whileHover={{ scale: 1.08, rotate: 5 }}
                    className={cn(
                      "grid h-12 w-12 place-items-center rounded-2xl shadow-sm",
                      color.bg,
                      color.text,
                    )}
                  >
                    {badgeIcon(badge.icon)}
                  </motion.div>

                  {badge.unlocked && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="rounded-full bg-[color-mix(in_srgb,#10b981_18%,var(--ff-surface))] p-1"
                    >
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </motion.div>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-[var(--ff-text)]">{badge.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--ff-text-soft)]">
                    {badge.description}
                  </p>
                </div>

                {!badge.unlocked && (
                  <div className="mt-auto pt-2">
                    <div className="mb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase text-[var(--ff-text-muted)]">
                      <span>Progresso</span>
                      <span>
                        {cappedCurrent} / {badge.target}
                      </span>
                    </div>

                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--ff-surface-muted)]">
                      <motion.div
                        className="h-full rounded-full bg-[var(--ff-primary)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${cappedPercent}%` }}
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