// src/services/gamificationService.ts
import {api} from './api'; // Supondo que você já tenha um axios configurado

export interface GameStatus {
  username: string;
  level: number;
  current_xp: number;
  xp_to_next_level: number;
  xp_progress_percent: number;
  coins: number;
  streak: number;
  pending_minutes: number;
  daily_progress: number;
}

export const gamificationService = {
  // Busca o status geral (Sidebar/Dashboard)
  getStatus: async () => {
    const response = await api.get('/gamification/status/');
    return response.data;
  },

  // Converte minutos de foco em moedas
  convertFocus: async () => {
    const response = await api.post('/gamification/actions/convert-focus/');
    return response.data;
  },

  // Resgata um baú (wood, silver, gold)
  claimChest: async (chestType: 'wood' | 'silver' | 'gold') => {
    const response = await api.post(`/gamification/actions/claim-chest/${chestType}/`);
    return response.data;
  },

  // Lista itens da loja
  getStoreItems: async () => {
    const response = await api.get('/gamification/store/items/');
    return response.data;
  },

  // Compra um item
  purchaseItem: async (itemId: number) => {
    const response = await api.post(`/gamification/store/purchase/${itemId}/`);
    return response.data;
  }
};