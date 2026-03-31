import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Store,
  Coins,
  Palette,
  Music4,
  Smile,
  Check,
  ShoppingCart,
  ArrowRightLeft,
  Timer,
  Volume2,
  Lock,
  AlertCircle,
  CheckCircle2,
  BrushCleaning,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  gamificationService,
  type StoreItem,
  type GameStatus,
} from "@/services/gamificationService";
import { useGameStore } from "@/store/useGameStore";
import { useAvatarStore } from "@/store/useAvatarStore";
import { useSoundStore } from "@/store/useSoundStore";
import { useThemeStore } from "@/store/useThemeStore";

type FilterType = "all" | "avatar" | "theme" | "sound";

type FlyingCoin = {
  id: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  rotate: number;
  scale: number;
  duration: number;
  delay: number;
};

const SECTIONS: Array<{
  id: Exclude<FilterType, "all">;
  label: string;
  icon: React.ReactNode;
}> = [
  {
    id: "avatar",
    label: "Coleção de Avatares",
    icon: <Smile className="h-5 w-5 text-blue-500" />,
  },
  {
    id: "theme",
    label: "Temas Exclusivos",
    icon: <Palette className="h-5 w-5 text-blue-500" />,
  },
  {
    id: "sound",
    label: "Recompensas Sonoras",
    icon: <Music4 className="h-5 w-5 text-blue-500" />,
  },
];

const SOUND_FILES: Record<string, string> = {
  alerta_supremo: "/sounds/alerta-supremo.mp3",
  aurora_digital: "/sounds/aurora-digital.mp3",
  despertar_curto: "/sounds/despertar-curto.mp3",
  despertar_neon: "/sounds/despertar-neon.mp3",
  digital_basico: "/sounds/digital-basico.mp3",
  eco_futuro: "/sounds/eco-futuro.mp3",
  flauta_zen: "/sounds/flauta-zen.mp3",
  marimba_brilhante: "/sounds/marimba-brilhante.mp3",
  marimba_serena: "/sounds/marimba-serena.mp3",
  marimba_viva: "/sounds/marimba-viva.mp3",
  ping_simples: "/sounds/ping-simples.mp3",
  pulso_tecnologico: "/sounds/pulso-tecnologico.mp3",
  sirene_laser: "/sounds/sirene-laser.mp3",
  toque_harmonico: "/sounds/toque-harmonico.mp3",
  toque_mensagem: "/sounds/toque-mensagem.mp3",
};

function getSoundFileByKey(key?: string | null) {
  if (!key) return null;
  return SOUND_FILES[key] || null;
}

const pageVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 16 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const listVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.35,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

function EquippedSummaryCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <motion.div
      variants={scaleIn}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <motion.div
        className="mb-2 flex items-center gap-2 text-slate-500"
        whileHover={{ rotate: -4, scale: 1.05 }}
        transition={{ duration: 0.2 }}
      >
        {icon}
      </motion.div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </p>
      <p className="mt-1 text-sm font-bold text-slate-900">{value}</p>
    </motion.div>
  );
}

export default function StorePage() {
  const { stats, fetchStatus, setStats } = useGameStore();

  const equippedAvatar = useAvatarStore((state) => state.equippedAvatar);
  const equippedSoundKey = useSoundStore((state) => state.equippedSoundKey);
  const equippedThemeKey = useThemeStore((state) => state.equippedThemeKey);

  const [items, setItems] = useState<StoreItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<number | null>(null);
  const [equippingId, setEquippingId] = useState<number | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [previewingSoundId, setPreviewingSoundId] = useState<number | null>(
    null
  );
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");

  const [flyingCoins, setFlyingCoins] = useState<FlyingCoin[]>([]);
  const [isBalanceHighlight, setIsBalanceHighlight] = useState(false);
  const [floatingGain, setFloatingGain] = useState<number | null>(null);
  const [displayCoins, setDisplayCoins] = useState<number>(stats?.coins || 0);

  const claimButtonRef = useRef<HTMLButtonElement | null>(null);
  const balanceCardRef = useRef<HTMLDivElement | null>(null);

  const userLevel = stats?.level || 1;
  const userCoins = stats?.coins || 0;
  const pendingCoins = stats?.pending_focus_minutes || 0;

  const inventoryIds = useMemo(
    () => new Set(stats?.inventory || []),
    [stats?.inventory]
  );

  const equippedItemIds = useMemo(
    () => ({
      avatar: stats?.equipped_avatar?.id ?? null,
      sound: stats?.equipped_sound?.id ?? null,
      theme: stats?.equipped_theme?.id ?? null,
    }),
    [
      stats?.equipped_avatar?.id,
      stats?.equipped_sound?.id,
      stats?.equipped_theme?.id,
    ]
  );

  useEffect(() => {
    setDisplayCoins(stats?.coins || 0);
  }, [stats?.coins]);

  async function loadStoreItems() {
    try {
      setIsLoading(true);
      const response = await gamificationService.getStoreItems();
      setItems(response.items || []);
    } catch (error) {
      console.error("Erro ao carregar loja:", error);
      setMessage({
        type: "error",
        text: "Não foi possível carregar os itens da loja.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  function syncEquippedState(nextStats: GameStatus) {
    setStats(nextStats);
  }

  useEffect(() => {
    loadStoreItems();
  }, []);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), 3000);
    return () => window.clearTimeout(timer);
  }, [message]);

  const tabs = useMemo(
    () => [
      {
        id: "all" as const,
        label: "Todos os Itens",
        icon: <Store className="h-4 w-4" />,
      },
      {
        id: "avatar" as const,
        label: "Avatares",
        icon: <Smile className="h-4 w-4" />,
      },
      {
        id: "theme" as const,
        label: "Temas",
        icon: <Palette className="h-4 w-4" />,
      },
      {
        id: "sound" as const,
        label: "Sons",
        icon: <Music4 className="h-4 w-4" />,
      },
    ],
    []
  );

  function animateCoinsToBalance(amount: number, onComplete?: () => void) {
    if (!claimButtonRef.current || !balanceCardRef.current) {
      onComplete?.();
      return;
    }

    const startRect = claimButtonRef.current.getBoundingClientRect();
    const endRect = balanceCardRef.current.getBoundingClientRect();

    const startX = startRect.left + startRect.width / 2;
    const startY = startRect.top + startRect.height / 2;
    const endX = endRect.left + endRect.width / 2;
    const endY = endRect.top + endRect.height / 2;

    const coinCount = Math.min(Math.max(Math.floor(amount / 5), 6), 14);

    const coins: FlyingCoin[] = Array.from({ length: coinCount }).map(
      (_, index) => ({
        id: Date.now() + index,
        startX: startX + (Math.random() * 30 - 15),
        startY: startY + (Math.random() * 20 - 10),
        endX: endX + (Math.random() * 30 - 15),
        endY: endY + (Math.random() * 20 - 10),
        rotate: Math.random() * 220 - 110,
        scale: 0.9 + Math.random() * 0.35,
        duration: 0.8 + Math.random() * 0.25,
        delay: index * 0.035,
      })
    );

    setFlyingCoins(coins);

    const longestAnimation =
      Math.max(...coins.map((coin) => coin.duration + coin.delay), 0.9) * 1000;

    window.setTimeout(() => {
      setFlyingCoins([]);
      setIsBalanceHighlight(true);
      setFloatingGain(amount);
      onComplete?.();

      window.setTimeout(() => setIsBalanceHighlight(false), 700);
      window.setTimeout(() => setFloatingGain(null), 1100);
    }, longestAnimation);
  }

  async function handleClaimCoins() {
    try {
      setIsClaiming(true);

      const previousCoins = stats?.coins || 0;
      const currentPendingCoins = stats?.pending_focus_minutes || 0;

      const data = await gamificationService.claimCoins();

      const nextStats = data?.stats;
      const gainedCoins =
        typeof nextStats?.coins === "number"
          ? Math.max(nextStats.coins - previousCoins, 0)
          : currentPendingCoins;

      animateCoinsToBalance(gainedCoins, async () => {
        if (nextStats) {
          syncEquippedState(nextStats);
          setDisplayCoins(nextStats.coins || 0);
        } else {
          await fetchStatus();
        }
      });
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      setMessage({
        type: "error",
        text: err.response?.data?.error || "Erro ao resgatar moedas.",
      });
    } finally {
      setIsClaiming(false);
    }
  }

  async function handlePurchase(item: StoreItem) {
    if (userLevel < item.required_level) {
      setMessage({
        type: "error",
        text: `Você precisa do nível ${item.required_level}.`,
      });
      return;
    }

    if (userCoins < item.price) {
      setMessage({ type: "error", text: "Moedas insuficientes." });
      return;
    }

    try {
      setPurchasingId(item.id);

      const data = await gamificationService.purchaseItem(item.id);

      if (data?.stats) {
        syncEquippedState(data.stats);
      } else {
        await fetchStatus();
      }

      await loadStoreItems();

      setMessage({
        type: "success",
        text: data?.message || "Compra realizada com sucesso.",
      });
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      setMessage({
        type: "error",
        text:
          err.response?.data?.error ||
          "Ocorreu um erro ao realizar a compra.",
      });
    } finally {
      setPurchasingId(null);
    }
  }

  async function handleEquipItem(item: StoreItem) {
    const isOwned = item.owned || inventoryIds.has(item.id);

    if (!isOwned) {
      setMessage({
        type: "error",
        text: "Compre este item antes de equipá-lo.",
      });
      return;
    }

    try {
      setEquippingId(item.id);

      const data = await gamificationService.equipItem(item.id);

      if (data?.stats) {
        syncEquippedState(data.stats);
      } else {
        await fetchStatus();
      }

      setItems((prevItems) =>
        prevItems.map((storeItem) => {
          if (storeItem.category !== item.category) {
            return storeItem;
          }

          return {
            ...storeItem,
            equipped: storeItem.id === item.id,
          };
        })
      );

      setMessage({
        type: "success",
        text: data?.message || `Item "${item.name}" equipado com sucesso.`,
      });
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      setMessage({
        type: "error",
        text: err.response?.data?.error || "Erro ao equipar item.",
      });
    } finally {
      setEquippingId(null);
    }
  }

  function handlePreviewSound(item: StoreItem) {
    const soundKey = item.visual_resource;
    const file = getSoundFileByKey(soundKey);

    if (!file) {
      setMessage({
        type: "error",
        text: "Arquivo de prévia não encontrado para este som.",
      });
      return;
    }

    try {
      setPreviewingSoundId(item.id);

      const audio = new Audio(file);
      audio.currentTime = 0;

      audio.play().catch(() => {
        setMessage({
          type: "error",
          text: "O navegador bloqueou a reprodução automática.",
        });
        setPreviewingSoundId(null);
      });

      audio.onended = () => setPreviewingSoundId(null);
    } catch {
      setPreviewingSoundId(null);
      setMessage({
        type: "error",
        text: "Não foi possível reproduzir a prévia.",
      });
    }
  }

  function renderItemIcon(item: StoreItem) {
    if (item.category === "avatar" && item.visual_resource) {
      return <span className="text-3xl">{item.visual_resource}</span>;
    }

    if (item.category === "theme") {
      return <Palette className="h-6 w-6 text-blue-500" />;
    }

    if (item.category === "sound") {
      return <Volume2 className="h-6 w-6 text-blue-500" />;
    }

    return <Smile className="h-6 w-6 text-blue-500" />;
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="mx-auto max-w-5xl space-y-8 pb-12"
    >
      <AnimatePresence>
        {flyingCoins.map((coin) => (
          <motion.div
            key={coin.id}
            initial={{
              opacity: 0,
              x: coin.startX,
              y: coin.startY,
              scale: 0.7,
              rotate: 0,
            }}
            animate={{
              opacity: [0, 1, 1, 0.95],
              x: coin.endX,
              y: coin.endY,
              scale: [0.7, 1.1, coin.scale, 0.95],
              rotate: coin.rotate,
            }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{
              duration: coin.duration,
              delay: coin.delay,
              ease: "easeInOut",
            }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              zIndex: 9999,
              pointerEvents: "none",
            }}
            className="flex h-6 w-6 items-center justify-center rounded-full border border-amber-300 bg-amber-400 shadow-lg"
          >
            <Coins className="h-3.5 w-3.5 text-amber-800" />
          </motion.div>
        ))}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {message && (
          <motion.div
            key={message.text}
            initial={{ opacity: 0, y: -14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className={cn(
              "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-sm",
              message.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
            )}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        variants={fadeUp}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <motion.h1
            className="flex items-center gap-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl"
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45 }}
          >
            <motion.div
              animate={{ rotate: [0, -8, 6, 0] }}
              transition={{ duration: 0.8, delay: 0.15 }}
            >
              <Store className="h-8 w-8 text-blue-600" />
            </motion.div>
            Loja de Recompensas
          </motion.h1>
          <motion.p
            className="mt-2 text-sm text-slate-500"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
          >
            Troque o seu tempo e gaste moedas em personalizações.
          </motion.p>
        </div>

        <motion.div
          ref={balanceCardRef}
          animate={
            isBalanceHighlight
              ? { scale: [1, 1.08, 1], y: [0, -3, 0] }
              : { scale: 1, y: 0 }
          }
          transition={{ duration: 0.5 }}
          whileHover={{ y: -2, scale: 1.01 }}
          className={cn(
            "relative flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 shadow-sm transition-all",
            isBalanceHighlight && "shadow-md ring-4 ring-amber-200/50"
          )}
        >
          <motion.div
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-200/50"
            animate={
              isBalanceHighlight ? { rotate: [0, -10, 10, 0] } : { rotate: 0 }
            }
            transition={{ duration: 0.45 }}
          >
            <Coins className="h-6 w-6 text-amber-600" />
          </motion.div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-800">
              O seu saldo
            </p>
            <motion.p
              key={displayCoins}
              initial={{ opacity: 0.5, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="text-xl font-bold text-amber-600"
            >
              {displayCoins} moedas
            </motion.p>
          </div>

          <AnimatePresence>
            {floatingGain !== null && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: -14, scale: 1 }}
                exit={{ opacity: 0, y: -24, scale: 0.95 }}
                transition={{ duration: 0.7 }}
                className="absolute -top-2 right-2 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-bold text-white shadow"
              >
                +{floatingGain}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      <motion.div
        variants={listVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-3 sm:grid-cols-3"
      >
        <EquippedSummaryCard
          title="Avatar ativo"
          value={stats?.equipped_avatar?.name || equippedAvatar || "Padrão"}
          icon={<Smile className="h-4 w-4 text-blue-500" />}
        />
        <EquippedSummaryCard
          title="Som ativo"
          value={stats?.equipped_sound?.name || equippedSoundKey || "Padrão"}
          icon={<Music4 className="h-4 w-4 text-blue-500" />}
        />
        <EquippedSummaryCard
          title="Tema ativo"
          value={stats?.equipped_theme?.name || equippedThemeKey || "Padrão"}
          icon={<BrushCleaning className="h-4 w-4 text-blue-500" />}
        />
      </motion.div>

      <AnimatePresence>
        {pendingCoins > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 26, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.45 }}
            className="relative overflow-hidden rounded-2xl bg-linear-to-r from-violet-700 via-purple-600 to-violet-500 p-6 text-white shadow-md sm:p-8"
          >
            <motion.div
              className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"
              animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.65, 0.4] }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute -bottom-10 right-20 h-32 w-32 rounded-full bg-violet-400/20 blur-xl"
              animate={{ scale: [1, 1.15, 1], opacity: [0.25, 0.45, 0.25] }}
              transition={{
                duration: 3.4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            <div className="relative flex flex-col items-center justify-between gap-6 sm:flex-row">
              <div className="flex w-full items-center gap-4 sm:w-auto">
                <motion.div
                  className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white/20 shadow-inner"
                  animate={{ rotate: [0, -8, 8, 0] }}
                  transition={{
                    duration: 2.6,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <ArrowRightLeft className="h-7 w-7 text-white" />
                </motion.div>

                <div>
                  <h2 className="text-lg font-semibold sm:text-xl">
                    Câmbio de Foco
                  </h2>
                  <div className="mt-1.5 flex flex-col items-start gap-1 text-sm text-violet-100 sm:flex-row sm:items-center sm:gap-2">
                    <span>
                      Tem{" "}
                      <strong className="text-white">
                        {pendingCoins} minutos
                      </strong>{" "}
                      de foco pendentes
                    </span>
                    <span className="hidden h-1 w-1 rounded-full bg-violet-300 sm:block" />
                    <span className="flex items-center gap-1 rounded-md bg-violet-900/30 px-2 py-0.5 text-xs sm:bg-transparent sm:px-0 sm:py-0 sm:text-sm">
                      Taxa: 1 <Timer className="h-3 w-3" /> = 1{" "}
                      <Coins className="h-3 w-3 text-amber-300" />
                    </span>
                  </div>
                </div>
              </div>

              <motion.button
                ref={claimButtonRef}
                onClick={handleClaimCoins}
                disabled={isClaiming}
                whileHover={!isClaiming ? { scale: 1.03, y: -1 } : {}}
                whileTap={!isClaiming ? { scale: 0.97 } : {}}
                className={cn(
                  "group flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-blue-700 shadow-sm transition-all hover:bg-blue-50 hover:shadow sm:w-auto",
                  isClaiming ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                )}
              >
                <motion.div
                  animate={isClaiming ? { rotate: 180 } : { rotate: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <ArrowRightLeft className="h-4 w-4" />
                </motion.div>
                {isClaiming
                  ? "A converter..."
                  : `Converter em ${pendingCoins} moedas`}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        variants={fadeUp}
        className="flex flex-wrap gap-2 border-b border-slate-200 pb-4 pt-4"
      >
        {tabs.map((tab) => {
          const active = filter === tab.id;

          return (
            <motion.button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              className={cn(
                "relative flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition",
                active
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              )}
            >
              {active && (
                <motion.span
                  layoutId="activeStoreTab"
                  className="absolute inset-0 rounded-xl bg-blue-600"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {tab.icon}
                {tab.label}
              </span>
            </motion.button>
          );
        })}
      </motion.div>

      {isLoading ? (
        <motion.div
          variants={listVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              variants={cardVariants}
              className="relative h-64 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100"
            >
              <motion.div
                className="absolute inset-y-0 -left-1/2 w-1/2 bg-white/40 blur-xl"
                animate={{ x: ["0%", "260%"] }}
                transition={{
                  duration: 1.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </motion.div>
          ))}
        </motion.div>
      ) : items.length === 0 ? (
        <motion.div
          variants={scaleIn}
          className="rounded-3xl border border-slate-200 bg-white py-20 text-center shadow-sm"
        >
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Store className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          </motion.div>
          <h3 className="text-lg font-semibold text-slate-900">
            A loja está vazia
          </h3>
          <p className="mt-1 text-slate-500">
            Volte mais tarde para ver as novidades.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-10">
          {SECTIONS.map((section) => {
            const sectionItems = items.filter(
              (item) => item.category === section.id
            );

            if (filter !== "all" && filter !== section.id) return null;
            if (sectionItems.length === 0) return null;

            return (
              <motion.section
                key={section.id}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="space-y-4"
              >
                <motion.div
                  className="mb-4 flex items-center gap-2"
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35 }}
                >
                  <motion.div
                    whileHover={{ rotate: -10, scale: 1.08 }}
                    transition={{ duration: 0.2 }}
                  >
                    {section.icon}
                  </motion.div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    {section.label}
                  </h2>
                </motion.div>

                <motion.div
                  variants={listVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {sectionItems.map((item) => {
                    const isOwned = item.owned || inventoryIds.has(item.id);

                    const isEquipped =
                      item.equipped ||
                      (item.category === "avatar" &&
                        equippedItemIds.avatar === item.id) ||
                      (item.category === "sound" &&
                        equippedItemIds.sound === item.id) ||
                      (item.category === "theme" &&
                        equippedItemIds.theme === item.id);

                    const isLocked = userLevel < item.required_level;
                    const canAfford = userCoins >= item.price;
                    const isPurchasing = purchasingId === item.id;
                    const isEquipping = equippingId === item.id;

                    const raritySafe = item.rarity || "Comum";

                    const rarityStyle =
                      {
                        Comum: "bg-slate-100 text-slate-600",
                        Raro: "bg-sky-100 text-sky-700",
                        Épico: "bg-violet-100 text-violet-700",
                        Lendário: "bg-amber-100 text-amber-700",
                      }[raritySafe] || "bg-slate-100 text-slate-600";

                    return (
                      <motion.div
                        key={item.id}
                        variants={cardVariants}
                        whileHover={{ y: -6, scale: 1.015 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                          "group relative flex flex-col justify-between rounded-3xl border bg-white p-5 shadow-sm transition-all hover:shadow-md",
                          isOwned
                            ? "border-violet-300 ring-2 ring-violet-50"
                            : "border-slate-200 hover:border-violet-200",
                          isLocked ? "opacity-70 grayscale-[0.4]" : ""
                        )}
                      >
                        {isEquipped && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute left-4 top-4 z-10 rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm"
                          >
                            Equipado agora
                          </motion.div>
                        )}

                        {isLocked && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute right-4 top-4 z-10 flex items-center gap-1 rounded-full bg-slate-900/90 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm backdrop-blur-sm"
                          >
                            <Lock className="h-3 w-3" />
                            Nível {item.required_level}
                          </motion.div>
                        )}

                        <div className="mb-4 flex items-start justify-between">
                          <motion.div
                            whileHover={{
                              rotate: item.category === "avatar" ? 0 : -6,
                              scale: 1.06,
                            }}
                            transition={{ duration: 0.2 }}
                            className={cn(
                              "flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-100 shadow-sm",
                              item.category === "avatar"
                                ? "bg-slate-50"
                                : "bg-violet-50 text-blue-600"
                            )}
                          >
                            {renderItemIcon(item)}
                          </motion.div>

                          <div className="flex flex-col items-end gap-2">
                            <motion.span
                              whileHover={{ scale: 1.05 }}
                              className={cn(
                                "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                                rarityStyle
                              )}
                            >
                              {raritySafe}
                            </motion.span>

                            {!isOwned && (
                              <motion.div
                                whileHover={{ scale: 1.04 }}
                                className={cn(
                                  "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold shadow-sm",
                                  canAfford
                                    ? "border border-amber-200 bg-amber-50 text-amber-700"
                                    : "border border-slate-200 bg-slate-50 text-slate-500"
                                )}
                              >
                                <Coins className="h-3.5 w-3.5" />
                                {item.price}
                              </motion.div>
                            )}
                          </div>
                        </div>

                        <div className="mb-5 flex-1">
                          <h3 className="text-base font-bold text-slate-900">
                            {item.name}
                          </h3>
                          <p className="mt-1 min-h-10 text-xs leading-relaxed text-slate-500">
                            {item.description}
                          </p>
                        </div>

                        {isOwned ? (
                          item.category === "sound" ? (
                            <div className="flex gap-2">
                              <motion.button
                                type="button"
                                onClick={() => handlePreviewSound(item)}
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.97 }}
                                className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                              >
                                <Volume2 className="h-4 w-4" />
                                {previewingSoundId === item.id
                                  ? "Reproduzindo..."
                                  : "Ouvir"}
                              </motion.button>

                              <motion.button
                                type="button"
                                onClick={() => handleEquipItem(item)}
                                disabled={isEquipping}
                                whileHover={!isEquipping ? { y: -2 } : {}}
                                whileTap={!isEquipping ? { scale: 0.97 } : {}}
                                className={cn(
                                  "flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition",
                                  isEquipping
                                    ? "cursor-not-allowed opacity-60"
                                    : "cursor-pointer",
                                  isEquipped
                                    ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "bg-blue-600 text-white hover:bg-blue-700"
                                )}
                              >
                                {isEquipped ? (
                                  <>
                                    <Check className="h-4 w-4" />
                                    Equipado
                                  </>
                                ) : (
                                  <>
                                    <Music4 className="h-4 w-4" />
                                    {isEquipping ? "Equipando..." : "Equipar"}
                                  </>
                                )}
                              </motion.button>
                            </div>
                          ) : item.category === "avatar" ? (
                            <motion.button
                              type="button"
                              onClick={() => handleEquipItem(item)}
                              disabled={isEquipping}
                              whileHover={!isEquipping ? { y: -2 } : {}}
                              whileTap={!isEquipping ? { scale: 0.97 } : {}}
                              className={cn(
                                "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition",
                                isEquipping
                                  ? "cursor-not-allowed opacity-60"
                                  : "cursor-pointer",
                                isEquipped
                                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : "bg-blue-600 text-white hover:bg-blue-700"
                              )}
                            >
                              {isEquipped ? (
                                <>
                                  <Check className="h-4 w-4" />
                                  Equipado
                                </>
                              ) : (
                                <>
                                  <Smile className="h-4 w-4" />
                                  {isEquipping ? "Equipando..." : "Equipar"}
                                </>
                              )}
                            </motion.button>
                          ) : item.category === "theme" ? (
                            <motion.button
                              type="button"
                              onClick={() => handleEquipItem(item)}
                              disabled={isEquipping}
                              whileHover={!isEquipping ? { y: -2 } : {}}
                              whileTap={!isEquipping ? { scale: 0.97 } : {}}
                              className={cn(
                                "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition",
                                isEquipping
                                  ? "cursor-not-allowed opacity-60"
                                  : "cursor-pointer",
                                isEquipped
                                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : "bg-blue-600 text-white hover:bg-blue-700"
                              )}
                            >
                              {isEquipped ? (
                                <>
                                  <Check className="h-4 w-4" />
                                  Equipado
                                </>
                              ) : (
                                <>
                                  <Palette className="h-4 w-4" />
                                  {isEquipping
                                    ? "Equipando..."
                                    : "Equipar tema"}
                                </>
                              )}
                            </motion.button>
                          ) : (
                            <button
                              disabled
                              className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-violet-100 bg-violet-50 py-3 text-xs font-bold text-violet-700 opacity-80"
                            >
                              <Check className="h-4 w-4" />
                              Comprado
                            </button>
                          )
                        ) : isLocked ? (
                          <button
                            disabled
                            className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-slate-100 py-3 text-xs font-bold text-slate-400"
                          >
                            <Lock className="h-4 w-4" />
                            Bloqueado
                          </button>
                        ) : (
                          <motion.button
                            onClick={() => handlePurchase(item)}
                            disabled={!canAfford || isPurchasing}
                            whileHover={
                              canAfford && !isPurchasing ? { y: -2 } : {}
                            }
                            whileTap={
                              canAfford && !isPurchasing ? { scale: 0.97 } : {}
                            }
                            className={cn(
                              "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition-all",
                              canAfford && !isPurchasing
                                ? "cursor-pointer bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                                : "cursor-not-allowed bg-slate-100 text-slate-400"
                            )}
                          >
                            <ShoppingCart className="h-4 w-4" />
                            {isPurchasing
                              ? "A comprar..."
                              : canAfford
                                ? "Comprar"
                                : "Moedas insuficientes"}
                          </motion.button>
                        )}
                      </motion.div>
                    );
                  })}
                </motion.div>
              </motion.section>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}