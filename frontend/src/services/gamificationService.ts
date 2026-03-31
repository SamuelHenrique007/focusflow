import { api } from "./api";

export type ChestType = "wood" | "silver" | "gold";

export interface ChestStatus {
  key: ChestType;
  type_label: string;
  threshold_percent: number;
  required_minutes?: number;
  current_minutes?: number;
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

export interface ChallengeStatus {
  key: string;
  title: string;
  description: string;
  icon: "target" | "clock" | "flame";
  current: number;
  target: number;
  completed: boolean;
  claimed: boolean;
  reward_xp: number;
  reward_coins: number;
  progress_percent: number;
}

export interface EquippedItem {
  id: number;
  name: string;
  category: "avatar" | "theme" | "sound" | string;
  visual_resource?: string;
  rarity?: "Comum" | "Raro" | "Épico" | "Lendário" | string;
}

export interface GameStatus {
  username: string;
  level: number;
  current_xp: number;
  xp_to_next_level: number;
  next_level_xp: number;
  xp_progress_percent: number;
  coins: number;
  streak: number;
  pending_focus_minutes: number;
  daily_goal_minutes: number;
  daily_goal_progress: number;
  total_pomodoros: number;
  total_focus_minutes: number;
  total_tasks_completed: number;
  inventory: number[];
  chests: ChestStatus[] | Record<string, unknown>;
  badges: BadgeStatus[] | Record<string, unknown>;
  challenges: ChallengeStatus[] | Record<string, unknown>;
  equipped_avatar: EquippedItem | null;
  equipped_sound: EquippedItem | null;
  equipped_theme: EquippedItem | null;
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

export interface GameStatusResponse {
  success?: boolean;
  stats: GameStatus;
}

export interface StoreItemsResponse {
  success?: boolean;
  items: StoreItem[];
}

export interface GenericGamificationResponse {
  success?: boolean;
  message?: string;
  error?: string;
  stats?: GameStatus;
  earned_coins?: number;
  xp_gained?: number;
}

export const gamificationService = {
  async getStatus() {
    const response = await api.get<GameStatusResponse>("/gamification/status/");
    return response.data;
  },

  async getStoreItems() {
    const response = await api.get<StoreItemsResponse>("/gamification/store/");
    return response.data;
  },

  async purchaseItem(itemId: number) {
    const response = await api.post<GenericGamificationResponse>(
      `/gamification/store/${itemId}/purchase/`
    );
    return response.data;
  },

  async equipItem(itemId: number) {
    const response = await api.post<GenericGamificationResponse>(
      `/gamification/store/${itemId}/equip/`
    );
    return response.data;
  },

  async claimCoins() {
    const response = await api.post<GenericGamificationResponse>(
      "/gamification/convert-focus-minutes/"
    );
    return response.data;
  },

  async claimChest(chestType: ChestType) {
    const response = await api.post<GenericGamificationResponse>(
      `/gamification/claim-chest/${chestType}/`
    );
    return response.data;
  },
};
