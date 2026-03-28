// src/store/useGameStore.ts
import { create } from 'zustand';
import { gamificationService, type GameStatus } from "../services/gamificationService";

interface GameState {
  stats: GameStatus | null;
  isLoading: boolean;
  fetchStatus: () => Promise<void>;
  updateStats: (newStats: Partial<GameStatus>) => void;
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
      console.error("Erro ao carregar dados de gamificação", error);
      set({ isLoading: false });
    }
  },

  updateStats: (newStats) => 
    set((state) => ({
      stats: state.stats ? { ...state.stats, ...newStats } : null
    })),
}));