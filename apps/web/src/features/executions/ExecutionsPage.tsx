import {
  CheckCircle2,
  CircleSlash,
  Clock3,
  Download,
  ExternalLink,
  Filter,
  RefreshCw,
  Search,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageTopBar } from "@/components/shell/PageTopBar";
import { NodeIcon } from "@/lib/node-icons";
import {
  cn,
  formatCompact,
  formatDateTime,
  formatDuration,
  formatRelative,
} from "@/lib/utils";
import { DEMO_EXECUTIONS } from "@/data/demo";
import type { ExecutionSummary } from "@/types/workflow";

type Status = "all" | ExecutionSummary["status"];
type Range = "24h" | "7d" | "30d";

const RANGE_MS: Record<Range, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

export function ExecutionsPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status>("all");
  const [range, setRange] = useState<Range>("7d");

  const now = Date.now();
  const executions = useMemo(
    () =>
      DEMO_EXECUTIONS.filter(
        (execution) =>
          now - new Date(execution.startedAt).getTime() <= RANGE_MS[range],
      ),
    [now, range],
  );

  const filtered = executions.filter((execution) => {
    const matchesQuery =
      !query.trim() ||
      `${execution.workflowName} ${execution.id} ${execution.trigger}`
        .toLowerCase()
        .includes(query.trim().toLowerCase());
    const matchesStatus = status === "all" || execution.status === status;
    return matchesQuery && matchesStatus;
  });

  const successCount = executions.filter((item) => item.status === "success").length;
  const errorCount = executions.filter((item) => item.status === "error").length;
  const successRate =
    executions.length === 0 ? 0 : (successCount / executions.length) * 100;
  const avgDuration =
    executions.length === 0
      ? 0
      : executions.reduce((sum, item) => sum + item.durationMs, 0) /
        executions.length;
  const tokens = executions.reduce((sum, item) => sum + (item.tokens ?? 0), 0);

  const exportCsv = () => {
    if (filtered.length === 0) {
      toast.error("There is nothing to export with these filters.");
      return;
    }
    const header = [
      "id",
      "workflow",
      "status",
      "trigger",
      "started_at",
      "duration_ms",
      "tokens",
    ];
    const rows = filtered.map((execution) => [
      execution.id,
      execution.workflowName,
      execution.status,
      execution.trigger,
      execution.startedAt,
      String(execution.durationMs),
      String(execution.tokens ?? 0),
    ]);
    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const csv = [header, ...rows]
      .map((row) => row.map(escape).join(","))
      .join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `flowpilot-executions-${range}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} executions`);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-app">
      <PageTopBar
        title="Executions"
        subtitle="Every run across your workspace, searchable and replayable."
        breadcrumb="Personal workspace"
        actions={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toast.success("Execution list refreshed")}
            >
              <RefreshCw className="size-3.5" />
              Refresh
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={exportCsv}
            >
              <Download className="size-3.5" />
              Export
            </Button>
          </>
        }
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="grid shrink-0 grid-cols-2 gap-3 px-6 pt-5 lg:grid-cols-4">
          {[
            {
              label: "Total runs",
              value: executions.length.toLocaleString(),
              icon: <Zap className="size-4" />,
              color: "var(--accent)",
            },
            {
              label: "Success rate",
              value: `${successRate.toFixed(1)}%`,
              icon: <CheckCircle2 className="size-4" />,
              color: "var(--success)",
            },
            {
              label: "Failures",
              value: String(errorCount),
              icon: <CircleSlash className="size-4" />,
              color: "var(--danger)",
            },
            {
              label: "Tokens used",
              value: formatCompact(tokens),
              icon: <Clock3 className="size-4" />,
              color: "#22d3ee",
            },
          ].map((stat) => (
            <div key={stat.label} className="surface-card px-4 py-3">
              <div className="flex items-center gap-2">
                <span
                  className="grid size-6 place-items-center rounded-md"
                  style={{
                    color: stat.color,
                    background: `color-mix(in oklab, ${stat.color} 12%, transparent)`,
                  }}
                >
                  {stat.icon}
                </span>
                <span className="text-[10.5px] font-medium text-ink-3">
                  {stat.label}
                </span>
              </div>
              <div className="mt-2 font-mono text-[20px] tracking-tight text-ink">
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 px-6 py-4">
          <div className="relative w-[260px]">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-3" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by workflow, id or trigger…"
              className="h-8 pl-8 text-[12px]"
              aria-label="Search executions"
            />
          </div>

          <div className="flex items-center gap-1 rounded-full border border-hairline bg-surface-2/60 p-0.5">
            {(["all", "success", "error", "running"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setStatus(item)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-medium capitalize transition",
                  status === item
                    ? "bg-surface text-ink shadow-sm"
                    : "text-ink-3 hover:text-ink-2",
                )}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 rounded-full border border-hairline bg-surface-2/60 p-0.5">
            {(["24h", "7d", "30d"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setRange(item)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-medium transition",
                  range === item
                    ? "bg-surface text-ink shadow-sm"
                    : "text-ink-3 hover:text-ink-2",
                )}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2 text-[10.5px] text-ink-3">
            <Filter className="size-3" />
            Avg duration {formatDuration(avgDuration)}
          </div>
        </div>

        <div className="fp-scroll min-h-0 flex-1 overflow-y-auto px-6 pb-6">
          <div className="surface-card overflow-hidden">
            <div className="grid grid-cols-[1.5fr_1fr_0.8fr_0.8fr_0.7fr_0.7fr_36px] gap-3 border-b border-hairline px-4 py-2 text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-3">
              <span>Workflow</span>
              <span>Status</span>
              <span>Trigger</span>
              <span>Started</span>
              <span>Duration</span>
              <span>Tokens</span>
              <span />
            </div>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-16 text-center">
                <Filter className="mb-3 size-5 text-ink-3" />
                <p className="text-[13px] font-medium text-ink">
                  No executions in this range
                </p>
                <p className="mt-1 text-[11.5px] text-ink-3">
                  Widen the time range or clear the filters.
                </p>
              </div>
            ) : (
              filtered.map((execution) => (
                <button
                  key={execution.id}
                  type="button"
                  onClick={() => navigate(`/executions/${execution.id}`)}
                  className="grid w-full grid-cols-[1.5fr_1fr_0.8fr_0.8fr_0.7fr_0.7fr_36px] items-center gap-3 border-b border-hairline px-4 py-2.5 text-left transition last:border-b-0 hover:bg-surface-2/55"
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className="grid size-7 shrink-0 place-items-center overflow-hidden rounded-lg border border-hairline bg-surface-2">
                      <NodeIcon
                        name={execution.triggerIcon}
                        className="size-4"
                      />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[11.5px] font-medium text-ink">
                        {execution.workflowName}
                      </span>
                      <span className="block font-mono text-[9.5px] text-ink-3">
                        {execution.id} · {execution.mode}
                      </span>
                    </span>
                  </span>
                  <span>
                    <Badge
                      variant={
                        execution.status === "success"
                          ? "success"
                          : execution.status === "running"
                            ? "accent"
                            : "danger"
                      }
                    >
                      {execution.status}
                    </Badge>
                  </span>
                  <span className="truncate text-[11px] text-ink-2">
                    {execution.trigger}
                  </span>
                  <span className="text-[10.5px] text-ink-3">
                    <span className="block">{formatDateTime(execution.startedAt)}</span>
                    <span className="block text-[9.5px]">
                      {formatRelative(execution.startedAt)}
                    </span>
                  </span>
                  <span className="font-mono text-[10.5px] text-ink-2">
                    {formatDuration(execution.durationMs)}
                  </span>
                  <span className="font-mono text-[10.5px] text-ink-2">
                    {(execution.tokens ?? 0).toLocaleString()}
                  </span>
                  <span className="grid size-6 place-items-center rounded-md text-ink-3">
                    <ExternalLink className="size-3" />
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
