from __future__ import annotations

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer

from .realtime import build_notifications_snapshot, get_notifications_group_name
from .services import sync_user_notifications


class NotificationConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        user = self.scope.get("user")

        if user is None or not user.is_authenticated:
            await self.close(code=4401)
            return

        self.user = user
        self.group_name = get_notifications_group_name(user.id)

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        changed = await database_sync_to_async(sync_user_notifications)(self.user)
        snapshot = await database_sync_to_async(build_notifications_snapshot)(self.user)

        await self.send_json(
            {
                "type": "notifications.connected",
                "justSynced": changed,
                **snapshot,
            }
        )

    async def disconnect(self, close_code):
        group_name = getattr(self, "group_name", None)
        if group_name:
            await self.channel_layer.group_discard(group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        action = content.get("action")

        if action == "ping":
            snapshot = await database_sync_to_async(build_notifications_snapshot)(self.user)
            await self.send_json({"type": "notifications.pong", **snapshot})

    async def notifications_event(self, event):
        await self.send_json(event["payload"])
