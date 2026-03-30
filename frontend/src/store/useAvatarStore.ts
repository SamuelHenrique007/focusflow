import { create } from "zustand";

const STORAGE_KEY = "focusflow_equipped_avatar";

function getInitialAvatar() {
  if (typeof window === "undefined") return "🙂";
  return localStorage.getItem(STORAGE_KEY) || "🙂";
}

type AvatarState = {
  equippedAvatar: string;
  setEquippedAvatar: (avatar: string) => void;
  loadAvatar: () => void;
};

export const useAvatarStore = create<AvatarState>((set) => ({
  equippedAvatar: getInitialAvatar(),

  setEquippedAvatar: (avatar: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, avatar);
    }

    set({ equippedAvatar: avatar });
  },

  loadAvatar: () => {
    set({ equippedAvatar: getInitialAvatar() });
  },
}));