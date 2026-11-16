import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
  ScrollText,
  Square,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge, StatusDot } from "@/components/ui/badge";
import { CodeBlock } from "@/components/ui/primitives";
import { NodeIcon } from "@/lib/node-icons";
import { cn, formatDuration } from "@/lib/utils";
import { useEditorStore } from "@/stores/editor.store";
import type { LogEntry } from "@/types/workflow";

function statusTone(status: LogEntry["status"]): "success" | "error" | "running" | "idle" {
  if (status === "success") return "success";
  if (status === "error") return "error";
  if (status === "running") return "running";
  return "idle";
}

function LogStatusIcon({ status }: { status: LogEntry["status"] }) {
  if (status === "success")
    return (
      <span className="grid size-4 place-items-center rounded-full bg-success/15 text-success">
        <Check className="size-2.5" strokeWidth={3} />
      </span>
    );
  if (status === "error")
    return (
      <span className="grid size-4 place-items-center rounded-full bg-danger/15 text-danger">
        <AlertTriangle className="size-2.5" />
      </span>
    );
  if (status === "running")
    return <Loader2 className="size-3.5 animate-spin text-accent" />;
  return <Square className="size-2.5 text-ink-3" />;
}

export function LogsPanel() {
  const logs = useEditorStore((state) => state.execution.logs);
  const execution = useEditorStore((state) => state.execution);
  const workflow = useEditorStore((state) => state.workflow);
  const open = useEditorStore((state) => state.logsOpen);
  const setOpen = useEditorStore((state) => state.setLogsOpen);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<"input" | "output">("output");

  useEffect(() => {
    if (logs.length === 0) {
      setSelectedId(null);
      return;
    }
    const last = logs[logs.length - 1];
    if (last) setSelectedId(last.id);
  }, [logs.length, logs]);

  const selected = logs.find((log) => log.id === selectedId) ?? logs[0];

  const totals = useMemo(() => {
    const tokens = logs.reduce((sum, log) => sum + (log.tokens ?? 0), 0);
    const cost = logs.reduce((sum, log) => sum + (log.cost ?? 0), 0);
    const duration = logs.reduce((sum, log) => sum + (log.durationMs ?? 0), 0);
    return { tokens, cost, duration };
  }, [logs]);

  const running = execution.status === "running";
  const summary =
    execution.status === "success"
      ? "Success"
      : execution.status === "error"
        ? "Failed"
        : execution.status === "cancelled"
          ? "Stopped"
          : running
            ? "Running"
            : "Idle";

  return (
    <div
      className={cn(
        "relative z-20 flex shrink-0 flex-col border-t border-line bg-surface transition-[height] duration-200",
        open ? "h-[304px]" : "h-10",
      )}
    >
      <div className="flex h-10 shrink-0 items-center gap-3 px-4">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex h-10 items-center gap-2.5 text-left"
        >
          <ScrollText className="size-4 text-ink-3" />
          <span className="text-[12.5px] font-medium text-ink">Logs</span>
          {logs.length > 0 || running ? (
            <span className="flex items-center gap-1.5 rounded-full border border-hairline bg-surface-2 px-2 py-0.5 text-[10px] text-ink-3">
              <StatusDot
                tone={
                  running
                    ? "running"
                    : execution.status === "error"
                      ? "error"
                      : "success"
                }
                pulse={running}
              />
              {summary}
              <span className="text-line-strong">·</span>
              {logs.length} step{logs.length === 1 ? "" : "s"}
              {totals.duration > 0 ? (
                <>
                  <span className="text-line-strong">·</span>
                  {formatDuration(totals.duration)}
                </>
              ) : null}
              {totals.tokens > 0 ? (
                <>
                  <span className="text-line-strong">·</span>
                  {totals.tokens.toLocaleString()} tokens
                </>
              ) : null}
            </span>
          ) : (
            <span className="text-[11.5px] text-ink-3">
              Run the workflow to inspect every step
            </span>
          )}
        </button>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            className="grid size-7 place-items-center rounded-md text-ink-3 transition hover:bg-surface-2 hover:text-ink"
            onClick={() => {
              const win = window.open("", "_blank", "width=920,height=720");
              if (!win) {
                toast.error("Allow pop-ups to open the logs window.");
                return;
              }
              win.document.title = `${workflow.name} · Logs`;
              const style = win.document.createElement("style");
              style.textContent =
                "body{font:13px/1.5 ui-sans-serif,system-ui,sans-serif;background:#131316;color:#f4f4f6;margin:0;padding:28px}" +
                "h1{font-size:15px;margin:0 0 4px}p{color:#9a9aa5;font-size:12px;margin:0 0 20px}" +
                "table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:7px 10px;border-bottom:1px solid #2a2a30;font-size:12px}" +
                "th{color:#9a9aa5;font-size:10px;text-transform:uppercase;letter-spacing:.08em}" +
                ".success{color:#22c55e}.error{color:#ef4444}.running{color:#8b5cf6}";
              win.document.head.appendChild(style);
              const title = win.document.createElement("h1");
              title.textContent = `${workflow.name} — execution logs`;
              const sub = win.document.createElement("p");
              sub.textContent = `${logs.length} steps · ${summary}`;
              const table = win.document.createElement("table");
              const head = win.document.createElement("tr");
              for (const label of ["Node", "Status", "Duration", "Tokens"]) {
                const th = win.document.createElement("th");
                th.textContent = label;
                head.appendChild(th);
              }
              table.appendChild(head);
              for (const log of logs) {
                const row = win.document.createElement("tr");
                const cells = [
                  log.nodeName,
                  log.status,
                  log.durationMs ? formatDuration(log.durationMs) : "—",
                  log.tokens ? String(log.tokens) : "—",
                ];
                cells.forEach((value, cellIndex) => {
                  const td = win.document.createElement("td");
                  td.textContent = value;
                  if (cellIndex === 1) td.className = log.status;
                  row.appendChild(td);
                });
                table.appendChild(row);
              }
              win.document.body.append(title, sub, table);
            }}
            aria-label="Open logs in new window"
          >
            <ExternalLink className="size-3.5" />
          </button>
          <button
            type="button"
            className="grid size-7 place-items-center rounded-md text-ink-3 transition hover:bg-surface-2 hover:text-ink"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Collapse logs" : "Expand logs"}
          >
            {open ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronUp className="size-4" />
            )}
          </button>
        </div>
      </div>

      {open ? (
        <div className="grid min-h-0 flex-1 grid-cols-[minmax(280px,0.9fr)_1.6fr] border-t border-hairline animate-fade-in">
          <div className="flex min-h-0 flex-col border-r border-hairline">
            <div className="flex h-8 shrink-0 items-center justify-between border-b border-hairline px-3.5">
              <span className="text-[9.5px] font-semibold uppercase tracking-[0.1em] text-ink-3">
                Timeline
              </span>
              <span className="font-mono text-[9.5px] text-ink-3">
                {logs.length} events
              </span>
            </div>
            <div className="fp-scroll min-h-0 flex-1 overflow-y-auto py-1">
              {logs.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                  <ScrollText className="mb-2 size-5 text-ink-3/60" />
                  <p className="text-[11.5px] text-ink-3">
                    {running
                      ? "Waiting for the first node…"
                      : "No logs yet. Press Execute to run this workflow."}
                  </p>
                </div>
              ) : (
                logs.map((log, index) => (
                  <button
                    key={log.id}
                    type="button"
                    onClick={() => setSelectedId(log.id)}
                    className={cn(
                      "relative flex w-full items-center gap-2.5 px-3 py-1.5 text-left transition-colors",
                      selected?.id === log.id
                        ? "bg-surface-2"
                        : "hover:bg-surface-2/60",
                    )}
                  >
                    {selected?.id === log.id ? (
                      <span className="absolute inset-y-1 left-0 w-[2px] rounded-full bg-accent" />
                    ) : null}
                    <span className="w-4 shrink-0 text-right font-mono text-[9.5px] text-ink-3">
                      {index + 1}
                    </span>
                    <span className="grid size-6 shrink-0 place-items-center overflow-hidden rounded-md border border-hairline bg-surface-2">
                      <NodeIcon name={log.icon} className="size-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11.5px] font-medium text-ink-2">
                        {log.nodeName}
                      </span>
                      <span className="block truncate font-mono text-[9px] text-ink-3">
                        {log.nodeType.replace("flowpilot.", "")}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-[9.5px] text-ink-3">
                      {log.durationMs} ms
                    </span>
                    <LogStatusIcon status={log.status} />
                  </button>
                ))
              )}
              {running ? (
                <div className="flex items-center gap-2.5 px-3 py-2">
                  <span className="w-4 text-right font-mono text-[9.5px] text-ink-3">
                    {logs.length + 1}
                  </span>
                  <Loader2 className="size-3.5 animate-spin text-accent" />
                  <span className="text-[11.5px] text-ink-3">
                    Next node running…
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex min-h-0 flex-col">
            {selected ? (
              <>
                <div className="flex h-8 shrink-0 items-center gap-2 border-b border-hairline px-3.5">
                  <LogStatusIcon status={selected.status} />
                  <span className="text-[11.5px] font-medium text-ink">
                    {selected.nodeName}
                  </span>
                  <Badge variant={statusTone(selected.status) === "error" ? "danger" : "success"}>
                    {selected.status}
                  </Badge>
                  <div className="ml-auto flex items-center gap-3 font-mono text-[9.5px] text-ink-3">
                    <span>{selected.durationMs} ms</span>
                    {selected.tokens ? <span>{selected.tokens} tokens</span> : null}
                    {selected.cost ? <span>${selected.cost.toFixed(4)}</span> : null}
                  </div>
                </div>
                <div className="flex min-h-0 flex-1 flex-col px-3 pb-2.5 pt-2">
                  <div className="mb-1.5 flex items-center gap-1">
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
                    {selected.error ? (
                      <span className="ml-auto flex items-center gap-1 text-[10px] text-danger">
                        <AlertTriangle className="size-3" />
                        {selected.error}
                      </span>
                    ) : null}
                  </div>
                  <div className="min-h-0 flex-1">
                    <CodeBlock
                      value={JSON.stringify(
                        (tab === "input" ? selected.input : selected.output) ?? {},
                        null,
                        2,
                      )}
                      className="h-full"
                      maxHeight="100%"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-[11.5px] text-ink-3">
                Select a step to inspect its input and output.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
