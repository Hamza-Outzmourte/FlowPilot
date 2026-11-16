import httpx
from flowpilot.core.config import settings
from flowpilot.nodes.core.base import (
    ExecutionContext,
    NodeDefinition,
    NodeOutput,
    ParameterSpec,
    PortSpec,
    BaseNode,
    register_node,
)

TELEGRAM_SEND_MESSAGE_DEFINITION = NodeDefinition(
    type="flowpilot.telegramSendMessage",
    version=1,
    displayName="Send a text message",
    group="action",
    shape="square",
    icon="send",
    inputs=[PortSpec(type="main")],
    outputs=[PortSpec(type="main")],
    credentials=[{"name": "telegramApi", "required": True}],
    properties=[
        ParameterSpec(
            name="chatId",
            type="expression",
            label="Chat ID",
            required=True,
            placeholder="{{ $json.message.chat.id }}",
        ),
        ParameterSpec(
            name="text",
            type="expression",
            label="Text",
            required=True,
            placeholder="{{ $json.output }}",
        ),
    ],
)


class TelegramSendMessageNode(BaseNode):
    definition = TELEGRAM_SEND_MESSAGE_DEFINITION

    async def execute(self, ctx: ExecutionContext) -> NodeOutput:
        bot_token = ctx.get_credential("telegramApi") or settings.telegram_bot_token
        if not bot_token:
            raise ValueError("Telegram bot token credential not found")

        # Resolve expressions from input
        input_json = getattr(ctx, "input_json", {}) or {}

        # Extract chat_id from message or parameters
        chat_id = None
        if isinstance(input_json.get("message"), dict):
            chat_id = input_json["message"].get("chat", {}).get("id")
        if not chat_id:
            chat_id = input_json.get("chat_id")
        if not chat_id:
            param_chat = str(ctx.parameters.get("chatId", ""))
            # Handle {{ $json.message.chat.id }} or direct value
            if "{{ $json.message.chat.id }}" in param_chat:
                chat_id = input_json.get("message", {}).get("chat", {}).get("id")
            elif param_chat and not param_chat.startswith("="):
                chat_id = param_chat

        # Extract text from output or parameters
        raw_text = str(ctx.parameters.get("text", ""))
        text = ""
        if raw_text and not raw_text.startswith("=") and "{{ $json.output }}" not in raw_text:
            text = raw_text
        if not text:
            text = str(input_json.get("output", "Hello from FlowPilot!"))

        if not chat_id:
            raise ValueError(f"Chat ID not found in input: {input_json}")

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"https://api.telegram.org/bot{bot_token}/sendMessage",
                json={"chat_id": chat_id, "text": text},
            )
            resp.raise_for_status()
            result = resp.json()

        return NodeOutput(json={"sent": True, "telegram": result, "text": text})


register_node(TelegramSendMessageNode)
