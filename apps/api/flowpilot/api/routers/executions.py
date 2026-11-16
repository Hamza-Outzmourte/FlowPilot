from __future__ import annotations

import uuid

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from flowpilot.api import store
from flowpilot.engine.runner import execute_workflow

router = APIRouter()


class ExecutePayload(BaseModel):
    workflowId: str | None = None
    nodes: list[dict] = []
    edges: list[dict] = []
    input: dict | None = None
    input_json: dict | None = None
    credentials: dict | None = None


@router.post("/execute")
async def execute(body: ExecutePayload):
    wid = body.workflowId or f"wf_{uuid.uuid4().hex[:8]}"
    results = await execute_workflow(
        workflow_id=wid,
        nodes=body.nodes,
        edges=body.edges,
        input_json=body.input or body.input_json or {},
        credentials=body.credentials or {},
    )
    exec_id = f"exec_{uuid.uuid4().hex[:8]}"
    store.EXECUTIONS[exec_id] = {
        "id": exec_id,
        "workflowId": wid,
        "status": "success" if all(r.get("status") in ("success", "skipped") for r in results) else "error",
        "results": results,
    }
    return {"executionId": exec_id, "results": results}


@router.get("/executions/{execution_id}")
async def get_execution(execution_id: str):
    ex = store.EXECUTIONS.get(execution_id)
    if ex is None:
        raise HTTPException(status_code=404, detail="Execution not found")
    return ex


@router.post("/executions/{execution_id}/stop")
async def stop_execution(execution_id: str):
    return None