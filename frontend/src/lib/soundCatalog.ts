export type AppSoundKey =
  | "alerta_supremo"
  | "aurora_digital"
  | "despertar_curto"
  | "despertar_neon"
  | "digital_basico"
  | "eco_futuro"
  | "flauta_zen"
  | "marimba_brilhante"
  | "marimba_serena"
  | "marimba_viva"
  | "ping_simples"
  | "pulso_tecnologico"
  | "sirene_laser"
  | "toque_harmonico"
  | "toque_mensagem";

export type SoundCatalogItem = {
  key: AppSoundKey;
  label: string;
  file: string;
  category: "sound";
};

export const SOUND_CATALOG: SoundCatalogItem[] = [
  {
    key: "alerta_supremo",
    label: "Alerta Supremo",
    file: "/sounds/alerta-supremo.mp3",
    category: "sound",
  },
  {
    key: "aurora_digital",
    label: "Aurora Digital",
    file: "/sounds/aurora-digital.mp3",
    category: "sound",
  },
  {
    key: "despertar_curto",
    label: "Despertar Curto",
    file: "/sounds/despertar-curto.mp3",
    category: "sound",
  },
  {
    key: "despertar_neon",
    label: "Despertar Neon",
    file: "/sounds/despertar-neon.mp3",
    category: "sound",
  },
  {
    key: "digital_basico",
    label: "Digital Básico",
    file: "/sounds/digital-basico.mp3",
    category: "sound",
  },
  {
    key: "eco_futuro",
    label: "Eco Futuro",
    file: "/sounds/eco-futuro.mp3",
    category: "sound",
  },
  {
    key: "flauta_zen",
    label: "Flauta Zen",
    file: "/sounds/flauta-zen.mp3",
    category: "sound",
  },
  {
    key: "marimba_brilhante",
    label: "Marimba Brilhante",
    file: "/sounds/marimba-brilhante.mp3",
    category: "sound",
  },
  {
    key: "marimba_serena",
    label: "Marimba Serena",
    file: "/sounds/marimba-serena.mp3",
    category: "sound",
  },
  {
    key: "marimba_viva",
    label: "Marimba Viva",
    file: "/sounds/marimba-viva.mp3",
    category: "sound",
  },
  {
    key: "ping_simples",
    label: "Ping Simples",
    file: "/sounds/ping-simples.mp3",
    category: "sound",
  },
  {
    key: "pulso_tecnologico",
    label: "Pulso Tecnológico",
    file: "/sounds/pulso-tecnologico.mp3",
    category: "sound",
  },
  {
    key: "sirene_laser",
    label: "Sirene Laser",
    file: "/sounds/sirene-laser.mp3",
    category: "sound",
  },
  {
    key: "toque_harmonico",
    label: "Toque Harmônico",
    file: "/sounds/toque-harmonico.mp3",
    category: "sound",
  },
  {
    key: "toque_mensagem",
    label: "Toque Mensagem",
    file: "/sounds/toque-mensagem.mp3",
    category: "sound",
  },
];

export function getSoundFileByKey(key?: string | null) {
  if (!key) return null;
  const sound = SOUND_CATALOG.find((item) => item.key === key);
  return sound?.file ?? null;
}