import { THEME_CATALOG } from "@/lib/themeCatalog";

export function applyTheme(themeKey: string) {
  if (typeof window === "undefined") return;

  const root = document.documentElement;
  const theme = THEME_CATALOG[themeKey] || THEME_CATALOG.focusflow_default;

  Object.entries(theme).forEach(([cssVar, value]) => {
    root.style.setProperty(cssVar, value);
  });

  root.dataset.theme = themeKey;
}