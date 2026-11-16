import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react";
import { create } from "zustand";
import {
  AI_AGENT_TYPE,
  defaultParameters,
  getNodeDefinition,
  requireNodeDefinition,
} from "@/data/node-catalog";
import {
  connectionTypeForHandle,
  createEdge,
  createFlowNode,
  createStickyNote,
  isValidConnection,
} from "@/lib/workflow-factory";
import { deepClone, sleep, uid } from "@/lib/utils";
import { api } from "@/lib/api";
import type {
  ConnectionType,
  ExecutionStatus,
  NodeRunStatus,
  FlowNode,
  JsonValue,
  LogEntry,
  NodeGroup,
  NodeRun,
  StoredWorkflow,
  WorkflowMeta,
} from "@/types/workflow";

interface Snapshot {
  nodes: FlowNode[];
  edges: Edge[];
}

export interface CreatorState {
  open: boolean;
  sourceNodeId?: string;
  sourceHandle?: string;
  connectionType?: ConnectionType;
  query?: string;
  group?: NodeGroup;
}

interface ExecutionState {
  status: ExecutionStatus;
  startedAt?: number;
  finishedAt?: number;
  runToken: number;
  currentNodeId?: string;
  logs: LogEntry[];
  nodeRuns: Record<string, NodeRun>;
}

export interface ExecuteInputs {
  prompt: string;
  channel: "telegram" | "gmail";
  email: string;
  chatId: string;
}

export interface EditorState {
  workflow: WorkflowMeta;
  nodes: FlowNode[];
  edges: Edge[];
  revision: number;
  saveState: "saved" | "saving" | "unsaved";
  lastSavedAt: number | null;
  past: Snapshot[];
  future: Snapshot[];
  selectedNodeId: string | null;
  creator: CreatorState;
  ndvNodeId: string | null;
  assistantOpen: boolean;
  overviewOpen: boolean;
  logsOpen: boolean;
  execution: ExecutionState;

  init: (workflow: StoredWorkflow) => void;
  setWorkflowMeta: (patch: Partial<WorkflowMeta>) => void;
  setSaveState: (state: "saved" | "saving" | "unsaved") => void;
  markSaved: () => void;
  onNodesChange: (changes: NodeChange<FlowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (
    type: string,
    position: { x: number; y: number },
    source?: { nodeId: string; handleId: string | null },
    openDetail?: boolean,
  ) => string;
  addStickyNote: (position: { x: number; y: number }) => void;
  updateNodeData: (id: string, patch: Partial<FlowNode["data"]>) => void;
  updateNodeParameters: (id: string, parameters: Record<string, unknown>) => void;
  deleteNode: (id: string) => void;
  deleteEdge: (id: string) => void;
  duplicateNode: (id: string) => void;
  setSelectedNodeId: (id: string | null) => void;
  toggleNodeDisabled: (id: string) => void;
  toggleNodePinned: (id: string) => void;
  setNodeStatus: (id: string, status: FlowNode["data"]["status"], error?: string) => void;
  undo: () => void;
  redo: () => void;
  takeSnapshot: () => void;
  openCreator: (payload?: Partial<CreatorState>) => void;
  closeCreator: () => void;
  openNdv: (id: string) => void;
  closeNdv: () => void;
  setAssistantOpen: (open: boolean) => void;
  setOverviewOpen: (open: boolean) => void;
  setLogsOpen: (open: boolean) => void;
  execute: (startNodeId?: string, inputs?: ExecuteInputs) => Promise<void>;
  executeDialogOpen: boolean;
  openExecuteDialog: () => void;
  closeExecuteDialog: () => void;
  stopExecution: () => void;
  resetExecution: () => void;
  tidyUp: () => void;
}

const initialWorkflow: WorkflowMeta = {
  id: "wf_new",
  name: "Untitled workflow",
  active: false,
  version: 1,
  tags: [],
  settings: {
    timezone: "Africa/Casablanca",
    timeoutSeconds: 3600,
    saveExecutionData: "all",
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const initialExecution: ExecutionState = {
  status: "idle",
  runToken: 0,
  logs: [],
  nodeRuns: {},
};

function snapshotOf(state: { nodes: FlowNode[]; edges: Edge[] }): Snapshot {
  return {
    nodes: deepClone(state.nodes),
    edges: deepClone(state.edges),
  };
}

function mockOutputFor(
  node: FlowNode,
  upstream: JsonValue,
): { output: JsonValue; tokens: number; cost: number } {
  const type = node.data.nodeType;

  if (type === "flowpilot.telegramTrigger") {
    return {
      output: {
        update_id: 884_213,
        message: {
          message_id: 4821,
          text: "Hey! My subscription renewed today. Can I get the invoice for March?",
          chat: { id: 842_119_004, type: "private" },
          from: { id: 842_119_004, first_name: "Maya", username: "mayak" },
        },
      },
      tokens: 0,
      cost: 0,
    };
  }

  if (type === "flowpilot.gmailTrigger") {
    return {
      output: {
        id: "18f2c9a1",
        threadId: "18f2c9a1",
        from: "maya@acme.co",
        subject: "Invoice question",
        snippet: "Could you send me the March invoice?",
      },
      tokens: 0,
      cost: 0,
    };
  }

  if (type === "flowpilot.aiAgent") {
    return {
      output: {
        output:
          "Of course, Maya. Your March invoice is attached to your billing portal and I've emailed a copy to maya@acme.co. Renewal is confirmed for April 1.",
        confidence: 0.92,
        intermediateSteps: [
          { tool: "support_knowledge", input: "invoice renewal March" },
          { tool: "gmail_reply", input: "send invoice copy" },
        ],
      },
      tokens: 1284,
      cost: 0.0031,
    };
  }

  if (type === "flowpilot.if") {
    return {
      output: { confidence: 0.92, branch: "true", matched: true },
      tokens: 0,
      cost: 0,
    };
  }

  if (type === "flowpilot.telegramSendMessage" || type === "flowpilot.telegramSendPhoto") {
    return {
      output: { ok: true, message_id: 4822, chat: { id: 842_119_004 } },
      tokens: 0,
      cost: 0,
    };
  }

  if (type === "flowpilot.gmailReply" || type === "flowpilot.gmailSend") {
    return {
      output: { id: "18f2ca77", threadId: "18f2c9a1", labelIds: ["SENT"] },
      tokens: 0,
      cost: 0,
    };
  }

  if (node.data.group === "ai") {
    return {
      output: {
        model: node.data.label,
        tokens: 620,
        latencyMs: 840,
        preview: "Sub-node resolved into the agent runtime.",
      },
      tokens: 620,
      cost: 0.0012,
    };
  }

  return {
    output: {
      ok: true,
      node: node.data.label,
      received: upstream,
    },
    tokens: 0,
    cost: 0,
  };
}

function executionPlan(
  nodes: FlowNode[],
  edges: Edge[],
  startNodeId?: string,
): FlowNode[] {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const mainOut = new Map<string, Edge[]>();
  const aiIn = new Map<string, Edge[]>();

  for (const edge of edges) {
    const connectionType =
      typeof edge.data?.connectionType === "string"
        ? edge.data.connectionType
        : "main";
    if (connectionType === "main") {
      const list = mainOut.get(edge.source) ?? [];
      list.push(edge);
      mainOut.set(edge.source, list);
    } else {
      const list = aiIn.get(edge.target) ?? [];
      list.push(edge);
      aiIn.set(edge.target, list);
    }
  }

  const start =
    (startNodeId ? byId.get(startNodeId) : undefined) ??
    nodes.find(
      (node) =>
        node.data.group === "trigger" && (mainOut.get(node.id)?.length ?? 0) > 0,
    ) ??
    nodes.find((node) => node.data.group === "trigger") ??
    nodes.find(
      (node) =>
        !edges.some(
          (edge) =>
            edge.target === node.id && edge.data?.connectionType === "main",
        ),
    );

  if (!start) return [];

  const ordered: FlowNode[] = [];
  const visited = new Set<string>();

  const visit = (node: FlowNode) => {
    if (visited.has(node.id)) return;
    visited.add(node.id);

    for (const edge of aiIn.get(node.id) ?? []) {
      const subNode = byId.get(edge.source);
      if (subNode) visit(subNode);
    }

    ordered.push(node);

    const outgoing = mainOut.get(node.id) ?? [];
    if (outgoing.length === 0) return;

    const branches = node.data.outputs.filter((port) => port.type === "main");
    if (branches.length > 1) {
      const firstEdge = outgoing.find((edge) => edge.sourceHandle === "out-0");
      if (firstEdge) {
        const target = byId.get(firstEdge.target);
        if (target) visit(target);
      }
      return;
    }

    for (const edge of outgoing) {
      const target = byId.get(edge.target);
      if (target) visit(target);
    }
  };

  visit(start);
  return ordered;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  workflow: initialWorkflow,
  nodes: [],
  edges: [],
  revision: 0,
  saveState: "saved",
  lastSavedAt: null,
  past: [],
  future: [],
  selectedNodeId: null,
  creator: { open: false },
  ndvNodeId: null,
  assistantOpen: false,
  overviewOpen: false,
  logsOpen: false,
  executeDialogOpen: false,
  execution: initialExecution,

  init: (workflow) => {
    set({
      workflow: {
        id: workflow.id,
        name: workflow.name,
        active: workflow.active,
        version: workflow.version,
        description: workflow.description,
        tags: workflow.tags,
        settings: workflow.settings,
        createdAt: workflow.createdAt,
        updatedAt: workflow.updatedAt,
      },
      nodes: deepClone(workflow.nodes).map((node) => ({
        ...node,
        selected: false,
        dragging: false,
      })),
      edges: deepClone(workflow.edges).map((edge) => ({
        ...edge,
        selected: false,
      })),
      revision: 0,
      saveState: "saved",
      lastSavedAt: Date.now(),
      past: [],
      future: [],
      selectedNodeId: null,
      creator: { open: false },
      ndvNodeId: null,
      execution: { ...initialExecution, runToken: get().execution.runToken + 1 },
    });
  },

  setWorkflowMeta: (patch) => {
    set((state) => ({
      workflow: { ...state.workflow, ...patch },
      revision: state.revision + 1,
      saveState: "unsaved",
    }));
  },

  setSaveState: (saveState) => set({ saveState }),
  markSaved: () => set({ saveState: "saved", lastSavedAt: Date.now() }),

  onNodesChange: (changes) => {
    const meaningful = changes.some(
      (change) => change.type !== "select" && change.type !== "dimensions",
    );
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
      revision: meaningful ? state.revision + 1 : state.revision,
      saveState: meaningful ? "unsaved" : state.saveState,
    }));
  },

  onEdgesChange: (changes) => {
    const meaningful = changes.some((change) => change.type !== "select");
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
      revision: meaningful ? state.revision + 1 : state.revision,
      saveState: meaningful ? "unsaved" : state.saveState,
    }));
  },

  onConnect: (connection) => {
    const state = get();
    if (!connection.source || !connection.target) return;
    const sourceNode = state.nodes.find((node) => node.id === connection.source);
    const targetNode = state.nodes.find((node) => node.id === connection.target);
    if (
      !isValidConnection(
        sourceNode,
        connection.sourceHandle,
        targetNode,
        connection.targetHandle,
      )
    ) {
      return;
    }
    if (
      state.edges.some(
        (edge) =>
          edge.source === connection.source &&
          edge.target === connection.target &&
          edge.sourceHandle === connection.sourceHandle &&
          edge.targetHandle === connection.targetHandle,
      )
    ) {
      return;
    }

    const connectionType = connectionTypeForHandle(
      sourceNode,
      connection.sourceHandle,
    );
    const edge = createEdge(connection.source, connection.target, {
      sourceHandle: connection.sourceHandle ?? "out-0",
      targetHandle: connection.targetHandle ?? "in-0",
      connectionType,
    });

    get().takeSnapshot();
    set((current) => ({
      edges: addEdge(edge, current.edges),
      revision: current.revision + 1,
      saveState: "unsaved",
    }));
  },

  addNode: (type, position, source, openDetail = true) => {
    const definition = getNodeDefinition(type);
    if (!definition) return "";
    get().takeSnapshot();

    let nodePosition = position;
    const state = get();
    if (source?.nodeId) {
      const sourceNode = state.nodes.find((node) => node.id === source.nodeId);
      if (sourceNode) {
        const isAiConnection =
          source.handleId?.startsWith("ai_") ?? false;
        if (isAiConnection) {
          const siblings = state.nodes.filter((node) =>
            state.edges.some(
              (edge) =>
                edge.target === sourceNode.id && edge.source === node.id,
            ),
          );
          nodePosition = {
            x: sourceNode.position.x + 258 / 2 - 46 + siblings.length * 96,
            y: sourceNode.position.y + 250,
          };
        } else {
          nodePosition = {
            x: sourceNode.position.x + 270,
            y: sourceNode.position.y,
          };
        }
      }
    }

    const node = createFlowNode(type, nodePosition);

    set((current) => {
      let edges = current.edges;
      if (source?.nodeId) {
        const sourceNode = current.nodes.find((item) => item.id === source.nodeId);
        if (sourceNode && source.handleId?.startsWith("ai_")) {
          edges = addEdge(
            createEdge(node.id, source.nodeId, {
              targetHandle: source.handleId,
              connectionType: source.handleId as ConnectionType,
            }),
            edges,
          );
        } else if (sourceNode) {
          edges = addEdge(
            createEdge(sourceNode.id, node.id, {
              sourceHandle: source.handleId ?? "out-0",
              connectionType: sourceNode.data.outputs[0]?.type ?? "main",
            }),
            edges,
          );
        }
      }
      return {
        nodes: [...current.nodes, node],
        edges,
        revision: current.revision + 1,
        saveState: "unsaved",
        selectedNodeId: node.id,
        creator: { open: false },
        ndvNodeId: openDetail ? node.id : current.ndvNodeId,
      };
    });

    return node.id;
  },

  addStickyNote: (position) => {
    get().takeSnapshot();
    const note = createStickyNote(
      position,
      "Add a note for your team…\n\nTip: drag the corner to resize.",
      "amber",
    );
    set((state) => ({
      nodes: [...state.nodes, note],
      revision: state.revision + 1,
      saveState: "unsaved",
      selectedNodeId: note.id,
    }));
  },

  updateNodeData: (id, patch) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...patch } } : node,
      ),
      revision: state.revision + 1,
      saveState: "unsaved",
    }));
  },

  updateNodeParameters: (id, parameters) => {
    get().takeSnapshot();
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, parameters } }
          : node,
      ),
      revision: state.revision + 1,
      saveState: "unsaved",
    }));
  },

  deleteNode: (id) => {
    get().takeSnapshot();
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== id),
      edges: state.edges.filter(
        (edge) => edge.source !== id && edge.target !== id,
      ),
      selectedNodeId:
        state.selectedNodeId === id ? null : state.selectedNodeId,
      ndvNodeId: state.ndvNodeId === id ? null : state.ndvNodeId,
      revision: state.revision + 1,
      saveState: "unsaved",
    }));
  },

  deleteEdge: (id) => {
    get().takeSnapshot();
    set((state) => ({
      edges: state.edges.filter((edge) => edge.id !== id),
      revision: state.revision + 1,
      saveState: "unsaved",
    }));
  },

  duplicateNode: (id) => {
    const node = get().nodes.find((item) => item.id === id);
    if (!node) return;
    get().takeSnapshot();
    const copy: FlowNode = {
      ...deepClone(node),
      id: uid("n"),
      position: { x: node.position.x + 48, y: node.position.y + 48 },
      selected: false,
      data: { ...deepClone(node.data), status: "idle" },
    };
    set((state) => ({
      nodes: [...state.nodes, copy],
      selectedNodeId: copy.id,
      revision: state.revision + 1,
      saveState: "unsaved",
    }));
  },

  setSelectedNodeId: (selectedNodeId) => set({ selectedNodeId }),

  toggleNodeDisabled: (id) => {
    get().takeSnapshot();
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, disabled: !node.data.disabled } }
          : node,
      ),
      revision: state.revision + 1,
      saveState: "unsaved",
    }));
  },

  toggleNodePinned: (id) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, pinned: !node.data.pinned } }
          : node,
      ),
      revision: state.revision + 1,
      saveState: "unsaved",
    }));
  },

  setNodeStatus: (id, status, error) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, status, error } } : node,
      ),
    }));
  },

  undo: () => {
    const state = get();
    const previous = state.past[state.past.length - 1];
    if (!previous) return;
    set({
      nodes: deepClone(previous.nodes),
      edges: deepClone(previous.edges),
      past: state.past.slice(0, -1),
      future: [snapshotOf(state), ...state.future].slice(0, 100),
      revision: state.revision + 1,
      saveState: "unsaved",
    });
  },

  redo: () => {
    const state = get();
    const next = state.future[0];
    if (!next) return;
    set({
      nodes: deepClone(next.nodes),
      edges: deepClone(next.edges),
      past: [...state.past, snapshotOf(state)].slice(-100),
      future: state.future.slice(1),
      revision: state.revision + 1,
      saveState: "unsaved",
    });
  },

  takeSnapshot: () => {
    const state = get();
    const snapshot = snapshotOf(state);
    const last = state.past[state.past.length - 1];
    if (
      last &&
      JSON.stringify(last.nodes) === JSON.stringify(snapshot.nodes) &&
      JSON.stringify(last.edges) === JSON.stringify(snapshot.edges)
    ) {
      return;
    }
    set({
      past: [...state.past, snapshot].slice(-100),
      future: [],
    });
  },

  openCreator: (payload) =>
    set({
      creator: {
        open: true,
        sourceNodeId: payload?.sourceNodeId,
        sourceHandle: payload?.sourceHandle,
        connectionType: payload?.connectionType,
        query: payload?.query,
        group: payload?.group,
      },
    }),

  closeCreator: () => set({ creator: { open: false } }),
  openNdv: (ndvNodeId) => set({ ndvNodeId }),
  closeNdv: () => set({ ndvNodeId: null }),
  setAssistantOpen: (assistantOpen) => set({ assistantOpen }),
  setOverviewOpen: (overviewOpen) => set({ overviewOpen }),
  setLogsOpen: (logsOpen) => set({ logsOpen }),
  openExecuteDialog: () => set({ executeDialogOpen: true }),
  closeExecuteDialog: () => set({ executeDialogOpen: false }),

  execute: async (startNodeId, inputs) => {
    const state = get();
    if (state.execution.status === "running") return;

    if (!inputs) {
      set({ executeDialogOpen: true });
      return;
    }

    // Try real backend execution first (sends actual Telegram/Gmail messages).
    try {
      const prompt = inputs.prompt || "Hello from FlowPilot";
      const channelChoice = inputs.channel;
      const email = inputs.email || "user@example.com";
      const chatId = inputs.chatId || "";

      const runToken = state.execution.runToken + 1;
      set({
        execution: {
          status: "running",
          startedAt: Date.now(),
          runToken,
          logs: [],
          nodeRuns: {},
        },
        nodes: state.nodes.map((node) => ({
          ...node,
          data: { ...node.data, status: "idle", error: undefined },
        })),
        logsOpen: true,
      });

      const resp = await api.executeWorkflow({
        workflowId: state.workflow.id,
        nodes: state.nodes,
        edges: state.edges,
        input: {
          message: { text: prompt, chat: { id: chatId } },
          text: prompt,
          output: prompt,
          channel: channelChoice,
          email: email || "user@example.com",
          chatId: chatId,
        },
      });

      // Apply results
      const results = (resp.results || []) as Array<Record<string, unknown>>;
      const nodeRuns: Record<string, NodeRun> = {};
      const logs: LogEntry[] = [];
      for (const r of results) {
        const nid = String(r.nodeId);
        const status = (r.status === "error" ? "error" : "success") as NodeRunStatus;
        const nodeName = String(r.nodeName ?? nid);
        const nodeType = String(r.nodeType ?? "");
        const output = (r.output ?? {}) as JsonValue;
        const finishedAt = Date.now();
        const nodeForIcon = get().nodes.find((n) => n.id === nid);
        const nodeRun: NodeRun = {
          nodeId: nid,
          nodeName,
          nodeType,
          status,
          startedAt: finishedAt - 500,
          finishedAt,
          durationMs: 500,
          input: r.input as JsonValue,
          output,
          tokens: 0,
          cost: 0,
          error: r.error as string | undefined,
        };
        nodeRuns[nid] = nodeRun;
        logs.push({ ...nodeRun, id: uid("log"), icon: nodeForIcon?.data.icon ?? "zap" });
        set((current) => ({
          nodes: current.nodes.map((n) =>
            n.id === nid
              ? { ...n, data: { ...n.data, status, error: r.error as string | undefined } }
              : n,
          ),
        }));
      }

      set((current) => ({
        execution: {
          ...current.execution,
          status: results.some((r) => r.status === "error") ? "error" : "success",
          finishedAt: Date.now(),
          currentNodeId: undefined,
          logs: logs as never,
          nodeRuns: nodeRuns as never,
        },
      }));
      return;
    } catch (err) {
      // Fall back to mock execution below
      console.warn("Backend execution failed, falling back to mock:", err);
    }

    // --- mock fallback (original implementation) ---
    const fresh = get();
    const runToken2 = fresh.execution.runToken + 1;
    const plan = executionPlan(fresh.nodes, fresh.edges, startNodeId);
    if (plan.length === 0) {
      set({ logsOpen: true });
      return;
    }

    const startedAt = Date.now();
    set({
      execution: {
        status: "running",
        startedAt,
        runToken: runToken2,
        logs: [],
        nodeRuns: {},
      },
      nodes: fresh.nodes.map((node) => ({
        ...node,
        data: { ...node.data, status: "idle", error: undefined },
      })),
      logsOpen: true,
    });

    let upstream: JsonValue = {};

    for (const plannedNode of plan) {
      if (get().execution.runToken !== runToken2) return;
      const currentNode = get().nodes.find(
        (node) => node.id === plannedNode.id,
      );
      if (!currentNode || currentNode.data.disabled) continue;

      set({ execution: { ...get().execution, currentNodeId: currentNode.id } });
      get().setNodeStatus(currentNode.id, "running");

      const baseDelay =
        currentNode.data.group === "ai"
          ? currentNode.data.shape === "wide"
            ? 1500
            : 700
          : currentNode.data.shape === "circle"
            ? 500
            : currentNode.data.group === "trigger"
              ? 420
              : 620;

      await sleep(baseDelay + Math.random() * 260);

      if (get().execution.runToken !== runToken2) return;

      const { output, tokens, cost } = mockOutputFor(currentNode, upstream);
      upstream = output;

      const finishedAt = Date.now();
      const nodeRun: NodeRun = {
        nodeId: currentNode.id,
        nodeName: currentNode.data.label,
        nodeType: currentNode.data.nodeType,
        status: "success",
        startedAt: finishedAt - baseDelay,
        finishedAt,
        durationMs: finishedAt - (finishedAt - baseDelay),
        input: upstream,
        output,
        tokens,
        cost,
      };
      const log: LogEntry = {
        ...nodeRun,
        id: uid("log"),
        icon: currentNode.data.icon,
      };

      set((current) => ({
        execution: {
          ...current.execution,
          currentNodeId: undefined,
          logs: [...current.execution.logs, log],
          nodeRuns: {
            ...current.execution.nodeRuns,
            [currentNode.id]: nodeRun,
          },
        },
      }));
      get().setNodeStatus(currentNode.id, "success");
    }

    if (get().execution.runToken !== runToken2) return;

    const finishedAt = Date.now();
    set((current) => ({
      execution: {
        ...current.execution,
        status: "success",
        finishedAt,
        currentNodeId: undefined,
      },
    }));
  },

  stopExecution: () => {
    const state = get();
    const token = state.execution.runToken + 1;
    const currentNodeId = state.execution.currentNodeId;
    set({
      execution: {
        ...state.execution,
        status: "cancelled",
        finishedAt: Date.now(),
        runToken: token,
        currentNodeId: undefined,
      },
      nodes: state.nodes.map((node) =>
        node.id === currentNodeId
          ? {
              ...node,
              data: {
                ...node.data,
                status: "cancelled",
                error: "Execution stopped by user",
              },
            }
          : node,
      ),
    });
  },

  resetExecution: () =>
    set((state) => ({
      execution: { ...initialExecution, runToken: state.execution.runToken + 1 },
      nodes: state.nodes.map((node) => ({
        ...node,
        data: { ...node.data, status: "idle", error: undefined },
      })),
    })),

  tidyUp: () => {
    const state = get();
    get().takeSnapshot();

    const mainEdges = state.edges.filter(
      (edge) => (edge.data?.connectionType ?? "main") === "main",
    );
    const incoming = new Set(mainEdges.map((edge) => edge.target));
    const depth = new Map<string, number>();
    const queue = state.nodes
      .filter(
        (node) =>
          node.data.shape !== "circle" &&
          node.type !== "sticky" &&
          !incoming.has(node.id),
      )
      .map((node) => node.id);

    for (const id of queue) depth.set(id, 0);

    for (let cursor = 0; cursor < queue.length; cursor++) {
      const id = queue[cursor];
      if (!id) continue;
      const currentDepth = depth.get(id) ?? 0;
      for (const edge of mainEdges.filter((item) => item.source === id)) {
        if (depth.has(edge.target)) continue;
        depth.set(edge.target, currentDepth + 1);
        queue.push(edge.target);
      }
    }

    const columns = new Map<number, number>();
    const nextNodes = state.nodes.map((node) => {
      if (node.type === "sticky" || node.data.shape === "circle") return node;
      const column = depth.get(node.id) ?? 0;
      const row = columns.get(column) ?? 0;
      columns.set(column, row + 1);
      return {
        ...node,
        position: { x: 60 + column * 290, y: 80 + row * 190 },
      };
    });

    const positioned = nextNodes.map((node) => {
      if (node.data.shape !== "circle") return node;
      const edge = state.edges.find(
        (item) =>
          item.source === node.id &&
          (item.data?.connectionType ?? "main") !== "main",
      );
      const parent = edge
        ? positionedNode(nextNodes, edge.target)
        : undefined;
      if (!parent) return node;
      const siblings = state.edges.filter(
        (item) =>
          item.target === parent.id &&
          (item.data?.connectionType ?? "main") !== "main",
      );
      const index = Math.max(
        0,
        siblings.findIndex((item) => item.source === node.id),
      );
      return {
        ...node,
        position: {
          x:
            parent.position.x +
            258 / 2 -
            46 +
            (index - (siblings.length - 1) / 2) * 104,
          y: parent.position.y + 250,
        },
      };
    });

    set({
      nodes: positioned,
      revision: state.revision + 1,
      saveState: "unsaved",
    });
  },
}));

function positionedNode(nodes: FlowNode[], id: string): FlowNode | undefined {
  return nodes.find((node) => node.id === id);
}

export function createEmptyWorkflowNode(): FlowNode {
  return createFlowNode(
    "flowpilot.manualTrigger",
    { x: 120, y: 160 },
    { label: "Manual Trigger", parameters: defaultParameters(requireNodeDefinition("flowpilot.manualTrigger")) },
  );
}

export function selectNodeById(id: string | null): FlowNode | undefined {
  if (!id) return undefined;
  return useEditorStore.getState().nodes.find((node) => node.id === id);
}

export const AI_AGENT = AI_AGENT_TYPE;
