import { create } from "zustand";

const STORAGE_KEY = "focusflow_equipped_avatar";
const DEFAULT_AVATAR = "🙂";

type AvatarState = {
  equippedAvatar: string;
  setEquippedAvatar: (avatar: string) => void;
  hydrateFromBackend: (avatar: string | null | undefined) => void;
  loadAvatar: () => void;
  clearAvatar: () => void;
};

function getStoredAvatar() {
  if (typeof window === "undefined") {
    return DEFAULT_AVATAR;
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  return stored || DEFAULT_AVATAR;
}

export const useAvatarStore = create<AvatarState>((set) => ({
  equippedAvatar: getStoredAvatar(),

  setEquippedAvatar: (avatar) => {
    const safeAvatar = avatar?.trim() || DEFAULT_AVATAR;

    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, safeAvatar);
    }

    set({ equippedAvatar: safeAvatar });
  },

  hydrateFromBackend: (avatar) => {
    const safeAvatar = avatar?.trim() || DEFAULT_AVATAR;

    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, safeAvatar);
    }

    set({ equippedAvatar: safeAvatar });
  },

  loadAvatar: () => {
    const storedAvatar = getStoredAvatar();
    set({ equippedAvatar: storedAvatar });
  },

  clearAvatar: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }

    set({ equippedAvatar: DEFAULT_AVATAR });
  },
}));