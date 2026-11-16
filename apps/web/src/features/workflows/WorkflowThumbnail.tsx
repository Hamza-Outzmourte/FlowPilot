import type { Edge } from "@xyflow/react";
import { useMemo } from "react";
import type { FlowNode } from "@/types/workflow";

const GROUP_COLOR: Record<string, string> = {
  trigger: "var(--accent)",
  ai: "var(--accent)",
  action: "#38bdf8",
  flow: "var(--success)",
  data: "#22d3ee",
  core: "#38bdf8",
  human: "var(--warning)",
};

export function WorkflowThumbnail({
  nodes,
  edges,
  className,
}: {
  nodes: FlowNode[];
  edges: Edge[];
  className?: string;
}) {
  const boxes = useMemo(() => {
    if (nodes.length === 0) {
      return {
        lines: [] as Array<{
          id: string;
          x1: number;
          y1: number;
          x2: number;
          y2: number;
          isAi: boolean;
        }>,
        rects: [] as Array<{
          id: string;
          x: number;
          y: number;
          w: number;
          h: number;
          circle: boolean;
          color: string;
        }>,
      };
    }
    const width = (node: FlowNode) =>
      node.data.shape === "wide" ? 258 : node.data.shape === "circle" ? 92 : 110;
    const height = (node: FlowNode) =>
      node.data.shape === "circle" ? 92 : 110;

    const minX = Math.min(...nodes.map((node) => node.position.x));
    const maxX = Math.max(
      ...nodes.map((node) => node.position.x + width(node)),
    );
    const minY = Math.min(...nodes.map((node) => node.position.y));
    const maxY = Math.max(
      ...nodes.map((node) => node.position.y + height(node)),
    );

    const pad = 40;
    const spanX = Math.max(1, maxX - minX + pad * 2);
    const spanY = Math.max(1, maxY - minY + pad * 2);
    const scale = Math.min(320 / spanX, 150 / spanY);

    const byId = new Map(nodes.map((node) => [node.id, node]));
    const center = (node: FlowNode) => ({
      x: (node.position.x - minX + pad) * scale,
      y: (node.position.y - minY + pad) * scale,
    });

    const lines = edges
      .map((edge) => {
        const source = byId.get(edge.source);
        const target = byId.get(edge.target);
        if (!source || !target) return null;
        const from = center(source);
        const to = center(target);
        const w = width(source) * scale;
        const isAi = (edge.data?.connectionType ?? "main") !== "main";
        return {
          id: edge.id,
          x1: from.x + (isAi ? w / 2 : w),
          y1: from.y + 24 * scale,
          x2: to.x,
          y2: to.y + 24 * scale,
          isAi,
        };
      })
      .filter((line): line is NonNullable<typeof line> => Boolean(line));

    const rects = nodes.map((node) => {
      const at = center(node);
      const w = width(node) * scale;
      const h = (node.data.shape === "circle" ? 34 : 46) * scale;
      return {
        id: node.id,
        x: at.x,
        y: at.y + 12 * scale,
        w,
        h,
        circle: node.data.shape === "circle",
        color:
          GROUP_COLOR[node.data.group] ?? "var(--text-muted)",
      };
    });

    return { lines, rects };
  }, [nodes, edges]);

  if (boxes.rects.length === 0) {
    return <div className={className} />;
  }

  return (
    <svg
      viewBox="0 0 320 150"
      className={className}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <defs>
        <pattern id="thumb-dots" width="10" height="10" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.8" fill="var(--canvas-dot)" />
        </pattern>
      </defs>
      <rect width="320" height="150" fill="url(#thumb-dots)" opacity="0.7" />
      {boxes.lines.map((line) => (
        <path
          key={line.id}
          d={`M ${line.x1} ${line.y1} C ${line.x1 + 20} ${line.y1}, ${line.x2 - 20} ${line.y2}, ${line.x2} ${line.y2}`}
          fill="none"
          stroke={line.isAi ? "var(--line-strong)" : "var(--edge)"}
          strokeWidth={0.9}
          strokeDasharray={line.isAi ? "2 2.5" : undefined}
          opacity="0.85"
        />
      ))}
      {boxes.rects.map((rect) => (
        <g key={rect.id}>
          <rect
            x={rect.x}
            y={rect.y}
            width={rect.w}
            height={rect.h}
            rx={rect.circle ? rect.h : 7}
            fill="var(--bg-node)"
            stroke="var(--line-default)"
            strokeWidth="0.8"
          />
          <rect
            x={rect.x + rect.w * 0.32}
            y={rect.y + rect.h * 0.34}
            width={rect.w * 0.36}
            height={rect.h * 0.32}
            rx={1.5}
            fill={rect.color}
            opacity="0.9"
          />
        </g>
      ))}
    </svg>
  );
}
