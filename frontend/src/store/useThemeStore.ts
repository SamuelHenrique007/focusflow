import { create } from "zustand";
import { applyTheme } from "@/lib/applyTheme";

const STORAGE_KEY = "focusflow_equipped_theme";
export const DEFAULT_THEME_KEY = "focusflow_default";

type ThemeState = {
  equippedThemeKey: string;
  setEquippedThemeKey: (themeKey: string) => void;
  hydrateFromBackend: (themeKey: string | null | undefined) => void;
  loadTheme: () => void;
  clearTheme: () => void;
};

export function getStoredThemeKey() {
  if (typeof window === "undefined") {
    return DEFAULT_THEME_KEY;
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  return stored || DEFAULT_THEME_KEY;
}

export const useThemeStore = create<ThemeState>((set) => ({
  equippedThemeKey: getStoredThemeKey(),

  setEquippedThemeKey: (themeKey) => {
    const safeKey = themeKey?.trim() || DEFAULT_THEME_KEY;

    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, safeKey);
      applyTheme(safeKey);
    }

    set({ equippedThemeKey: safeKey });
  },

  hydrateFromBackend: (themeKey) => {
    const safeKey = themeKey?.trim() || DEFAULT_THEME_KEY;

    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, safeKey);
      applyTheme(safeKey);
    }

    set({ equippedThemeKey: safeKey });
  },

  loadTheme: () => {
    const storedTheme = getStoredThemeKey();

    if (typeof window !== "undefined") {
      applyTheme(storedTheme);
    }

    set({ equippedThemeKey: storedTheme });
  },

  clearTheme: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
      applyTheme(DEFAULT_THEME_KEY);
    }

    set({ equippedThemeKey: DEFAULT_THEME_KEY });
  },
}));