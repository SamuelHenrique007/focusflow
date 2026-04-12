import { useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useNotificationsStore } from "@/store/useNotificationsStore"

export default function NotificationSocketManager() {
  const { accessToken, isAuthenticated } = useAuth()

  const connectSocket = useNotificationsStore((state) => state.connectSocket)
  const disconnectSocket = useNotificationsStore((state) => state.disconnectSocket)
  const fetchUnreadCount = useNotificationsStore((state) => state.fetchUnreadCount)
  const socket = useNotificationsStore((state) => state.socket)
  const socketConnected = useNotificationsStore((state) => state.socketConnected)

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      disconnectSocket()
      return
    }

    connectSocket(accessToken)
    void fetchUnreadCount()

    return disconnectSocket
  }, [isAuthenticated, accessToken, connectSocket, disconnectSocket, fetchUnreadCount])

  useEffect(() => {
    if (!socketConnected || !socket) return

    const interval = window.setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ action: "ping" }))
      }
    }, 30000)

    return () => {
      window.clearInterval(interval)
    }
  }, [socketConnected, socket])

  return null
}
