import React, { useEffect, useMemo, useState } from "react";
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
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          {subtitle ? (
            <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
          ) : null}
        </div>
        {rightIcon ? (
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-50 ring-1 ring-slate-200">
            {rightIcon}
          </div>
        ) : null}
      </div>

      <div className="mt-4">{children}</div>
    </div>
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
            <div key={labels[i]} className="flex-1">
              <div className="flex h-40 items-end rounded-2xl bg-slate-50 ring-1 ring-slate-200">
                <div
                  className="w-full rounded-2xl bg-blue-600/25 transition-all duration-500"
                  style={{
                    height: `${h * 100}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-center text-xs text-slate-500">
                {labels[i]}
              </p>
            </div>
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
    <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
      <div className="space-y-3">
        {values.map((v, i) => {
          const pct = maxValue ? Math.max(0, Math.min(1, v / maxValue)) : 0;
          return (
            <div key={labels[i]} className="flex items-center gap-3">
              <span className="w-16 text-xs font-medium text-slate-600">
                {labels[i]}
              </span>
              <div className="flex-1">
                <ProgressBar value={pct} barClassName="bg-emerald-500" />
              </div>
              <span className="w-10 text-right text-xs font-semibold text-slate-700">
                {v}
              </span>
            </div>
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
        barClassName: "bg-blue-600",
      },
      {
        label: "Trabalho",
        count: counts.trabalho,
        pct: total > 0 ? counts.trabalho / total : 0,
        barClassName: "bg-emerald-500",
      },
      {
        label: "Pessoal",
        count: counts.pessoal,
        pct: total > 0 ? counts.pessoal / total : 0,
        barClassName: "bg-amber-500",
      },
    ];
  }, [tasks, total]);

  return (
    <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
      <div className="space-y-4">
        {categoryData.map((item) => (
          <div key={item.label}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-slate-700">
                {item.label}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {item.count} {item.count === 1 ? "tarefa" : "tarefas"}
              </span>
            </div>
            <ProgressBar value={item.pct} barClassName={item.barClassName} />
          </div>
        ))}

        {total === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma tarefa cadastrada ainda.</p>
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
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        </div>
        <span className="text-xs font-semibold text-slate-700">
          {progressLabel}
        </span>
      </div>

      <div className="mt-3">
        <ProgressBar value={value} barClassName="bg-blue-600" />
      </div>
    </div>
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
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Estatísticas
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Acompanhe seu progresso e desempenho com dados reais.
          </p>
        </div>

        <div>
          <Badge tone="warning">
            <Flame className="h-4 w-4" />
            {streakDays} {streakDays === 1 ? "dia" : "dias"}
          </Badge>
        </div>
      </div>

      {errorMessage ? (
        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="mt-5 rounded-2xl border border-slate-200 bg-linear-to-r from-slate-50 to-indigo-50 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <Badge tone="info">
            <Sparkles className="h-4 w-4" />
            Nível {level}
          </Badge>
          <p className="text-xs font-medium text-slate-500">
            {xpNow}/{xpMax} XP
          </p>
        </div>

        <div className="mt-4">
          <ProgressBar value={xpPct} />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Tempo Total"
          value={loading ? "..." : overviewStats.tempoTotal}
          subtitle="de foco"
          icon={<Clock3 className="h-5 w-5" />}
          iconTone="bg-blue-50 text-blue-700"
        />
        <StatCard
          title="Tarefas"
          value={loading ? "..." : overviewStats.tarefasConcluidas}
          subtitle="concluídas"
          icon={<CheckCircle2 className="h-5 w-5" />}
          iconTone="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          title="Pomodoros"
          value={loading ? "..." : overviewStats.pomodoros}
          subtitle="completados"
          icon={<Target className="h-5 w-5" />}
          iconTone="bg-rose-50 text-rose-700"
        />
        <StatCard
          title="Maior Sequência"
          value={loading ? "..." : overviewStats.maiorSequencia}
          subtitle="de produtividade"
          icon={<Flame className="h-5 w-5" />}
          iconTone="bg-amber-50 text-amber-800"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartFrame
          title="Tempo Focado"
          subtitle="Últimos 7 dias"
          rightIcon={<TrendingUp className="h-5 w-5 text-blue-600" />}
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
          rightIcon={<Calendar className="h-5 w-5 text-emerald-600" />}
        >
          <LineChartMock
            labels={weeklyData.labels}
            values={weeklyData.pomodorosPerDay}
            maxValue={weeklyData.pomoMax}
          />
        </ChartFrame>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartFrame title="Tarefas por Categoria">
          <CategoryDistribution tasks={tasks} />
        </ChartFrame>

        <ChartFrame title="Desafios Ativos">
          <div className="space-y-4">
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
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                Nenhum desafio ativo encontrado no momento.
              </div>
            )}
          </div>
        </ChartFrame>
      </div>
    </>
  );
}