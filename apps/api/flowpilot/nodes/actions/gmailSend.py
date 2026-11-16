import smtplib
from email.message import EmailMessage

from flowpilot.core.config import settings
from flowpilot.engine.expressions import resolve_value
from flowpilot.nodes.core.base import (
    BaseNode,
    NodeDefinition,
    NodeOutput,
    ParameterSpec,
    PortSpec,
    register_node,
)


GMAIL_SEND_DEFINITION = NodeDefinition(
    type="flowpilot.gmailSend",
    version=1,
    displayName="Send an email",
    group="action",
    shape="square",
    icon="mail",
    inputs=[PortSpec(type="main")],
    outputs=[PortSpec(type="main")],
    credentials=[{"name": "gmailOAuth2", "required": False}],
    properties=[
        ParameterSpec(name="to", type="string", label="To", required=True, placeholder="{{ $json.email }}"),
        ParameterSpec(name="subject", type="string", label="Subject", required=True, placeholder="Your FlowPilot answer"),
        ParameterSpec(name="body", type="string", label="Body", required=True, placeholder="{{ $json.output }}"),
    ],
)


class GmailSendNode(BaseNode):
    definition = GMAIL_SEND_DEFINITION

    async def execute(self, ctx) -> NodeOutput:
        current = getattr(ctx, "input_json", {}) or {}
        node_outputs: dict = getattr(ctx, "node_outputs", {}) or {}

        to_raw = ctx.parameters.get("to", "")
        subject_raw = ctx.parameters.get("subject", "")
        body_raw = ctx.parameters.get("body", "")

        to = str(resolve_value(to_raw, current, node_outputs)).strip()
        subject = str(resolve_value(subject_raw, current, node_outputs)).strip()
        body = str(resolve_value(body_raw, current, node_outputs))

        # Credentials: prefer node credentials, then settings/env
        address = ctx.get_credential("gmailAddress") or ctx.get_credential("gmail") or settings.gmail_address
        password = ctx.get_credential("gmailAppPassword") or ctx.get_credential("gmailPassword") or settings.gmail_app_password

        if not address or not password:
            raise ValueError(
                "Gmail credentials not found. Set GMAIL_ADDRESS and GMAIL_APP_PASSWORD in .env or pass credentials."
            )
        if not to:
            raise ValueError(f"Recipient (to) not found in input: {current}")

        msg = EmailMessage()
        msg["From"] = address
        msg["To"] = to
        msg["Subject"] = subject or "Message from FlowPilot"
        msg.set_content(body or "")

        # Send via Gmail SMTP (app password)
        import asyncio

        def _send():
            with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
                server.login(address, password)
                server.send_message(msg)

        await asyncio.to_thread(_send)

        return NodeOutput(json={"sent": True, "to": to, "subject": subject, "body": body})


register_node(GmailSendNode)