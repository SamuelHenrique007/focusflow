export type ThemeDefinition = {
  label: string;
  vars: Record<string, string>;
};

export const THEME_CATALOG: Record<string, ThemeDefinition> = {
  focusflow_default: {
    label: "FocusFlow Padrão",
    vars: {
      "--ff-primary": "#2563eb",
      "--ff-primary-strong": "#1d4ed8",
      "--ff-primary-soft": "#dbeafe",
      "--ff-surface": "#ffffff",
      "--ff-surface-soft": "#f8fafc",
      "--ff-surface-muted": "#e2e8f0",
      "--ff-border": "#cbd5e1",
      "--ff-text": "#0f172a",
      "--ff-text-soft": "#475569",
      "--ff-text-muted": "#64748b",
      "--ff-ring": "rgba(37, 99, 235, 0.22)",
    },
  },

  sunset_focus: {
    label: "Sunset Focus",
    vars: {
      "--ff-primary": "#f97316",
      "--ff-primary-strong": "#ea580c",
      "--ff-primary-soft": "#ffedd5",
      "--ff-surface": "#fffaf5",
      "--ff-surface-soft": "#fff7ed",
      "--ff-surface-muted": "#fed7aa",
      "--ff-border": "#fdba74",
      "--ff-text": "#431407",
      "--ff-text-soft": "#7c2d12",
      "--ff-text-muted": "#9a3412",
      "--ff-ring": "rgba(249, 115, 22, 0.24)",
    },
  },

  forest_calm: {
    label: "Forest Calm",
    vars: {
      "--ff-primary": "#059669",
      "--ff-primary-strong": "#047857",
      "--ff-primary-soft": "#d1fae5",
      "--ff-surface": "#f7fffb",
      "--ff-surface-soft": "#ecfdf5",
      "--ff-surface-muted": "#bbf7d0",
      "--ff-border": "#86efac",
      "--ff-text": "#052e16",
      "--ff-text-soft": "#14532d",
      "--ff-text-muted": "#166534",
      "--ff-ring": "rgba(5, 150, 105, 0.22)",
    },
  },

  night_mode: {
    label: "Night Mode",
    vars: {
      "--ff-primary": "#8b5cf6",
      "--ff-primary-strong": "#7c3aed",
      "--ff-primary-soft": "#312e81",
      "--ff-surface": "#0f172a",
      "--ff-surface-soft": "#1e293b",
      "--ff-surface-muted": "#334155",
      "--ff-border": "#475569",
      "--ff-text": "#f8fafc",
      "--ff-text-soft": "#e2e8f0",
      "--ff-text-muted": "#cbd5e1",
      "--ff-ring": "rgba(139, 92, 246, 0.30)",
    },
  },

  cyberpunk_neon: {
    label: "Cyberpunk Neon",
    vars: {
      "--ff-primary": "#06b6d4",
      "--ff-primary-strong": "#0891b2",
      "--ff-primary-soft": "#083344",
      "--ff-surface": "#09090b",
      "--ff-surface-soft": "#18181b",
      "--ff-surface-muted": "#27272a",
      "--ff-border": "#3f3f46",
      "--ff-text": "#f4f4f5",
      "--ff-text-soft": "#d4d4d8",
      "--ff-text-muted": "#a1a1aa",
      "--ff-ring": "rgba(6, 182, 212, 0.28)",
    },
  },

  aurora_bloom: {
    label: "Aurora Bloom",
    vars: {
      "--ff-primary": "#db2777",
      "--ff-primary-strong": "#be185d",
      "--ff-primary-soft": "#fce7f3",
      "--ff-surface": "#fffafc",
      "--ff-surface-soft": "#fdf2f8",
      "--ff-surface-muted": "#fbcfe8",
      "--ff-border": "#f9a8d4",
      "--ff-text": "#500724",
      "--ff-text-soft": "#831843",
      "--ff-text-muted": "#9d174d",
      "--ff-ring": "rgba(219, 39, 119, 0.22)",
    },
  },

  ocean_breeze: {
    label: "Ocean Breeze",
    vars: {
      "--ff-primary": "#0ea5e9",
      "--ff-primary-strong": "#0284c7",
      "--ff-primary-soft": "#e0f2fe",
      "--ff-surface": "#f8fdff",
      "--ff-surface-soft": "#f0f9ff",
      "--ff-surface-muted": "#bae6fd",
      "--ff-border": "#7dd3fc",
      "--ff-text": "#082f49",
      "--ff-text-soft": "#0c4a6e",
      "--ff-text-muted": "#0369a1",
      "--ff-ring": "rgba(14, 165, 233, 0.24)",
    },
  },

  lavender_mist: {
    label: "Lavender Mist",
    vars: {
      "--ff-primary": "#a855f7",
      "--ff-primary-strong": "#9333ea",
      "--ff-primary-soft": "#f3e8ff",
      "--ff-surface": "#fdfaff",
      "--ff-surface-soft": "#faf5ff",
      "--ff-surface-muted": "#e9d5ff",
      "--ff-border": "#d8b4fe",
      "--ff-text": "#3b0764",
      "--ff-text-soft": "#581c87",
      "--ff-text-muted": "#7e22ce",
      "--ff-ring": "rgba(168, 85, 247, 0.24)",
    },
  },
};

export const DEFAULT_THEME_KEY = "focusflow_default";

const THEME_ALIASES: Record<string, keyof typeof THEME_CATALOG> = {
  default: "focusflow_default",
  padrao: "focusflow_default",
  "tema padrão": "focusflow_default",
  "tema padrao": "focusflow_default",
  focusflow: "focusflow_default",

  sunset: "sunset_focus",
  sunset_focus: "sunset_focus",
  laranja: "sunset_focus",
  "tema pôr do sol": "sunset_focus",
  "tema por do sol": "sunset_focus",

  forest: "forest_calm",
  forest_calm: "forest_calm",
  verde: "forest_calm",
  "tema floresta": "forest_calm",

  dark: "night_mode",
  night: "night_mode",
  night_mode: "night_mode",
  "tema dark clássico": "night_mode",
  "tema dark classico": "night_mode",
  "🌙": "night_mode",

  cyberpunk: "cyberpunk_neon",
  neon: "cyberpunk_neon",
  cyberpunk_neon: "cyberpunk_neon",
  "tema cyberpunk neon": "cyberpunk_neon",
  "⚡": "cyberpunk_neon",

  aurora: "aurora_bloom",
  aurora_bloom: "aurora_bloom",
  rosa: "aurora_bloom",

  ocean: "ocean_breeze",
  ocean_breeze: "ocean_breeze",
  azul: "ocean_breeze",

  lavender: "lavender_mist",
  lavender_mist: "lavender_mist",
  roxo: "lavender_mist",
};

export function normalizeThemeKey(
  themeKey?: string | null
): keyof typeof THEME_CATALOG {
  const raw = themeKey?.trim();

  if (!raw) {
    return DEFAULT_THEME_KEY;
  }

  if (raw in THEME_CATALOG) {
    return raw as keyof typeof THEME_CATALOG;
  }

  const normalized = raw
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

  if (normalized in THEME_CATALOG) {
    return normalized as keyof typeof THEME_CATALOG;
  }

  return THEME_ALIASES[normalized] || DEFAULT_THEME_KEY;
}

export function isValidThemeKey(
  themeKey?: string | null
): themeKey is keyof typeof THEME_CATALOG {
  return normalizeThemeKey(themeKey) in THEME_CATALOG;
}

export function getThemeDefinition(themeKey?: string | null) {
  return THEME_CATALOG[normalizeThemeKey(themeKey)];
}
