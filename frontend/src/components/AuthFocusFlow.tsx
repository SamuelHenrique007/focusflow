import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Clock3, Sparkles, Target, Timer, Eye, EyeOff } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToastStore } from "@/store/useToastStore";
import { motion, AnimatePresence } from "framer-motion";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type Mode = "login" | "register";

type BackendErrorResponse = {
  detail?: string | string[];
  email?: string[];
  name?: string[];
  password?: string[];
  non_field_errors?: string[];
};

function translateErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("no active account found")) {
    return "E-mail ou senha inválidos.";
  }

  if (normalized.includes("this field is required")) {
    return "Preencha os campos obrigatórios.";
  }

  if (normalized.includes("already exists")) {
    return "Já existe uma conta com esses dados.";
  }

  if (
    normalized.includes("valid email") ||
    normalized.includes("valid e-mail") ||
    normalized.includes("enter a valid email") ||
    normalized.includes("informe um e-mail válido")
  ) {
    return "Informe um e-mail válido.";
  }

  if (normalized.includes("password")) {
    return "A senha informada não atende aos requisitos.";
  }

  return message;
}

function getBackendErrorMessage(error: unknown) {
  const fallback = "Não foi possível concluir a operação.";

  if (!axios.isAxiosError<BackendErrorResponse>(error)) {
    return fallback;
  }

  const data = error.response?.data;

  if (!data) {
    return fallback;
  }

  const rawMessage =
    (Array.isArray(data.detail) ? data.detail[0] : data.detail) ||
    data.email?.[0] ||
    data.name?.[0] ||
    data.password?.[0] ||
    data.non_field_errors?.[0] ||
    fallback;

  return translateErrorMessage(String(rawMessage));
}

function TextField({
  id,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  autoComplete,
  isPassword = false,
}: {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  isPassword?: boolean;
}) {
  const [showPassword, setShowPassword] = useState(false);

  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

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
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cx(
            "w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-4 text-sm text-slate-900 outline-none ring-blue-200 placeholder:text-slate-400 transition focus:border-blue-500 focus:bg-white focus:ring-4",
            isPassword ? "pr-12" : "pr-4",
          )}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 transition-colors hover:text-blue-600 focus:outline-none"
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

export default function AuthFocusFlow() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();
  const pushToast = useToastStore((state) => state.pushToast);

  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  function showToast(
    variant: "success" | "error" | "info",
    title: string,
    description: string,
  ) {
    pushToast({
      variant,
      title,
      description,
      duration: 4200,
    });
  }

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (location.pathname === "/register") {
      setMode("register");
    } else {
      setMode("login");
    }

    setPassword("");
  }, [location.pathname]);

  const title = useMemo(
    () => (mode === "login" ? "Bem-vindo de volta" : "Criar sua conta"),
    [mode],
  );

  const subtitle = useMemo(
    () =>
      mode === "login"
        ? "Entre com sua conta para continuar sua jornada de foco."
        : "Crie sua conta e comece a organizar suas tarefas com mais constância.",
    [mode],
  );

  const primaryLabel =
    loading ? "Carregando..." : mode === "login" ? "Entrar" : "Criar conta";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const payloadName = name.trim();
    const payloadEmail = email.trim().toLowerCase();
    const payloadPassword = password.trim();

    if (mode === "register" && !payloadName) {
      showToast("error", "Erro no cadastro", "Informe seu nome.");
      setLoading(false);
      return;
    }

    if (!payloadEmail) {
      showToast(
        "error",
        mode === "login" ? "Erro no login" : "Erro no cadastro",
        "Informe seu e-mail.",
      );
      setLoading(false);
      return;
    }

    if (!payloadEmail.includes("@") || !payloadEmail.includes(".")) {
      showToast(
        "error",
        mode === "login" ? "Erro no login" : "Erro no cadastro",
        "Informe um e-mail válido.",
      );
      setLoading(false);
      return;
    }

    if (!payloadPassword) {
      showToast(
        "error",
        mode === "login" ? "Erro no login" : "Erro no cadastro",
        "Informe sua senha.",
      );
      setLoading(false);
      return;
    }

    try {
      if (mode === "register") {
        await register({
          name: payloadName,
          email: payloadEmail,
          password: payloadPassword,
        });

        showToast(
          "success",
          "Conta criada",
          "Cadastro realizado com sucesso.",
        );
        navigate("/dashboard", { replace: true });
        return;
      }

      await login({
        email: payloadEmail,
        password: payloadPassword,
      });

      showToast("success", "Login realizado", "Bem-vindo de volta!");
      navigate("/dashboard", { replace: true });
    } catch (error: unknown) {
      const backendError = getBackendErrorMessage(error);

      showToast(
        "error",
        mode === "login" ? "Falha ao entrar" : "Falha ao cadastrar",
        backendError,
      );
    } finally {
      setLoading(false);
    }
  }

  function switchMode(nextMode: Mode) {
    if (nextMode === "login") {
      navigate("/login");
    } else {
      navigate("/register");
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.14),transparent_30%)]" />

      <div className="relative w-full max-w-6xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl lg:grid lg:grid-cols-2">
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
                Transforme intenção em{" "}
                <span className="text-amber-300">ação diária</span>
              </h1>
            </div>

            <div className="mt-10 grid gap-4">
              <BenefitItem
                icon={<Clock3 className="h-5 w-5" />}
                title="Sessões de foco"
                description="Use a técnica Pomodoro para manter ritmo e reduzir distrações."
              />
              <BenefitItem
                icon={<Target className="h-5 w-5" />}
                title="Metas visíveis"
                description="Tenha clareza sobre prioridades e avance com mais consistência."
              />
              <BenefitItem
                icon={<Sparkles className="h-5 w-5" />}
                title="Experiência motivadora"
                description="Visualize progresso e torne o hábito produtivo mais envolvente."
              />
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center bg-white p-6 sm:p-8 lg:p-10">
          <div className="w-full max-w-md">
            <div className="mb-6 flex items-center justify-center gap-3 lg:hidden">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-600 text-white shadow-sm">
                <Timer className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-lg font-semibold text-slate-900">
                  FocusFlow
                </p>
                <p className="text-xs text-slate-500">Produtividade & foco</p>
              </div>
            </div>

            <div className="text-center lg:text-left">
              <motion.h2
                key={title}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-bold tracking-tight text-slate-900"
              >
                {title}
              </motion.h2>

              <motion.p
                key={subtitle}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="mt-2 text-sm leading-relaxed text-slate-500"
              >
                {subtitle}
              </motion.p>
            </div>

            <form className="mt-8 flex flex-col gap-4" onSubmit={onSubmit}>
              <AnimatePresence initial={false}>
                {mode === "register" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <TextField
                      id="name"
                      label="Nome de usuário"
                      placeholder="Seu nome de usuário"
                      value={name}
                      onChange={setName}
                      autoComplete="username"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <TextField
                id="email"
                label="E-mail"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={setEmail}
                autoComplete="email"
              />

              <TextField
                id="password"
                label="Senha"
                type="password"
                isPassword={true}
                placeholder={
                  mode === "register" ? "Mínimo 8 caracteres" : "••••••••"
                }
                value={password}
                onChange={setPassword}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
              />

              <AnimatePresence>
                {mode === "login" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex justify-end overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => navigate("/forgot-password")}
                      className="mt-1 cursor-pointer text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      Esqueceu a senha?
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className={cx(
                  "mt-2 inline-flex w-full cursor-pointer items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200",
                  loading && "cursor-not-allowed opacity-70",
                )}
              >
                {primaryLabel}
              </motion.button>
            </form>

            <div className="mt-6 border-t border-slate-200 pt-5 text-center text-sm text-slate-600">
              {mode === "login" ? (
                <>
                  Não tem uma conta?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("register")}
                    className="cursor-pointer font-semibold text-blue-700 transition-colors hover:text-blue-800"
                  >
                    Criar conta
                  </button>
                </>
              ) : (
                <>
                  Já tem uma conta?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("login")}
                    className="cursor-pointer font-semibold text-blue-700 transition-colors hover:text-blue-800"
                  >
                    Entrar
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}