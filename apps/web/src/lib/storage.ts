import { DEMO_WORKFLOWS } from "@/data/demo";
import type { StoredWorkflow, WorkflowMeta } from "@/types/workflow";
import { DEFAULT_SETTINGS } from "./workflow-factory";
import { deepClone, uid } from "./utils";

const INDEX_KEY = "flowpilot.index.v1";
const WORKFLOW_PREFIX = "flowpilot.workflow.v1.";

function hasStorage(): boolean {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function readJson<T>(key: string): T | null {
  if (!hasStorage()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota errors are non-fatal for the demo experience.
  }
}

export function metaOf(workflow: StoredWorkflow): WorkflowMeta {
  const { nodes: _nodes, edges: _edges, ...meta } = workflow;
  void _nodes;
  void _edges;
  return meta;
}

export function ensureSeeded(): void {
  if (!hasStorage()) return;
  const index = readJson<WorkflowMeta[]>(INDEX_KEY) ?? [];
  const metasById = new Map(index.map((meta) => [meta.id, meta]));
  let changed = false;
  const metas = [...index];
  for (const workflow of DEMO_WORKFLOWS) {
    const stored = metasById.get(workflow.id);
    if (stored && (stored.version ?? 0) >= (workflow.version ?? 0)) continue;
    writeJson(`${WORKFLOW_PREFIX}${workflow.id}`, workflow);
    const idx = metas.findIndex((meta) => meta.id === workflow.id);
    if (idx >= 0) metas[idx] = metaOf(workflow);
    else metas.unshift(metaOf(workflow));
    changed = true;
  }
  if (index.length === 0 || changed) {
    writeJson(INDEX_KEY, metas);
  }
}

export function listWorkflowMetas(): WorkflowMeta[] {
  ensureSeeded();
  const metas = readJson<WorkflowMeta[]>(INDEX_KEY) ?? [];
  return [...metas].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function listStoredWorkflows(): StoredWorkflow[] {
  return listWorkflowMetas()
    .map((meta) => getStoredWorkflow(meta.id))
    .filter((workflow): workflow is StoredWorkflow => Boolean(workflow));
}

export function getStoredWorkflow(id: string): StoredWorkflow | null {
  ensureSeeded();
  const stored = readJson<StoredWorkflow>(`${WORKFLOW_PREFIX}${id}`);
  if (stored) return stored;
  const demo = DEMO_WORKFLOWS.find((workflow) => workflow.id === id);
  if (!demo) return null;
  const copy = deepClone(demo);
  saveStoredWorkflow(copy);
  return copy;
}

export function saveStoredWorkflow(workflow: StoredWorkflow): void {
  ensureSeeded();
  const next: StoredWorkflow = {
    ...workflow,
    updatedAt: new Date().toISOString(),
  };
  writeJson(`${WORKFLOW_PREFIX}${next.id}`, next);

  const metas = readJson<WorkflowMeta[]>(INDEX_KEY) ?? [];
  const filtered = metas.filter((meta) => meta.id !== next.id);
  writeJson(INDEX_KEY, [metaOf(next), ...filtered]);
}

export function createStoredWorkflow(
  partial: Partial<StoredWorkflow> = {},
): StoredWorkflow {
  const now = new Date().toISOString();
  const workflow: StoredWorkflow = {
    id: uid("wf"),
    name: partial.name ?? "My workflow",
    active: partial.active ?? false,
    version: partial.version ?? 1,
    description: partial.description ?? "",
    tags: partial.tags ?? [],
    settings: partial.settings ?? DEFAULT_SETTINGS,
    createdAt: now,
    updatedAt: now,
    nodes: partial.nodes ?? [],
    edges: partial.edges ?? [],
  };
  saveStoredWorkflow(workflow);
  return workflow;
}

export function duplicateStoredWorkflow(
  source: StoredWorkflow,
): StoredWorkflow {
  const now = new Date().toISOString();
  const copy: StoredWorkflow = {
    ...deepClone(source),
    id: uid("wf"),
    name: `${source.name} copy`,
    active: false,
    version: 1,
    createdAt: now,
    updatedAt: now,
  };
  saveStoredWorkflow(copy);
  return copy;
}

export function deleteStoredWorkflow(id: string): void {
  if (!hasStorage()) return;
  window.localStorage.removeItem(`${WORKFLOW_PREFIX}${id}`);
  const metas = readJson<WorkflowMeta[]>(INDEX_KEY) ?? [];
  writeJson(
    INDEX_KEY,
    metas.filter((meta) => meta.id !== id),
  );
}

export function persistWorkflow(workflow: StoredWorkflow): void {
  saveStoredWorkflow(workflow);
}
