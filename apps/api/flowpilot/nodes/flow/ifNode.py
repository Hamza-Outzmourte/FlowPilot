from typing import Any

from flowpilot.engine.expressions import resolve_value
from flowpilot.nodes.core.base import (
    BaseNode,
    NodeDefinition,
    NodeOutput,
    ParameterSpec,
    PortSpec,
    register_node,
)


IF_DEFINITION = NodeDefinition(
    type="flowpilot.if",
    version=1,
    displayName="If",
    group="flow",
    shape="square",
    icon="git-branch",
    inputs=[PortSpec(type="main")],
    outputs=[PortSpec(type="main"), PortSpec(type="main")],
    properties=[
        ParameterSpec(name="left", type="string", label="Left value", placeholder="{{ $json.channel }}"),
        ParameterSpec(name="operator", type="string", label="Operator", placeholder="equals"),
        ParameterSpec(name="right", type="string", label="Right value", placeholder="telegram"),
    ],
)


def _to_number(v: Any) -> float | None:
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


class IfNode(BaseNode):
    definition = IF_DEFINITION

    async def execute(self, ctx) -> NodeOutput:
        current = getattr(ctx, "input_json", {}) or {}
        left_raw = ctx.parameters.get("left", "")
        right_raw = ctx.parameters.get("right", "")
        left = resolve_value(left_raw, current, {})
        right = resolve_value(right_raw, current, {})
        operator = str(ctx.parameters.get("operator", "equals")).lower()

        matched = False
        if operator in ("equals", "equal", "=="):
            matched = str(left) == str(right)
        elif operator in ("not equals", "not_equal", "!="):
            matched = str(left) != str(right)
        elif operator in ("greater than", ">", "gt"):
            ln, rn = _to_number(left), _to_number(right)
            matched = ln is not None and rn is not None and ln > rn
        elif operator in ("less than", "<", "lt"):
            ln, rn = _to_number(left), _to_number(right)
            matched = ln is not None and rn is not None and ln < rn
        elif operator in ("contains",):
            matched = str(right) in str(left)
        else:
            matched = str(left) == str(right)

        return NodeOutput(json={"matched": matched, "branch": "true" if matched else "false", "left": left, "right": right})


register_node(IfNode)