import { create } from "zustand";
import {
  gamificationService,
  type BadgeStatus,
  type ChallengeStatus,
  type ChestType,
  type GameStatus,
} from "@/services/gamificationService";
import { useAvatarStore } from "@/store/useAvatarStore";
import { useSoundStore } from "@/store/useSoundStore";
import { useThemeStore } from "@/store/useThemeStore";
import { useToastStore } from "@/store/useToastStore";

type MessageState = {
  type: "success" | "error";
  text: string;
} | null;

type FetchStatusOptions = {
  notifyChanges?: boolean;
};

type GameStore = {
  stats: GameStatus | null;
  isLoading: boolean;
  message: MessageState;

  setStats: (stats: GameStatus | null) => void;
  clearMessage: () => void;

  fetchStatus: (options?: FetchStatusOptions) => Promise<void>;
  claimCoins: () => Promise<void>;
  claimChest: (chestType: ChestType) => Promise<void>;
};

function hydrateEquippedPreferences(stats: GameStatus | null) {
  if (!stats) return;

  useAvatarStore
    .getState()
    .hydrateFromBackend(stats.equipped_avatar?.visual_resource);

  useSoundStore
    .getState()
    .hydrateFromBackend(stats.equipped_sound?.visual_resource);

  useThemeStore
    .getState()
    .hydrateFromBackend(stats.equipped_theme?.visual_resource);
}

function toBadgeArray(badges: GameStatus["badges"]): BadgeStatus[] {
  return Array.isArray(badges) ? badges : [];
}

function toChallengeArray(challenges: GameStatus["challenges"]): ChallengeStatus[] {
  return Array.isArray(challenges) ? challenges : [];
}

function notifyRewardChanges(previousStats: GameStatus | null, nextStats: GameStatus) {
  if (!previousStats) return;

  const pushToast = useToastStore.getState().pushToast;

  const xpDiff = Math.max(0, nextStats.current_xp - previousStats.current_xp);
  const coinsDiff = Math.max(0, nextStats.coins - previousStats.coins);
  const levelDiff = Math.max(0, nextStats.level - previousStats.level);

  if (xpDiff > 0) {
    pushToast({
      variant: "success",
      title: `+${xpDiff} XP`,
      description: "Seu progresso avançou na gamificação.",
    });
  }

  if (coinsDiff > 0) {
    pushToast({
      variant: "success",
      title: `+${coinsDiff} moedas`,
      description: "Você ganhou moedas pela sua evolução.",
    });
  }

  if (levelDiff > 0) {
    pushToast({
      variant: "info",
      title: `Subiste para o nível ${nextStats.level}!`,
      description: "Continue assim para desbloquear novas recompensas.",
    });
  }

  const previousBadges = new Map(
    toBadgeArray(previousStats.badges).map((badge) => [badge.key, badge]),
  );

  const unlockedBadges = toBadgeArray(nextStats.badges).filter((badge) => {
    const previousBadge = previousBadges.get(badge.key);
    return badge.unlocked && !previousBadge?.unlocked;
  });

  if (unlockedBadges.length === 1) {
    const badge = unlockedBadges[0];

    pushToast({
      variant: "success",
      title: `Conquista desbloqueada: ${badge.title}`,
      description: badge.description,
    });
  } else if (unlockedBadges.length > 1) {
    pushToast({
      variant: "success",
      title: `${unlockedBadges.length} conquistas desbloqueadas!`,
      description: unlockedBadges.map((badge) => badge.title).join(", "),
    });
  }

  const previousChallenges = new Map(
    toChallengeArray(previousStats.challenges).map((challenge) => [challenge.key, challenge]),
  );

  const completedChallenges = toChallengeArray(nextStats.challenges).filter((challenge) => {
    const previousChallenge = previousChallenges.get(challenge.key);
    return challenge.completed && !previousChallenge?.completed;
  });

  if (completedChallenges.length === 1) {
    const challenge = completedChallenges[0];

    pushToast({
      variant: "success",
      title: `Desafio diário concluído: ${challenge.title}`,
      description: `Recompensa: ${challenge.reward_xp} XP e ${challenge.reward_coins} moedas.`,
    });
  } else if (completedChallenges.length > 1) {
    pushToast({
      variant: "success",
      title: `${completedChallenges.length} desafios concluídos!`,
      description: completedChallenges.map((challenge) => challenge.title).join(", "),
    });
  }
}

export const useGameStore = create<GameStore>((set, get) => ({
  stats: null,
  isLoading: false,
  message: null,

  setStats: (stats) => {
    set({ stats });
    hydrateEquippedPreferences(stats);
  },

  clearMessage: () => set({ message: null }),

  fetchStatus: async (options) => {
    set({ isLoading: true });

    try {
      const data = await gamificationService.getStatus();

      if (!data?.stats) {
        set({
          stats: null,
          isLoading: false,
        });
        return;
      }

      const previousStats = get().stats;
      const stats = data.stats;

      if (options?.notifyChanges) {
        notifyRewardChanges(previousStats, stats);
      }

      set({
        stats,
        isLoading: false,
      });

      hydrateEquippedPreferences(stats);
    } catch (error) {
      console.error("Erro ao carregar dados de gamificação", error);

      set({
        stats: null,
        isLoading: false,
        message: {
          type: "error",
          text: "Não foi possível carregar os dados de gamificação.",
        },
      });
    }
  },

  claimCoins: async () => {
    try {
      const data = await gamificationService.claimCoins();

      if (data?.stats) {
        set({
          stats: data.stats,
          message: {
            type: "success",
            text: data.message || "Moedas resgatadas com sucesso.",
          },
        });

        hydrateEquippedPreferences(data.stats);
        return;
      }

      set({
        message: {
          type: "error",
          text: data?.error || "Não foi possível resgatar as moedas.",
        },
      });
    } catch (error) {
      console.error("Erro ao resgatar moedas", error);

      set({
        message: {
          type: "error",
          text: "Erro ao resgatar moedas.",
        },
      });
    }
  },

  claimChest: async (chestType) => {
    try {
      const data = await gamificationService.claimChest(chestType);

      if (data?.stats) {
        set({
          stats: data.stats,
          message: {
            type: "success",
            text: data.message || "Baú resgatado com sucesso.",
          },
        });

        hydrateEquippedPreferences(data.stats);
        return;
      }

      set({
        message: {
          type: "error",
          text: data?.error || "Não foi possível resgatar o baú.",
        },
      });
    } catch (error) {
      console.error("Erro ao resgatar baú", error);

      set({
        message: {
          type: "error",
          text: "Erro ao resgatar baú.",
        },
      });
    }
  },
}));