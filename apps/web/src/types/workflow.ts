import type { Edge, Node } from "@xyflow/react";

export type ConnectionType =
  | "main"
  | "ai_languageModel"
  | "ai_memory"
  | "ai_tool"
  | "ai_embedding"
  | "ai_vectorStore"
  | "ai_retriever"
  | "ai_document"
  | "ai_textSplitter"
  | "ai_outputParser";

export type NodeGroup =
  | "trigger"
  | "action"
  | "flow"
  | "data"
  | "ai"
  | "core"
  | "human";

export type NodeShape = "square" | "wide" | "circle";

export type ParameterType =
  | "string"
  | "number"
  | "boolean"
  | "options"
  | "multiOptions"
  | "json"
  | "code"
  | "expression"
  | "collection"
  | "resourceLocator"
  | "notice";

export interface ParameterOption {
  label: string;
  value: string;
  description?: string;
}

export interface ParameterSpec {
  name: string;
  displayName: string;
  type: ParameterType;
  default?: unknown;
  placeholder?: string;
  description?: string;
  hint?: string;
  required?: boolean;
  options?: ParameterOption[];
  rows?: number;
  language?: "json" | "javascript" | "python" | "text";
  displayOptions?: { show?: Record<string, unknown[]> };
}

export interface PortSpec {
  type: ConnectionType;
  label?: string;
  required?: boolean;
}

export interface CredentialSpec {
  name: string;
  displayName: string;
  required: boolean;
}

export interface NodeDefinition {
  type: string;
  version: number;
  displayName: string;
  subtitle?: string;
  description: string;
  group: NodeGroup;
  shape: NodeShape;
  icon: string;
  categories: string[];
  subcategory?: string;
  inputs: PortSpec[];
  outputs: PortSpec[];
  credentials?: CredentialSpec[];
  properties: ParameterSpec[];
  keywords?: string[];
  documentationUrl?: string;
}

export type NodeRunStatus =
  | "idle"
  | "running"
  | "success"
  | "error"
  | "waiting"
  | "cancelled"
  | "skipped";

export interface AgentSubPort {
  id: string;
  label: string;
  type: ConnectionType;
  required?: boolean;
  connected: boolean;
}

export interface FlowNodeData extends Record<string, unknown> {
  label: string;
  subtitle?: string;
  nodeType: string;
  group: NodeGroup;
  shape: NodeShape;
  icon: string;
  parameters: Record<string, unknown>;
  disabled?: boolean;
  pinned?: boolean;
  inputs: PortSpec[];
  outputs: PortSpec[];
  hasOutgoing?: boolean;
  hasIncoming?: boolean;
  connectedOutputs?: number[];
  connectedInputs?: number[];
  connectedAiPorts?: string[];
  status: NodeRunStatus;
  error?: string;
  agentSubPorts?: AgentSubPort[];
  pendingToolStub?: boolean;
  noteColor?: string;
  noteBody?: string;
}

export type FlowNode = Node<FlowNodeData>;

export interface WorkflowSettings {
  timezone: string;
  timeoutSeconds: number;
  saveExecutionData: "all" | "none" | "errors";
}

export interface WorkflowMeta {
  id: string;
  name: string;
  active: boolean;
  version: number;
  description?: string;
  tags: string[];
  settings: WorkflowSettings;
  createdAt: string;
  updatedAt: string;
}

export interface StoredWorkflow extends WorkflowMeta {
  nodes: FlowNode[];
  edges: Edge[];
}

export interface WorkflowJson {
  id: string;
  name: string;
  active: boolean;
  version: number;
  nodes: Array<{
    id: string;
    type: string;
    name: string;
    position: [number, number];
    parameters: Record<string, unknown>;
    credentials?: Record<string, string>;
    disabled?: boolean;
  }>;
  connections: Record<
    string,
    Partial<
      Record<
        ConnectionType,
        Array<Array<{ node: string; type: ConnectionType; index: number }>>
      >
    >
  >;
  settings: WorkflowSettings;
  pinData: Record<string, unknown>;
}

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface NodeRun {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  status: NodeRunStatus;
  startedAt?: number;
  finishedAt?: number;
  durationMs?: number;
  input?: JsonValue;
  output?: JsonValue;
  tokens?: number;
  cost?: number;
  error?: string;
}

export interface LogEntry extends NodeRun {
  id: string;
  icon: string;
}

export type ExecutionStatus =
  | "idle"
  | "running"
  | "success"
  | "error"
  | "cancelled";

export interface ExecutionSummary {
  id: string;
  workflowId: string;
  workflowName: string;
  status: "success" | "error" | "running" | "waiting";
  mode: "manual" | "trigger" | "test";
  trigger: string;
  triggerIcon: string;
  startedAt: string;
  durationMs: number;
  tokens?: number;
  cost?: number;
  nodeRuns: number;
}

export interface ExecutionDetail extends ExecutionSummary {
  nodeRunsDetail: NodeRun[];
}

export interface DashboardStats {
  totalExecutions: number;
  totalExecutionsDelta: number;
  successRate: number;
  successRateDelta: number;
  avgDurationMs: number;
  avgDurationDelta: number;
  activeWorkflows: number;
  activeWorkflowsDelta: number;
  sparkline: Record<
    "executions" | "success" | "duration" | "workflows",
    number[]
  >;
  timeline: Array<{ label: string; success: number; error: number }>;
  aiUsage: Array<{
    provider: string;
    model: string;
    tokens: number;
    cost: number;
    color: string;
  }>;
  recentExecutions: ExecutionSummary[];
  topWorkflows: Array<{
    id: string;
    name: string;
    executions: number;
    successRate: number;
    avgDurationMs: number;
  }>;
  failingWorkflows: Array<{
    id: string;
    name: string;
    failures: number;
    lastError: string;
  }>;
  knowledge: {
    collections: number;
    documents: number;
    lastIndexedAt: string;
    failedIngestions: number;
  };
}

export interface KnowledgeCollection {
  id: string;
  name: string;
  description: string;
  embeddingModel: string;
  documents: number;
  chunks: number;
  lastIndexedAt: string;
  status: "ready" | "indexing" | "failed";
  color: string;
}

export interface KnowledgeDocument {
  id: string;
  name: string;
  type: "pdf" | "md" | "txt" | "url" | "csv" | "docx";
  chunks: number;
  sizeKb: number;
  status: "indexed" | "processing" | "failed";
  updatedAt: string;
  source: string;
}

export interface RetrievalHit {
  id: string;
  content: string;
  score: number;
  source: string;
  page?: number;
}

export interface CredentialRecord {
  id: string;
  name: string;
  type: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
  workspace: string;
}

export interface TemplateRecord {
  id: string;
  name: string;
  description: string;
  category: string;
  nodes: number;
  author: string;
  featured?: boolean;
  icon: string;
  gradient: string;
  workflowId?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  initials: string;
  workspace: string;
  plan: string;
}
