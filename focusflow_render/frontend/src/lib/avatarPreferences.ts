const STORAGE_KEY = "focusflow_equipped_avatar";

export function getEquippedAvatarKey(): string {
  if (typeof window === "undefined") return "🙂";
  return localStorage.getItem(STORAGE_KEY) || "🙂";
}

export function setEquippedAvatarKey(avatarKey: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, avatarKey);
}