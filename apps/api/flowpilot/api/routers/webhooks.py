import asyncio
import re
import httpx
from fastapi import APIRouter, Body, Header, HTTPException, Request, status
from flowpilot.core.config import settings
from flowpilot.engine.runner import execute_workflow
from flowpilot.nodes.core.base import ExecutionContext

router = APIRouter()

def generate_telegram_secret_token(workflow_id: str, node_id: str) -> str:
    """Telegram secret_token allows only A-Z, a-z, 0-9, _ and - (1-256 chars)."""
    raw = f"{workflow_id}_{node_id}"
    return re.sub(r"[^A-Za-z0-9_-]", "_", raw)[:256]

# In-memory storage for webhook workflows (demo only)
# Key: f"{workflow_id}:{node_id}", Value: { bot_token, nodes, edges, credentials }
WEBHOOK_WORKFLOWS: dict[str, dict] = {}
RECENT_EVENTS: list[dict] = []


@router.get("/webhook/telegram/status")
async def get_telegram_status():
    """Return the status of the Telegram webhook integration."""
    return {
        "configured": bool(WEBHOOK_WORKFLOWS),
        "bot_token": settings.telegram_bot_token or "",
        "webhook_base_url": settings.webhook_base_url,
        "recent_events": RECENT_EVENTS[-5:],
        "workflows": list(WEBHOOK_WORKFLOWS.keys()),
    }


@router.get("/webhook/telegram/events")
async def get_telegram_events(since: int = 0):
    """Return incoming events received after `since` index."""
    return {"events": [e for e in RECENT_EVENTS if int(e.get("id", 0)) > since]}


@router.post("/webhook/telegram/simulate")
async def simulate_telegram_message(payload: dict = Body(...)):
    """Simulate an incoming Telegram message for canvas testing."""
    text = payload.get("text", "Hello from FlowPilot canvas test!")
    workflow_id = payload.get("workflow_id", "wf_customer_support")
    node_id = payload.get("node_id", "n_telegram_trigger")
    chat_id = payload.get("chat_id", 12345678)

    message = {
        "text": text,
        "chat": {"id": chat_id},
        "from": {"first_name": "Test User"},
    }
    event = {
        "id": str(len(RECENT_EVENTS) + 1),
        "text": text,
        "chat_id": chat_id,
        "sender": "Test User",
        "timestamp": int(asyncio.get_event_loop().time()),
    }
    RECENT_EVENTS.append(event)

    asyncio.create_task(
        _process_telegram_message(workflow_id, node_id, message, text, chat_id)
    )
    return {"ok": True, "event": event}


@router.post("/webhook/telegram/setup")
async def setup_telegram_webhook(payload: dict = Body(...)):
    """Auto-set Telegram webhook and store workflow for execution."""
    bot_token = payload.get("bot_token")
    workflow_id = payload.get("workflow_id")
    node_id = payload.get("node_id")
    nodes = payload.get("nodes", [])
    edges = payload.get("edges", [])
    credentials = payload.get("credentials", {})

    if not bot_token or not workflow_id or not node_id:
        raise HTTPException(status_code=400, detail="Missing bot_token, workflow_id, or node_id")

    webhook_url = f"{settings.webhook_base_url}/api/v1/webhook/telegram/{workflow_id}/{node_id}"
    secret_token = generate_telegram_secret_token(workflow_id, node_id)

    # Store workflow data for later execution
    WEBHOOK_WORKFLOWS[f"{workflow_id}:{node_id}"] = {
        "bot_token": bot_token,
        "nodes": nodes,
        "edges": edges,
        "credentials": credentials,
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"https://api.telegram.org/bot{bot_token}/setWebhook",
            json={
                "url": webhook_url,
                "secret_token": secret_token,
                "allowed_updates": ["message"],
            },
        )
        data = resp.json()
        if not data.get("ok"):
            raise HTTPException(status_code=400, detail=data.get("description", "Telegram API error"))

    return {"ok": True, "webhook_url": webhook_url, "secret_token": secret_token}


async def _process_telegram_message(
    workflow_id: str,
    node_id: str,
    message: dict,
    text: str,
    chat_id: int | None,
):
    """Process incoming Telegram message asynchronously and reply."""
    try:
        # Show typing indicator in Telegram while generating response
        key = f"{workflow_id}:{node_id}"
        stored = WEBHOOK_WORKFLOWS.get(key)
        bot_token = (stored and stored.get("bot_token")) or settings.telegram_bot_token
        nodes = (stored and stored.get("nodes")) or []
        edges = (stored and stored.get("edges")) or []
        credentials = (stored and stored.get("credentials")) or {}

        if chat_id and bot_token:
            try:
                async with httpx.AsyncClient() as client:
                    await client.post(
                        f"https://api.telegram.org/bot{bot_token}/sendChatAction",
                        json={"chat_id": chat_id, "action": "typing"},
                    )
            except Exception:
                pass

        if not nodes:
            # Fallback: if server was reloaded or workflow not yet registered, answer directly via Gemini
            from flowpilot.nodes.ai.aiAgent import AIAgentNode

            agent = AIAgentNode()
            ctx = ExecutionContext(
                workflow_id=workflow_id,
                node_id=node_id,
                credentials={"telegramApi": bot_token},
            )
            ctx.input_json = {"message": message, "text": text, "chat_id": chat_id}
            ctx.parameters = {"model": "gemini-3.1-flash-lite-preview"}
            out = await agent.execute(ctx)
            response_text = str(out.json.get("output", "Hello from FlowPilot!"))

            if chat_id and bot_token:
                async with httpx.AsyncClient() as client:
                    await client.post(
                        f"https://api.telegram.org/bot{bot_token}/sendMessage",
                        json={"chat_id": chat_id, "text": response_text},
                    )
            print(f"DEBUG: Sent Telegram direct reply to chat {chat_id}: {response_text[:60]}...", flush=True)
            return

        # Execute workflow with the message as input
        input_json = {"message": message, "text": text, "chat_id": chat_id}
        results = await execute_workflow(
            workflow_id=workflow_id,
            nodes=nodes,
            edges=edges,
            input_json=input_json,
            credentials=credentials,
        )
        print(f"DEBUG: Webhook execution results: {results}", flush=True)

        # Check if a message was already sent by a telegramSendMessage node
        already_sent = any(r.get("output", {}).get("sent") for r in results)

        # Find the response text from the workflow (e.g. AI Agent output)
        response_text = None
        for result in reversed(results):
            output = result.get("output", {})
            if output.get("output"):
                response_text = str(output["output"])
                break

        # If the workflow failed with error, let the user know on Telegram
        if not response_text and not already_sent:
            errors = [r.get("error") for r in results if r.get("error")]
            if errors:
                response_text = f"Error in workflow: {errors[0]}"
            else:
                response_text = "I received your message, but no output was generated."

        # Send response back to Telegram if not already sent by an action node
        if not already_sent and chat_id and bot_token:
            async with httpx.AsyncClient() as client:
                await client.post(
                    f"https://api.telegram.org/bot{bot_token}/sendMessage",
                    json={"chat_id": chat_id, "text": response_text},
                )
            print(f"DEBUG: Sent workflow reply to Telegram chat {chat_id}", flush=True)

    except Exception as e:
        print(f"ERROR: Failed processing Telegram update: {e}", flush=True)
        if chat_id and bot_token:
            try:
                async with httpx.AsyncClient() as client:
                    await client.post(
                        f"https://api.telegram.org/bot{bot_token}/sendMessage",
                        json={"chat_id": chat_id, "text": f"⚠️ Error: {e}"},
                    )
            except Exception:
                pass


@router.post("/webhook/telegram/{workflow_id}/{node_id}")
async def telegram_webhook(
    workflow_id: str,
    node_id: str,
    request: Request,
    x_telegram_bot_api_secret_token: str | None = Header(default=None),
):
    """Receive Telegram updates, acknowledge immediately, and process in background."""
    # Validate secret token
    expected_secret = generate_telegram_secret_token(workflow_id, node_id)
    if x_telegram_bot_api_secret_token not in (expected_secret, f"{workflow_id}:{node_id}"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid webhook secret token")

    body = await request.json()
    message = body.get("message", {})
    text = message.get("text", "")
    chat_id = message.get("chat", {}).get("id")

    # Acknowledge immediately to avoid Telegram webhook timeout (typically 5s)
    asyncio.create_task(
        _process_telegram_message(
            workflow_id=workflow_id,
            node_id=node_id,
            message=message,
            text=text,
            chat_id=chat_id,
        )
    )

    return {"ok": True, "status": "processing"}


@router.post("/workflows/{workflow_id}/run")
async def run_workflow(workflow_id: str, request: Request):
    """Execute a workflow manually."""
    body = await request.json()
    nodes = body.get("nodes", [])
    edges = body.get("edges", [])
    input_json = body.get("input", {})
    credentials = body.get("credentials", {})

    results = await execute_workflow(
        workflow_id=workflow_id,
        nodes=nodes,
        edges=edges,
        input_json=input_json,
        credentials=credentials,
    )

    return {"workflow_id": workflow_id, "status": "completed", "results": results}
