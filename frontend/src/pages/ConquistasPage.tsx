import { useMemo } from "react";
import {
  Trophy,
  Flame,
  Sparkles,
  Star,
  Lock,
  CheckCircle2,
} from "lucide-react";

import { Badge } from "@/components/common/Badge";
import { ProgressBar } from "@/components/common/ProgressBar";
import { StatCard } from "@/components/common/StatCard";

type Achievement = {
  id: string;
  title: string;
  description: string;
  points: number;
  unlocked: boolean;
  progress?: number; 
  hint?: string;
};

function AchievementCard({ a }: { a: Achievement }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={
              "grid h-12 w-12 place-items-center rounded-2xl ring-1 " +
              (a.unlocked
                ? "bg-amber-50 text-amber-700 ring-amber-200"
                : "bg-slate-50 text-slate-500 ring-slate-200")
            }
          >
            {a.unlocked ? (
              <Trophy className="h-6 w-6" />
            ) : (
              <Lock className="h-6 w-6" />
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {a.title}
            </p>
            <p className="mt-1 text-sm text-slate-500">{a.description}</p>
            {a.hint ? (
              <p className="mt-2 text-xs text-slate-500">💡 {a.hint}</p>
            ) : null}
          </div>
        </div>

        <Badge tone={a.unlocked ? "warning" : "neutral"}>
          <span className="whitespace-nowrap">{a.points} pts</span>
        </Badge>
      </div>

      {typeof a.progress === "number" && !a.unlocked ? (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Progresso</span>
            <span className="font-semibold text-slate-700">
              {Math.round(a.progress * 100)}%
            </span>
          </div>
          <div className="mt-2">
            <ProgressBar value={a.progress} barClassName="bg-amber-500" />
          </div>
        </div>
      ) : null}

      {a.unlocked ? (
        <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-700">
          <CheckCircle2 className="h-4 w-4" /> Desbloqueada
        </div>
      ) : null}
    </div>
  );
}

export default function ConquistasPage() {
  const streakDays = 1;

  const level = 1;
  const xpNow = 0;
  const xpMax = 100;
  const xpPct = xpMax ? xpNow / xpMax : 0;

  const achievements = useMemo<Achievement[]>(
    () => [
      {
        id: "a1",
        title: "Primeiro Pomodoro",
        description: "Complete 1 sessão Pomodoro.",
        points: 10,
        unlocked: true,
      },
      {
        id: "a2",
        title: "Semana Produtiva",
        description: "Complete 5 tarefas na semana.",
        points: 25,
        unlocked: false,
        progress: 2 / 5,
        hint: "Marque tarefas rápidas como concluídas para ganhar ritmo.",
      },
      {
        id: "a3",
        title: "Foco de Ferro",
        description: "Foque por 2 horas em um dia.",
        points: 30,
        unlocked: false,
        progress: 0 / 120,
        hint: "4 pomodoros de 25 min já dão 100 min.",
      },
      {
        id: "a4",
        title: "Streak 7 dias",
        description: "Mantenha 7 dias seguidos de produtividade.",
        points: 50,
        unlocked: false,
        progress: streakDays / 7,
      },
    ],
    [streakDays],
  );

  const unlocked = achievements.filter((a) => a.unlocked);
  const locked = achievements.filter((a) => !a.unlocked);
  const totalPoints = unlocked.reduce((sum, a) => sum + a.points, 0);

  const unlockedCount = unlocked.length;
  const lockedCount = locked.length;
  const achievementsPct = achievements.length
    ? unlockedCount / achievements.length
    : 0;



  return (
  <>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Conquistas
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Desbloqueie conquistas completando desafios
        </p>
      </div>

      <div>
        <Badge tone="warning">
          <Flame className="h-4 w-4" />
          {streakDays} dia
        </Badge>
      </div>
    </div>

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

    <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/60 p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-100 text-amber-700 ring-1 ring-amber-200">
            <Trophy className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Progresso de Conquistas
            </p>
            <p className="mt-1 text-xs text-slate-600">
              {unlockedCount} de {unlockedCount + lockedCount} desbloqueadas
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-3xl font-semibold tracking-tight text-amber-700">
            {Math.round(achievementsPct * 100)}%
          </p>
        </div>
      </div>

      <div className="mt-4">
        <ProgressBar value={achievementsPct} barClassName="bg-amber-500" />
      </div>
    </div>

    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Desbloqueadas"
        value={`${unlockedCount}`}
        icon={<Star className="h-6 w-6" />}
        iconTone="bg-amber-50 text-amber-700"
      />
      <StatCard
        title="Bloqueadas"
        value={`${lockedCount}`}
        icon={<Lock className="h-6 w-6" />}
        iconTone="bg-slate-100 text-slate-700"
      />
      <StatCard
        title="Pontos Totais"
        value={`${totalPoints}`}
        icon={<Sparkles className="h-6 w-6" />}
        iconTone="bg-indigo-50 text-indigo-700"
      />
      <StatCard
        title="Nível Atual"
        value={`${level}`}
        icon={<Trophy className="h-6 w-6" />}
        iconTone="bg-amber-50 text-amber-700"
      />
    </div>

    <div className="mt-8">
      <div className="flex items-center gap-2">
        <Star className="h-5 w-5 text-amber-600" />
        <h2 className="text-base font-semibold text-slate-900">
          Desbloqueadas ({unlocked.length})
        </h2>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {unlocked.map((a) => (
          <AchievementCard key={a.id} a={a} />
        ))}
      </div>
    </div>

    <div className="mt-8">
      <div className="flex items-center gap-2">
        <Lock className="h-5 w-5 text-slate-500" />
        <h2 className="text-base font-semibold text-slate-900">
          Bloqueadas ({locked.length})
        </h2>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {locked.map((a) => (
          <AchievementCard key={a.id} a={a} />
        ))}
      </div>
    </div>
  </>
);
}