import {
  Handle,
  Position,
  type NodeProps,
  type NodeTypes,
} from "@xyflow/react";
import { AlertTriangle, Check, Pin, Plus, Zap } from "lucide-react";
import { memo } from "react";
import { AI_SUB_PORT_SPECS } from "@/data/node-catalog";
import { hasBrandIcon, NodeIcon } from "@/lib/node-icons";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/stores/editor.store";
import type { FlowNode } from "@/types/workflow";
import { StickyNoteNode } from "./StickyNoteNode";

type FlowNodeProps = NodeProps<FlowNode>;

const groupColor: Record<string, string> = {
  flow: "var(--success)",
  data: "#22d3ee",
  core: "var(--info)",
  human: "var(--warning)",
  trigger: "var(--accent)",
  ai: "var(--accent)",
};

function offsets(count: number): number[] {
  if (count <= 1) return [50];
  if (count === 2) return [34, 66];
  return [26, 50, 74];
}

function AddStub({
  top,
  onClick,
  ariaLabel,
}: {
  top: number;
  onClick: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className="fp-add-stub nodrag nopan -translate-y-1/2"
      style={{ left: "calc(100% - 1px)", top: `${top}%` }}
    >
      <span className="fp-add-stub-line" />
      <span className="fp-add-stub-btn">
        <Plus className="size-3.5" strokeWidth={2.2} />
      </span>
    </button>
  );
}

function StatusBadges({ data }: { data: FlowNode["data"] }) {
  return (
    <>
      {data.pinned ? (
        <span
          className="fp-node-badge -left-7 right-auto bg-[var(--bg-surface-2)] text-ink-2"
          title="Pinned data"
        >
          <Pin className="size-2.5" />
        </span>
      ) : null}
      {data.status === "success" ? (
        <span className="fp-node-badge bg-success" title="Succeeded">
          <Check className="size-2.5" strokeWidth={3} />
        </span>
      ) : null}
      {data.status === "error" ? (
        <span className="fp-node-badge bg-danger" title={data.error ?? "Failed"}>
          <AlertTriangle className="size-2.5" strokeWidth={2.6} />
        </span>
      ) : null}
      {data.status === "cancelled" ? (
        <span className="fp-node-badge bg-warning" title="Stopped">
          <span className="text-[9px] font-bold">!</span>
        </span>
      ) : null}
    </>
  );
}

const SquareNode = memo(function SquareNode({ id, data }: FlowNodeProps) {
  const openCreator = useEditorStore((state) => state.openCreator);
  const requiresInput = data.inputs.some((port) => port.type === "main");
  const outputs = data.outputs.filter((port) => port.type === "main");
  const outOffsets = offsets(Math.max(1, outputs.length));
  const inputOffsets = offsets(data.inputs.length);
  const connected = new Set(data.connectedOutputs ?? []);
  const isTrigger = data.group === "trigger";
  // Stored workflows created before the custom If glyph shipped still carry
  // the old icon key; upgrade them on render.
  const iconName =
    data.nodeType === "flowpilot.if" && data.icon === "git-branch"
      ? "if"
      : data.icon;
  const brand = hasBrandIcon(iconName);

  return (
    <div className="fp-node relative">
      {isTrigger ? (
        <span className="fp-trigger-bolt" title="Trigger" aria-label="Trigger">
          <Zap className="size-[22px]" strokeWidth={2.2} />
        </span>
      ) : null}

      <div
        className={cn(
          "fp-node-tile h-[110px] w-[110px]",
          isTrigger && "fp-node-tile-trigger",
          data.group === "action" && "fp-node-tile-action",
        )}
      >
        {isTrigger && data.status === "success" ? (
          <span className="fp-trigger-check" title="Succeeded" aria-label="Succeeded">
            <Check className="size-3.5" strokeWidth={3} />
          </span>
        ) : null}
        <div
          className={cn(
            "relative z-[1] transition-transform duration-150",
            brand ? "" : "text-ink-2",
          )}
          style={brand ? undefined : { color: groupColor[data.group] ?? "var(--text-secondary)" }}
        >
          <NodeIcon name={iconName} className="h-[44px] w-[44px]" />
        </div>
        <StatusBadges data={data} />
      </div>

      <div className="fp-node-label">
        <div className="fp-node-label-title">{data.label}</div>
        {data.subtitle ? (
          <div className="fp-node-label-subtitle">{data.subtitle}</div>
        ) : null}
      </div>

      {requiresInput
        ? data.inputs.map((port, index) => (
            <Handle
              key={`in-${index}`}
              id={`in-${index}`}
              type="target"
              position={Position.Left}
              className={cn(
                "fp-handle",
                port.type !== "main" && "fp-handle-diamond",
              )}
              style={{ top: `${inputOffsets[index] ?? 50}%` }}
            />
          ))
        : null}

      {outputs.map((_port, index) => (
        <Handle
          key={`out-${index}`}
          id={`out-${index}`}
          type="source"
          position={Position.Right}
          className="fp-handle"
          style={{ top: `${outOffsets[index] ?? 50}%` }}
        />
      ))}

      {outputs.map((port, index) =>
        !connected.has(index) ? (
          <AddStub
            key={`stub-${index}`}
            top={outOffsets[index] ?? 50}
            ariaLabel={`Add node after ${data.label}`}
            onClick={() =>
              openCreator({
                sourceNodeId: id,
                sourceHandle: `out-${index}`,
                connectionType: port.type,
              })
            }
          />
        ) : null,
      )}

      {outputs.length > 0
        ? outputs.map((port, index) =>
            port.label ? (
              <span
                key={`port-label-${index}`}
                className="absolute whitespace-nowrap text-[10.5px] font-medium text-ink-3"
                style={{
                  left: "calc(100% + 42px)",
                  top: `${outOffsets[index] ?? 50}%`,
                  transform: "translateY(-50%)",
                }}
              >
                {port.label}
              </span>
            ) : null,
          )
        : null}
    </div>
  );
});

const AgentNode = memo(function AgentNode({ id, data }: FlowNodeProps) {
  const openCreator = useEditorStore((state) => state.openCreator);
  const connectedAi = new Set(data.connectedAiPorts ?? []);
  const toolConnected = connectedAi.has("ai_tool");

  return (
    <div className="fp-node relative">
      <div className="fp-node-tile relative h-[110px] w-[258px] rounded-[24px] px-4">
        <div className="relative z-[1] flex w-full items-center gap-3">
          <div className="grid size-12 shrink-0 place-items-center rounded-[15px] border border-accent/25 bg-[linear-gradient(150deg,var(--accent-soft),transparent)] text-accent shadow-[inset_0_1px_0_var(--line-default)]">
            <NodeIcon name={data.icon} className="size-7" />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <div className="truncate text-[15px] font-semibold tracking-[-0.01em] text-ink">
              {data.label}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-ink-3">
              <span className="status-dot bg-accent" />
              {data.subtitle ?? "Agent"}
            </div>
          </div>
        </div>
        <StatusBadges data={data} />
      </div>

      <Handle
        id="in-0"
        type="target"
        position={Position.Left}
        className="fp-handle"
        style={{ top: "50%" }}
      />
      <Handle
        id="out-0"
        type="source"
        position={Position.Right}
        className="fp-handle"
        style={{ top: "50%" }}
      />

      {!data.hasOutgoing ? (
        <AddStub
          top={50}
          ariaLabel={`Add node after ${data.label}`}
          onClick={() =>
            openCreator({
              sourceNodeId: id,
              sourceHandle: "out-0",
              connectionType: "main",
            })
          }
        />
      ) : null}

      {AI_SUB_PORT_SPECS.map((port, index) => {
        const left = 25 + index * 25;
        return (
          <div key={port.id}>
            <Handle
              id={port.id}
              type="target"
              position={Position.Bottom}
              className="fp-handle-agent"
              style={{ left: `${left}%` }}
            />
            <span
              className={cn(
                "fp-subport-label",
                port.required && "fp-subport-label-required",
              )}
              style={{ left: `${left}%` }}
            >
              {port.label}
            </span>
          </div>
        );
      })}

      {!toolConnected ? (
        <button
          type="button"
          aria-label="Add a tool to the agent"
          onClick={(event) => {
            event.stopPropagation();
            openCreator({
              sourceNodeId: id,
              sourceHandle: "ai_tool",
              connectionType: "ai_tool",
              group: "ai",
            });
          }}
          className="nodrag nopan absolute z-[5] flex -translate-x-1/2 flex-col items-center"
          style={{ left: "75%", top: "calc(100% + 28px)" }}
        >
          <span className="h-3.5 w-px bg-[var(--line-strong)]" />
          <span className="fp-add-stub-btn size-[20px] rounded-[7px]">
            <Plus className="size-3" strokeWidth={2.2} />
          </span>
        </button>
      ) : null}
    </div>
  );
});

const CircleNode = memo(function CircleNode({ data }: FlowNodeProps) {
  const openCreator = useEditorStore((state) => state.openCreator);
  const brand = hasBrandIcon(data.icon);
  const connected = (data.connectedOutputs ?? []).length > 0;

  return (
    <div className="fp-node relative">
      <div className="fp-node-subtile h-[92px] w-[92px] rounded-full">
        <div
          className={cn(
            "relative z-[1]",
            brand ? "" : "text-ink-2",
          )}
          style={
            brand
              ? undefined
              : {
                  color:
                    data.group === "ai"
                      ? "var(--accent)"
                      : "var(--text-secondary)",
                }
          }
        >
          <NodeIcon name={data.icon} className="h-10 w-10" />
        </div>
        <StatusBadges data={data} />
      </div>

      <div className="fp-node-label">
        <div className="fp-node-label-title !text-[12.5px]">{data.label}</div>
        {data.subtitle ? (
          <div className="fp-node-label-subtitle !text-[10.5px]">{data.subtitle}</div>
        ) : null}
      </div>

      <Handle
        id="out-0"
        type="source"
        position={Position.Top}
        className="fp-handle-diamond"
      />

      {data.group === "ai" && !connected ? (
        <button
          type="button"
          aria-label="Connect to an agent"
          className="nodrag nopan absolute left-1/2 top-[calc(100%+38px)] -translate-x-1/2 text-[10px] text-ink-3 opacity-0 transition-opacity hover:text-accent focus-visible:opacity-100"
          onClick={() => openCreator({ group: "ai" })}
        >
          connect
        </button>
      ) : null}
    </div>
  );
});

export function FlowPilotNode(props: FlowNodeProps) {
  if (props.data.shape === "wide") return <AgentNode {...props} />;
  if (props.data.shape === "circle") return <CircleNode {...props} />;
  return <SquareNode {...props} />;
}

export const nodeTypes: NodeTypes = {
  flowpilot: FlowPilotNode,
  sticky: StickyNoteNode,
};
