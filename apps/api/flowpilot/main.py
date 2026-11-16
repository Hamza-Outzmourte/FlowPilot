from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from flowpilot.core.config import settings
from flowpilot.api.routers import webhooks, executions, workflows

# Import all node modules to trigger @register_node registration
import flowpilot.nodes.triggers.telegramTrigger  # noqa: F401
import flowpilot.nodes.triggers.chatTrigger  # noqa: F401
import flowpilot.nodes.actions.telegramSendMessage  # noqa: F401
import flowpilot.nodes.actions.gmailSend  # noqa: F401
import flowpilot.nodes.ai.aiAgent  # noqa: F401
import flowpilot.nodes.flow.ifNode  # noqa: F401

app = FastAPI(title="FlowPilot API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.cors_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(webhooks.router, prefix="/api/v1")
app.include_router(workflows.router, prefix="/api/v1")
app.include_router(executions.router, prefix="/api/v1")


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/api/v1/nodes")
async def list_nodes():
    from flowpilot.nodes.core.base import list_node_definitions

    nodes = list_node_definitions()
    return {"nodes": [d.model_dump() for d in nodes]}