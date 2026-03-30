import { create } from "zustand";

const STORAGE_KEY = "focusflow_equipped_sound";
export const DEFAULT_SOUND_KEY = "marimba_serena";

type SoundState = {
  equippedSoundKey: string;
  setEquippedSoundKey: (soundKey: string) => void;
  hydrateFromBackend: (soundKey: string | null | undefined) => void;
  loadSound: () => void;
  clearSound: () => void;
};

export function getStoredSoundKey() {
  if (typeof window === "undefined") {
    return DEFAULT_SOUND_KEY;
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  return stored || DEFAULT_SOUND_KEY;
}

export const useSoundStore = create<SoundState>((set) => ({
  equippedSoundKey: getStoredSoundKey(),

  setEquippedSoundKey: (soundKey) => {
    const safeKey = soundKey?.trim() || DEFAULT_SOUND_KEY;

    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, safeKey);
    }

    set({ equippedSoundKey: safeKey });
  },

  hydrateFromBackend: (soundKey) => {
    const safeKey = soundKey?.trim() || DEFAULT_SOUND_KEY;

    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, safeKey);
    }

    set({ equippedSoundKey: safeKey });
  },

  loadSound: () => {
    const storedSound = getStoredSoundKey();
    set({ equippedSoundKey: storedSound });
  },

  clearSound: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }

    set({ equippedSoundKey: DEFAULT_SOUND_KEY });
  },
}));