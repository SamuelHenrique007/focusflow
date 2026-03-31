import { create } from "zustand";

export type ToastVariant = "success" | "info" | "error";

export type ToastItem = {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  duration?: number;
};

type ToastStore = {
  toasts: ToastItem[];
  pushToast: (toast: Omit<ToastItem, "id">) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
};

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  pushToast: (toast) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));

    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },

  clearToasts: () => set({ toasts: [] }),
}));
