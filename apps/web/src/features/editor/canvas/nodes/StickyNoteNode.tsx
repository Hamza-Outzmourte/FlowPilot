import { NodeResizer, type NodeProps } from "@xyflow/react";
import { memo } from "react";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/stores/editor.store";
import type { FlowNode } from "@/types/workflow";

const NOTE_COLORS = [
  "amber",
  "violet",
  "cyan",
  "green",
  "rose",
  "blue",
  "slate",
  "orange",
] as const;

const colorSwatch: Record<string, string> = {
  amber: "#f59e0b",
  violet: "#8b5cf6",
  cyan: "#22d3ee",
  green: "#22c55e",
  rose: "#f43f5e",
  blue: "#38bdf8",
  slate: "#94a3b8",
  orange: "#fb923c",
};

export const StickyNoteNode = memo(function StickyNoteNode({
  id,
  data,
  selected,
}: NodeProps<FlowNode>) {
  const updateNodeData = useEditorStore((state) => state.updateNodeData);
  const deleteNode = useEditorStore((state) => state.deleteNode);
  const color = data.noteColor ?? "amber";

  return (
    <>
      <NodeResizer
        isVisible={Boolean(selected)}
        minWidth={180}
        minHeight={120}
        lineStyle={{
          borderColor: "var(--accent)",
          borderWidth: 1,
          borderRadius: 12,
        }}
        handleStyle={{
          width: 8,
          height: 8,
          borderRadius: 3,
          border: "1.5px solid var(--accent)",
          background: "var(--bg-surface)",
        }}
      />
      <div
        className={cn(
          "sticky-note group relative flex h-full w-full flex-col overflow-hidden",
          `sticky-${color}`,
        )}
      >
        <div className="flex h-8 shrink-0 items-center justify-between px-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.09em] text-ink-3">
            Note
          </span>
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {NOTE_COLORS.map((tone) => (
              <button
                key={tone}
                type="button"
                aria-label={`Set note color to ${tone}`}
                onClick={() =>
                  updateNodeData(id, {
                    noteColor: tone,
                  })
                }
                className={cn(
                  "nodrag size-2.5 rounded-full border transition-transform hover:scale-125",
                  color === tone ? "ring-1 ring-ink-2 ring-offset-1 ring-offset-transparent" : "",
                )}
                style={{ background: colorSwatch[tone] }}
              />
            ))}
            <button
              type="button"
              aria-label="Delete note"
              onClick={() => deleteNode(id)}
              className="nodrag size-2.5 rounded-full border text-ink-3 transition hover:bg-danger hover:text-white"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>
        <textarea
          value={data.noteBody ?? ""}
          onChange={(event) => updateNodeData(id, { noteBody: event.target.value })}
          placeholder="Write a note…"
          spellCheck={false}
          className="nodrag nopan nowheel min-h-0 flex-1 resize-none bg-transparent px-3 pb-3 font-mono text-[11.5px] leading-relaxed text-ink-2 outline-none placeholder:text-ink-3/70"
        />
      </div>
    </>
  );
});
