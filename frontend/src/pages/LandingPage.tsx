"use client";

import React from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  LayoutDashboard,
  ListTodo,
  Sparkles,
  Timer,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-blue-600/10 blur-2xl transition group-hover:bg-blue-600/20" />
      <div className="flex items-start gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-md bg-blue-600 text-white shadow-sm">
          {icon}
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <p className="text-sm leading-relaxed text-slate-600">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Topbar (mesmo padrão do AppShell mobile) */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-blue-600 text-white shadow-sm">
              <Timer className="h-5 w-5" />
            </div>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-semibold text-slate-900">
                FocusFlow
              </p>
              <p className="truncate text-xs text-slate-500">
                Produtividade & foco
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" className="rounded-2xl">
              Login
            </Button>
            <Button className="rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold">
              Cadastre-se
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
        {/* HERO (card com gradient, como nos highlights do Dashboard) */}
        <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-linear-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-sm sm:p-8">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
          <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 ring-1 ring-white/15">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-300" />
              Um sistema para transformar foco em hábito
            </div>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Pare de adiar e comece a{" "}
              <span className="text-amber-300">concluir</span>
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base">
              O FocusFlow te ajuda a combater a procrastinação com tarefas
              organizadas, ciclos de Pomodoro e acompanhamento do seu progresso.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button className="rounded-2xl bg-white text-slate-900 hover:bg-white/90">
                Comece agora
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                className={cn(
                  "rounded-2xl border-white/25 bg-white/10 text-white",
                  "hover:bg-white/15 hover:text-white",
                )}
              >
                Já tenho conta
              </Button>
            </div>

            <div className="mt-6 flex flex-wrap gap-4 text-xs text-white/85">
              <div className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                Pomodoro integrado
              </div>
              <div className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                Metas e prioridades
              </div>
              <div className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                Progresso e estatísticas
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mt-10">
          <div className="text-center">
            <p className="inline-flex rounded-full bg-blue-600/10 px-3 py-1 text-xs font-semibold text-blue-700">
              RECURSOS PRINCIPAIS
            </p>
            <h2 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">
              Tudo que você precisa para manter constância
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600">
              Uma experiência simples e organizada que utiliza tarefas, ciclos
              de foco e elementos de gamificação para tornar o progresso visível
              e motivador.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={<ListTodo className="h-6 w-6" />}
              title="Gestão de tarefas"
              description="Crie, organize e acompanhe suas atividades para manter controle do que precisa ser feito."
            />

            <FeatureCard
              icon={<Clock3 className="h-6 w-6" />}
              title="Pomodoro"
              description="Utilize ciclos de foco e pausa para melhorar a concentração e produtividade."
            />

            <FeatureCard
              icon={<LayoutDashboard className="h-6 w-6" />}
              title="Dashboard"
              description="Visualize rapidamente suas tarefas pendentes, concluídas e seu progresso."
            />

            <FeatureCard
              icon={<Sparkles className="h-6 w-6" />}
              title="Gamificação"
              description="Elementos motivacionais como progresso e recompensas para incentivar a conclusão de tarefas."
            />
          </div>
        </section>

        {/* Sobre */}
        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="inline-flex rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold text-slate-700">
              SOBRE O PROJETO
            </p>
            <h3 className="mt-3 text-2xl font-bold text-slate-900">
              Um apoio prático para reduzir a procrastinação
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              O FocusFlow foi pensado para facilitar o início das tarefas e
              reduzir o adiamento, combinando organização, gestão de tempo e
              feedbacks de progresso. O objetivo é apoiar a criação de hábitos
              produtivos de forma gradual e sustentável.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left">
                <p className="text-sm font-semibold text-slate-900">Missão</p>
                <p className="mt-1 text-sm text-slate-600">
                  Ajudar usuários a concluir tarefas com mais foco e constância.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left">
                <p className="text-sm font-semibold text-slate-900">Visão</p>
                <p className="mt-1 text-sm text-slate-600">
                  Tornar a produtividade mais simples e acessível no dia a dia.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left">
                <p className="text-sm font-semibold text-slate-900">
                  Compromisso
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Interface clara, feedback rápido e experiência consistente.
                </p>
              </div>
            </div>

            <div className="mt-8">
              <Button className="rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                Criar minha conta
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-10 border-t border-slate-200 pt-6 text-sm text-slate-500">
          © {new Date().getFullYear()} FocusFlow — Projeto acadêmico (TCC).
        </footer>
      </main>
    </div>
  );
}
