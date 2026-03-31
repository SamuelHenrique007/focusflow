import React from "react";
import { useNavigate } from "react-router-dom";
import { motion, type Variants } from "framer-motion";
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
                Produtividade & foco
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
              Um sistema para transformar foco em hábito
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl"
            >
              Pare de adiar e comece a{" "}
              <span className="text-amber-300">concluir</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-3 max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base"
            >
              O FocusFlow te ajuda a combater a procrastinação com tarefas
              organizadas, ciclos de Pomodoro e acompanhamento do seu progresso.
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
                "Pomodoro integrado",
                "Metas e prioridades",
                "Progresso e estatísticas",
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
              Uma experiência simples e organizada que utiliza tarefas, ciclos
              de foco e elementos de gamificação para tornar o progresso visível
              e motivador.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
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
          </motion.div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
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

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              className="mt-6 grid gap-3 sm:grid-cols-3"
            >
              {[
                {
                  title: "Missão",
                  text: "Ajudar usuários a concluir tarefas com mais foco e constância.",
                },
                {
                  title: "Visão",
                  text: "Tornar a produtividade mais simples e acessível no dia a dia.",
                },
                {
                  title: "Compromisso",
                  text: "Interface clara, feedback rápido e experiência consistente.",
                },
              ].map((item) => (
                <motion.div
                  key={item.title}
                  variants={fadeUp}
                  whileHover={{ y: -4 }}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left"
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">{item.text}</p>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="mt-8"
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Button
                  className="cursor-pointer rounded-2xl bg-blue-600 font-semibold text-white hover:bg-blue-700"
                  onClick={() => navigate("/register")}
                >
                  Criar minha conta
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </motion.section>

        <motion.footer
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-10 border-t border-slate-200 pt-6 text-sm text-slate-500"
        >
          © {new Date().getFullYear()} FocusFlow — Projeto acadêmico (TCC).
        </motion.footer>
      </main>
    </motion.div>
  );
}