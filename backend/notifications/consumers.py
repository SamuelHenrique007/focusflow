from __future__ import annotations

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer

from .realtime import build_notifications_snapshot
from .services import sync_user_notifications
from channels.db import database_sync_to_async


class NotificationConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]

        if not self.user.is_authenticated:
            await self.close()
            return

        self.group_name = f"notifications_{self.user.id}"

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        await database_sync_to_async(sync_user_notifications)(self.user)
        snapshot = await database_sync_to_async(build_notifications_snapshot)(self.user)

        await self.send_json({
            "type": "notifications.snapshot",
            **snapshot,
        })

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        action = content.get("action")

        if action == "ping":
            changed = await database_sync_to_async(sync_user_notifications)(self.user)
            snapshot = await database_sync_to_async(build_notifications_snapshot)(self.user)

            await self.send_json({
                "type": "notifications.pong",
                "justSynced": changed,
                **snapshot,
            })

    async def notifications_broadcast(self, event):
        await self.send_json(event["payload"])
    async def disconnect(self, close_code):
        group_name = getattr(self, "group_name", None)
        if group_name:
            await self.channel_layer.group_discard(group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        action = content.get("action")

        if action == "ping":
            changed = await database_sync_to_async(sync_user_notifications)(self.user)
            snapshot = await database_sync_to_async(build_notifications_snapshot)(self.user)
            await self.send_json(
                {
                    "type": "notifications.pong",
                    "justSynced": changed,
                    **snapshot,
                }
            )

    async def notifications_event(self, event):
        await self.send_json(event["payload"])
