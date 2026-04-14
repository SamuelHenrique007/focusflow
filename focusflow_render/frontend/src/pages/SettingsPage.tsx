import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Palette,
  Volume2,
  Smile,
  RotateCcw,
  Clock3,
  Save,
  Sparkles,
  UserCog,
  ShieldCheck,
  Eye,
  EyeOff,
  Info,
  CheckCircle2,
  Timer,
  LayoutDashboard,
  ListTodo,
  BarChart3,
  Trophy,
  Bell,
  ShoppingBag,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useGameStore } from "@/store/useGameStore";
import { useThemeStore } from "@/store/useThemeStore";
import { useAvatarStore } from "@/store/useAvatarStore";
import { useSoundStore, DEFAULT_SOUND_KEY } from "@/store/useSoundStore";
import { useToastStore } from "@/store/useToastStore";
import { gamificationService } from "@/services/gamificationService";
import {
  getPomodoroSettings,
  updatePomodoroSettings,
  type PomodoroSettings,
} from "@/services/pomodoro";
import { getThemeDefinition } from "@/lib/themeCatalog";
import { cn } from "@/lib/cn";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function SectionCard({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      variants={itemVariants}
      className="rounded-3xl border border-(--ff-border) bg-(--ff-surface) p-6 shadow-sm"
    >
      <div className="mb-5 flex items-start gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-(--ff-primary-soft) text-(--ff-primary)">
          {icon}
        </div>
        <div>
          <h2 className="text-lg font-bold text-(--ff-text)">{title}</h2>
          <p className="text-sm text-(--ff-text-soft)">{description}</p>
        </div>
      </div>
      {children}
    </motion.section>
  );
}

function PreferenceRow({
  label,
  value,
  action,
  muted,
}: {
  label: string;
  value: string;
  action?: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-(--ff-border) bg-(--ff-surface-soft) p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-(--ff-text)">{label}</p>
        <p
          className={cn(
            "text-sm",
            muted ? "text-(--ff-text-muted)" : "text-(--ff-text-soft)",
          )}
        >
          {value}
        </p>
      </div>
      {action}
    </div>
  );
}

export default function SettingsPage() {
  const { user, updateProfile, changePassword } = useAuth();
  const pushToast = useToastStore((state) => state.pushToast);

  const fetchStatus = useGameStore((state) => state.fetchStatus);

  const equippedThemeKey = useThemeStore((state) => state.equippedThemeKey);
  const clearTheme = useThemeStore((state) => state.clearTheme);

  const equippedAvatar = useAvatarStore((state) => state.equippedAvatar);
  const clearAvatar = useAvatarStore((state) => state.clearAvatar);

  const equippedSoundKey = useSoundStore((state) => state.equippedSoundKey);
  const clearSound = useSoundStore((state) => state.clearSound);

  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_new_password: "",
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const [pomodoroSettings, setPomodoroSettings] = useState<PomodoroSettings>({
    focus_minutes: 25,
    short_break_minutes: 5,
    long_break_minutes: 15,
    cycles_before_long_break: 4,
  });

  const [isSavingPomodoro, setIsSavingPomodoro] = useState(false);
  const [isLoadingPomodoro, setIsLoadingPomodoro] = useState(true);
  const [busySection, setBusySection] = useState<
    "theme" | "avatar" | "sound" | null
  >(null);

  const currentThemeLabel = useMemo(() => {
    return getThemeDefinition(equippedThemeKey).label;
  }, [equippedThemeKey]);

  function showToast(
    variant: "success" | "error" | "info",
    title: string,
    description: string,
  ) {
    pushToast({
      variant,
      title,
      description,
      duration: variant === "error" ? 5000 : 4200,
    });
  }

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (!user) return;

    setProfileForm({
      name: user.name || "",
      email: user.email || "",
    });
  }, [user]);

  useEffect(() => {
    let active = true;

    async function loadPomodoro() {
      try {
        setIsLoadingPomodoro(true);
        const data = await getPomodoroSettings();
        if (!active) return;
        setPomodoroSettings(data);
      } catch (error) {
        console.error("Erro ao carregar configurações do pomodoro:", error);
        if (!active) return;

        showToast(
          "error",
          "Falha ao carregar pomodoro",
          "Não foi possível carregar as configurações do pomodoro.",
        );
      } finally {
        if (active) setIsLoadingPomodoro(false);
      }
    }

    loadPomodoro();

    return () => {
      active = false;
    };
  }, []);

  function extractErrorMessage(error: unknown, fallback: string) {
    const err = error as {
      response?: {
        data?: Record<string, unknown>;
      };
    };

    const data = err?.response?.data;

    if (!data) return fallback;

    if (typeof data.detail === "string") return data.detail;
    if (typeof data.message === "string") return data.message;

    for (const value of Object.values(data)) {
      if (typeof value === "string") return value;
      if (Array.isArray(value) && typeof value[0] === "string") return value[0];
    }

    return fallback;
  }

  function updatePomodoroField<K extends keyof PomodoroSettings>(
    key: K,
    value: PomodoroSettings[K],
  ) {
    setPomodoroSettings((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSaveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!profileForm.name.trim()) {
      showToast("error", "Erro ao salvar perfil", "Informe o nome do usuário.");
      return;
    }

    if (!profileForm.email.trim()) {
      showToast(
        "error",
        "Erro ao salvar perfil",
        "Informe o e-mail do usuário.",
      );
      return;
    }

    try {
      setIsSavingProfile(true);

      await updateProfile({
        name: profileForm.name.trim(),
        email: profileForm.email.trim(),
      });

      showToast(
        "success",
        "Perfil atualizado",
        "Dados do usuário atualizados com sucesso.",
      );
    } catch (error) {
      console.error("Erro ao atualizar dados do usuário:", error);
      showToast(
        "error",
        "Falha ao atualizar perfil",
        extractErrorMessage(
          error,
          "Não foi possível atualizar os dados do usuário.",
        ),
      );
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleChangePassword(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !passwordForm.current_password ||
      !passwordForm.new_password ||
      !passwordForm.confirm_new_password
    ) {
      showToast(
        "error",
        "Erro ao alterar senha",
        "Preencha todos os campos da senha.",
      );
      return;
    }

    if (passwordForm.new_password.length < 8) {
      showToast(
        "error",
        "Erro ao alterar senha",
        "A nova senha deve ter pelo menos 8 caracteres.",
      );
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_new_password) {
      showToast(
        "error",
        "Erro ao alterar senha",
        "A confirmação da nova senha não confere.",
      );
      return;
    }

    try {
      setIsSavingPassword(true);

      await changePassword(passwordForm);

      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_new_password: "",
      });

      showToast("success", "Senha alterada", "Senha alterada com sucesso.");
    } catch (error) {
      console.error("Erro ao alterar senha:", error);
      showToast(
        "error",
        "Falha ao alterar senha",
        extractErrorMessage(error, "Não foi possível alterar a senha."),
      );
    } finally {
      setIsSavingPassword(false);
    }
  }

  async function handleSavePomodoro() {
    try {
      setIsSavingPomodoro(true);
      const data = await updatePomodoroSettings(pomodoroSettings);
      setPomodoroSettings(data);

      showToast(
        "success",
        "Pomodoro salvo",
        "Configurações do pomodoro salvas com sucesso.",
      );
    } catch (error) {
      console.error("Erro ao salvar configurações do pomodoro:", error);
      showToast(
        "error",
        "Falha ao salvar pomodoro",
        "Não foi possível salvar as configurações do pomodoro.",
      );
    } finally {
      setIsSavingPomodoro(false);
    }
  }

  async function handleResetCategory(category: "theme" | "avatar" | "sound") {
    try {
      setBusySection(category);
      const data = await gamificationService.resetEquipment(category);

      if (category === "theme") clearTheme();
      if (category === "avatar") clearAvatar();
      if (category === "sound") clearSound();

      await fetchStatus();

      showToast(
        "success",
        category === "theme"
          ? "Tema restaurado"
          : category === "avatar"
            ? "Avatar restaurado"
            : "Som restaurado",
        data?.message ||
          (category === "theme"
            ? "Tema restaurado para o padrão."
            : category === "avatar"
              ? "Avatar restaurado para o padrão."
              : "Som restaurado para o padrão."),
      );
    } catch (error) {
      console.error(`Erro ao redefinir ${category}:`, error);
      showToast(
        "error",
        "Falha ao restaurar item",
        `Não foi possível redefinir ${
          category === "theme"
            ? "o tema"
            : category === "avatar"
              ? "o avatar"
              : "o som"
        }.`,
      );
    } finally {
      setBusySection(null);
    }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="mx-auto max-w-5xl space-y-6 pb-12"
    >
      <motion.div
        variants={itemVariants}
        className="rounded-3xl border border-(--ff-border) bg-(--ff-surface) p-6 shadow-sm"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-(--ff-primary-soft) px-3 py-1 text-xs font-semibold text-(--ff-primary)">
              <Sparkles className="h-3.5 w-3.5" />
              Personalização
            </p>
            <h1 className="text-2xl font-bold text-(--ff-text)">
              Configurações
            </h1>
            <p className="mt-1 text-sm text-(--ff-text-soft)">
              Aqui você pode gerenciar sua conta, restaurar itens equipados,
              ajustar o pomodoro e visualizar informações sobre a aplicação.
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Dados do usuário"
          description="Atualize seu nome e e-mail da conta."
          icon={<UserCog className="h-5 w-5" />}
        >
          <form className="space-y-4" onSubmit={handleSaveProfile}>
            <div className="grid gap-4">
              <label className="block cursor-pointer space-y-2">
                <span className="block text-sm font-semibold text-(--ff-text)">
                  Nome
                </span>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(event) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Digite seu nome"
                  disabled={isSavingProfile}
                  className="w-full cursor-text rounded-xl border border-(--ff-border) bg-(--ff-surface) px-3 py-2 text-sm text-(--ff-text) outline-none transition focus:border-(--ff-primary)"
                />
              </label>

              <label className="block cursor-pointer space-y-2">
                <span className="block text-sm font-semibold text-(--ff-text)">
                  E-mail
                </span>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(event) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      email: event.target.value,
                    }))
                  }
                  placeholder="Digite seu e-mail"
                  disabled={isSavingProfile}
                  className="w-full cursor-text rounded-xl border border-(--ff-border) bg-(--ff-surface) px-3 py-2 text-sm text-(--ff-text) outline-none transition focus:border-(--ff-primary)"
                />
              </label>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-(--ff-primary) px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {isSavingProfile ? "Salvando..." : "Salvar dados"}
              </button>
            </div>
          </form>
        </SectionCard>

        <SectionCard
          title="Segurança"
          description="Altere sua senha para manter sua conta protegida."
          icon={<ShieldCheck className="h-5 w-5" />}
        >
          <form className="space-y-4" onSubmit={handleChangePassword}>
            <div className="grid gap-4">
              <label className="block cursor-pointer space-y-2">
                <span className="block text-sm font-semibold text-(--ff-text)">
                  Senha atual
                </span>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordForm.current_password}
                    onChange={(event) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        current_password: event.target.value,
                      }))
                    }
                    placeholder="Digite sua senha atual"
                    disabled={isSavingPassword}
                    className="w-full cursor-text rounded-xl border border-(--ff-border) bg-(--ff-surface) py-2 pl-3 pr-10 text-sm text-(--ff-text) outline-none transition focus:border-(--ff-primary)"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowCurrentPassword(!showCurrentPassword);
                    }}
                    disabled={isSavingPassword}
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-(--ff-text-soft) transition hover:text-(--ff-text) disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </label>

              <label className="block cursor-pointer space-y-2">
                <span className="block text-sm font-semibold text-(--ff-text)">
                  Nova senha
                </span>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={passwordForm.new_password}
                    onChange={(event) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        new_password: event.target.value,
                      }))
                    }
                    placeholder="Digite a nova senha"
                    disabled={isSavingPassword}
                    className="w-full cursor-text rounded-xl border border-(--ff-border) bg-(--ff-surface) py-2 pl-3 pr-10 text-sm text-(--ff-text) outline-none transition focus:border-(--ff-primary)"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowNewPassword(!showNewPassword);
                    }}
                    disabled={isSavingPassword}
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-(--ff-text-soft) transition hover:text-(--ff-text) disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </label>

              <label className="block cursor-pointer space-y-2">
                <span className="block text-sm font-semibold text-(--ff-text)">
                  Confirmar nova senha
                </span>
                <div className="relative">
                  <input
                    type={showConfirmNewPassword ? "text" : "password"}
                    value={passwordForm.confirm_new_password}
                    onChange={(event) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        confirm_new_password: event.target.value,
                      }))
                    }
                    placeholder="Confirme a nova senha"
                    disabled={isSavingPassword}
                    className="w-full cursor-text rounded-xl border border-(--ff-border) bg-(--ff-surface) py-2 pl-3 pr-10 text-sm text-(--ff-text) outline-none transition focus:border-(--ff-primary)"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowConfirmNewPassword(!showConfirmNewPassword);
                    }}
                    disabled={isSavingPassword}
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-(--ff-text-soft) transition hover:text-(--ff-text) disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {showConfirmNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </label>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSavingPassword}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-(--ff-primary) px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ShieldCheck className="h-4 w-4" />
                {isSavingPassword ? "Alterando..." : "Alterar senha"}
              </button>
            </div>
          </form>
        </SectionCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Aparência"
          description="Gerencie o tema visual do FocusFlow e volte ao padrão quando quiser."
          icon={<Palette className="h-5 w-5" />}
        >
          <div className="space-y-4">
            <PreferenceRow
              label="Tema atual"
              value={currentThemeLabel}
              action={
                <button
                  type="button"
                  onClick={() => handleResetCategory("theme")}
                  disabled={busySection === "theme"}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-(--ff-primary) px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RotateCcw className="h-4 w-4" />
                  {busySection === "theme"
                    ? "Restaurando..."
                    : "Voltar ao normal"}
                </button>
              }
            />
            <p className="text-xs text-(--ff-text-muted)">
              O tema padrão do sistema é restaurado imediatamente e remove o
              tema equipado da loja.
            </p>
          </div>
        </SectionCard>

        <SectionCard
          title="Perfil visual"
          description="Redefina rapidamente avatar e som para os padrões do aplicativo."
          icon={<Smile className="h-5 w-5" />}
        >
          <div className="space-y-4">
            <PreferenceRow
              label="Avatar equipado"
              value={equippedAvatar || "🙂"}
              action={
                <button
                  type="button"
                  onClick={() => handleResetCategory("avatar")}
                  disabled={busySection === "avatar"}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-(--ff-border) bg-(--ff-surface) px-4 py-2 text-sm font-semibold text-(--ff-text) transition hover:bg-(--ff-surface-soft) disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RotateCcw className="h-4 w-4" />
                  {busySection === "avatar"
                    ? "Redefinindo..."
                    : "Usar avatar padrão"}
                </button>
              }
            />

            <PreferenceRow
              label="Som equipado"
              value={equippedSoundKey || DEFAULT_SOUND_KEY}
              action={
                <button
                  type="button"
                  onClick={() => handleResetCategory("sound")}
                  disabled={busySection === "sound"}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-(--ff-border) bg-(--ff-surface) px-4 py-2 text-sm font-semibold text-(--ff-text) transition hover:bg-(--ff-surface-soft) disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Volume2 className="h-4 w-4" />
                  {busySection === "sound"
                    ? "Redefinindo..."
                    : "Usar som padrão"}
                </button>
              }
            />
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Pomodoro"
        description="Ajuste os tempos padrão das sessões e pausas."
        icon={<Clock3 className="h-5 w-5" />}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              key: "focus_minutes" as const,
              label: "Foco",
              min: 15,
              max: 60,
            },
            {
              key: "short_break_minutes" as const,
              label: "Pausa curta",
              min: 3,
              max: 15,
            },
            {
              key: "long_break_minutes" as const,
              label: "Pausa longa",
              min: 10,
              max: 30,
            },
            {
              key: "cycles_before_long_break" as const,
              label: "Ciclos até pausa longa",
              min: 2,
              max: 6,
            },
          ].map((field) => (
            <label
              key={field.key}
              className="block cursor-pointer rounded-2xl border border-(--ff-border) bg-(--ff-surface-soft) p-4"
            >
              <span className="mb-2 block text-sm font-semibold text-(--ff-text)">
                {field.label}
              </span>
              <input
                type="number"
                min={field.min}
                max={field.max}
                value={pomodoroSettings[field.key]}
                onChange={(event) => {
                  const rawValue = Number(event.target.value);
                  const safeValue = Number.isNaN(rawValue)
                    ? field.min
                    : Math.min(field.max, Math.max(field.min, rawValue));
                  updatePomodoroField(field.key, safeValue);
                }}
                disabled={isLoadingPomodoro || isSavingPomodoro}
                className="w-full cursor-text rounded-xl border border-(--ff-border) bg-(--ff-surface) px-3 py-2 text-sm text-(--ff-text) outline-none ring-0 transition focus:border-(--ff-primary)"
              />
            </label>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-(--ff-text-soft)">
            Essas configurações são usadas nas suas próximas sessões de foco.
          </p>
          <button
            type="button"
            onClick={handleSavePomodoro}
            disabled={isLoadingPomodoro || isSavingPomodoro}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-(--ff-primary) px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {isSavingPomodoro ? "Salvando..." : "Salvar pomodoro"}
          </button>
        </div>
      </SectionCard>

      <SectionCard
        title="Sobre"
        description="Conheça a aplicação e suas principais funcionalidades."
        icon={<Info className="h-5 w-5" />}
      >
        <div className="space-y-5">
          <div className="rounded-2xl border border-(--ff-border) bg-(--ff-surface-soft) p-5">
            <h3 className="text-base font-bold text-(--ff-text)">
              Sobre o FocusFlow
            </h3>
            <p className="mt-2 text-sm leading-6 text-(--ff-text-soft)">
              O FocusFlow é uma aplicação voltada para produtividade,
              organização e gerenciamento do tempo. Seu objetivo é ajudar o
              usuário a manter o foco nas tarefas, acompanhar o próprio
              desempenho e tornar a rotina mais eficiente com recursos de
              planejamento, estatísticas, personalização e sessões de Pomodoro.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-(--ff-border) bg-(--ff-surface-soft) p-4">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-(--ff-primary-soft) text-(--ff-primary)">
                  <LayoutDashboard className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-(--ff-text)">
                    Dashboard
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-(--ff-text-soft)">
                    Exibe uma visão geral da produtividade, do progresso e das
                    informações mais importantes do usuário.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-(--ff-border) bg-(--ff-surface-soft) p-4">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-(--ff-primary-soft) text-(--ff-primary)">
                  <ListTodo className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-(--ff-text)">
                    Tarefas
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-(--ff-text-soft)">
                    Permite cadastrar, visualizar e organizar tarefas para
                    melhorar o planejamento da rotina.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-(--ff-border) bg-(--ff-surface-soft) p-4">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-(--ff-primary-soft) text-(--ff-primary)">
                  <Timer className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-(--ff-text)">
                    Pomodoro
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-(--ff-text-soft)">
                    Ajuda no controle do tempo por meio de ciclos de foco e
                    pausa, favorecendo a concentração e a produtividade.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-(--ff-border) bg-(--ff-surface-soft) p-4">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-(--ff-primary-soft) text-(--ff-primary)">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-(--ff-text)">
                    Estatísticas
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-(--ff-text-soft)">
                    Mostra dados e métricas para acompanhar o desempenho e a
                    evolução dos hábitos do usuário.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-(--ff-border) bg-(--ff-surface-soft) p-4">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-(--ff-primary-soft) text-(--ff-primary)">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-(--ff-text)">
                    Gamificação
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-(--ff-text-soft)">
                    Inclui recompensas e elementos motivacionais para tornar a
                    experiência mais envolvente.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-(--ff-border) bg-(--ff-surface-soft) p-4">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-(--ff-primary-soft) text-(--ff-primary)">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-(--ff-text)">
                    Personalização
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-(--ff-text-soft)">
                    Permite personalizar tema, avatar e som, deixando a
                    aplicação mais adequada às preferências do usuário.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-(--ff-border) bg-(--ff-surface-soft) p-4">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-(--ff-primary-soft) text-(--ff-primary)">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-(--ff-text)">
                    Notificações
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-(--ff-text-soft)">
                    Auxiliam o usuário com lembretes e avisos importantes dentro
                    da aplicação.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-(--ff-border) bg-(--ff-surface-soft) p-4">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-(--ff-primary-soft) text-(--ff-primary)">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-(--ff-text)">
                    Organização da rotina
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-(--ff-text-soft)">
                    Reúne recursos para ajudar o usuário a planejar, executar e
                    acompanhar melhor suas atividades diárias.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>
    </motion.div>
  );
}