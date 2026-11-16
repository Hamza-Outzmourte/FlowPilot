import { getNodeDefinition } from "@/data/node-catalog";
import type {
  ConnectionType,
  FlowNode,
  StoredWorkflow,
  WorkflowJson,
} from "@/types/workflow";
import {
  createEdge,
  createFlowNode,
  DEFAULT_SETTINGS,
} from "./workflow-factory";
import { deepClone, uid } from "./utils";
import { workflowJsonSchema, type WorkflowJsonInput } from "./schema";
import { saveStoredWorkflow } from "./storage";

function handleIndex(handleId: string | null | undefined, prefix: string): number {
  if (!handleId?.startsWith(prefix)) return 0;
  const parsed = Number(handleId.slice(prefix.length));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function toWorkflowJson(workflow: StoredWorkflow): WorkflowJson {
  const labelById = new Map(
    workflow.nodes.map((node) => [node.id, node.data.label]),
  );

  const connections: WorkflowJson["connections"] = {};

  for (const edge of workflow.edges) {
    const sourceName = labelById.get(edge.source);
    const targetName = labelById.get(edge.target);
    if (!sourceName || !targetName) continue;

    const connectionType = (edge.data?.connectionType ??
      "main") as ConnectionType;
    const sourceIndex =
      connectionType === "main" ? handleIndex(edge.sourceHandle, "out-") : 0;
    const targetIndex = handleIndex(edge.targetHandle, "in-");

    const nodeConnections = connections[sourceName] ?? {};
    const groups = nodeConnections[connectionType] ?? [];
    while (groups.length <= sourceIndex) groups.push([]);
    const group = groups[sourceIndex] ?? [];
    group.push({ node: targetName, type: connectionType, index: targetIndex });
    groups[sourceIndex] = group;
    nodeConnections[connectionType] = groups;
    connections[sourceName] = nodeConnections;
  }

  return {
    id: workflow.id,
    name: workflow.name,
    active: workflow.active,
    version: workflow.version,
    nodes: workflow.nodes
      .filter((node) => node.type === "flowpilot")
      .map((node) => ({
        id: node.id,
        type: node.data.nodeType,
        name: node.data.label,
        position: [node.position.x, node.position.y],
        parameters: deepClone(node.data.parameters),
        disabled: node.data.disabled,
      })),
    connections,
    settings: workflow.settings,
    pinData: {},
  };
}

export function fromWorkflowJson(
  input: WorkflowJsonInput,
  options: { newId?: boolean } = {},
): StoredWorkflow {
  const idByName = new Map<string, string>();
  const nodes: FlowNode[] = [];

  for (const node of input.nodes) {
    const definition = getNodeDefinition(node.type);
    if (!definition) continue;
    const created = createFlowNode(
      node.type,
      { x: node.position[0], y: node.position[1] },
      {
        label: node.name,
        parameters: node.parameters,
        disabled: node.disabled,
      },
    );
    idByName.set(node.name, created.id);
    nodes.push(created);
  }

  const edges = [];

  for (const [sourceName, connectionGroups] of Object.entries(
    input.connections,
  )) {
    const sourceId = idByName.get(sourceName);
    if (!sourceId) continue;
    for (const [connectionType, groups] of Object.entries(connectionGroups)) {
      if (!groups) continue;
      for (let sourceIndex = 0; sourceIndex < groups.length; sourceIndex++) {
        const targets = groups[sourceIndex] ?? [];
        for (const target of targets) {
          const targetId = idByName.get(target.node);
          if (!targetId) continue;
          const isMain = connectionType === "main";
          edges.push(
            createEdge(sourceId, targetId, {
              sourceHandle: isMain ? `out-${sourceIndex}` : "out-0",
              targetHandle: isMain ? `in-${target.index}` : connectionType,
              connectionType: connectionType as ConnectionType,
            }),
          );
        }
      }
    }
  }

  return {
    id: options.newId === false ? input.id : uid("wf"),
    name: input.name,
    active: input.active,
    version: input.version,
    description: undefined,
    tags: [],
    settings: input.settings ?? DEFAULT_SETTINGS,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodes,
    edges,
  };
}

export function downloadWorkflow(workflow: StoredWorkflow): void {
  const json = toWorkflowJson(workflow);
  const blob = new Blob([JSON.stringify(json, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${workflow.name.replace(/[^a-z0-9-_]+/gi, "-").toLowerCase()}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function importWorkflowFile(file: File): Promise<StoredWorkflow> {
  const text = await file.text();
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("The file does not contain valid JSON.");
  }
  const parsed = workflowJsonSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error("The file is not a valid FlowPilot workflow.");
  }
  const workflow = fromWorkflowJson(parsed.data);
  saveStoredWorkflow(workflow);
  return workflow;
}
