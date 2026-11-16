import {
  Copy,
  Grid2x2,
  List,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  Workflow as WorkflowIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/overlays";
import { EmptyState } from "@/components/ui/primitives";
import { PageTopBar } from "@/components/shell/PageTopBar";
import { cn, formatRelative } from "@/lib/utils";
import {
  createStoredWorkflow,
  deleteStoredWorkflow,
  duplicateStoredWorkflow,
  getStoredWorkflow,
  listWorkflowMetas,
} from "@/lib/storage";
import type { StoredWorkflow } from "@/types/workflow";
import { WorkflowThumbnail } from "./WorkflowThumbnail";

type StatusFilter = "all" | "active" | "inactive";

function loadWorkflows(): StoredWorkflow[] {
  return listWorkflowMetas()
    .map((meta) => getStoredWorkflow(meta.id))
    .filter((item): item is StoredWorkflow => Boolean(item));
}

export function WorkflowsPage() {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<StoredWorkflow[]>(loadWorkflows);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [tag, setTag] = useState<string>("all");

  const tags = useMemo(() => {
    const set = new Set<string>();
    workflows.forEach((workflow) =>
      workflow.tags.forEach((item) => set.add(item)),
    );
    return Array.from(set).sort();
  }, [workflows]);

  const filtered = workflows.filter((workflow) => {
    const matchesQuery =
      !query.trim() ||
      `${workflow.name} ${workflow.description ?? ""} ${workflow.tags.join(" ")}`
        .toLowerCase()
        .includes(query.trim().toLowerCase());
    const matchesStatus =
      status === "all" ||
      (status === "active" ? workflow.active : !workflow.active);
    const matchesTag = tag === "all" || workflow.tags.includes(tag);
    return matchesQuery && matchesStatus && matchesTag;
  });

  const refresh = () => setWorkflows(loadWorkflows());

  const createWorkflow = () => {
    const workflow = createStoredWorkflow({ name: "Untitled workflow" });
    navigate(`/workflows/${workflow.id}`);
  };

  const duplicate = (workflow: StoredWorkflow) => {
    const copy = duplicateStoredWorkflow(workflow);
    refresh();
    toast.success("Workflow duplicated", { description: copy.name });
  };

  const remove = (workflow: StoredWorkflow) => {
    deleteStoredWorkflow(workflow.id);
    refresh();
    toast(`“${workflow.name}” deleted`);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-app">
      <PageTopBar
        title="Workflows"
        subtitle={`${workflows.length} workflows in your personal workspace`}
        breadcrumb="Personal workspace"
        actions={
          <Button variant="primary" size="sm" onClick={createWorkflow}>
            <Plus className="size-3.5" />
            New workflow
          </Button>
        }
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-hairline px-6 py-3">
          <div className="relative w-[250px]">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-3" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search workflows…"
              className="h-8 pl-8 text-[12px]"
              aria-label="Search workflows"
            />
          </div>

          <div className="flex items-center gap-1 rounded-full border border-hairline bg-surface-2/60 p-0.5">
            {(["all", "active", "inactive"] as const).map((item) => (
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

          {tags.length > 0 ? (
            <div className="flex items-center gap-1">
              {["all", ...tags].slice(0, 5).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setTag(item)}
                  className={cn(
                    "rounded-full border px-2 py-1 text-[10.5px] font-medium transition",
                    tag === item
                      ? "border-accent/30 bg-accent-soft text-accent"
                      : "border-hairline bg-surface text-ink-3 hover:text-ink-2",
                  )}
                >
                  {item === "all" ? "All tags" : item}
                </button>
              ))}
            </div>
          ) : null}

          <div className="ml-auto flex items-center gap-1 rounded-[8px] border border-hairline bg-surface-2/60 p-0.5">
            <button
              type="button"
              onClick={() => setView("grid")}
              className={cn(
                "grid size-6 place-items-center rounded-md transition",
                view === "grid"
                  ? "bg-surface text-ink shadow-sm"
                  : "text-ink-3 hover:text-ink-2",
              )}
              aria-label="Grid view"
            >
              <Grid2x2 className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className={cn(
                "grid size-6 place-items-center rounded-md transition",
                view === "list"
                  ? "bg-surface text-ink shadow-sm"
                  : "text-ink-3 hover:text-ink-2",
              )}
              aria-label="List view"
            >
              <List className="size-3.5" />
            </button>
          </div>
        </div>

        <div className="fp-scroll min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {filtered.length === 0 ? (
            <div className="surface-card">
              <EmptyState
                icon={<WorkflowIcon className="size-5" />}
                title="No workflows match"
                description="Try a different search, or start a new workflow from scratch."
                action={
                  <Button variant="primary" size="sm" onClick={createWorkflow}>
                    <Plus className="size-3.5" />
                    New workflow
                  </Button>
                }
              />
            </div>
          ) : view === "grid" ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {filtered.map((workflow) => (
                <article
                  key={workflow.id}
                  className="surface-card surface-card-hover group relative overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => navigate(`/workflows/${workflow.id}`)}
                    className="block w-full text-left"
                  >
                    <div className="relative h-[136px] overflow-hidden border-b border-hairline bg-canvas">
                      <WorkflowThumbnail
                        nodes={workflow.nodes}
                        edges={workflow.edges}
                        className="h-full w-full"
                      />
                      <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5">
                        <Badge variant={workflow.active ? "success" : "default"}>
                          {workflow.active ? "Active" : "Draft"}
                        </Badge>
                      </div>
                      <div className="absolute bottom-2 right-2.5 rounded-full border border-hairline bg-surface/80 px-2 py-0.5 font-mono text-[9.5px] text-ink-3 backdrop-blur">
                        {workflow.nodes.length} nodes
                      </div>
                    </div>
                    <div className="px-4 py-3">
                      <h3 className="truncate text-[13px] font-semibold text-ink">
                        {workflow.name}
                      </h3>
                      <p className="mt-0.5 line-clamp-1 text-[11px] text-ink-3">
                        {workflow.description || "No description yet"}
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="flex min-w-0 gap-1">
                          {workflow.tags.slice(0, 2).map((item) => (
                            <span
                              key={item}
                              className="rounded-full border border-hairline bg-surface-2 px-1.5 py-0.5 text-[9.5px] text-ink-3"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                        <span className="shrink-0 text-[10px] text-ink-3">
                          {formatRelative(workflow.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </button>
                  <div className="absolute right-2 top-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="grid size-7 place-items-center rounded-lg border border-hairline bg-surface/85 text-ink-3 opacity-0 backdrop-blur transition hover:text-ink group-hover:opacity-100"
                          aria-label="Workflow actions"
                        >
                          <MoreHorizontal className="size-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={() => navigate(`/workflows/${workflow.id}`)}
                        >
                          <WorkflowIcon className="size-3.5" />
                          Open in editor
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => duplicate(workflow)}>
                          <Copy className="size-3.5" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          danger
                          onSelect={() => remove(workflow)}
                        >
                          <Trash2 className="size-3.5" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="surface-card overflow-hidden">
              <div className="grid grid-cols-[2fr_1fr_0.9fr_1fr_40px] gap-3 border-b border-hairline px-4 py-2 text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-3">
                <span>Workflow</span>
                <span>Status</span>
                <span>Nodes</span>
                <span>Updated</span>
                <span />
              </div>
              {filtered.map((workflow) => (
                <div
                  key={workflow.id}
                  className="grid grid-cols-[2fr_1fr_0.9fr_1fr_40px] items-center gap-3 border-b border-hairline px-4 py-2.5 transition last:border-b-0 hover:bg-surface-2/50"
                >
                  <button
                    type="button"
                    onClick={() => navigate(`/workflows/${workflow.id}`)}
                    className="flex min-w-0 items-center gap-2.5 text-left"
                  >
                    <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-lg border border-hairline bg-surface-2">
                      <WorkflowThumbnail
                        nodes={workflow.nodes}
                        edges={workflow.edges}
                        className="h-6 w-6"
                      />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[12px] font-medium text-ink">
                        {workflow.name}
                      </span>
                      <span className="block truncate text-[10px] text-ink-3">
                        {workflow.tags.join(" · ") || "Untagged"}
                      </span>
                    </span>
                  </button>
                  <span>
                    <Badge variant={workflow.active ? "success" : "default"}>
                      {workflow.active ? "Active" : "Draft"}
                    </Badge>
                  </span>
                  <span className="font-mono text-[11px] text-ink-2">
                    {workflow.nodes.length}
                  </span>
                  <span className="text-[11px] text-ink-3">
                    {formatRelative(workflow.updatedAt)}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="grid size-7 place-items-center rounded-md text-ink-3 transition hover:bg-surface-2 hover:text-ink"
                        aria-label="Workflow actions"
                      >
                        <MoreHorizontal className="size-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onSelect={() => navigate(`/workflows/${workflow.id}`)}
                      >
                        <WorkflowIcon className="size-3.5" />
                        Open in editor
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => duplicate(workflow)}>
                        <Copy className="size-3.5" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem danger onSelect={() => remove(workflow)}>
                        <Trash2 className="size-3.5" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
