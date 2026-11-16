import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
  type EdgeTypes,
} from "@xyflow/react";
import { Plus, Trash2 } from "lucide-react";
import { memo, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/stores/editor.store";

export const FlowEdge = memo(function FlowEdge({
  id,
  source,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  data,
  selected,
}: EdgeProps) {
  const [hovered, setHovered] = useState(false);
  const hideTimer = useRef<number | null>(null);
  const openCreator = useEditorStore((state) => state.openCreator);
  const deleteEdge = useEditorStore((state) => state.deleteEdge);

  const showToolbar = () => {
    if (hideTimer.current !== null) {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    setHovered(true);
  };

  const scheduleHide = () => {
    if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      hideTimer.current = null;
      setHovered(false);
    }, 260);
  };

  useEffect(
    () => () => {
      if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
    },
    [],
  );

  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const connectionType =
    typeof data?.connectionType === "string" ? data.connectionType : "main";
  const isAi = connectionType !== "main";
  const running = data?.running === true;
  const label = typeof data?.label === "string" ? data.label : undefined;
  const subLabel = typeof data?.subLabel === "string" ? data.subLabel : undefined;

  return (
    <>
      <g
        onMouseEnter={showToolbar}
        onMouseLeave={scheduleHide}
      >
        <BaseEdge
          id={id}
          path={path}
          markerEnd={markerEnd}
          interactionWidth={30}
          className={cn(
            running && "fp-edge-running",
            isAi && "opacity-90",
          )}
          style={
            selected
              ? { stroke: "var(--accent)", strokeWidth: 2 }
              : isAi
                ? { strokeDasharray: "4 5", strokeWidth: 1.3 }
                : undefined
          }
        />
      </g>

      {subLabel ? (
        <EdgeLabelRenderer>
          <span
            className="pointer-events-none absolute rounded bg-canvas px-1 font-medium text-ink-3"
            style={{
              transform: "translate(-50%, -50%)",
              left: targetX,
              top: targetY - 16,
              fontSize: 9.5,
              letterSpacing: "0.02em",
            }}
          >
            {subLabel}
          </span>
        </EdgeLabelRenderer>
      ) : null}

      {label && !hovered ? (
        <EdgeLabelRenderer>
          <span
            className="pointer-events-none absolute rounded-full border border-hairline bg-surface px-1.5 py-0.5 text-[9.5px] font-medium text-ink-3 shadow-sm"
            style={{
              transform: "translate(-50%, -50%)",
              left: labelX,
              top: labelY,
            }}
          >
            {label}
          </span>
        </EdgeLabelRenderer>
      ) : null}

      {(hovered || selected) && (
        <EdgeLabelRenderer>
          <div
            className="edge-toolbar nodrag nopan"
            onMouseEnter={showToolbar}
            onMouseLeave={scheduleHide}
            style={{
              transform: "translate(-50%, -50%)",
              left: labelX,
              top: labelY,
            }}
          >
            <button
              type="button"
              aria-label="Insert node on connection"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => openCreator({ sourceNodeId: source })}
            >
              <Plus className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Delete connection"
              className="danger"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => deleteEdge(id)}
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

export const edgeTypes: EdgeTypes = {
  flowpilot: FlowEdge,
};
