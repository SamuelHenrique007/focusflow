import React, { useEffect, useMemo, useState } from "react";
import { motion, type Variants } from "framer-motion";
import {
  Flame,
  Sparkles,
  Clock3,
  CheckCircle2,
  Target,
  TrendingUp,
  Calendar,
} from "lucide-react";

import { Badge } from "@/components/common/Badge";
import { ProgressBar } from "@/components/common/ProgressBar";
import { StatCard } from "@/components/common/StatCard";
import { useGameStore } from "@/store/useGameStore";
import { listTasks, type Task } from "@/services/tasks";
import {
  getPomodoroHistory,
  type PomodoroSession,
} from "@/services/pomodoro";
import type { ChallengeStatus } from "@/services/gamificationService";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

function ChartFrame({
  title,
  subtitle,
  rightIcon,
  children,
}: {
  title: string;
  subtitle?: string;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface)] p-4 shadow-sm sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--ff-text)]">{title}</p>
          {subtitle ? (
            <p className="mt-1 text-xs text-[var(--ff-text-muted)]">
              {subtitle}
            </p>
          ) : null}
        </div>
        {rightIcon ? (
          <motion.div
            whileHover={{ scale: 1.06, rotate: 3 }}
            transition={{ duration: 0.2 }}
            className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--ff-surface-soft)] ring-1 ring-[var(--ff-border)] text-[var(--ff-primary)]"
          >
            {rightIcon}
          </motion.div>
        ) : null}
      </div>

      <div className="mt-4">{children}</div>
    </motion.div>
  );
}

function BarChartMock({
  labels,
  values,
  maxValue,
}: {
  labels: string[];
  values: number[];
  maxValue: number;
}) {
  return (
    <div>
      <div className="flex items-end gap-2">
        {values.map((v, i) => {
          const h = maxValue ? Math.max(0, Math.min(1, v / maxValue)) : 0;

          return (
            <motion.div
              key={labels[i]}
              className="flex-1"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.06 }}
            >
              <div className="flex h-40 items-end rounded-2xl bg-[var(--ff-surface-soft)] ring-1 ring-[var(--ff-border)]">
                <motion.div
                  className="w-full rounded-2xl bg-[var(--ff-primary)]/30"
                  initial={{ height: 0 }}
                  whileInView={{ height: `${h * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.55, delay: i * 0.08 }}
                />
              </div>
              <p className="mt-2 text-center text-xs text-[var(--ff-text-muted)]">
                {labels[i]}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function LineChartMock({
  labels,
  values,
  maxValue,
}: {
  labels: string[];
  values: number[];
  maxValue: number;
}) {
  return (
    <div className="rounded-2xl bg-[var(--ff-surface-soft)] p-4 ring-1 ring-[var(--ff-border)]">
      <div className="space-y-3">
        {values.map((v, i) => {
          const pct = maxValue ? Math.max(0, Math.min(1, v / maxValue)) : 0;

          return (
            <motion.div
              key={labels[i]}
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.06 }}
            >
              <span className="w-16 text-xs font-medium text-[var(--ff-text-soft)]">
                {labels[i]}
              </span>
              <div className="flex-1">
                <ProgressBar value={pct} barClassName="bg-[var(--ff-primary)]" />
              </div>
              <span className="w-10 text-right text-xs font-semibold text-[var(--ff-text)]">
                {v}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function CategoryDistribution({
  tasks,
}: {
  tasks: Task[];
}) {
  const total = tasks.length;

  const categoryData = useMemo(() => {
    const counts = {
      estudo: tasks.filter((task) => task.category === "estudo").length,
      trabalho: tasks.filter((task) => task.category === "trabalho").length,
      pessoal: tasks.filter((task) => task.category === "pessoal").length,
    };

    return [
      {
        label: "Estudo",
        count: counts.estudo,
        pct: total > 0 ? counts.estudo / total : 0,
        barClassName: "bg-[var(--ff-primary)]",
      },
      {
        label: "Trabalho",
        count: counts.trabalho,
        pct: total > 0 ? counts.trabalho / total : 0,
        barClassName: "bg-[var(--ff-primary)] opacity-85",
      },
      {
        label: "Pessoal",
        count: counts.pessoal,
        pct: total > 0 ? counts.pessoal / total : 0,
        barClassName: "bg-[var(--ff-primary)] opacity-70",
      },
    ];
  }, [tasks, total]);

  return (
    <div className="rounded-2xl bg-[var(--ff-surface-soft)] p-4 ring-1 ring-[var(--ff-border)]">
      <div className="space-y-4">
        {categoryData.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: index * 0.07 }}
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-[var(--ff-text-soft)]">
                {item.label}
              </span>
              <span className="text-xs font-semibold text-[var(--ff-text-muted)]">
                {item.count} {item.count === 1 ? "tarefa" : "tarefas"}
              </span>
            </div>
            <ProgressBar value={item.pct} barClassName={item.barClassName} />
          </motion.div>
        ))}

        {total === 0 ? (
          <p className="text-sm text-[var(--ff-text-muted)]">
            Nenhuma tarefa cadastrada ainda.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function ChallengeCard({
  title,
  subtitle,
  progressLabel,
  value,
}: {
  title: string;
  subtitle: string;
  progressLabel: string;
  value: number;
}) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface)] p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--ff-text)]">{title}</p>
          <p className="mt-1 text-xs text-[var(--ff-text-muted)]">{subtitle}</p>
        </div>
        <span className="text-xs font-semibold text-[var(--ff-text-soft)]">
          {progressLabel}
        </span>
      </div>

      <div className="mt-3">
        <ProgressBar value={value} barClassName="bg-[var(--ff-primary)]" />
      </div>
    </motion.div>
  );
}

function formatMinutesToHours(minutes: number) {
  if (!minutes || minutes <= 0) return "0min";

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0 && mins > 0) return `${hours}h ${mins}min`;
  if (hours > 0) return `${hours}h`;
  return `${mins}min`;
}

function getLast7Days() {
  const days: { key: string; label: string }[] = [];
  const today = new Date();

  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);

    const key = date.toISOString().slice(0, 10);
    const label = date.toLocaleDateString("pt-BR", { weekday: "short" });

    days.push({
      key,
      label: label.charAt(0).toUpperCase() + label.slice(1).replace(".", ""),
    });
  }

  return days;
}

export default function EstatisticasPage() {
  const { stats: gameStats, fetchStatus } = useGameStore();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [history, setHistory] = useState<PomodoroSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setErrorMessage("");

        const [tasksData, historyData] = await Promise.all([
          listTasks(),
          getPomodoroHistory(),
          fetchStatus(),
        ]);

        setTasks(tasksData);
        setHistory(historyData);
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
        setErrorMessage("Não foi possível carregar os dados reais das estatísticas.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [fetchStatus]);

  const streakDays = gameStats?.streak ?? 0;
  const level = gameStats?.level ?? 1;
  const xpNow = gameStats?.current_xp ?? 0;
  const xpMax = gameStats?.xp_to_next_level ?? 100;
  const xpPct = xpMax ? xpNow / xpMax : 0;

  const overviewStats = useMemo(() => {
    const totalFocusMinutes = gameStats?.total_focus_minutes ?? 0;
    const totalTasksCompleted =
      gameStats?.total_tasks_completed ??
      tasks.filter((task) => task.status === "concluida").length;
    const totalPomodoros = gameStats?.total_pomodoros ?? 0;

    return {
      tempoTotal: formatMinutesToHours(totalFocusMinutes),
      tarefasConcluidas: String(totalTasksCompleted),
      pomodoros: String(totalPomodoros),
      maiorSequencia: `${streakDays} ${streakDays === 1 ? "dia" : "dias"}`,
    };
  }, [gameStats, tasks, streakDays]);

  const weeklyData = useMemo(() => {
    const days = getLast7Days();
    const focusMap = new Map<string, number>();
    const pomodoroMap = new Map<string, number>();

    days.forEach((day) => {
      focusMap.set(day.key, 0);
      pomodoroMap.set(day.key, 0);
    });

    history.forEach((session) => {
      if (
        session.session_type !== "focus" ||
        session.status !== "completed" ||
        !session.ended_at
      ) {
        return;
      }

      const key = session.ended_at.slice(0, 10);

      if (!focusMap.has(key) || !pomodoroMap.has(key)) return;

      focusMap.set(key, (focusMap.get(key) ?? 0) + session.planned_minutes);
      pomodoroMap.set(key, (pomodoroMap.get(key) ?? 0) + 1);
    });

    const labels = days.map((day) => day.label);
    const focusMinutes = days.map((day) => focusMap.get(day.key) ?? 0);
    const pomodorosPerDay = days.map((day) => pomodoroMap.get(day.key) ?? 0);

    return {
      labels,
      focusMinutes,
      pomodorosPerDay,
      focusMax: Math.max(...focusMinutes, 1),
      pomoMax: Math.max(...pomodorosPerDay, 1),
    };
  }, [history]);

  const activeChallenges = useMemo(() => {
    if (!Array.isArray(gameStats?.challenges)) return [];
    return (gameStats.challenges as ChallengeStatus[]).slice(0, 3);
  }, [gameStats?.challenges]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        <motion.div
          variants={fadeUp}
          className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
        >
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-[var(--ff-text)]">
              Estatísticas
            </h1>
            <p className="mt-1 text-sm text-[var(--ff-text-muted)]">
              Acompanhe seu progresso e desempenho com dados reais.
            </p>
          </div>

          <motion.div
            whileHover={{ scale: 1.04 }}
            transition={{ duration: 0.2 }}
          >
            <Badge tone="warning">
              <Flame className="h-4 w-4" />
              {streakDays} {streakDays === 1 ? "dia" : "dias"}
            </Badge>
          </motion.div>
        </motion.div>

        {errorMessage ? (
          <motion.div
            variants={fadeUp}
            className="mt-5 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-primary-soft)] p-4 text-sm font-medium text-[var(--ff-text)]"
          >
            {errorMessage}
          </motion.div>
        ) : null}

        <motion.div
          variants={fadeUp}
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
          className="mt-5 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface)] p-4 sm:p-5"
        >
          <div className="flex items-center justify-between gap-3">
            <motion.div
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.2 }}
            >
              <Badge tone="info">
                <Sparkles className="h-4 w-4" />
                Nível {level}
              </Badge>
            </motion.div>

            <p className="text-xs font-medium text-[var(--ff-text-muted)]">
              {xpNow}/{xpMax} XP
            </p>
          </div>

          <div className="mt-4">
            <ProgressBar value={xpPct} />
          </div>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <motion.div variants={fadeUp} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
            <StatCard
              title="Tempo Total"
              value={loading ? "..." : overviewStats.tempoTotal}
              subtitle="de foco"
              icon={<Clock3 className="h-5 w-5" />}
              iconTone="bg-[var(--ff-primary-soft)] text-[var(--ff-primary)]"
            />
          </motion.div>

          <motion.div variants={fadeUp} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
            <StatCard
              title="Tarefas"
              value={loading ? "..." : overviewStats.tarefasConcluidas}
              subtitle="concluídas"
              icon={<CheckCircle2 className="h-5 w-5" />}
              iconTone="bg-[var(--ff-primary-soft)] text-[var(--ff-primary)]"
            />
          </motion.div>

          <motion.div variants={fadeUp} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
            <StatCard
              title="Pomodoros"
              value={loading ? "..." : overviewStats.pomodoros}
              subtitle="completados"
              icon={<Target className="h-5 w-5" />}
              iconTone="bg-[var(--ff-primary-soft)] text-[var(--ff-primary)]"
            />
          </motion.div>

          <motion.div variants={fadeUp} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
            <StatCard
              title="Maior Sequência"
              value={loading ? "..." : overviewStats.maiorSequencia}
              subtitle="de produtividade"
              icon={<Flame className="h-5 w-5" />}
              iconTone="bg-[var(--ff-primary-soft)] text-[var(--ff-primary)]"
            />
          </motion.div>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2"
        >
          <ChartFrame
            title="Tempo Focado"
            subtitle="Últimos 7 dias"
            rightIcon={<TrendingUp className="h-5 w-5" />}
          >
            <BarChartMock
              labels={weeklyData.labels}
              values={weeklyData.focusMinutes}
              maxValue={weeklyData.focusMax}
            />
          </ChartFrame>

          <ChartFrame
            title="Pomodoros"
            subtitle="Por dia"
            rightIcon={<Calendar className="h-5 w-5" />}
          >
            <LineChartMock
              labels={weeklyData.labels}
              values={weeklyData.pomodorosPerDay}
              maxValue={weeklyData.pomoMax}
            />
          </ChartFrame>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2"
        >
          <ChartFrame title="Tarefas por Categoria">
            <CategoryDistribution tasks={tasks} />
          </ChartFrame>

          <ChartFrame title="Desafios Ativos">
            <motion.div
              variants={staggerContainer}
              className="space-y-4"
            >
              {activeChallenges.length > 0 ? (
                activeChallenges.map((challenge) => (
                  <ChallengeCard
                    key={challenge.key}
                    title={challenge.title}
                    subtitle={challenge.description}
                    progressLabel={`${challenge.current}/${challenge.target}`}
                    value={Math.max(
                      0,
                      Math.min(1, challenge.progress_percent / 100)
                    )}
                  />
                ))
              ) : (
                <motion.div
                  variants={fadeUp}
                  className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-soft)] p-4 text-sm text-[var(--ff-text-muted)]"
                >
                  Nenhum desafio ativo encontrado no momento.
                </motion.div>
              )}
            </motion.div>
          </ChartFrame>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}