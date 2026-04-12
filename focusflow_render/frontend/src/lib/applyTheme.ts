import {
  DEFAULT_THEME_KEY,
  getThemeDefinition,
  normalizeThemeKey,
} from "@/lib/themeCatalog";

export function applyTheme(themeKey?: string | null) {
  if (typeof window === "undefined") return DEFAULT_THEME_KEY;

  const root = document.documentElement;
  const safeThemeKey = normalizeThemeKey(themeKey);
  const theme = getThemeDefinition(safeThemeKey);

  Object.entries(theme.vars).forEach(([cssVar, value]) => {
    root.style.setProperty(cssVar, value);
  });

  root.dataset.theme = safeThemeKey;
  root.style.colorScheme = safeThemeKey === "night_mode" ? "dark" : "light";

  return safeThemeKey;
}