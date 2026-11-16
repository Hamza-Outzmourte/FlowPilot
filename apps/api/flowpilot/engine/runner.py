"""Simple workflow execution engine."""

import asyncio
from typing import Any

from flowpilot.core.config import settings
from flowpilot.engine.expressions import resolve_parameters
from flowpilot.nodes.core.base import (
    ExecutionContext,
    NodeOutput,
    get_node_definition,
)
from flowpilot.nodes import *  # noqa: F401 - triggers @register_node


class ExecutionError(Exception):
    pass


def _main_edges(edges: list[dict]) -> list[dict]:
    out = []
    for e in edges:
        ct = e.get("data", {}).get("connectionType") if isinstance(e.get("data"), dict) else None
        if ct is None:
            ct = e.get("connectionType", "main")
        if ct == "main":
            out.append(e)
    return out


def _is_subnode(node: dict, edges: list[dict]) -> bool:
    nid = node["id"]
    has_main_in = any(e.get("target") == nid for e in edges)
    has_main_out = any(e.get("source") == nid for e in edges)
    has_ai_edge = any(
        (e.get("data", {}) or {}).get("connectionType", e.get("connectionType", "main")) != "main"
        and (e.get("source") == nid or e.get("target") == nid)
        for e in edges
    )
    # sub-nodes only connect via ai_* edges (and have at least one such edge)
    return (not has_main_in and not has_main_out) and has_ai_edge


async def execute_workflow(
    workflow_id: str,
    nodes: list[dict],
    edges: list[dict],
    input_json: dict[str, Any] | None = None,
    credentials: dict[str, dict[str, str]] | None = None,
) -> list[dict]:
    input_json = input_json or {}
    credentials = credentials or {}

    node_map: dict[str, dict] = {n["id"]: n for n in nodes}
    main_edges = _main_edges(edges)

    children: dict[str, list[dict]] = {}
    for edge in main_edges:
        source = edge.get("source")
        target = edge.get("target")
        if source and target and target in node_map:
            children.setdefault(source, []).append(node_map[target])

    incoming_main = {e.get("target") for e in main_edges if e.get("target")}
    start_nodes = [n for n in nodes if n["id"] not in incoming_main and not _is_subnode(n, main_edges)]

    # Filter out sub-nodes from traversal entirely
    runnable = [n for n in nodes if not _is_subnode(n, main_edges)]

    results: list[dict] = []
    visited: set[str] = set()
    current_output: dict[str, Any] = dict(input_json)
    node_outputs: dict[str, dict[str, Any]] = {}  # by node id
    node_outputs_by_name: dict[str, dict[str, Any]] = {}  # by label

    async def run_node(node: dict) -> dict[str, Any]:
        nonlocal current_output
        node_id = node["id"]
        node_data = node.get("data", {}) or {}
        node_type = node_data.get("nodeType") or node.get("type", "")
        label = node_data.get("label", node_type)
        parameters = node_data.get("parameters", {}) or {}

        definition = get_node_definition(node_type)
        if definition is None:
            return {
                "nodeId": node_id,
                "nodeName": label,
                "nodeType": node_type,
                "status": "skipped",
                "input": dict(current_output),
                "output": {},
            }

        node_credentials = credentials.get(node_id, {})
        # fall back to global credentials keyed by node type or "*" 
        if not node_credentials:
            node_credentials = credentials.get("*", {})

        ctx = ExecutionContext(
            workflow_id=workflow_id,
            node_id=node_id,
            credentials=node_credentials,
        )
        ctx.input_json = dict(current_output)  # type: ignore[attr-defined]
        ctx.parameters = resolve_parameters(parameters, current_output, node_outputs_by_name)  # type: ignore[attr-defined]
        ctx.node_outputs = node_outputs_by_name  # type: ignore[attr-defined]

        from flowpilot.nodes.core.base import _NODE_REGISTRY

        node_cls = _NODE_REGISTRY.get(node_type)
        if node_cls is None:
            return {
                "nodeId": node_id,
                "nodeName": label,
                "nodeType": node_type,
                "status": "skipped",
                "input": dict(current_output),
                "output": {},
            }

        node_instance = node_cls()
        output: NodeOutput = await node_instance.execute(ctx)

        # Update current output for downstream nodes
        current_output = {**current_output, **(output.json or {})}

        node_outputs[node_id] = output.json or {}
        node_outputs_by_name[label] = output.json or {}
        # also register by node id string for $('id') lookups
        node_outputs_by_name[node_id] = output.json or {}

        return {
            "nodeId": node_id,
            "nodeName": label,
            "nodeType": node_type,
            "status": "success",
            "input": dict(current_output),
            "output": output.json or {},
        }

    # BFS with branching
    queue: list[dict] = list(start_nodes)
    while queue:
        node = queue.pop(0)
        node_id = node["id"]
        if node_id in visited:
            continue
        if _is_subnode(node, main_edges):
            continue
        visited.add(node_id)

        node_type = (node.get("data", {}) or {}).get("nodeType") or node.get("type", "")

        try:
            result = await run_node(node)
            results.append(result)
        except Exception as exc:  # noqa: BLE001
            results.append(
                {
                    "nodeId": node_id,
                    "nodeName": (node.get("data", {}) or {}).get("label", node_type),
                    "nodeType": node_type,
                    "status": "error",
                    "error": str(exc),
                }
            )
            continue

        outs = children.get(node_id, [])
        # Branching: if If node, pick branch
        if node_type == "flowpilot.if" and len(outs) > 1:
            matched = (result.get("output") or {}).get("matched", False)
            # out-0 = true branch, out-1 = false branch (by convention)
            # find edge sourceHandle
            branch_edges = [e for e in main_edges if e.get("source") == node_id]
            chosen_handle = "out-0" if matched else "out-1"
            chosen_targets = []
            for e in branch_edges:
                sh = e.get("sourceHandle", "out-0")
                if sh == chosen_handle:
                    t = e.get("target")
                    if t in node_map:
                        chosen_targets.append(node_map[t])
            if not chosen_targets:
                # fallback: first
                if outs:
                    chosen_targets = [outs[0]]
            for t in chosen_targets:
                if t.get("id") not in visited:
                    queue.append(t)
        else:
            for child in outs:
                if child.get("id") not in visited:
                    queue.append(child)

    # Ensure all runnable nodes visited? If disconnected, skip.
    return results