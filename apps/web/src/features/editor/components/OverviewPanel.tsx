import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowUpRight,
  Clock3,
  Cpu,
  Gauge,
  Settings2,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NodeIcon } from "@/lib/node-icons";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/stores/editor.store";
import { DEMO_EXECUTIONS } from "@/data/demo";

export function OverviewPanel() {
  const open = useEditorStore((state) => state.overviewOpen);
  const setOpen = useEditorStore((state) => state.setOverviewOpen);
  const workflow = useEditorStore((state) => state.workflow);
  const nodes = useEditorStore((state) => state.nodes);
  const reduced = useReducedMotion();
  const navigate = useNavigate();

  const triggers = useMemo(
    () => nodes.filter((node) => node.data.group === "trigger"),
    [nodes],
  );
  const models = useMemo(
    () =>
      nodes.filter((node) =>
        node.data.outputs.some((port) => port.type === "ai_languageModel"),
      ),
    [nodes],
  );
  const tools = useMemo(
    () =>
      nodes.filter((node) =>
        node.data.outputs.some((port) => port.type === "ai_tool"),
      ),
    [nodes],
  );

  const executions = DEMO_EXECUTIONS.filter(
    (execution) => execution.workflowId === workflow.id,
  );
  const successRate =
    executions.length === 0
      ? 100
      : (executions.filter((execution) => execution.status === "success").length /
          executions.length) *
        100;

  return (
    <AnimatePresence>
      {open ? (
        <motion.aside
          className="absolute bottom-0 right-0 top-0 z-30 flex w-[320px] flex-col border-l border-line bg-surface shadow-[-20px_0_50px_rgba(0,0,0,.35)]"
          initial={{ x: reduced ? 0 : 320 }}
          animate={{ x: 0 }}
          exit={{ x: reduced ? 0 : 320 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          aria-label="Workflow overview"
        >
          <div className="flex h-[52px] shrink-0 items-center justify-between border-b border-hairline px-4">
            <div>
              <h2 className="text-[13px] font-semibold text-ink">Workflow</h2>
              <p className="text-[10.5px] text-ink-3">Overview & settings</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="grid size-7 place-items-center rounded-lg text-ink-3 transition hover:bg-surface-2 hover:text-ink"
              aria-label="Close workflow panel"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="fp-scroll min-h-0 flex-1 overflow-y-auto px-4 py-4">
            <div className="rounded-[12px] border border-hairline bg-surface-2/40 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[12.5px] font-semibold text-ink">
                    {workflow.name}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-ink-3">
                    {workflow.description ??
                      "No description yet. Add one so your team knows what this workflow does."}
                  </p>
                </div>
                <Badge variant={workflow.active ? "success" : "default"}>
                  {workflow.active ? "Active" : "Draft"}
                </Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {(workflow.tags.length ? workflow.tags : ["Untagged"]).map(
                  (tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-hairline bg-surface px-2 py-0.5 text-[10px] text-ink-3"
                    >
                      {tag}
                    </span>
                  ),
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { label: "Nodes", value: String(nodes.length) },
                { label: "Runs", value: String(executions.length) },
                { label: "Success", value: `${successRate.toFixed(0)}%` },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[10px] border border-hairline bg-surface-2/40 px-2.5 py-2"
                >
                  <div className="text-[9.5px] uppercase tracking-wider text-ink-3">
                    {stat.label}
                  </div>
                  <div className="mt-0.5 font-mono text-[14px] text-ink">
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>

            <Section icon={<Zap className="size-3.5" />} title="Triggers">
              {triggers.length === 0 ? (
                <EmptyRow text="No trigger yet — this workflow can only run manually." />
              ) : (
                triggers.map((trigger) => (
                  <NodeRow
                    key={trigger.id}
                    icon={trigger.data.icon}
                    label={trigger.data.label}
                    hint={trigger.data.subtitle}
                    onClick={() => useEditorStore.getState().openNdv(trigger.id)}
                  />
                ))
              )}
            </Section>

            <Section icon={<Cpu className="size-3.5" />} title="AI models">
              {models.length === 0 ? (
                <EmptyRow text="No chat model attached." />
              ) : (
                models.map((model) => (
                  <NodeRow
                    key={model.id}
                    icon={model.data.icon}
                    label={model.data.label}
                    hint={String(
                      model.data.parameters.model ?? model.data.subtitle ?? "",
                    )}
                    onClick={() => useEditorStore.getState().openNdv(model.id)}
                  />
                ))
              )}
            </Section>

            <Section icon={<Sparkles className="size-3.5" />} title="Agent tools">
              {tools.length === 0 ? (
                <EmptyRow text="No tools attached to the agent." />
              ) : (
                tools.map((tool) => (
                  <NodeRow
                    key={tool.id}
                    icon={tool.data.icon}
                    label={tool.data.label}
                    hint={tool.data.subtitle}
                    onClick={() => useEditorStore.getState().openNdv(tool.id)}
                  />
                ))
              )}
            </Section>

            <Section icon={<Gauge className="size-3.5" />} title="Recent runs">
              {executions.length === 0 ? (
                <EmptyRow text="This workflow hasn't run yet." />
              ) : (
                executions.slice(0, 3).map((execution) => (
                  <button
                    key={execution.id}
                    type="button"
                    onClick={() => navigate(`/executions/${execution.id}`)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-surface-2"
                  >
                    <span
                      className={cn(
                        "status-dot",
                        execution.status === "success"
                          ? "bg-success"
                          : "bg-danger",
                      )}
                    />
                    <span className="flex-1 truncate font-mono text-[10.5px] text-ink-2">
                      {execution.id}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-ink-3">
                      <Clock3 className="size-2.5" />
                      {Math.round(execution.durationMs / 100) / 10}s
                    </span>
                  </button>
                ))
              )}
            </Section>

            <Section icon={<Settings2 className="size-3.5" />} title="Settings">
              <div className="space-y-1.5 px-2 text-[11px]">
                <SettingRow label="Timezone" value={workflow.settings.timezone} />
                <SettingRow
                  label="Timeout"
                  value={`${workflow.settings.timeoutSeconds}s`}
                />
                <SettingRow
                  label="Save data"
                  value={workflow.settings.saveExecutionData}
                />
                <SettingRow label="Version" value={`v${workflow.version}`} />
              </div>
            </Section>
          </div>

          <div className="shrink-0 border-t border-hairline p-3">
            <Button
              variant="secondary"
              size="sm"
              className="w-full justify-between"
              onClick={() => navigate("/settings")}
            >
              Open workflow settings
              <ArrowUpRight className="size-3.5" />
            </Button>
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-5">
      <div className="mb-1.5 flex items-center gap-1.5 px-1 text-[10px] font-semibold uppercase tracking-[0.09em] text-ink-3">
        {icon}
        {title}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function NodeRow({
  icon,
  label,
  hint,
  onClick,
}: {
  icon: string;
  label: string;
  hint?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-surface-2"
    >
      <span className="grid size-6 shrink-0 place-items-center overflow-hidden rounded-md border border-hairline bg-surface-2">
        <NodeIcon name={icon} className="size-3.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[11.5px] font-medium text-ink-2">
          {label}
        </span>
        {hint ? (
          <span className="block truncate text-[9.5px] text-ink-3">{hint}</span>
        ) : null}
      </span>
    </button>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <p className="rounded-lg border border-dashed border-line px-2.5 py-2 text-[10.5px] leading-relaxed text-ink-3">
      {text}
    </p>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-3">{label}</span>
      <span className="font-mono text-[10.5px] text-ink-2">{value}</span>
    </div>
  );
}
