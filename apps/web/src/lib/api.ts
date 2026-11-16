import type {
  ExecutionDetail,
  NodeDefinition,
  StoredWorkflow,
  WorkflowMeta,
} from "@/types/workflow";

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });
  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${await response.text()}`);
  }
  return response.json();
}

export const api = {
  // Nodes
  getNodes: () => request<{ nodes: NodeDefinition[] }>("/api/v1/nodes"),

  // Workflows
  getWorkflows: () => request<{ workflows: WorkflowMeta[] }>("/api/v1/workflows"),
  getWorkflow: (id: string) => request<StoredWorkflow>(`/api/v1/workflows/${id}`),
  createWorkflow: (workflow: Partial<StoredWorkflow>) =>
    request<StoredWorkflow>("/api/v1/workflows", {
      method: "POST",
      body: JSON.stringify(workflow),
    }),
  updateWorkflow: (id: string, workflow: Partial<StoredWorkflow>) =>
    request<StoredWorkflow>(`/api/v1/workflows/${id}`, {
      method: "PATCH",
      body: JSON.stringify(workflow),
    }),
  deleteWorkflow: (id: string) =>
    request<void>(`/api/v1/workflows/${id}`, { method: "DELETE" }),

  // Executions
  runWorkflow: (id: string, startNodeId?: string) =>
    request<{ executionId: string }>(`/api/v1/workflows/${id}/run`, {
      method: "POST",
      body: JSON.stringify({ startNodeId }),
    }),

  executeWorkflow: (payload: {
    workflowId?: string;
    nodes: unknown[];
    edges: unknown[];
    input?: Record<string, unknown>;
    credentials?: Record<string, Record<string, string>>;
  }) =>
    request<{ executionId: string; results: Array<Record<string, unknown>> }>(
      "/api/v1/execute",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    ),
  getExecution: (id: string) =>
    request<ExecutionDetail>(`/api/v1/executions/${id}`),
  stopExecution: (id: string) =>
    request<void>(`/api/v1/executions/${id}/stop`, { method: "POST" }),
};

export default api;
