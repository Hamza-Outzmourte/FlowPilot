import {
  ArrowUpRight,
  Clock3,
  ExternalLink,
  Play,
  RefreshCw,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/primitives";
import { DEMO_EXECUTIONS } from "@/data/demo";
import { formatDateTime, formatDuration, formatRelative } from "@/lib/utils";
import { useEditorStore } from "@/stores/editor.store";

type Filter = "all" | "success" | "error";

export function WorkflowExecutionsTab() {
  const navigate = useNavigate();
  const workflow = useEditorStore((state) => state.workflow);
  const execute = useEditorStore((state) => state.execute);
  const [filter, setFilter] = useState<Filter>("all");

  const executions = useMemo(
    () => DEMO_EXECUTIONS.filter((item) => item.workflowId === workflow.id),
    [workflow.id],
  );

  const visible = executions.filter((execution) =>
    filter === "all" ? true : execution.status === filter,
  );

  const successRate =
    executions.length === 0
      ? 100
      : (executions.filter((item) => item.status === "success").length /
          executions.length) *
        100;
  const avgDuration =
    executions.length === 0
      ? 0
      : executions.reduce((sum, item) => sum + item.durationMs, 0) /
        executions.length;
  const tokens = executions.reduce((sum, item) => sum + (item.tokens ?? 0), 0);

  return (
    <div className="fp-scroll min-h-0 flex-1 overflow-y-auto bg-app">
      <div className="mx-auto max-w-[1180px] px-8 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">
              Executions
            </h1>
            <p className="mt-1 text-[12.5px] text-ink-3">
              Every run of “{workflow.name}”, with per-node input and output.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => toast.success("Execution list refreshed")}
            >
              <RefreshCw className="size-3.5" />
              Refresh
            </Button>
            <Button variant="primary" size="sm" onClick={() => void execute()}>
              <Play className="size-3.5" />
              Execute workflow
            </Button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "Total runs", value: String(executions.length) },
            { label: "Success rate", value: `${successRate.toFixed(1)}%` },
            { label: "Avg duration", value: formatDuration(avgDuration) },
            { label: "Tokens used", value: tokens.toLocaleString() },
          ].map((stat) => (
            <div
              key={stat.label}
              className="surface-card px-4 py-3.5"
            >
              <div className="text-[10px] font-medium uppercase tracking-[0.08em] text-ink-3">
                {stat.label}
              </div>
              <div className="mt-1.5 font-mono text-[19px] tracking-tight text-ink">
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-1.5">
          {(["all", "success", "error"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={
                filter === item
                  ? "rounded-full border border-accent/30 bg-accent-soft px-3 py-1 text-[11.5px] font-medium capitalize text-accent"
                  : "rounded-full border border-hairline bg-surface px-3 py-1 text-[11.5px] font-medium capitalize text-ink-3 transition hover:text-ink-2"
              }
            >
              {item}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <div className="surface-card mt-3">
            <EmptyState
              icon={<Zap className="size-5" />}
              title="No executions yet"
              description="Run this workflow manually, or publish it and let its triggers fire."
              action={
                <Button variant="primary" size="sm" onClick={() => void execute()}>
                  <Play className="size-3.5" />
                  Execute now
                </Button>
              }
            />
          </div>
        ) : (
          <div className="surface-card mt-3 overflow-hidden">
            <div className="grid h-9 grid-cols-[1.4fr_0.8fr_0.9fr_0.8fr_0.9fr_40px] items-center gap-3 border-b border-hairline px-4 text-[10px] font-semibold uppercase tracking-[0.07em] text-ink-3">
              <span>Execution</span>
              <span>Status</span>
              <span>Started</span>
              <span>Duration</span>
              <span>Tokens</span>
              <span />
            </div>
            {visible.map((execution) => (
              <button
                key={execution.id}
                type="button"
                onClick={() => navigate(`/executions/${execution.id}`)}
                className="grid h-[52px] w-full grid-cols-[1.4fr_0.8fr_0.9fr_0.8fr_0.9fr_40px] items-center gap-3 border-b border-hairline px-4 text-left transition last:border-b-0 hover:bg-surface-2/60"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg border border-hairline bg-surface-2 text-ink-3">
                    <Zap className="size-3.5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-mono text-[11.5px] text-ink">
                      {execution.id}
                    </span>
                    <span className="block text-[10px] capitalize text-ink-3">
                      {execution.mode} · {execution.nodeRuns} nodes
                    </span>
                  </span>
                </span>
                <span>
                  <Badge
                    variant={execution.status === "success" ? "success" : "danger"}
                  >
                    {execution.status}
                  </Badge>
                </span>
                <span className="text-[11.5px] text-ink-2">
                  {formatDateTime(execution.startedAt)}
                  <span className="ml-1.5 text-[10px] text-ink-3">
                    {formatRelative(execution.startedAt)}
                  </span>
                </span>
                <span className="flex items-center gap-1 font-mono text-[11px] text-ink-2">
                  <Clock3 className="size-3 text-ink-3" />
                  {formatDuration(execution.durationMs)}
                </span>
                <span className="font-mono text-[11px] text-ink-2">
                  {(execution.tokens ?? 0).toLocaleString()}
                </span>
                <span className="grid size-6 place-items-center rounded-md text-ink-3">
                  <ArrowUpRight className="size-3.5" />
                </span>
              </button>
            ))}
          </div>
        )}

        <p className="mt-4 flex items-center gap-1.5 text-[11px] text-ink-3">
          <ExternalLink className="size-3" />
          Execution data is generated in demo mode and stored locally.
        </p>
      </div>
    </div>
  );
}
