const STORAGE_KEY = "focusflow_equipped_sound";

export function getEquippedSoundKey(): string {
  return localStorage.getItem(STORAGE_KEY) || "marimba_serena";
}

export function setEquippedSoundKey(soundKey: string) {
  localStorage.setItem(STORAGE_KEY, soundKey);
}