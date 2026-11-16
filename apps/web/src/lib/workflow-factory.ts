import { MarkerType, type Edge } from "@xyflow/react";
import {
  AI_AGENT_TYPE,
  AI_SUB_PORT_SPECS,
  defaultParameters,
  requireNodeDefinition,
} from "@/data/node-catalog";
import type {
  ConnectionType,
  FlowNode,
  FlowNodeData,
  WorkflowSettings,
} from "@/types/workflow";
import { uid } from "./utils";

export const DEFAULT_SETTINGS: WorkflowSettings = {
  timezone: "Africa/Casablanca",
  timeoutSeconds: 3600,
  saveExecutionData: "all",
};

export const EDGE_MARKER = {
  type: MarkerType.ArrowClosed,
  width: 16,
  height: 16,
  color: "var(--edge)",
} as const;

export interface CreateNodeOptions {
  id?: string;
  label?: string;
  parameters?: Record<string, unknown>;
  disabled?: boolean;
  pinned?: boolean;
  status?: FlowNodeData["status"];
}

export function createFlowNode(
  type: string,
  position: { x: number; y: number },
  options: CreateNodeOptions = {},
): FlowNode {
  const definition = requireNodeDefinition(type);
  const data: FlowNodeData = {
    label: options.label ?? definition.displayName,
    subtitle: definition.subtitle,
    nodeType: type,
    group: definition.group,
    shape: definition.shape,
    icon: definition.icon,
    parameters: {
      ...defaultParameters(definition),
      ...options.parameters,
    },
    disabled: options.disabled ?? false,
    pinned: options.pinned ?? false,
    inputs: definition.inputs,
    outputs: definition.outputs,
    status: options.status ?? "idle",
  };

  if (type === AI_AGENT_TYPE) {
    data.agentSubPorts = AI_SUB_PORT_SPECS.map((port) => ({
      ...port,
      connected: false,
    }));
  }

  return {
    id: options.id ?? uid("n"),
    type: "flowpilot",
    position,
    data,
    width: definition.shape === "wide" ? 258 : definition.shape === "circle" ? 92 : 110,
    height: definition.shape === "circle" ? 92 : 110,
    measured:
      definition.shape === "circle"
        ? { width: 92, height: 92 }
        : definition.shape === "wide"
          ? { width: 258, height: 110 }
          : { width: 110, height: 110 },
  };
}

export function createStickyNote(
  position: { x: number; y: number },
  body: string,
  color = "amber",
): FlowNode {
  return {
    id: uid("sticky"),
    type: "sticky",
    position,
    width: 240,
    height: 160,
    data: {
      label: "Sticky note",
      nodeType: "flowpilot.sticky",
      group: "core",
      shape: "square",
      icon: "square-pen",
      parameters: {},
      inputs: [],
      outputs: [],
      status: "idle",
      noteBody: body,
      noteColor: color,
    },
  };
}

export interface CreateEdgeOptions {
  id?: string;
  sourceHandle?: string;
  targetHandle?: string;
  connectionType?: ConnectionType;
  label?: string;
}

export function createEdge(
  source: string,
  target: string,
  options: CreateEdgeOptions = {},
): Edge {
  const connectionType = options.connectionType ?? "main";
  return {
    id: options.id ?? uid("e"),
    source,
    target,
    sourceHandle: options.sourceHandle ?? "out-0",
    targetHandle: options.targetHandle ?? "in-0",
    type: "flowpilot",
    markerEnd: EDGE_MARKER,
    data: {
      connectionType,
      label: options.label,
    },
  };
}

export function connectionTypeForHandle(
  node: FlowNode | undefined,
  handleId: string | null | undefined,
): ConnectionType {
  if (!node) return "main";
  if (!handleId) return "main";
  if (handleId.startsWith("out-")) {
    const index = Number(handleId.slice(4));
    return node.data.outputs[index]?.type ?? "main";
  }
  if (handleId.startsWith("ai_")) return handleId as ConnectionType;
  if (handleId.startsWith("in-")) return "main";
  return "main";
}

export function isValidConnection(
  source: FlowNode | undefined,
  sourceHandle: string | null | undefined,
  target: FlowNode | undefined,
  targetHandle: string | null | undefined,
): boolean {
  if (!source || !target || source.id === target.id) return false;
  const sourceType = connectionTypeForHandle(source, sourceHandle);
  const targetType = connectionTypeForHandle(target, targetHandle);

  if (sourceType === "main" && targetType === "main") {
    return !target.data.inputs.every((port) => port.type !== "main");
  }
  if (sourceType === "main") return false;
  if (targetType === "main") return false;
  return sourceType === targetType;
}
