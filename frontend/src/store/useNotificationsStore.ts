import { create } from "zustand"
import { notificationsService } from "@/services/notifications"

type NotificationsState = {
  unreadCount: number
  hasUnreadNotifications: boolean
  isLoadingUnreadCount: boolean
  fetchUnreadCount: () => Promise<void>
  setUnreadCount: (count: number) => void
  clearUnreadCount: () => void
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  unreadCount: 0,
  hasUnreadNotifications: false,
  isLoadingUnreadCount: false,

  fetchUnreadCount: async () => {
    try {
      set({ isLoadingUnreadCount: true })

      const data = await notificationsService.unreadCount()
      const count = data.count ?? 0

      set({
        unreadCount: count,
        hasUnreadNotifications: count > 0,
        isLoadingUnreadCount: false,
      })
    } catch (error) {
      console.error("Erro ao carregar contador de notificações", error)

      set({
        unreadCount: 0,
        hasUnreadNotifications: false,
        isLoadingUnreadCount: false,
      })
    }
  },

  setUnreadCount: (count) =>
    set({
      unreadCount: Math.max(0, count),
      hasUnreadNotifications: count > 0,
    }),

  clearUnreadCount: () =>
    set({
      unreadCount: 0,
      hasUnreadNotifications: false,
    }),
}))