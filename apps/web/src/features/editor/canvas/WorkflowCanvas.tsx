import {
  Background,
  BackgroundVariant,
  ReactFlow,
  ReactFlowProvider,
  SelectionMode,
  useNodesInitialized,
  useReactFlow,
  type Connection,
} from "@xyflow/react";
import {
  Focus,
  Minus,
  PanelRight,
  Plus,
  Search,
  Sparkles,
  StickyNote,
  Wand2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { EDGE_MARKER } from "@/lib/workflow-factory";
import { useEditorStore } from "@/stores/editor.store";
import { useUiStore } from "@/stores/ui.store";
import type { FlowNode } from "@/types/workflow";
import { FlowEdge, edgeTypes } from "./edges/FlowEdge";
import { nodeTypes } from "./nodes/FlowNode";
import { ExecuteBar } from "../components/ExecuteBar";
import { Tooltip } from "@/components/ui/overlays";

const AI_LABELS: Record<string, string> = {
  ai_languageModel: "Model",
  ai_memory: "Memory",
  ai_tool: "Tool",
  ai_embedding: "Embeddings",
  ai_vectorStore: "Vector Store",
  ai_retriever: "Retriever",
  ai_document: "Document",
  ai_textSplitter: "Splitter",
  ai_outputParser: "Parser",
};

function CanvasControls() {
  const { fitView, zoomIn, zoomOut } = useReactFlow();
  const tidyUp = useEditorStore((state) => state.tidyUp);

  return (
    <div className="glass-panel absolute bottom-4 left-4 z-10 flex items-center gap-0.5 rounded-full p-1">
      <Tooltip content="Fit view" side="top" shortcut="Shift+1">
        <button
          type="button"
          onClick={() => void fitView({ padding: 0.22, duration: 320 })}
          className="grid size-8 place-items-center rounded-full text-ink-2 transition hover:bg-surface-2 hover:text-ink"
          aria-label="Fit view"
        >
          <Focus className="size-4" />
        </button>
      </Tooltip>
      <Tooltip content="Zoom in" side="top" shortcut="+">
        <button
          type="button"
          onClick={() => void zoomIn({ duration: 160 })}
          className="grid size-8 place-items-center rounded-full text-ink-2 transition hover:bg-surface-2 hover:text-ink"
          aria-label="Zoom in"
        >
          <Plus className="size-4" />
        </button>
      </Tooltip>
      <Tooltip content="Zoom out" side="top" shortcut="−">
        <button
          type="button"
          onClick={() => void zoomOut({ duration: 160 })}
          className="grid size-8 place-items-center rounded-full text-ink-2 transition hover:bg-surface-2 hover:text-ink"
          aria-label="Zoom out"
        >
          <Minus className="size-4" />
        </button>
      </Tooltip>
      <div className="mx-1 h-4 w-px bg-hairline" />
      <Tooltip content="Tidy up" side="top">
        <button
          type="button"
          onClick={() => {
            tidyUp();
            toast("Canvas tidied up");
          }}
          className="grid size-8 place-items-center rounded-full text-ink-2 transition hover:bg-surface-2 hover:text-ink"
          aria-label="Tidy up"
        >
          <Wand2 className="size-4" />
        </button>
      </Tooltip>
    </div>
  );
}

function CanvasRightToolbar() {
  const openCreator = useEditorStore((state) => state.openCreator);
  const addStickyNote = useEditorStore((state) => state.addStickyNote);
  const setOverviewOpen = useEditorStore((state) => state.setOverviewOpen);
  const setAssistantOpen = useEditorStore((state) => state.setAssistantOpen);
  const { screenToFlowPosition } = useReactFlow();

  const addNote = () => {
    const position = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });
    addStickyNote({ x: position.x - 120, y: position.y - 80 });
  };

  return (
    <div className="glass-panel absolute right-4 top-4 z-10 flex flex-col items-center gap-0.5 rounded-full p-1.5">
      <Tooltip content="Add node" side="left" shortcut="Tab">
        <button
          type="button"
          onClick={() => openCreator()}
          className="grid size-9 place-items-center rounded-full text-ink-2 transition hover:bg-surface-2 hover:text-ink"
          aria-label="Add node"
        >
          <Plus className="size-[17px]" />
        </button>
      </Tooltip>
      <Tooltip content="Search nodes" side="left" shortcut="F">
        <button
          type="button"
          onClick={() => openCreator({ query: "" })}
          className="grid size-9 place-items-center rounded-full text-ink-2 transition hover:bg-surface-2 hover:text-ink"
          aria-label="Search nodes"
        >
          <Search className="size-[17px]" />
        </button>
      </Tooltip>
      <Tooltip content="Add sticky note" side="left">
        <button
          type="button"
          onClick={addNote}
          className="grid size-9 place-items-center rounded-full text-ink-2 transition hover:bg-surface-2 hover:text-ink"
          aria-label="Add sticky note"
        >
          <StickyNote className="size-[17px]" />
        </button>
      </Tooltip>
      <div className="my-0.5 h-px w-5 bg-hairline" />
      <Tooltip content="Workflow panel" side="left">
        <button
          type="button"
          onClick={() => setOverviewOpen(true)}
          className="grid size-9 place-items-center rounded-full text-ink-2 transition hover:bg-surface-2 hover:text-ink"
          aria-label="Open workflow panel"
        >
          <PanelRight className="size-[17px]" />
        </button>
      </Tooltip>
      <Tooltip content="Ask AI" side="left">
        <button
          type="button"
          onClick={() => setAssistantOpen(true)}
          className="grid size-9 place-items-center rounded-full text-accent transition hover:bg-accent-soft"
          aria-label="Ask AI"
        >
          <Sparkles className="size-[17px]" />
        </button>
      </Tooltip>
    </div>
  );
}

function EmptyCanvas() {
  const openCreator = useEditorStore((state) => state.openCreator);

  return (
    <div className="pointer-events-none absolute inset-0 z-[5] grid place-items-center">
      <div className="pointer-events-auto w-[340px] rounded-[18px] border border-line bg-surface/80 p-6 text-center shadow-[var(--shadow-float)] backdrop-blur-xl animate-fade-in">
        <div className="mx-auto mb-4 grid size-12 place-items-center rounded-[14px] border border-accent/25 bg-accent-soft text-accent">
          <Sparkles className="size-6" />
        </div>
        <h2 className="text-[16px] font-semibold tracking-[-0.01em] text-ink">
          Start building your workflow
        </h2>
        <p className="mx-auto mt-1.5 max-w-[260px] text-[12.5px] leading-relaxed text-ink-3">
          Add a trigger to start, then connect AI agents, tools and app actions.
        </p>
        <button
          type="button"
          onClick={() => openCreator({ group: "trigger" })}
          className="mt-5 inline-flex h-9 items-center gap-2 rounded-full bg-accent px-4 text-[13px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,.2),0_8px_20px_var(--accent-glow)] transition hover:bg-accent-hover"
        >
          <Plus className="size-4" />
          Add first step
        </button>
        <div className="mt-5 flex items-center justify-center gap-3 text-[10.5px] text-ink-3">
          <span className="flex items-center gap-1">
            <span className="kbd">Tab</span> add node
          </span>
          <span className="text-line-strong">·</span>
          <span className="flex items-center gap-1">
            <span className="kbd">Ctrl K</span> commands
          </span>
        </div>
      </div>
    </div>
  );
}

function CanvasInner() {
  const nodes = useEditorStore((state) => state.nodes);
  const edges = useEditorStore((state) => state.edges);
  const onNodesChange = useEditorStore((state) => state.onNodesChange);
  const onEdgesChange = useEditorStore((state) => state.onEdgesChange);
  const onConnect = useEditorStore((state) => state.onConnect);
  const setSelectedNodeId = useEditorStore((state) => state.setSelectedNodeId);
  const openNdv = useEditorStore((state) => state.openNdv);
  const takeSnapshot = useEditorStore((state) => state.takeSnapshot);
  const addStickyNote = useEditorStore((state) => state.addStickyNote);
  const { screenToFlowPosition, fitView } = useReactFlow();
  const workflowId = useEditorStore((state) => state.workflow.id);
  const snapToGrid = useUiStore((state) => state.snapToGrid);
  const nodesInitialized = useNodesInitialized();
  const fittedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!nodesInitialized || nodes.length === 0) return;
    if (fittedFor.current === workflowId) return;
    const timer = window.setTimeout(() => {
      fittedFor.current = workflowId;
      void fitView({ padding: 0.22, maxZoom: 1 });
    }, 160);
    return () => window.clearTimeout(timer);
  }, [nodesInitialized, workflowId, nodes.length, fitView]);

  const decoratedNodes = useMemo(() => {
    return nodes.map((node) => {
      const outgoing = edges.filter(
        (edge) =>
          edge.source === node.id &&
          (edge.data?.connectionType ?? "main") === "main",
      );
      const incoming = edges.filter(
        (edge) =>
          edge.target === node.id &&
          (edge.data?.connectionType ?? "main") === "main",
      );
      const aiIncoming = edges.filter(
        (edge) =>
          edge.target === node.id &&
          (edge.data?.connectionType ?? "main") !== "main",
      );
      const connectedOutputs = Array.from(
        new Set(
          outgoing.map((edge) => {
            const handle = edge.sourceHandle ?? "out-0";
            const index = Number(handle.replace("out-", ""));
            return Number.isFinite(index) ? index : 0;
          }),
        ),
      );
      const connectedInputs = Array.from(
        new Set(
          incoming.map((edge) => {
            const handle = edge.targetHandle ?? "in-0";
            const index = Number(handle.replace("in-", ""));
            return Number.isFinite(index) ? index : 0;
          }),
        ),
      );
      const connectedAiPorts = aiIncoming
        .map((edge) => edge.targetHandle)
        .filter((handle): handle is string => Boolean(handle));

      const classes = ["fp-node"];
      if (node.data.status === "running") classes.push("fp-node-running");
      if (node.data.disabled) classes.push("fp-node-disabled");

      return {
        ...node,
        className: [node.className, ...classes].filter(Boolean).join(" "),
        data: {
          ...node.data,
          hasOutgoing: outgoing.length > 0,
          hasIncoming: incoming.length > 0,
          connectedOutputs,
          connectedInputs,
          connectedAiPorts,
        },
      } satisfies FlowNode;
    });
  }, [nodes, edges]);

  const decoratedEdges = useMemo(() => {
    const statusById = new Map(nodes.map((node) => [node.id, node.data.status]));
    return edges.map((edge) => {
      const connectionType =
        typeof edge.data?.connectionType === "string"
          ? edge.data.connectionType
          : "main";
      return {
        ...edge,
        data: {
          ...edge.data,
          subLabel: AI_LABELS[connectionType],
          running:
            statusById.get(edge.target) === "running" ||
            statusById.get(edge.source) === "running",
        },
      };
    });
  }, [edges, nodes]);

  const handleConnect = useCallback(
    (connection: Connection) => {
      onConnect(connection);
    },
    [onConnect],
  );

  return (
    <div className="relative h-full w-full overflow-hidden bg-canvas">
      <ReactFlow
        nodes={decoratedNodes}
        edges={decoratedEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onNodeDragStart={takeSnapshot}
        onNodeClick={(_, node) => setSelectedNodeId(node.id)}
        onNodeDoubleClick={(_, node) => {
          if (node.type === "sticky") return;
          openNdv(node.id);
        }}
        onPaneClick={() => setSelectedNodeId(null)}
        onSelectionChange={({ nodes: selected }) =>
          setSelectedNodeId(selected[0]?.id ?? null)
        }
        onBeforeDelete={async () => {
          takeSnapshot();
          return true;
        }}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
        }}
        onDrop={(event) => {
          event.preventDefault();
          const type = event.dataTransfer.getData("application/flowpilot-node");
          if (!type) return;
          const position = screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
          });
          useEditorStore.getState().addNode(type, position);
        }}
        fitView
        fitViewOptions={{ padding: 0.28, maxZoom: 1.1 }}
        minZoom={0.2}
        maxZoom={2.5}
        snapToGrid={snapToGrid}
        snapGrid={[12, 12]}
        panOnDrag
        selectionKeyCode="Shift"
        selectionMode={SelectionMode.Partial}
        deleteKeyCode={["Backspace", "Delete"]}
        multiSelectionKeyCode={["Shift", "Control"]}
        defaultEdgeOptions={{ type: "flowpilot", markerEnd: EDGE_MARKER }}
        connectionLineStyle={{
          stroke: "var(--accent)",
          strokeWidth: 1.6,
          strokeDasharray: "5 5",
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1.5}
          color="var(--canvas-dot)"
        />
      </ReactFlow>

      <div className="dot-vignette pointer-events-none absolute inset-0 z-[1]" />

      {nodes.length === 0 ? <EmptyCanvas /> : null}

      <CanvasControls />
      <CanvasRightToolbar />
      <ExecuteBar />

      <button
        type="button"
        className="absolute bottom-4 right-4 z-10 hidden rounded-full border border-line bg-surface/80 px-2.5 py-1 font-mono text-[10px] text-ink-3 backdrop-blur transition hover:text-ink sm:block"
        onClick={() => {
          const position = screenToFlowPosition({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
          });
          addStickyNote({ x: position.x, y: position.y });
        }}
      >
        scroll to zoom · drag to pan
      </button>
    </div>
  );
}

export function WorkflowCanvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
}

export { FlowEdge };
