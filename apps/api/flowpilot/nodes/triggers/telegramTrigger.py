import re
import httpx
from flowpilot.nodes.core.base import (
    ExecutionContext,
    NodeDefinition,
    NodeOutput,
    ParameterSpec,
    PortSpec,
    TriggerNode,
    register_node,
)

TELEGRAM_TRIGGER_DEFINITION = NodeDefinition(
    type="flowpilot.telegramTrigger",
    version=1,
    displayName="Telegram Trigger",
    group="trigger",
    shape="square",
    icon="telegram",
    inputs=[],
    outputs=[PortSpec(type="main")],
    credentials=[{"name": "telegramApi", "required": True}],
    properties=[
        ParameterSpec(
            name="updates",
            type="options",
            label="Updates to listen for",
            required=True,
            options=["message", "edited_message", "channel_post"],
        ),
    ],
)


class TelegramTriggerNode(TriggerNode):
    definition = TELEGRAM_TRIGGER_DEFINITION

    async def execute(self, ctx: ExecutionContext) -> NodeOutput:
        # Trigger nodes don't execute on demand; they are activated via webhook.
        # This is called when the workflow is manually run from the editor.
        return NodeOutput(json={"triggered": True, "source": "telegram"})

    async def activate(self, ctx: ExecutionContext) -> None:
        bot_token = ctx.get_credential("telegramApi")
        if not bot_token:
            raise ValueError("Telegram bot token credential not found")

        webhook_url = (
            f"{ctx.__dict__.get('webhook_base_url', 'http://localhost:8000')}"
            f"/api/v1/webhook/telegram/{ctx.workflow_id}/{ctx.node_id}"
        )

        async with httpx.AsyncClient() as client:
            # Set webhook with secret token for security
            resp = await client.post(
                f"https://api.telegram.org/bot{bot_token}/setWebhook",
                json={
                    "url": webhook_url,
                    "secret_token": re.sub(r"[^A-Za-z0-9_-]", "_", f"{ctx.workflow_id}_{ctx.node_id}")[:256],
                    "allowed_updates": ["message"],
                },
            )
            resp.raise_for_status()

    async def deactivate(self, ctx: ExecutionContext) -> None:
        bot_token = ctx.get_credential("telegramApi")
        if not bot_token:
            return

        async with httpx.AsyncClient() as client:
            await client.post(
                f"https://api.telegram.org/bot{bot_token}/deleteWebhook",
            )


register_node(TelegramTriggerNode)
