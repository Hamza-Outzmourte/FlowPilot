import {
  Background,
  BackgroundVariant,
  ReactFlow,
  ReactFlowProvider,
  type Node,
} from "@xyflow/react";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Clock3,
  Copy,
  ExternalLink,
  Loader2,
  Play,
  RotateCcw,
  Sparkles,
  Square,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/primitives";
import { NodeIcon } from "@/lib/node-icons";
import { cn, formatCurrency, formatDateTime, formatDuration } from "@/lib/utils";
import { getExecutionDetail, getDemoWorkflow } from "@/data/demo";
import { getStoredWorkflow, saveStoredWorkflow } from "@/lib/storage";
import { nodeTypes } from "@/features/editor/canvas/nodes/FlowNode";
import { edgeTypes } from "@/features/editor/canvas/edges/FlowEdge";
import { EDGE_MARKER } from "@/lib/workflow-factory";
import type { Edge } from "@xyflow/react";
import type { FlowNode, NodeRun } from "@/types/workflow";

function ExecutionCanvas({
  nodes,
  edges,
  selectedId,
  onSelect,
}: {
  nodes: FlowNode[];
  edges: Edge[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <ReactFlowProvider>
      <div className="relative h-full w-full overflow-hidden bg-canvas">
        <ReactFlow
          nodes={nodes.map((node) => ({
            ...node,
            className: cn(
              node.data.status === "running" && "fp-node-running",
              node.data.status === "skipped" && "opacity-45",
            ),
            selected: node.id === selectedId,
          })) as Node[]}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodeClick={(_, node) => onSelect(node.id)}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable
          edgesFocusable={false}
          panOnDrag
          zoomOnScroll
          fitView
          fitViewOptions={{ padding: 0.28, maxZoom: 1.05 }}
          minZoom={0.2}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{ type: "flowpilot", markerEnd: EDGE_MARKER }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1.2}
            color="var(--canvas-dot)"
          />
        </ReactFlow>
        <div className="dot-vignette pointer-events-none absolute inset-0" />
      </div>
    </ReactFlowProvider>
  );
}

export function ExecutionDetailPage() {
  const { executionId } = useParams<{ executionId: string }>();
  const navigate = useNavigate();
  const detail = executionId ? getExecutionDetail(executionId) : undefined;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<"output" | "input">("output");

  const workflow = detail ? getDemoWorkflow(detail.workflowId) : undefined;

  const nodes = useMemo<FlowNode[]>(() => {
    if (!workflow || !detail) return [];
    return workflow.nodes.map((node) => {
      const run = detail.nodeRunsDetail.find((item) => item.nodeId === node.id);
      return {
        ...node,
        data: {
          ...node.data,
          status: run?.status ?? "skipped",
          error: run?.error,
        },
      };
    });
  }, [workflow, detail]);

  const selectedRun: NodeRun | undefined = detail?.nodeRunsDetail.find(
    (item) => item.nodeId === (selectedId ?? detail.nodeRunsDetail[0]?.nodeId),
  );

  const copyToEditor = () => {
    if (!detail) return;
    const stored = getStoredWorkflow(detail.workflowId);
    if (!stored) {
      toast.error("This workflow is no longer in the workspace.");
      return;
    }
    const succeeded = new Set(
      detail.nodeRunsDetail
        .filter((run) => run.status === "success")
        .map((run) => run.nodeId),
    );
    saveStoredWorkflow({
      ...stored,
      nodes: stored.nodes.map((node) =>
        succeeded.has(node.id)
          ? { ...node, data: { ...node.data, pinned: true } }
          : node,
      ),
    });
    navigate(`/workflows/${detail.workflowId}`);
    toast.success(
      succeeded.size > 0
        ? `Pinned output from ${succeeded.size} nodes`
        : "Opened the workflow in the editor",
    );
  };

  const retry = () => {
    if (!detail) return;
    if (!getStoredWorkflow(detail.workflowId)) {
      toast.error("This workflow is no longer in the workspace.");
      return;
    }
    navigate(`/workflows/${detail.workflowId}?run=1`);
    toast.success(`Retrying “${detail.workflowName}”`);
  };

  if (!detail) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-app px-6">
        <AlertTriangle className="size-6 text-ink-3" />
        <h1 className="mt-4 text-[18px] font-semibold text-ink">
          Execution not found
        </h1>
        <p className="mt-1 text-[12.5px] text-ink-3">
          “{executionId}” isn’t in this workspace’s history.
        </p>
        <Button asChild variant="primary" size="sm" className="mt-5">
          <Link to="/executions">
            <ArrowLeft className="size-3.5" />
            Back to executions
          </Link>
        </Button>
      </div>
    );
  }

  const totalTokens = detail.nodeRunsDetail.reduce(
    (sum, run) => sum + (run.tokens ?? 0),
    0,
  );
  const totalCost = detail.nodeRunsDetail.reduce(
    (sum, run) => sum + (run.cost ?? 0),
    0,
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-app">
      <header className="flex h-[64px] shrink-0 items-center gap-3 border-b border-hairline px-5">
        <button
          type="button"
          onClick={() => navigate("/executions")}
          className="grid size-8 place-items-center rounded-lg text-ink-3 transition hover:bg-surface-2 hover:text-ink"
          aria-label="Back to executions"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-[15px] font-semibold tracking-[-0.01em] text-ink">
              {detail.workflowName}
            </h1>
            <Badge
              variant={detail.status === "success" ? "success" : "danger"}
            >
              {detail.status}
            </Badge>
            <span className="font-mono text-[10.5px] text-ink-3">
              {detail.id}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[10.5px] text-ink-3">
            <span className="capitalize">{detail.mode} run</span>
            <span>·</span>
            <span>{detail.trigger}</span>
            <span>·</span>
            <span>{formatDateTime(detail.startedAt)}</span>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              navigate(`/workflows/${detail.workflowId}`)
            }
          >
            <ExternalLink className="size-3.5" />
            Open workflow
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={copyToEditor}
          >
            <Copy className="size-3.5" />
            Copy to editor
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={retry}
          >
            <RotateCcw className="size-3.5" />
            Retry
          </Button>
        </div>
      </header>

      <div className="flex shrink-0 flex-wrap items-center gap-5 border-b border-hairline bg-surface/40 px-5 py-2.5">
        <Metric label="Duration" value={formatDuration(detail.durationMs)} icon={<Clock3 className="size-3" />} />
        <Metric label="Nodes" value={`${detail.nodeRunsDetail.length} run`} icon={<Play className="size-3" />} />
        <Metric label="Tokens" value={totalTokens.toLocaleString()} icon={<Sparkles className="size-3" />} />
        <Metric label="Est. cost" value={formatCurrency(totalCost)} icon={<Square className="size-2.5" />} />
        <div className="ml-auto flex items-center gap-1.5 text-[10.5px] text-ink-3">
          <span className="status-dot bg-success" />
          {detail.nodeRunsDetail.filter((run) => run.status === "success").length}{" "}
          succeeded
          {detail.nodeRunsDetail.some((run) => run.status === "error") ? (
            <>
              <span className="mx-1 text-line-strong">·</span>
              <span className="status-dot bg-danger" />
              {detail.nodeRunsDetail.filter((run) => run.status === "error").length}{" "}
              failed
            </>
          ) : null}
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="relative min-w-0 flex-1 border-r border-hairline">
          {workflow ? (
            <ExecutionCanvas
              nodes={nodes}
              edges={workflow.edges}
              selectedId={selectedId ?? selectedRun?.nodeId ?? null}
              onSelect={(id) => setSelectedId(id)}
            />
          ) : (
            <div className="grid h-full place-items-center text-[12px] text-ink-3">
              Workflow snapshot unavailable.
            </div>
          )}
        </div>

        <aside className="flex w-[400px] shrink-0 flex-col bg-surface/30">
          <div className="flex h-9 shrink-0 items-center justify-between border-b border-hairline px-4">
            <span className="text-[10px] font-semibold uppercase tracking-[0.09em] text-ink-3">
              Node runs
            </span>
            <span className="font-mono text-[9.5px] text-ink-3">
              {detail.nodeRunsDetail.length} nodes
            </span>
          </div>

          <div className="fp-scroll min-h-0 flex-1 overflow-y-auto py-1">
            {detail.nodeRunsDetail.map((run, index) => {
              const active = (selectedRun?.nodeId ?? "") === run.nodeId;
              return (
                <button
                  key={run.nodeId}
                  type="button"
                  onClick={() => setSelectedId(run.nodeId)}
                  className={cn(
                    "relative flex w-full items-center gap-2.5 px-4 py-2 text-left transition",
                    active ? "bg-surface-2" : "hover:bg-surface-2/50",
                  )}
                >
                  {active ? (
                    <span className="absolute inset-y-1.5 left-0 w-[2px] rounded-full bg-accent" />
                  ) : null}
                  <span className="w-4 shrink-0 text-right font-mono text-[9.5px] text-ink-3">
                    {index + 1}
                  </span>
                  <span className="relative grid size-7 shrink-0 place-items-center overflow-hidden rounded-lg border border-hairline bg-surface-2">
                    <NodeIcon
                      name={
                        workflow?.nodes.find((node) => node.id === run.nodeId)
                          ?.data.icon ?? "box"
                      }
                      className="size-3.5"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11.5px] font-medium text-ink-2">
                      {run.nodeName}
                    </span>
                    <span className="block truncate font-mono text-[9px] text-ink-3">
                      {run.nodeType.replace("flowpilot.", "")}
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-[9.5px] text-ink-3">
                    {run.durationMs} ms
                  </span>
                  <RunIcon status={run.status} />
                </button>
              );
            })}
          </div>

          <div className="flex h-[46%] shrink-0 flex-col border-t border-line">
            <div className="flex h-9 shrink-0 items-center gap-2 px-4">
              <span className="text-[10px] font-semibold uppercase tracking-[0.09em] text-ink-3">
                Inspector
              </span>
              <div className="ml-auto flex items-center gap-0.5">
                {(["input", "output"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setTab(item)}
                    className={cn(
                      "rounded-md px-2 py-0.5 text-[10px] font-medium capitalize transition",
                      tab === item
                        ? "bg-surface-2 text-ink"
                        : "text-ink-3 hover:text-ink-2",
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
            <div className="min-h-0 flex-1 px-3 pb-3">
              {selectedRun ? (
                <div className="flex h-full flex-col gap-2">
                  {selectedRun.error ? (
                    <div className="flex items-start gap-2 rounded-lg border border-danger/25 bg-[var(--danger-soft)] px-2.5 py-2 text-[10.5px] leading-relaxed text-danger">
                      <AlertTriangle className="mt-0.5 size-3 shrink-0" />
                      {selectedRun.error}
                    </div>
                  ) : null}
                  <div className="min-h-0 flex-1">
                    <CodeBlock
                      value={JSON.stringify(
                        (tab === "input" ? selectedRun.input : selectedRun.output) ??
                          {},
                        null,
                        2,
                      )}
                      className="h-full"
                      maxHeight="100%"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid h-full place-items-center text-[11px] text-ink-3">
                  Select a node to inspect its data.
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="grid size-6 place-items-center rounded-md border border-hairline bg-surface-2 text-ink-3">
        {icon}
      </span>
      <span>
        <span className="block text-[9px] uppercase tracking-wider text-ink-3">
          {label}
        </span>
        <span className="block font-mono text-[11px] text-ink-2">{value}</span>
      </span>
    </div>
  );
}

function RunIcon({ status }: { status: NodeRun["status"] }) {
  if (status === "success")
    return (
      <span className="grid size-4 shrink-0 place-items-center rounded-full bg-[var(--success-soft)] text-success">
        <Check className="size-2.5" strokeWidth={3} />
      </span>
    );
  if (status === "error")
    return (
      <span className="grid size-4 shrink-0 place-items-center rounded-full bg-[var(--danger-soft)] text-danger">
        <AlertTriangle className="size-2.5" />
      </span>
    );
  if (status === "running")
    return <Loader2 className="size-3.5 shrink-0 animate-spin text-accent" />;
  return (
    <span className="grid size-4 shrink-0 place-items-center rounded-full border border-line text-ink-3">
      <span className="size-1 rounded-full bg-ink-3" />
    </span>
  );
}
