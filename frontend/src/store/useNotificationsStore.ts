import { create } from "zustand";
import { api } from "@/services/api";

type NotificationSocketMessage = {
  type?: string;
  unreadCount?: number;
  unread_count?: number;
  totalCount?: number;
  total_count?: number;
  hasUnreadNotifications?: boolean;
  has_unread_notifications?: boolean;
  notificationId?: number | null;
  notification_id?: number | null;
};

type NotificationEventSource = "local" | "socket";

type NotificationState = {
  hasUnreadNotifications: boolean;
  unreadCount: number;
  socketConnected: boolean;
  socket: WebSocket | null;
  fetchUnreadCount: () => Promise<void>;
  connectSocket: (token: string) => void;
  disconnectSocket: () => void;
  setUnreadCount: (count: number) => void;
};

const NOTIFICATIONS_EVENT_NAME = "notifications:changed";

function emitNotificationsChanged(source: NotificationEventSource) {
  window.dispatchEvent(
    new CustomEvent(NOTIFICATIONS_EVENT_NAME, {
      detail: { source },
    })
  );
}

function buildSocketUrl(accessToken: string) {
  const apiBaseUrl =
    (import.meta.env.VITE_API_URL as string | undefined) ??
    "http://localhost:8000/api";

  const backendBaseUrl = apiBaseUrl.replace(/\/api\/?$/, "");

  const isLocalBackend =
    backendBaseUrl.includes("localhost") ||
    backendBaseUrl.includes("127.0.0.1");

  const isHttps =
    !isLocalBackend &&
    (backendBaseUrl.startsWith("https://") ||
      window.location.protocol === "https:");

  const wsProtocol = isHttps ? "wss" : "ws";
  const normalizedBaseUrl = backendBaseUrl.replace(/^https?/, wsProtocol);

  return `${normalizedBaseUrl}/ws/notifications/?token=${encodeURIComponent(
    accessToken
  )}`;
}

export const useNotificationsStore = create<NotificationState>((set, get) => {
  let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  let manuallyClosed = false;

  async function fetchUnreadCount() {
    try {
      const response = await api.get("/notifications/unread-count/");
      const unreadCount = Number(response.data?.count ?? 0);

      set({
        unreadCount,
        hasUnreadNotifications: unreadCount > 0,
      });
    } catch (error) {
      console.error(
        "Erro ao buscar quantidade de notificações não lidas:",
        error
      );
    }
  }

  function connectSocket(token: string) {
    if (!token) {
      console.error("Token não encontrado para conexão WebSocket.");
      return;
    }

    const currentSocket = get().socket;

    if (
      currentSocket &&
      (currentSocket.readyState === WebSocket.OPEN ||
        currentSocket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    manuallyClosed = false;

    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }

    const socketUrl = buildSocketUrl(token);
    const socket = new WebSocket(socketUrl);

    socket.onopen = () => {
      set({
        socketConnected: true,
        socket,
      });

      void fetchUnreadCount();
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as NotificationSocketMessage;

        const unreadCount =
          typeof data.unreadCount === "number"
            ? data.unreadCount
            : typeof data.unread_count === "number"
            ? data.unread_count
            : null;

        const hasUnreadNotifications =
          typeof data.hasUnreadNotifications === "boolean"
            ? data.hasUnreadNotifications
            : typeof data.has_unread_notifications === "boolean"
            ? data.has_unread_notifications
            : null;

        if (unreadCount !== null) {
          set({
            unreadCount,
            hasUnreadNotifications: unreadCount > 0,
          });
        } else if (hasUnreadNotifications !== null) {
          set((state) => ({
            ...state,
            hasUnreadNotifications,
          }));

          void fetchUnreadCount();
        } else {
          void fetchUnreadCount();
        }

        emitNotificationsChanged("socket");
      } catch (error) {
        console.error("Erro ao processar mensagem socket:", error);
      }
    };

    socket.onerror = (event) => {
      console.error("Erro no websocket de notificações:", event);
    };

    socket.onclose = () => {
      set({
        socketConnected: false,
        socket: null,
      });

      if (!manuallyClosed) {
        reconnectTimeout = setTimeout(() => {
          connectSocket(token);
        }, 3000);
      }
    };

    set({ socket });
  }

  function disconnectSocket() {
    manuallyClosed = true;

    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }

    const socket = get().socket;

    if (socket) {
      socket.close();
    }

    set({
      socketConnected: false,
      socket: null,
    });
  }

  function setUnreadCount(count: number) {
    set({
      unreadCount: count,
      hasUnreadNotifications: count > 0,
    });
  }

  return {
    unreadCount: 0,
    hasUnreadNotifications: false,
    socketConnected: false,
    socket: null,
    fetchUnreadCount,
    connectSocket,
    disconnectSocket,
    setUnreadCount,
  };
});