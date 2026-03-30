import { create } from "zustand";
import { gamificationService, type GameStatus } from "@/services/gamificationService";

interface GameState {
  stats: GameStatus | null;
  isLoading: boolean;
  fetchStatus: () => Promise<void>;
  setStats: (stats: GameStatus) => void;
  updateStats: (newStats: Partial<GameStatus>) => void;
  clearStats: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  stats: null,
  isLoading: false,

  fetchStatus: async () => {
    set({ isLoading: true });
    try {
      const data = await gamificationService.getStatus();
      set({ stats: data.stats, isLoading: false });
    } catch (error) {
      console.error("Erro ao carregar dados de gamificação:", error);
      set({ isLoading: false });
    }
  },

  setStats: (stats) => set({ stats }),

  updateStats: (newStats) =>
    set((state) => ({
      stats: state.stats ? { ...state.stats, ...newStats } : null,
    })),

  clearStats: () => set({ stats: null }),
}));