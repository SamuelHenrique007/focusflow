import { useEffect } from "react"

import { useAuth } from "@/hooks/useAuth"
import { useNotificationsStore } from "@/store/useNotificationsStore"

export default function NotificationSocketManager() {
  const { accessToken, isAuthenticated } = useAuth()
  const connectSocket = useNotificationsStore((state) => state.connectSocket)
  const disconnectSocket = useNotificationsStore((state) => state.disconnectSocket)
  const fetchUnreadCount = useNotificationsStore((state) => state.fetchUnreadCount)

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      disconnectSocket()
      return
    }

    void fetchUnreadCount()
    connectSocket(accessToken)

    return () => {
      disconnectSocket()
    }
  }, [isAuthenticated, accessToken, fetchUnreadCount, connectSocket, disconnectSocket])

  return null
}