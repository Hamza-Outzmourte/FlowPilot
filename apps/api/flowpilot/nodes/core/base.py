from abc import ABC, abstractmethod
from typing import Any, ClassVar, Dict, List, Optional

from pydantic import BaseModel


class PortSpec(BaseModel):
    type: str  # "main" | "ai_languageModel" | "ai_memory" | "ai_tool" | etc.
    label: Optional[str] = None
    required: bool = False


class ParameterSpec(BaseModel):
    name: str
    type: str  # "string" | "number" | "boolean" | "options" | "json" | "code" | "expression" | "collection" | "credential"
    label: Optional[str] = None
    required: bool = False
    options: Optional[List[str]] = None
    placeholder: Optional[str] = None


class NodeDefinition(BaseModel):
    type: str
    version: int = 1
    displayName: str
    subtitle: Optional[str] = None
    group: str  # "trigger" | "action" | "flow" | "data" | "ai" | "core" | "human"
    shape: str = "square"  # "square" | "wide" | "circle"
    icon: str
    inputs: List[PortSpec] = []
    outputs: List[PortSpec] = []
    credentials: Optional[List[Dict[str, Any]]] = None
    properties: List[ParameterSpec] = []
    documentationUrl: Optional[str] = None


class NodeOutput(BaseModel):
    json: Dict[str, Any]
    binary: Optional[Dict[str, Any]] = None
    paired_item: Optional[Dict[str, Any]] = None


class ExecutionContext(BaseModel):
    workflow_id: str
    node_id: str
    credentials: Dict[str, Any] = {}
    input_json: Dict[str, Any] = {}
    parameters: Dict[str, Any] = {}

    class Config:
        extra = "allow"

    def get_credential(self, name: str) -> Optional[str]:
        return self.credentials.get(name)


class BaseNode(ABC):
    definition: ClassVar[NodeDefinition]

    @abstractmethod
    async def execute(self, ctx: ExecutionContext) -> NodeOutput:
        ...


class TriggerNode(BaseNode):
    @abstractmethod
    async def activate(self, ctx: ExecutionContext) -> None:
        """Register webhook / start polling / schedule cron."""

    @abstractmethod
    async def deactivate(self, ctx: ExecutionContext) -> None:
        """Remove webhook / stop polling / unschedule."""


# Registry
_NODE_REGISTRY: Dict[str, type[BaseNode]] = {}


def register_node(node_class: type[BaseNode]) -> type[BaseNode]:
    _NODE_REGISTRY[node_class.definition.type] = node_class
    return node_class


def get_node_definition(node_type: str) -> Optional[NodeDefinition]:
    cls = _NODE_REGISTRY.get(node_type)
    if cls is None:
        return None
    return cls.definition


def list_node_definitions() -> List[NodeDefinition]:
    return [cls.definition for cls in _NODE_REGISTRY.values()]
