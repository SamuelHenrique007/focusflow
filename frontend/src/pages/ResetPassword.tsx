import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AxiosError } from "axios";
import { resetPasswordRequest } from "@/services/auth";
import FeedbackMessage from "@/components/ui/FeedbackMessage";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, KeyRound, Timer, Eye, EyeOff, CheckCircle2 } from "lucide-react";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type ResetPasswordErrorResponse = {
  detail?: string;
  new_password?: string[];
  confirm_new_password?: string[];
};

// Componente de input reutilizável com botão de visibilidade da senha
function TextField({
  id,
  label,
  placeholder,
  value,
  onChange,
  isPassword = false,
}: {
  id: string;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  isPassword?: boolean;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = isPassword ? (showPassword ? "text" : "password") : "text";

  return (
    <div className="w-full">
      <label htmlFor={id} className="text-sm font-semibold text-slate-800">
        {label}
      </label>
      <div className="relative mt-2">
        <input
          id={id}
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cx(
            "w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-4 text-sm text-slate-900 outline-none ring-blue-200 placeholder:text-slate-400 transition focus:border-blue-500 focus:bg-white focus:ring-4",
            isPassword ? "pr-12" : "pr-4"
          )}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 text-slate-400 hover:text-blue-600 focus:outline-none transition-colors"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Eye className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        )}
      </div>
    </div>
  );
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

export default function ResetPassword() {
  const { uid = "", token = "" } = useParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  function validatePasswords() {
    if (!newPassword || !confirmNewPassword) {
      return "Preencha todos os campos.";
    }

    if (newPassword.length < 8) {
      return "A senha deve possuir pelo menos 8 caracteres.";
    }

    if (newPassword !== confirmNewPassword) {
      return "As senhas não coincidem.";
    }

    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    const validationError = validatePasswords();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setLoading(true);

    try {
      const response = await resetPasswordRequest({
        uid,
        token,
        new_password: newPassword,
        confirm_new_password: confirmNewPassword,
      });

      setSuccessMessage(response.message || "Senha redefinida com sucesso!");

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error: unknown) {
      let message =
        "Não foi possível redefinir a senha. Verifique se o link ainda é válido.";

      if (error instanceof AxiosError) {
        const data = error.response?.data as ResetPasswordErrorResponse | undefined;

        message =
          data?.detail ||
          data?.new_password?.[0] ||
          data?.confirm_new_password?.[0] ||
          message;
      } else if (error instanceof Error) {
        message = error.message;
      }

      setErrorMessage(message);
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
                Defina sua <span className="text-amber-300">nova senha</span>
              </h1>
              <p className="mt-4 text-base text-white/80">
                Você está a um passo de recuperar sua conta e voltar a organizar suas tarefas.
              </p>
            </div>

            <div className="mt-10 grid gap-4">
              <BenefitItem
                icon={<KeyRound className="h-5 w-5" />}
                title="1. Escolha uma senha forte"
                description="Use pelo menos 8 caracteres para garantir a segurança da sua conta."
              />
              <BenefitItem
                icon={<ShieldCheck className="h-5 w-5" />}
                title="2. Confirme sua senha"
                description="Digite novamente para evitar erros de digitação."
              />
              <BenefitItem
                icon={<CheckCircle2 className="h-5 w-5" />}
                title="3. Volte ao foco"
                description="Pronto! Você será redirecionado para o login automaticamente."
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
                Nova senha
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="mt-2 text-sm leading-relaxed text-slate-500"
              >
                Defina sua nova senha para acessar sua conta com segurança.
              </motion.p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
              <TextField
                id="newPassword"
                label="Nova senha"
                placeholder="Mínimo de 8 caracteres"
                value={newPassword}
                onChange={(value) => {
                  setNewPassword(value);
                  if (errorMessage) setErrorMessage("");
                }}
                isPassword={true}
              />

              <TextField
                id="confirmNewPassword"
                label="Confirmar nova senha"
                placeholder="Confirme sua nova senha"
                value={confirmNewPassword}
                onChange={(value) => {
                  setConfirmNewPassword(value);
                  if (errorMessage) setErrorMessage("");
                }}
                isPassword={true}
              />

              {/* Mensagens de Feedback com animação */}
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
                {loading ? "Salvando..." : "Redefinir senha"}
              </motion.button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}