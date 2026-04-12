import React, { useState } from "react";
import { forgotPasswordRequest } from "@/services/auth";
import FeedbackMessage from "@/components/ui/FeedbackMessage";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Mail, KeyRound, Timer, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function BenefitItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-white/10 p-4 ring-1 ring-white/10 backdrop-blur-sm">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/15 text-white">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-white/80">
          {description}
        </p>
      </div>
    </div>
  );
}

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setLoading(true);

    try {
      const response = await forgotPasswordRequest(email.trim().toLowerCase());
      setSuccessMessage(response.message || "Link de recuperação enviado com sucesso!");
      setEmail("");
    } catch {
      setErrorMessage("Não foi possível enviar o link de recuperação. Verifique o e-mail informado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.14),transparent_30%)]" />

      <div className="relative w-full max-w-6xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl lg:grid lg:grid-cols-2">
        {/* Lado Esquerdo - Banner Lateral */}
        <section className="relative hidden overflow-hidden bg-linear-to-br from-blue-600 via-indigo-600 to-slate-900 p-8 lg:flex lg:flex-col lg:justify-center">
          <div className="absolute inset-0">
            <div className="absolute -left-10 top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute bottom-10 right-0 h-56 w-56 rounded-full bg-cyan-300/10 blur-3xl" />
          </div>

          <div className="relative">
            <div className="inline-flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/10 backdrop-blur-sm">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-blue-600 shadow-sm">
                <Timer className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">FocusFlow</p>
                <p className="text-xs text-white/75">
                  Produtividade, foco e constância
                </p>
              </div>
            </div>

            <div className="mt-10 max-w-md">
              <h1 className="mt-5 text-4xl font-extrabold leading-tight text-white">
                Recupere seu <span className="text-amber-300">acesso</span>
              </h1>
              <p className="mt-4 text-base text-white/80">
                Não se preocupe, é fácil voltar para a sua rotina de foco. Siga os passos para redefinir sua senha com segurança.
              </p>
            </div>

            <div className="mt-10 grid gap-4">
              <BenefitItem
                icon={<Mail className="h-5 w-5" />}
                title="1. Informe seu e-mail"
                description="Digite o endereço associado à sua conta do FocusFlow."
              />
              <BenefitItem
                icon={<ShieldCheck className="h-5 w-5" />}
                title="2. Verifique sua caixa de entrada"
                description="Enviaremos um link seguro e exclusivo para você."
              />
              <BenefitItem
                icon={<KeyRound className="h-5 w-5" />}
                title="3. Crie uma nova senha"
                description="Escolha uma senha forte e volte a focar no que importa."
              />
            </div>
          </div>
        </section>

        {/* Lado Direito - Formulário */}
        <section className="flex items-center justify-center bg-white p-6 sm:p-8 lg:p-10">
          <div className="w-full max-w-md">
            {/* Header Mobile Oculto no Desktop */}
            <div className="mb-6 flex items-center justify-center gap-3 lg:hidden">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-600 text-white shadow-sm">
                <Timer className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-lg font-semibold text-slate-900">
                  FocusFlow
                </p>
                <p className="text-xs text-slate-500">
                  Produtividade & foco
                </p>
              </div>
            </div>

            <div className="text-center lg:text-left">
              <motion.h2
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-bold tracking-tight text-slate-900"
              >
                Recuperar senha
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="mt-2 text-sm leading-relaxed text-slate-500"
              >
                Informe seu e-mail para receber o link de redefinição e voltar ao seu fluxo de trabalho.
              </motion.p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
              <div>
                <label className="text-sm font-semibold text-slate-800">
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage("");
                    if (successMessage) setSuccessMessage("");
                  }}
                  placeholder="seu@email.com"
                  autoComplete="email"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none ring-blue-200 placeholder:text-slate-400 transition focus:border-blue-500 focus:bg-white focus:ring-4"
                />
              </div>

              {/* Animação suave para as mensagens de feedback */}
              <AnimatePresence mode="wait">
                {errorMessage && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <FeedbackMessage message={errorMessage} variant="error" />
                  </motion.div>
                )}
                {successMessage && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <FeedbackMessage message={successMessage} variant="success" />
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className={cx(
                  "cursor-pointer mt-2 inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-sm transition",
                  "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200",
                  loading && "cursor-not-allowed opacity-70"
                )}
              >
                {loading ? "Enviando..." : "Enviar link"}
              </motion.button>
            </form>

            <div className="mt-8 border-t border-slate-200 pt-6 text-center">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="group cursor-pointer inline-flex items-center justify-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Voltar para o login
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}