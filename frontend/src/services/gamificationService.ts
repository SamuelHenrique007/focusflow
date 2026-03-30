import { api } from "./api";

export type ChestType = "wood" | "silver" | "gold";

export interface ChestStatus {
  key: ChestType;
  type_label: string;
  threshold: number;
  reward_label: string;
  claimed: boolean;
  unlocked: boolean;
  ready_to_claim: boolean;
}

export interface BadgeStatus {
  key: string;
  title: string;
  description: string;
  icon: "target" | "clock" | "flame" | "zap" | "shield";
  color: "blue" | "amber" | "orange" | "purple" | "emerald";
  current: number;
  target: number;
  unlocked: boolean;
  progress_percent: number;
}

export interface GameStatus {
  username: string;
  level: number;
  current_xp: number;
  xp_to_next_level: number;
  xp_progress_percent: number;
  coins: number;
  streak: number;
  pending_focus_minutes: number;
  daily_goal_progress: number;
  total_pomodoros: number;
  total_tasks_completed: number;
  chests: ChestStatus[];
  badges: BadgeStatus[];
}

export interface StoreItem {
  id: number;
  name: string;
  description: string;
  price: number;
  required_level: number;
  category: "avatar" | "theme" | "sound" | string;
  rarity: "Comum" | "Raro" | "Épico" | "Lendário" | string;
  visual_resource?: string;
  owned: boolean;
  equipped: boolean;
}

export const gamificationService = {
  async getStatus() {
    const response = await api.get<{ stats: GameStatus }>("/gamification/status/");
    return response.data;
  },

  async convertFocus(minutes: number) {
    const response = await api.post("/gamification/actions/convert-focus/", { minutes });
    return response.data;
  },

  async claimCoins() {
    const response = await api.post("/gamification/actions/claim-coins/");
    return response.data;
  },

  async claimChest(chestType: ChestType) {
    const response = await api.post(`/gamification/actions/claim-chest/${chestType}/`);
    return response.data;
  },

  async completeTaskReward() {
    const response = await api.post("/gamification/actions/complete-task/");
    return response.data;
  },

  async getStoreItems() {
    const response = await api.get<StoreItem[]>("/gamification/store/");
    return response.data;
  },

  async purchaseItem(itemId: number) {
    const response = await api.post(`/gamification/store/${itemId}/purchase/`);
    return response.data;
  },
};