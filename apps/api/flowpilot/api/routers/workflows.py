from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from flowpilot.api import store

router = APIRouter()


class WorkflowPayload(BaseModel):
    id: str | None = None
    name: str = "Untitled workflow"
    description: str = ""
    active: bool = False
    version: int = 1
    tags: list[str] = []
    settings: dict[str, Any] = {}
    nodes: list[dict[str, Any]] = []
    edges: list[dict[str, Any]] = []


@router.get("/workflows")
async def list_workflows():
    return {"workflows": list(store.WORKFLOWS.values())}


@router.get("/workflows/{workflow_id}")
async def get_workflow(workflow_id: str):
    wf = store.WORKFLOWS.get(workflow_id)
    if wf is None:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return wf


@router.post("/workflows")
async def create_workflow(payload: WorkflowPayload):
    wid = payload.id or f"wf_{uuid.uuid4().hex[:8]}"
    data = payload.model_dump()
    data["id"] = wid
    store.WORKFLOWS[wid] = data
    return data


@router.patch("/workflows/{workflow_id}")
async def update_workflow(workflow_id: str, payload: WorkflowPayload):
    if workflow_id not in store.WORKFLOWS:
        # upsert
        pass
    data = payload.model_dump()
    data["id"] = workflow_id
    store.WORKFLOWS[workflow_id] = {**store.WORKFLOWS.get(workflow_id, {}), **data}
    return store.WORKFLOWS[workflow_id]


@router.delete("/workflows/{workflow_id}")
async def delete_workflow(workflow_id: str):
    store.WORKFLOWS.pop(workflow_id, None)
    return None


@router.post("/workflows/{workflow_id}/run")
async def run_workflow(workflow_id: str, body: dict[str, Any] | None = None):
    body = body or {}
    wf = store.WORKFLOWS.get(workflow_id)
    nodes = body.get("nodes") or (wf or {}).get("nodes", [])
    edges = body.get("edges") or (wf or {}).get("edges", [])
    input_json = body.get("input", {}) or body.get("input_json", {}) or {}
    credentials = body.get("credentials", {}) or {}
    # also accept top-level credential map
    if not credentials and body.get("credential"):
        credentials = body["credential"]

    from flowpilot.engine.runner import execute_workflow

    results = await execute_workflow(
        workflow_id=workflow_id,
        nodes=nodes,
        edges=edges,
        input_json=input_json,
        credentials=credentials,
    )
    exec_id = f"exec_{uuid.uuid4().hex[:8]}"
    store.EXECUTIONS[exec_id] = {
        "id": exec_id,
        "workflowId": workflow_id,
        "status": "success" if all(r.get("status") in ("success", "skipped") for r in results) else "error",
        "results": results,
    }
    return {"executionId": exec_id, "results": results}