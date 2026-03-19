"use client";

import React, { useMemo } from "react";
import {
  Flame,
  Sparkles,
  Clock3,
  CheckCircle2,
  Target,
  TrendingUp,
  Calendar,
} from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/common/Badge";
import { ProgressBar } from "@/components/common/ProgressBar";
import { StatCard } from "@/components/common/StatCard";

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
              <div className="h-40 rounded-2xl bg-slate-50 ring-1 ring-slate-200">
                <div
                  className="h-full w-full rounded-2xl bg-blue-600/20"
                  style={{
                    transformOrigin: "bottom",
                    transform: `scaleY(${h})`,
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

function DonutMock({
  aLabel,
  bLabel,
  aPct,
}: {
  aLabel: string;
  bLabel: string;
  aPct: number;
}) {
  const a = Math.max(0, Math.min(1, aPct));
  const b = 1 - a;
  const aDeg = Math.round(a * 360);
  return (
    <div className="flex items-center gap-5">
      <div
        className="h-28 w-28 rounded-full"
        style={{
          background: `conic-gradient(rgba(37,99,235,0.25) 0 ${aDeg}deg, rgba(16,185,129,0.25) ${aDeg}deg 360deg)`,
        }}
      />
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-600/30" />
          <span className="text-sm font-medium text-slate-700">
            {aLabel} • {Math.round(a * 100)}%
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/30" />
          <span className="text-sm font-medium text-slate-700">
            {bLabel} • {Math.round(b * 100)}%
          </span>
        </div>
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

export default function EstatisticasPage() {
  const streakDays = 1;

  const level = 1;
  const xpNow = 0;
  const xpMax = 100;
  const xpPct = xpMax ? xpNow / xpMax : 0;

  const stats = useMemo(
    () => ({
      tempoTotal: "4h",
      tarefasConcluidas: "2",
      pomodoros: "10",
      maiorSequencia: "1 dias",
    }),
    [],
  );

  const labels = [
    "Quinta",
    "Sexta",
    "Sábado",
    "Domingo",
    "Segunda",
    "Terça",
    "Quarta",
  ];
  const focusMinutes = [0, 0, 0, 0, 0, 280, 0];
  const pomodorosPerDay = [0, 0, 0, 0, 0, 11, 0];
  const focusMax = 280;
  const pomoMax = 12;

  const userEmail = "sh0161663@gmail.com";

  return (
    <AppShell
      activeKey="stats"
      userEmail={userEmail}
      rightActions={
        <Badge tone="warning" className="hidden lg:inline-flex">
          <Flame className="h-4 w-4" />
          {streakDays} dia
        </Badge>
      }
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Estatísticas
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Acompanhe seu progresso e desempenho
          </p>
        </div>

        <div className="lg:hidden">
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

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Tempo Total"
          value={stats.tempoTotal}
          subtitle="de foco"
          icon={<Clock3 className="h-5 w-5" />}
          iconTone="bg-blue-50 text-blue-700"
        />
        <StatCard
          title="Tarefas"
          value={stats.tarefasConcluidas}
          subtitle="concluídas"
          icon={<CheckCircle2 className="h-5 w-5" />}
          iconTone="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          title="Pomodoros"
          value={stats.pomodoros}
          subtitle="completados"
          icon={<Target className="h-5 w-5" />}
          iconTone="bg-rose-50 text-rose-700"
        />
        <StatCard
          title="Maior Sequência"
          value={stats.maiorSequencia}
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
            labels={labels}
            values={focusMinutes}
            maxValue={focusMax}
          />
        </ChartFrame>

        <ChartFrame
          title="Pomodoros"
          subtitle="Por dia"
          rightIcon={<Calendar className="h-5 w-5 text-emerald-600" />}
        >
          <LineChartMock
            labels={labels}
            values={pomodorosPerDay}
            maxValue={pomoMax}
          />
        </ChartFrame>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartFrame title="Tarefas por Categoria">
          <DonutMock aLabel="Trabalho" bLabel="Pessoal" aPct={0.55} />
        </ChartFrame>

        <ChartFrame title="Desafios Ativos">
          <div className="space-y-4">
            <ChallengeCard
              title="Complete 5 tarefas esta semana"
              subtitle="🕒 6 dias restantes"
              progressLabel="2/5"
              value={2 / 5}
            />
            <ChallengeCard
              title="Foque por 2 horas hoje"
              subtitle="🕒 Último dia!"
              progressLabel="0/120"
              value={0 / 120}
            />
          </div>
        </ChartFrame>
      </div>
    </AppShell>
  );
}
