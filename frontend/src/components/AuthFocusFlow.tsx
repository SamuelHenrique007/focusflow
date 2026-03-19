import React, { useMemo, useState } from "react";
import { Timer } from "lucide-react";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type Mode = "login" | "register";

function TextField({
  id,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  autoComplete,
}: {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-slate-800">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none ring-blue-200 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4"
      />
    </div>
  );
}

export default function AuthFocusFlow() {
  const [mode, setMode] = useState<Mode>("login");

  // mocks
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const title = useMemo(
    () => (mode === "login" ? "Bem-vindo de volta" : "Criar sua conta"),
    [mode],
  );

  const subtitle = useMemo(
    () =>
      mode === "login"
        ? "Entre com sua conta para continuar"
        : "Comece sua jornada de produtividade",
    [mode],
  );

  const primaryLabel = mode === "login" ? "Entrar" : "Criar conta";

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // coloque sua lógica de auth aqui
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* fundo suave como nas outras telas */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_10%,rgba(59,130,246,0.10),transparent_55%),radial-gradient(circle_at_75%_15%,rgba(99,102,241,0.08),transparent_55%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-[1400px] items-center justify-center px-4 py-10">
        <div className="w-full max-w-[520px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
            {/* topo */}
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-600 text-white shadow-sm">
                  <Timer className="h-5 w-5" />
                </div>
                <p className="text-lg font-semibold text-slate-900">
                  FocusFlow
                </p>
              </div>

              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">
                {title}
              </h1>
              <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            </div>

            {/* formulário */}
            <form className="mt-6 space-y-4" onSubmit={onSubmit}>
              {mode === "register" ? (
                <TextField
                  id="name"
                  label="Nome"
                  placeholder="Seu nome completo"
                  value={name}
                  onChange={setName}
                  autoComplete="name"
                />
              ) : null}

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
                placeholder={
                  mode === "register" ? "Mínimo 8 caracteres" : "••••••••"
                }
                value={password}
                onChange={setPassword}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
              />

              <button
                type="submit"
                className={cx(
                  "mt-2 inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-sm",
                  "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200",
                )}
              >
                {primaryLabel}
              </button>
            </form>

            {/* rodapé */}
            <div className="mt-5 border-t border-slate-200 pt-4 text-center text-sm text-slate-600">
              {mode === "login" ? (
                <>
                  Não tem uma conta?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("register")}
                    className="font-semibold text-blue-700 hover:text-blue-800"
                  >
                    Criar conta
                  </button>
                </>
              ) : (
                <>
                  Já tem uma conta?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="font-semibold text-blue-700 hover:text-blue-800"
                  >
                    Entrar
                  </button>
                </>
              )}
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-slate-500">
            FocusFlow • autenticação
          </p>
        </div>
      </div>
    </div>
  );
}
