"""Lightweight expression resolver for workflow node parameters."""

from __future__ import annotations

import re
from typing import Any


_JSON_PATH_RE = re.compile(r"\{\{\s*\$json\.([\w\.]+)\s*\}\}")
_NODE_REF_RE = re.compile(r"\{\{\s*\$\('([^']+)'\)\.item\.json\.([\w\.]+)\s*\}")


def _get_path(obj: Any, path: str) -> Any:
    cur = obj
    for part in path.split("."):
        if isinstance(cur, dict):
            cur = cur.get(part)
        elif isinstance(cur, list):
            try:
                cur = cur[int(part)]
            except (ValueError, IndexError):
                return None
        else:
            return None
        if cur is None:
            return None
    return cur


def resolve_value(value: Any, current: dict[str, Any], node_outputs: dict[str, dict[str, Any]]) -> Any:
    if not isinstance(value, str):
        return value

    text = value.strip()

    # n8n-style leading "=" marks the whole value as an expression.
    if text.startswith("="):
        text = text[1:].strip()

    # Whole-string template: replace with the resolved value (preserving type when possible).
    if text.startswith("{{") and text.endswith("}}") and text.count("{{") == 1:
        inner = text[2:-2].strip()
        if inner.startswith("$json."):
            path = inner[len("$json."):]
            resolved = _get_path(current, path)
            return resolved if resolved is not None else ""
        m = re.match(r"\$\('([^']+)'\)\.item\.json\.(.+)", inner)
        if m:
            name, path = m.group(1), m.group(2)
            out = node_outputs.get(name, {})
            resolved = _get_path(out, path)
            return resolved if resolved is not None else ""
        return value

    # Inline replacement within a larger string.
    def _repl_json(m: re.Match) -> str:
        resolved = _get_path(current, m.group(1))
        return "" if resolved is None else str(resolved)

    def _repl_node(m: re.Match) -> str:
        name, path = m.group(1), m.group(2)
        out = node_outputs.get(name, {})
        resolved = _get_path(out, path)
        return "" if resolved is None else str(resolved)

    result = _JSON_PATH_RE.sub(_repl_json, text)
    result = _NODE_REF_RE.sub(_repl_node, result)
    return result


def resolve_parameters(params: dict[str, Any], current: dict[str, Any], node_outputs: dict[str, dict[str, Any]]) -> dict[str, Any]:
    return {k: resolve_value(v, current, node_outputs) for k, v in (params or {}).items()}