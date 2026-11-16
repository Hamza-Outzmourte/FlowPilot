import {
  Braces,
  Check,
  ChevronDown,
  CirclePlay,
  Info,
  Loader2,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  Tooltip,
} from "@/components/ui/overlays";
import { CodeBlock, Switch } from "@/components/ui/primitives";
import { getNodeDefinition } from "@/data/node-catalog";
import { NodeIcon } from "@/lib/node-icons";
import { cn, deepClone, sleep } from "@/lib/utils";
import { useEditorStore } from "@/stores/editor.store";
import type {
  FlowNode,
  JsonValue,
  ParameterSpec,
} from "@/types/workflow";

function isVisible(property: ParameterSpec, values: Record<string, unknown>): boolean {
  const show = property.displayOptions?.show;
  if (!show) return true;
  return Object.entries(show).every(([key, allowed]) =>
    allowed.some((value) => value === values[key]),
  );
}

function isExpression(value: unknown): boolean {
  return typeof value === "string" && value.startsWith("={{") && value.endsWith("}}");
}

function toggleExpression(value: unknown): string {
  const text = typeof value === "string" ? value : "";
  if (isExpression(text)) return text.slice(3, -2);
  return `={{ ${text} }}`;
}

function buildSchema(properties: ParameterSpec[]) {
  const shape: z.ZodRawShape = {};
  for (const property of properties) {
    if (property.type === "boolean") {
      shape[property.name] = z.boolean();
      continue;
    }
    if (property.type === "number") {
      shape[property.name] = z
        .number({ invalid_type_error: "Enter a number" })
        .finite();
      continue;
    }
    if (property.type === "multiOptions") {
      let schema = z.array(z.string());
      if (property.required) {
        schema = schema.min(1, "Select at least one option") as typeof schema;
      }
      shape[property.name] = schema;
      continue;
    }
    const base = z.string();
    let schema: z.ZodType<string> = property.required
      ? base.min(1, "This field is required")
      : base;
    if (property.type === "json") {
      schema = schema.refine((value) => {
        if (!value.trim()) return true;
        try {
          JSON.parse(value);
          return true;
        } catch {
          return false;
        }
      }, "Invalid JSON");
    }
    shape[property.name] = schema;
  }
  return z.object(shape);
}

function sampleInput(node: FlowNode | undefined): JsonValue {
  if (!node) return {};
  if (node.data.nodeType.includes("telegram")) {
    return {
      update_id: 884213,
      message: {
        message_id: 4821,
        text: "Hey! My subscription renewed today. Can I get the invoice for March?",
        chat: { id: 842119004, type: "private" },
        from: { id: 842119004, first_name: "Maya", username: "mayak" },
      },
    };
  }
  if (node.data.nodeType.includes("gmail")) {
    return {
      id: "18f2c9a1",
      threadId: "18f2c9a1",
      from: "maya@acme.co",
      subject: "Invoice question",
      snippet: "Could you send me the March invoice?",
    };
  }
  return {
    json: {
      id: "item_01H",
      name: "Maya K.",
      email: "maya@acme.co",
      status: "active",
    },
    meta: { source: "previous node" },
  };
}

function TableView({ value }: { value: JsonValue }) {
  if (Array.isArray(value)) {
    return (
      <div className="space-y-1.5">
        {value.slice(0, 8).map((item, index) => (
          <div
            key={index}
            className="rounded-lg border border-hairline bg-surface-2/50 px-2.5 py-2 font-mono text-[11px] text-ink-2"
          >
            {typeof item === "object" ? JSON.stringify(item) : String(item)}
          </div>
        ))}
      </div>
    );
  }
  if (value && typeof value === "object") {
    return (
      <div className="overflow-hidden rounded-lg border border-hairline">
        {Object.entries(value).map(([key, item], index) => (
          <div
            key={key}
            className={cn(
              "grid grid-cols-[120px_1fr] gap-2 px-2.5 py-1.5 text-[11px]",
              index % 2 === 0 ? "bg-surface-2/40" : "bg-surface-2/10",
            )}
          >
            <span className="truncate font-mono text-ink-3">{key}</span>
            <span className="truncate font-mono text-ink-2">
              {typeof item === "object" && item !== null
                ? JSON.stringify(item)
                : String(item)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-hairline bg-surface-2/40 px-2.5 py-2 font-mono text-[11px] text-ink-2">
      {String(value)}
    </div>
  );
}

function IOTabs({
  value,
  empty,
}: {
  value: JsonValue | undefined;
  empty: string;
}) {
  const [tab, setTab] = useState<"json" | "table">("json");
  if (!value) {
    return (
      <div className="flex h-full min-h-[160px] flex-col items-center justify-center rounded-[10px] border border-dashed border-line bg-surface-2/20 px-4 text-center">
        <Braces className="mb-2 size-5 text-ink-3" />
        <p className="text-[11.5px] leading-relaxed text-ink-3">{empty}</p>
      </div>
    );
  }
  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex items-center gap-1">
        {(["json", "table"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={cn(
              "rounded-md px-2 py-1 text-[10.5px] font-medium capitalize transition",
              tab === item
                ? "bg-surface-2 text-ink"
                : "text-ink-3 hover:text-ink-2",
            )}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1">
        {tab === "json" ? (
          <CodeBlock
            value={JSON.stringify(value, null, 2)}
            className="h-full"
            maxHeight="100%"
          />
        ) : (
          <div className="h-full overflow-auto">
            <TableView value={value} />
          </div>
        )}
      </div>
    </div>
  );
}

function ParameterField({
  property,
  value,
  error,
  onChange,
}: {
  property: ParameterSpec;
  value: unknown;
  error?: string;
  onChange: (value: unknown) => void;
}) {
  const expression = isExpression(value);

  if (property.type === "boolean") {
    return (
      <div className="flex items-start justify-between gap-4 rounded-[10px] border border-hairline bg-surface-2/30 px-3 py-2.5">
        <div>
          <Label className="text-[12.5px] text-ink">{property.displayName}</Label>
          {property.description ? (
            <p className="mt-0.5 text-[11px] leading-snug text-ink-3">
              {property.description}
            </p>
          ) : null}
        </div>
        <Switch
          checked={Boolean(value)}
          onCheckedChange={(checked) => onChange(checked)}
        />
      </div>
    );
  }

  if (property.type === "options") {
    return (
      <div className="space-y-1.5">
        <Label>{property.displayName}{property.required ? <span className="text-danger"> *</span> : null}</Label>
        <Select
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="" disabled>
            Select…
          </option>
          {property.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        {property.description ? (
          <p className="text-[11px] text-ink-3">{property.description}</p>
        ) : null}
        {error ? <p className="text-[11px] text-danger">{error}</p> : null}
      </div>
    );
  }

  if (property.type === "multiOptions") {
    const selected = Array.isArray(value) ? (value as string[]) : [];
    return (
      <div className="space-y-1.5">
        <Label>{property.displayName}</Label>
        <div className="flex flex-wrap gap-1.5">
          {property.options?.map((option) => {
            const active = selected.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  onChange(
                    active
                      ? selected.filter((item) => item !== option.value)
                      : [...selected, option.value],
                  )
                }
                className={cn(
                  "flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[11.5px] transition",
                  active
                    ? "border-accent/40 bg-accent-soft text-accent"
                    : "border-line bg-surface-2 text-ink-3 hover:text-ink-2",
                )}
              >
                {active ? <Check className="size-3" /> : <Plus className="size-3" />}
                {option.label}
              </button>
            );
          })}
        </div>
        {error ? <p className="text-[11px] text-danger">{error}</p> : null}
      </div>
    );
  }

  if (property.type === "json" || property.type === "code") {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label>
            {property.displayName}
            {property.required ? <span className="text-danger"> *</span> : null}
          </Label>
          {property.type === "code" ? (
            <span className="rounded border border-hairline bg-surface-2 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-ink-3">
              {property.language ?? "code"}
            </span>
          ) : null}
        </div>
        <Textarea
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
          rows={property.rows ?? 6}
          spellCheck={false}
          className="font-mono text-[11.5px] leading-relaxed"
          placeholder={property.placeholder}
        />
        {error ? (
          <p className="text-[11px] text-danger">{error}</p>
        ) : property.description ? (
          <p className="text-[11px] text-ink-3">{property.description}</p>
        ) : null}
      </div>
    );
  }

  if (property.type === "resourceLocator") {
    return (
      <div className="space-y-1.5">
        <Label>{property.displayName}</Label>
        <div className="relative">
          <Input
            value={String(value ?? "")}
            onChange={(event) => onChange(event.target.value)}
            placeholder={property.placeholder ?? "Select…"}
            className="pr-8"
          />
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-3" />
        </div>
      </div>
    );
  }

  const multiline = (property.rows ?? 1) > 2;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label>
          {property.displayName}
          {property.required ? <span className="text-danger"> *</span> : null}
        </Label>
        <Tooltip content={expression ? "Remove expression" : "Use expression"}>
          <button
            type="button"
            onClick={() => onChange(toggleExpression(value))}
            className={cn(
              "grid size-5 place-items-center rounded text-[10px] font-semibold transition",
              expression
                ? "bg-accent-soft text-accent"
                : "text-ink-3 hover:bg-surface-2 hover:text-ink-2",
            )}
            aria-label="Toggle expression"
          >
            ƒx
          </button>
        </Tooltip>
      </div>
      {multiline ? (
        <Textarea
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
          rows={property.rows}
          placeholder={property.placeholder}
          className={cn(
            expression && "font-mono text-[11.5px] text-accent",
          )}
        />
      ) : (
        <Input
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
          placeholder={property.placeholder}
          className={cn(expression && "font-mono text-[11.5px] text-accent")}
        />
      )}
      {error ? (
        <p className="text-[11px] text-danger">{error}</p>
      ) : property.description ? (
        <p className="text-[11px] text-ink-3">{property.description}</p>
      ) : null}
    </div>
  );
}

export function NodeDetail() {
  const nodeId = useEditorStore((state) => state.ndvNodeId);
  const node = useEditorStore((state) =>
    state.ndvNodeId
      ? state.nodes.find((item) => item.id === state.ndvNodeId)
      : undefined,
  );
  const nodes = useEditorStore((state) => state.nodes);
  const edges = useEditorStore((state) => state.edges);
  const closeNdv = useEditorStore((state) => state.closeNdv);
  const updateNodeParameters = useEditorStore((state) => state.updateNodeParameters);
  const updateNodeData = useEditorStore((state) => state.updateNodeData);
  const deleteNode = useEditorStore((state) => state.deleteNode);
  const setNodeStatus = useEditorStore((state) => state.setNodeStatus);
  const nodeRun = useEditorStore((state) =>
    nodeId ? state.execution.nodeRuns[nodeId] : undefined,
  );

  const [values, setValues] = useState<Record<string, unknown>>({});
  const [label, setLabel] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [localOutput, setLocalOutput] = useState<JsonValue | undefined>();
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  const definition = node ? getNodeDefinition(node.data.nodeType) : undefined;

  useEffect(() => {
    if (!node) return;
    setValues(deepClone(node.data.parameters));
    setLabel(node.data.label);
    setErrors({});
    setLocalOutput(undefined);
  }, [node?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const incoming = useMemo(() => {
    if (!node) return undefined;
    const edge = edges.find(
      (item) =>
        item.target === node.id &&
        (item.data?.connectionType ?? "main") === "main",
    );
    if (!edge) return undefined;
    return nodes.find((item) => item.id === edge.source);
  }, [edges, node, nodes]);

  const inputValue: JsonValue | undefined = useMemo(() => {
    if (!node) return undefined;
    if (incoming) {
      const run = useEditorStore.getState().execution.nodeRuns[incoming.id];
      if (run?.output) return run.output;
    }
    if (nodeRun?.input) return nodeRun.input;
    return sampleInput(incoming ?? node);
  }, [incoming, node, nodeRun]);

  const outputValue = localOutput ?? nodeRun?.output;

  const visibleProperties = useMemo(
    () =>
      (definition?.properties ?? []).filter((property) =>
        isVisible(property, values),
      ),
    [definition, values],
  );

  const dirty =
    node &&
    (JSON.stringify(values) !== JSON.stringify(node.data.parameters) ||
      label !== node.data.label);

  const setValue = (name: string, value: unknown) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  };

  const save = () => {
    if (!node) return;
    const schema = buildSchema(visibleProperties);
    const result = schema.safeParse(values);
    if (!result.success) {
      const next: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string") next[key] = issue.message;
      }
      setErrors(next);
      toast.error("Check the highlighted fields");
      return;
    }
    setSaving(true);
    updateNodeParameters(node.id, values);
    if (label.trim() && label !== node.data.label) {
      updateNodeData(node.id, { label: label.trim() });
    }
    window.setTimeout(() => {
      setSaving(false);
      toast.success("Node saved");
    }, 320);
  };

  const runStep = async () => {
    if (!node) return;
    setTesting(true);
    setNodeStatus(node.id, "running");
    await sleep(760);
    const isAi = node.data.group === "ai";
    const preview: JsonValue = isAi
      ? {
          output:
            "Of course, Maya. Your March invoice is attached to your billing portal and I've emailed a copy to maya@acme.co.",
          confidence: 0.92,
          tokens: 1284,
        }
      : node.data.group === "trigger"
        ? sampleInput(node)
        : { ok: true, node: node.data.label, executedAt: new Date().toISOString() };
    setLocalOutput(preview);
    setNodeStatus(node.id, "success");
    setTesting(false);
    toast.success(`${node.data.label} executed`);
  };

  if (!node || !definition) return null;

  return (
    <Dialog
      open={Boolean(node)}
      onOpenChange={(open) => {
        if (!open) closeNdv();
      }}
    >
      <DialogContent
        hideClose
        className="flex h-[min(760px,88vh)] max-w-[1180px] flex-col gap-0 overflow-hidden p-0"
        aria-describedby={undefined}
      >
        <header className="flex h-[68px] shrink-0 items-center gap-3 border-b border-hairline bg-surface-2/40 px-5">
          <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-[11px] border border-line bg-surface shadow-sm">
            <NodeIcon name={node.data.icon} className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <input
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              className="w-full max-w-[420px] rounded-md bg-transparent px-1 py-0.5 text-[16px] font-semibold tracking-[-0.01em] text-ink outline-none transition hover:bg-surface-2 focus:bg-surface-2"
              aria-label="Node name"
            />
            <div className="flex items-center gap-2 px-1 text-[11px] text-ink-3">
              <span className="font-mono">{definition.type.replace("flowpilot.", "")}</span>
              <span>·</span>
              <span className="capitalize">{node.data.group}</span>
              {node.data.disabled ? (
                <span className="rounded bg-[var(--warning-soft)] px-1.5 py-0.5 text-[9.5px] font-medium text-warning">
                  Disabled
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" onClick={() => { deleteNode(node.id); closeNdv(); }} className="text-ink-3 hover:text-danger">
              <Trash2 className="size-3.5" />
              Delete
            </Button>
            <div className="mx-1 h-5 w-px bg-hairline" />
            <button
              type="button"
              onClick={closeNdv}
              className="grid size-8 place-items-center rounded-lg text-ink-3 transition hover:bg-surface-2 hover:text-ink"
              aria-label="Close node details"
            >
              <X className="size-4" />
            </button>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-[1fr_1.35fr_1fr]">
          <section className="flex min-h-0 flex-col border-r border-hairline">
            <div className="flex h-10 shrink-0 items-center justify-between border-b border-hairline px-4">
              <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-3">
                Input
              </span>
              <span className="truncate text-[10.5px] text-ink-3">
                {incoming ? incoming.data.label : "Trigger data"}
              </span>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden p-3">
              <IOTabs value={inputValue} empty="No input yet. Connect this node and run the workflow." />
            </div>
          </section>

          <section className="flex min-h-0 flex-col border-r border-hairline">
            <div className="flex h-10 shrink-0 items-center justify-between border-b border-hairline px-4">
              <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-3">
                Parameters
              </span>
              <span className="flex items-center gap-1 text-[10px] text-ink-3">
                <Info className="size-3" />
                {visibleProperties.length} fields
              </span>
            </div>
            <div className="fp-scroll min-h-0 flex-1 overflow-y-auto px-4 py-4">
              {definition.credentials?.length ? (
                <div className="mb-4 rounded-[10px] border border-warning/20 bg-[var(--warning-soft)] px-3 py-2.5">
                  <p className="text-[11.5px] font-medium text-warning">
                    {definition.credentials
                      .filter((credential) => credential.required)
                      .map((credential) => credential.displayName)
                      .join(", ") || "Credentials"}{" "}
                    required
                  </p>
                  <p className="mt-0.5 text-[11px] text-ink-3">
                    Link a credential to run this node in production.
                  </p>
                </div>
              ) : null}
              <div className="space-y-4">
                {visibleProperties.map((property) => (
                  <ParameterField
                    key={property.name}
                    property={property}
                    value={values[property.name]}
                    error={errors[property.name]}
                    onChange={(value) => setValue(property.name, value)}
                  />
                ))}
                {visibleProperties.length === 0 ? (
                  <div className="rounded-[10px] border border-dashed border-line px-3 py-8 text-center text-[11.5px] text-ink-3">
                    This node has no parameters.
                  </div>
                ) : null}
                <div className="rounded-[10px] border border-hairline bg-surface-2/30 px-3 py-2.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-ink-3">Node ID</span>
                    <span className="max-w-[200px] truncate font-mono text-ink-3">
                      {node.id}
                    </span>
                  </div>
                  {nodeRun ? (
                    <div className="mt-1.5 flex items-center justify-between text-[11px]">
                      <span className="text-ink-3">Last run</span>
                      <span className="font-mono text-success">
                        {nodeRun.durationMs} ms · {nodeRun.tokens ?? 0} tokens
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          <section className="flex min-h-0 flex-col">
            <div className="flex h-10 shrink-0 items-center justify-between border-b border-hairline px-4">
              <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-3">
                Output
              </span>
              {nodeRun ? (
                <span className="flex items-center gap-1 text-[10px] text-success">
                  <span className="status-dot bg-success" />
                  {nodeRun.durationMs} ms
                </span>
              ) : null}
            </div>
            <div className="min-h-0 flex-1 overflow-hidden p-3">
              <IOTabs
                value={outputValue}
                empty="Run this step to inspect its output."
              />
            </div>
            {nodeRun ? (
              <div className="mx-3 mb-3 grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-hairline bg-surface-2/40 px-2.5 py-2">
                  <div className="text-[9.5px] uppercase tracking-wider text-ink-3">
                    Tokens
                  </div>
                  <div className="mt-0.5 font-mono text-[12px] text-ink">
                    {nodeRun.tokens ?? 0}
                  </div>
                </div>
                <div className="rounded-lg border border-hairline bg-surface-2/40 px-2.5 py-2">
                  <div className="text-[9.5px] uppercase tracking-wider text-ink-3">
                    Est. cost
                  </div>
                  <div className="mt-0.5 font-mono text-[12px] text-ink">
                    ${(nodeRun.cost ?? 0).toFixed(4)}
                  </div>
                </div>
              </div>
            ) : null}
          </section>
        </div>

        <footer className="flex h-[58px] shrink-0 items-center justify-between border-t border-hairline bg-surface-2/30 px-4">
          <div className="flex items-center gap-2 text-[11px] text-ink-3">
            <span className="status-dot bg-success" />
            Autosaved with the workflow
            {dirty ? (
              <span className="ml-2 rounded-full bg-[var(--warning-soft)] px-2 py-0.5 text-[10px] font-medium text-warning">
                Unsaved changes
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void runStep()}
              disabled={testing}
            >
              {testing ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <CirclePlay className="size-3.5" />
              )}
              Execute step
            </Button>
            <Button variant="primary" size="sm" onClick={save} disabled={saving}>
              {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
              Save changes
            </Button>
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
