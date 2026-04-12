import { create } from "zustand";
import { applyTheme } from "@/lib/applyTheme";
import { DEFAULT_THEME_KEY, normalizeThemeKey } from "@/lib/themeCatalog";

const STORAGE_KEY = "focusflow_equipped_theme";

type ThemeState = {
  equippedThemeKey: string;
  setEquippedThemeKey: (themeKey: string) => void;
  hydrateFromBackend: (themeKey: string | null | undefined) => void;
  loadTheme: () => void;
  clearTheme: () => void;
};

function sanitizeThemeKey(themeKey?: string | null) {
  return normalizeThemeKey(themeKey);
}

export function getStoredThemeKey() {
  if (typeof window === "undefined") {
    return DEFAULT_THEME_KEY;
  }

  return sanitizeThemeKey(localStorage.getItem(STORAGE_KEY));
}

export const useThemeStore = create<ThemeState>((set) => ({
  equippedThemeKey: DEFAULT_THEME_KEY,

  setEquippedThemeKey: (themeKey) => {
    const safeKey = sanitizeThemeKey(themeKey);

    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, safeKey);
      applyTheme(safeKey);
    }

    set({ equippedThemeKey: safeKey });
  },

  hydrateFromBackend: (themeKey) => {
    const safeKey = sanitizeThemeKey(themeKey);

    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, safeKey);
      applyTheme(safeKey);
    }

    set({ equippedThemeKey: safeKey });
  },

  loadTheme: () => {
    const storedTheme = getStoredThemeKey();
    const safeKey = applyTheme(storedTheme);

    set({ equippedThemeKey: safeKey });
  },

  clearTheme: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
      applyTheme(DEFAULT_THEME_KEY);
    }

    set({ equippedThemeKey: DEFAULT_THEME_KEY });
  },
}));