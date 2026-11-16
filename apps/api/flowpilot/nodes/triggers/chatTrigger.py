from flowpilot.nodes.core.base import (
    BaseNode,
    NodeDefinition,
    NodeOutput,
    ParameterSpec,
    PortSpec,
    register_node,
)


CHAT_TRIGGER_DEFINITION = NodeDefinition(
    type="flowpilot.chatTrigger",
    version=1,
    displayName="Chat Trigger",
    group="trigger",
    shape="square",
    icon="message-circle",
    inputs=[],
    outputs=[PortSpec(type="main")],
    properties=[
        ParameterSpec(name="initialMessage", type="string", label="Initial Message", default="Hi! How can I help you today?"),
    ],
)


class ChatTriggerNode(BaseNode):
    definition = CHAT_TRIGGER_DEFINITION

    async def execute(self, ctx) -> NodeOutput:
        # Chat triggers just forward the incoming input.
        input_json = getattr(ctx, "input_json", {}) or {}
        return NodeOutput(json=dict(input_json) if input_json else {"triggered": True, "source": "chat"})


register_node(ChatTriggerNode)