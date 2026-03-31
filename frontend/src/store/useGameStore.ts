import { create } from "zustand";
import {
  gamificationService,
  type ChestType,
  type GameStatus,
} from "@/services/gamificationService";
import { useAvatarStore } from "@/store/useAvatarStore";
import { useSoundStore } from "@/store/useSoundStore";
import { useThemeStore } from "@/store/useThemeStore";

type MessageState = {
  type: "success" | "error";
  text: string;
} | null;

type GameStore = {
  stats: GameStatus | null;
  isLoading: boolean;
  message: MessageState;

  setStats: (stats: GameStatus | null) => void;
  clearMessage: () => void;

  fetchStatus: () => Promise<void>;
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

export const useGameStore = create<GameStore>((set) => ({
  stats: null,
  isLoading: false,
  message: null,

  setStats: (stats) => {
    set({ stats });
    hydrateEquippedPreferences(stats);
  },

  clearMessage: () => set({ message: null }),

  fetchStatus: async () => {
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

      const stats = data.stats;

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
