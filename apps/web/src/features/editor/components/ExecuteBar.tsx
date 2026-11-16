import {
  ChevronDown,
  Loader2,
  Play,
  Square,
  Workflow as WorkflowIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { NodeIcon } from "@/lib/node-icons";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/overlays";
import { useEditorStore } from "@/stores/editor.store";

export function ExecuteBar() {
  const nodes = useEditorStore((state) => state.nodes);
  const edges = useEditorStore((state) => state.edges);
  const status = useEditorStore((state) => state.execution.status);
  const startedAt = useEditorStore((state) => state.execution.startedAt);
  const execute = useEditorStore((state) => state.execute);
  const stopExecution = useEditorStore((state) => state.stopExecution);
  const selectedNodeId = useEditorStore((state) => state.selectedNodeId);
  const setLogsOpen = useEditorStore((state) => state.setLogsOpen);
  const logsCount = useEditorStore((state) => state.execution.logs.length);
  const [elapsed, setElapsed] = useState(0);

  const triggers = useMemo(
    () => nodes.filter((node) => node.data.group === "trigger"),
    [nodes],
  );

  const entryTrigger = useMemo(() => {
    const withOutgoing = triggers.find((trigger) =>
      edges.some(
        (edge) =>
          edge.source === trigger.id &&
          (edge.data?.connectionType ?? "main") === "main",
      ),
    );
    return withOutgoing ?? triggers[0];
  }, [triggers, edges]);

  const selectedNode = nodes.find((node) => node.id === selectedNodeId);
  const running = status === "running";

  useEffect(() => {
    if (!running || !startedAt) {
      setElapsed(0);
      return;
    }
    const timer = window.setInterval(
      () => setElapsed(Date.now() - startedAt),
      100,
    );
    return () => window.clearInterval(timer);
  }, [running, startedAt]);

  return (
    <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2">
      {running ? (
        <div className="flex h-11 items-center gap-1 rounded-full border border-danger/30 bg-[#1a1416] pl-4 pr-1.5 shadow-[0_12px_36px_rgba(239,68,68,.18)]">
          <span className="relative mr-1 grid size-5 place-items-center">
            <Loader2 className="size-4 animate-spin text-danger" />
          </span>
          <span className="mr-3 text-[13px] font-medium text-ink">
            Running
            <span className="ml-2 font-mono text-[11px] text-ink-3">
              {(elapsed / 1000).toFixed(1)}s · {logsCount} nodes
            </span>
          </span>
          <button
            type="button"
            onClick={stopExecution}
            className="flex h-8 items-center gap-2 rounded-full bg-danger px-3 text-[12.5px] font-semibold text-white transition hover:bg-[#dc2f2f]"
          >
            <Square className="size-3.5 fill-current" />
            Stop
          </button>
        </div>
      ) : (
        <div className="flex h-11 items-stretch rounded-full border border-black/10 bg-[#f4f4f6] p-[3px] text-[#111114] shadow-[0_14px_40px_rgba(0,0,0,.38),0_1px_0_rgba(255,255,255,.7)_inset]">
          <button
            type="button"
            onClick={() => void execute(entryTrigger?.id)}
            className="flex items-center gap-2 rounded-full pl-3.5 pr-3 text-[13.5px] font-semibold tracking-[-0.01em] transition hover:bg-black/[0.055]"
          >
            {entryTrigger ? (
              <span className="grid size-6 place-items-center overflow-hidden rounded-md">
                <NodeIcon name={entryTrigger.data.icon} className="size-[18px]" />
              </span>
            ) : (
              <Play className="size-4 fill-current" />
            )}
            <span>Execute</span>
          </button>
          <div className="my-1.5 w-px bg-black/10" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="grid w-8 place-items-center rounded-full transition hover:bg-black/[0.055]"
                aria-label="Execution options"
              >
                <ChevronDown className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="mb-2">
              <DropdownMenuLabel>Execute</DropdownMenuLabel>
              <DropdownMenuItem
                onSelect={() => void execute(entryTrigger?.id)}
              >
                <Play className="size-3.5" />
                Execute workflow
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!selectedNode || selectedNode.data.group === "trigger"}
                onSelect={() => {
                  if (!selectedNode) return;
                  setLogsOpen(true);
                  void execute(selectedNode.id);
                }}
              >
                <WorkflowIcon className="size-3.5" />
                Execute from selected node
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  setLogsOpen(true);
                }}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      logsCount > 0 ? "bg-success" : "bg-ink-3",
                    )}
                  />
                  Open logs
                </span>
              </DropdownMenuItem>
              {triggers.length > 1 ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Start from trigger</DropdownMenuLabel>
                  {triggers.map((trigger) => (
                    <DropdownMenuItem
                      key={trigger.id}
                      onSelect={() => void execute(trigger.id)}
                    >
                      <NodeIcon
                        name={trigger.data.icon}
                        className="size-3.5"
                      />
                      {trigger.data.label}
                      {entryTrigger?.id === trigger.id ? (
                        <span className="ml-auto text-[10px] font-medium text-accent">
                          default
                        </span>
                      ) : null}
                    </DropdownMenuItem>
                  ))}
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <div className="pointer-events-none flex h-4 items-center gap-2 text-[10px] text-ink-3">
        {selectedNode ? (
          <span className="rounded-full border border-line bg-surface/70 px-2 py-0.5 backdrop-blur">
            Selected: {selectedNode.data.label}
          </span>
        ) : (
          <span className="opacity-80">Ctrl+Enter to execute</span>
        )}
      </div>
    </div>
  );
}
