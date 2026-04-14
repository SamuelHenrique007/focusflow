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

// Variantes de animação do Framer Motion
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
  const loadTheme = useThemeStore((state) => state.loadTheme);

  const equippedAvatar = useAvatarStore((state) => state.equippedAvatar);
  const clearAvatar = useAvatarStore((state) => state.clearAvatar);
  const loadAvatar = useAvatarStore((state) => state.loadAvatar);

  const equippedSoundKey = useSoundStore((state) => state.equippedSoundKey);
  const clearSound = useSoundStore((state) => state.clearSound);
  const loadSound = useSoundStore((state) => state.loadSound);

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
    loadTheme();
    loadAvatar();
    loadSound();
  }, [fetchStatus, loadTheme, loadAvatar, loadSound]);

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

      fetchStatus();

      if (category === "theme" && data?.theme_key) {
        loadTheme();
      }

      if (category === "avatar" && data?.avatar) {
        loadAvatar();
      }

      if (category === "sound" && data?.sound_key) {
        loadSound();
      }

      showToast(
        "success",
        "Preferência redefinida",
        "A configuração foi restaurada para o padrão do aplicativo.",
      );
    } catch (error) {
      console.error("Erro ao resetar equipamento:", error);
      showToast(
        "error",
        "Falha ao redefinir",
        "Não foi possível restaurar essa configuração.",
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
      className="space-y-6"
    >
      <motion.section
        variants={itemVariants}
        className="overflow-hidden rounded-3xl border border-(--ff-border) bg-linear-to-r from-(--ff-primary) to-(--ff-primary-strong) p-6 text-white shadow-sm"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white/90 ring-1 ring-white/15">
              <Sparkles className="h-3.5 w-3.5" />
              Preferências do FocusFlow
            </div>
            <h1 className="text-2xl font-bold sm:text-3xl">Configurações</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/85 sm:text-base">
              Personalize seu perfil, ajuste o Pomodoro e redefina elementos
              visuais sempre que precisar.
            </p>
          </div>

          <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm text-white/90 ring-1 ring-white/15">
            {user?.email || "Conta conectada"}
          </div>
        </div>
      </motion.section>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="Perfil"
          description="Atualize seus dados básicos para manter a conta sempre em dia."
          icon={<UserCog className="h-5 w-5" />}
        >
          <form className="space-y-4" onSubmit={handleSaveProfile}>
            <div className="grid gap-4 md:grid-cols-2">
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
                {isSavingProfile ? "Salvando..." : "Salvar perfil"}
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
                    placeholder="Digite a senha atual"
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
        title="Sobre"
        description="Conheça o FocusFlow e veja os principais recursos disponíveis na aplicação."
        icon={<Info className="h-5 w-5" />}
      >
        <div className="space-y-5">
          <div className="rounded-2xl border border-(--ff-border) bg-(--ff-surface-soft) p-5">
            <h3 className="text-base font-bold text-(--ff-text)">
              O que é o FocusFlow?
            </h3>
            <p className="mt-2 text-sm leading-6 text-(--ff-text-soft)">
              O FocusFlow é uma aplicação de produtividade criada para ajudar o
              usuário a organizar a rotina, manter o foco e acompanhar sua
              evolução ao longo do tempo. A plataforma reúne gerenciamento de
              tarefas, sessões Pomodoro, métricas de desempenho, notificações e
              elementos de gamificação em uma experiência personalizável.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {[
              {
                icon: <ListTodo className="h-5 w-5" />,
                title: "Gestão de tarefas",
                description:
                  "Permite criar, editar e organizar tarefas com mais clareza para acompanhar o que precisa ser feito no dia a dia.",
              },
              {
                icon: <Timer className="h-5 w-5" />,
                title: "Pomodoro integrado",
                description:
                  "Oferece ciclos de foco e pausa para melhorar a concentração e manter uma rotina de estudos ou trabalho mais consistente.",
              },
              {
                icon: <LayoutDashboard className="h-5 w-5" />,
                title: "Dashboard",
                description:
                  "Apresenta uma visão geral da rotina com informações úteis sobre progresso, pendências e produtividade.",
              },
              {
                icon: <BarChart3 className="h-5 w-5" />,
                title: "Estatísticas",
                description:
                  "Mostra dados de desempenho para acompanhar sessões concluídas, evolução do foco e hábitos de produtividade.",
              },
              {
                icon: <Trophy className="h-5 w-5" />,
                title: "Conquistas e gamificação",
                description:
                  "Transforma o progresso em motivação com recompensas, metas e incentivos visuais durante o uso da plataforma.",
              },
              {
                icon: <ShoppingBag className="h-5 w-5" />,
                title: "Loja e personalização",
                description:
                  "Permite usar recompensas obtidas no sistema para personalizar elementos da experiência, como itens visuais e preferências.",
              },
              {
                icon: <Bell className="h-5 w-5" />,
                title: "Notificações",
                description:
                  "Envia lembretes e avisos importantes para ajudar o usuário a não perder tarefas, sessões e atualizações relevantes.",
              },
              {
                icon: <Palette className="h-5 w-5" />,
                title: "Configurações personalizadas",
                description:
                  "Possibilita ajustar perfil, aparência, sons e tempos do Pomodoro conforme a preferência de uso de cada pessoa.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-(--ff-border) bg-(--ff-surface-soft) p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-(--ff-primary-soft) text-(--ff-primary)">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-(--ff-text)">
                      {feature.title}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-(--ff-text-soft)">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-(--ff-border) bg-(--ff-surface-soft) p-5">
            <h3 className="flex items-center gap-2 text-sm font-bold text-(--ff-text)">
              <CheckCircle2 className="h-4 w-4 text-(--ff-primary)" />
              Resumo da proposta
            </h3>
            <p className="mt-2 text-sm leading-6 text-(--ff-text-soft)">
              A proposta do FocusFlow é reunir organização, foco, acompanhamento
              de desempenho e motivação em um único ambiente, ajudando o usuário
              a manter constância nas atividades e tomar decisões melhores sobre
              sua rotina.
            </p>
          </div>
        </div>
      </SectionCard>

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
    </motion.div>
  );
}