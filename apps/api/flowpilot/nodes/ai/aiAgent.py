from typing import Any

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage
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

AI_AGENT_DEFINITION = NodeDefinition(
    type="flowpilot.aiAgent",
    version=1,
    displayName="AI Agent",
    group="ai",
    shape="wide",
    icon="bot",
    inputs=[PortSpec(type="main")],
    outputs=[PortSpec(type="main")],
    credentials=[],
    properties=[
        ParameterSpec(
            name="systemPrompt",
            type="string",
            label="System Prompt",
            required=False,
            placeholder="You are a helpful assistant.",
        ),
        ParameterSpec(
            name="model",
            type="string",
            label="Model",
            required=False,
            placeholder="gemini-2.5-flash",
        ),
    ],
)


class AIAgentNode(BaseNode):
    definition = AI_AGENT_DEFINITION

    async def execute(self, ctx: ExecutionContext) -> NodeOutput:
        # Get input from previous node
        input_json = getattr(ctx, "input_json", {}) or {}
        input_text = ""
        if isinstance(input_json.get("message"), dict):
            input_text = str(input_json["message"].get("text", ""))
        if not input_text and input_json.get("text"):
            input_text = str(input_json["text"])
        if not input_text:
            input_text = str(input_json.get("output", "Hello"))

        # Get parameters - prefer lightning fast models (gemini-3.1-flash-lite-preview: ~2s)
        system_prompt = str(ctx.parameters.get("systemPrompt", "You are a helpful assistant."))
        model_name = str(ctx.parameters.get("model") or "gemini-3.5-flash")
        # Normalize deprecated/unknown model names to a known-good one
        if any(v in model_name for v in ("2.5", "2.0", "1.5", "3.8", "gemma", "flash-latest", "lite")):
            model_name = "gemini-3.5-flash"

        # Get Gemini API key from credentials
        api_key = ctx.get_credential("googlePalmApi")
        if not api_key:
            api_key = settings.google_api_key

        if not api_key:
            raise ValueError(
                "Google Gemini API key not found. "
                "Add it in Settings → Credentials or set GOOGLE_API_KEY env var."
            )

        # Call Gemini via LangChain with short timeout and single retry
        try:
            llm = ChatGoogleGenerativeAI(
                model=model_name,
                google_api_key=api_key,
                temperature=0.7,
                max_output_tokens=2000,
                max_retries=1,
                timeout=60,
            )
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=input_text),
            ]
            response = await llm.ainvoke(messages)
        except Exception:
            # Fallback to gemini-flash-lite-latest if preview model fails
            model_name = "gemini-3.5-flash"
            llm = ChatGoogleGenerativeAI(
                model=model_name,
                google_api_key=api_key,
                temperature=0.7,
                max_output_tokens=2000,
                max_retries=1,
                timeout=60,
            )
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=input_text),
            ]
            response = await llm.ainvoke(messages)

        # Extract text from response content (Gemini 3.8 returns list of parts)
        def _extract_text(content) -> str:
            if isinstance(content, str):
                return content
            elif isinstance(content, list):
                parts = []
                for item in content:
                    if isinstance(item, dict) and "text" in item:
                        parts.append(item["text"])
                    elif isinstance(item, str):
                        parts.append(item)
                    elif hasattr(item, "text"):
                        parts.append(str(item.text))
                return "".join(parts) if parts else str(content)
            return str(content)

        output_text = _extract_text(response.content)

        return NodeOutput(
            json={
                "output": output_text,
                "input": input_text,
                "model": model_name,
            }
        )


register_node(AIAgentNode)
