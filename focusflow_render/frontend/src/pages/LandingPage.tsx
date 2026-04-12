import React from "react";
import { useNavigate } from "react-router-dom";
import { motion, type Variants } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  LayoutDashboard,
  ListTodo,
  Timer,
  BarChart3,
  Trophy,
  Bell,
  Settings,
  ShoppingBag,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

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
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ duration: 0.25 }}
      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <motion.div
        className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-blue-600/10 blur-2xl"
        whileHover={{ scale: 1.15, opacity: 1 }}
        transition={{ duration: 0.3 }}
      />

      <div className="flex items-start gap-4">
        <motion.div
          whileHover={{ rotate: 6, scale: 1.08 }}
          transition={{ duration: 0.2 }}
          className="grid h-12 w-12 place-items-center rounded-md bg-blue-600 text-white shadow-sm"
        >
          {icon}
        </motion.div>

        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <p className="text-sm leading-relaxed text-slate-600">
            {description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

const features = [
  {
    icon: <ListTodo className="h-6 w-6" />,
    title: "Gestão de tarefas",
    description:
      "Crie, organize, edite e acompanhe tarefas com categorias, prioridades, prazos e progresso de execução.",
  },
  {
    icon: <Clock3 className="h-6 w-6" />,
    title: "Pomodoro integrado",
    description:
      "Use ciclos de foco e pausa com temporizador configurável para manter a concentração durante os estudos ou trabalho.",
  },
  {
    icon: <LayoutDashboard className="h-6 w-6" />,
    title: "Dashboard inteligente",
    description:
      "Visualize rapidamente as tarefas do dia, pendências, progresso diário e insights para impulsionar sua produtividade.",
  },
  {
    icon: <BarChart3 className="h-6 w-6" />,
    title: "Estatísticas de produtividade",
    description:
      "Acompanhe métricas de desempenho, sessões realizadas, distribuição das tarefas e evolução do foco ao longo do tempo.",
  },
  {
    icon: <Trophy className="h-6 w-6" />,
    title: "Conquistas e gamificação",
    description:
      "Desbloqueie medalhas, desafios e recompensas para tornar a rotina mais motivadora e manter constância no uso.",
  },
  {
    icon: <ShoppingBag className="h-6 w-6" />,
    title: "Loja e recompensas",
    description:
      "Utilize moedas e recompensas do sistema para personalizar sua experiência e valorizar o progresso alcançado.",
  },
  {
    icon: <Bell className="h-6 w-6" />,
    title: "Notificações",
    description:
      "Receba avisos e lembretes importantes sobre tarefas, foco, progresso e ações relevantes dentro da plataforma.",
  },
  {
    icon: <Settings className="h-6 w-6" />,
    title: "Configurações personalizadas",
    description:
      "Ajuste preferências do perfil, aparência, sons e parâmetros do Pomodoro para adaptar o sistema ao seu ritmo.",
  },
];

const highlights = [
  "Tarefas com prioridade e prazo",
  "Sessões Pomodoro configuráveis",
  "Dashboard com visão geral",
  "Estatísticas de produtividade",
  "Sistema de conquistas",
  "Notificações e preferências",
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-slate-50"
    >
      <motion.header
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <motion.div
              initial={{ scale: 0.8, rotate: -8, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-blue-600 text-white shadow-sm"
            >
              <Timer className="h-5 w-5" />
            </motion.div>

            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-semibold text-slate-900">
                FocusFlow
              </p>
              <p className="truncate text-xs text-slate-500">
                Produtividade, foco e constância
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Button
                variant="outline"
                className="cursor-pointer rounded-2xl"
                onClick={() => navigate("/login")}
              >
                Entrar
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Button
                className="cursor-pointer rounded-2xl bg-blue-600 font-semibold text-white hover:bg-blue-700"
                onClick={() => navigate("/register")}
              >
                Cadastre-se
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
        <motion.section
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="relative overflow-hidden rounded-2xl border border-slate-200 bg-linear-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-sm sm:p-8"
        >
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl"
          />
          <motion.div
            animate={{ scale: [1, 1.12, 1] }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.4,
            }}
            className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"
          />

          <div className="relative">
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 ring-1 ring-white/15"
            >
              <motion.span
                animate={{ scale: [1, 1.25, 1], opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 1.8, repeat: Infinity }}
                className="inline-block h-2 w-2 rounded-full bg-emerald-300"
              />
              Organize seu tempo e acompanhe sua evolução
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl"
            >
              Transforme sua rotina em <span className="text-amber-300">foco</span>{" "}
              e produtividade
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-3 max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base"
            >
              O FocusFlow é uma plataforma que ajuda você a organizar tarefas,
              manter ciclos de concentração com Pomodoro, acompanhar
              estatísticas, receber notificações e evoluir com recursos de
              gamificação.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="mt-6 flex flex-wrap items-center gap-3"
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Button
                  className="cursor-pointer rounded-2xl bg-white text-slate-900 hover:bg-white/90"
                  onClick={() => navigate("/register")}
                >
                  Comece agora
                  <motion.span
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                    className="inline-flex"
                  >
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </motion.span>
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Button
                  variant="outline"
                  className={cn(
                    "cursor-pointer rounded-2xl border-white/25 bg-white/10 text-white",
                    "hover:bg-white/15 hover:text-white",
                  )}
                  onClick={() => navigate("/login")}
                >
                  Já tenho conta
                </Button>
              </motion.div>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="mt-6 flex flex-wrap gap-4 text-xs text-white/85"
            >
              {[
                "Tarefas e prioridades",
                "Pomodoro configurável",
                "Estatísticas e progresso",
              ].map((item) => (
                <motion.div
                  key={item}
                  variants={fadeUp}
                  className="inline-flex items-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  {item}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>

        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          variants={staggerContainer}
          className="mt-10"
        >
          <motion.div variants={fadeUp} className="text-center">
            <p className="inline-flex rounded-full bg-blue-600/10 px-3 py-1 text-xs font-semibold text-blue-700">
              RECURSOS PRINCIPAIS
            </p>
            <h2 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">
              Tudo que você precisa para manter constância
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600">
              O FocusFlow reúne organização, foco, acompanhamento de desempenho
              e recursos motivacionais em uma experiência simples e prática.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            {features.map((feature) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </motion.div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="inline-flex rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold text-slate-700">
                SOBRE O SISTEMA
              </p>

              <h3 className="mt-3 text-2xl font-bold text-slate-900">
                Um apoio prático para estudar, trabalhar e manter o foco
              </h3>

              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                O FocusFlow foi desenvolvido para ajudar usuários a reduzir a
                procrastinação e melhorar a gestão do tempo. A plataforma reúne
                tarefas, sessões Pomodoro, dashboard, estatísticas,
                notificações, conquistas e personalização, oferecendo uma
                experiência completa para construção de hábitos produtivos.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {highlights.map((item) => (
                  <div
                    key={item}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              className="grid gap-3"
            >
              {[
                {
                  title: "Produtividade",
                  text: "Organize tarefas e acompanhe sua execução com mais clareza.",
                  icon: <LayoutDashboard className="h-5 w-5" />,
                },
                {
                  title: "Foco",
                  text: "Use sessões Pomodoro para manter atenção em blocos de trabalho.",
                  icon: <Timer className="h-5 w-5" />,
                },
                {
                  title: "Segurança e controle",
                  text: "Gerencie perfil, preferências e recursos do sistema em um só lugar.",
                  icon: <ShieldCheck className="h-5 w-5" />,
                },
              ].map((item) => (
                <motion.div
                  key={item.title}
                  variants={fadeUp}
                  whileHover={{ y: -4 }}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600/10 text-blue-600">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {item.title}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">{item.text}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative mt-10 overflow-hidden rounded-2xl border border-slate-200/50 bg-linear-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-sm sm:p-8"
        >
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 ring-1 ring-white/15">
                PRONTO PARA COMEÇAR?
              </p>
              <h3 className="mt-3 text-2xl font-bold">
                Organize suas tarefas e evolua com mais constância
              </h3>
              <p className="mt-2 max-w-2xl text-sm text-white/85">
                Crie sua conta para acessar tarefas, Pomodoro, estatísticas,
                conquistas, notificações e personalizações em um único lugar.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Button
                  className="cursor-pointer rounded-2xl bg-white text-slate-900 hover:bg-white/90"
                  onClick={() => navigate("/register")}
                >
                  Criar minha conta
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Button
                  variant="outline"
                  className="cursor-pointer rounded-2xl border-white/25 bg-white/10 text-white hover:bg-white/15 hover:text-white"
                  onClick={() => navigate("/login")}
                >
                  Acessar sistema
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.section>

        <motion.footer
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-10 border-t border-slate-200 pt-6 text-sm text-slate-500"
        >
          © {new Date().getFullYear()} FocusFlow — Projeto acadêmico.
        </motion.footer>
      </main>
    </motion.div>
  );
}