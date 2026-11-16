import {
  Check,
  ChevronDown,
  CloudUpload,
  Copy,
  Download,
  Moon,
  MoreHorizontal,
  PanelTop,
  Pencil,
  Rocket,
  Sun,
  Trash2,
  Upload,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/overlays";
import { cn } from "@/lib/utils";
import {
  deleteStoredWorkflow,
  duplicateStoredWorkflow,
  getStoredWorkflow,
} from "@/lib/storage";
import { downloadWorkflow, importWorkflowFile } from "@/lib/workflow-io";
import { useEditorStore } from "@/stores/editor.store";
import { useUiStore } from "@/stores/ui.store";

export function EditorTopBar() {
  const navigate = useNavigate();
  const workflow = useEditorStore((state) => state.workflow);
  const saveState = useEditorStore((state) => state.saveState);
  const setWorkflowMeta = useEditorStore((state) => state.setWorkflowMeta);
  const theme = useUiStore((state) => state.theme);
  const setTheme = useUiStore((state) => state.setTheme);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(workflow.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(workflow.name);
  }, [workflow.name]);

  useEffect(() => {
    if (renaming) inputRef.current?.select();
  }, [renaming]);

  const commitName = () => {
    const trimmed = name.trim();
    if (trimmed) setWorkflowMeta({ name: trimmed });
    else setName(workflow.name);
    setRenaming(false);
  };

  const publish = () => {
    setWorkflowMeta({ active: true });
    toast.success(`“${workflow.name}” is live`, {
      description: "Triggers are now listening for events.",
    });
  };

  const duplicateWorkflow = () => {
    const state = useEditorStore.getState();
    const snapshot = getStoredWorkflow(workflow.id);
    if (!snapshot) {
      toast.error("Could not load this workflow.");
      return;
    }
    const copy = duplicateStoredWorkflow({
      ...snapshot,
      name: workflow.name,
      nodes: state.nodes,
      edges: state.edges,
    });
    toast.success(`Duplicated “${workflow.name}”`);
    navigate(`/workflows/${copy.id}`);
  };

  const download = () => {
    const state = useEditorStore.getState();
    const snapshot = getStoredWorkflow(workflow.id);
    if (!snapshot) {
      toast.error("Could not load this workflow.");
      return;
    }
    downloadWorkflow({
      ...snapshot,
      name: workflow.name,
      nodes: state.nodes,
      edges: state.edges,
    });
    toast.success("Workflow JSON downloaded");
  };

  const importJson = async (file: File | undefined) => {
    if (!file) return;
    try {
      const imported = await importWorkflowFile(file);
      toast.success(`Imported “${imported.name}”`);
      navigate(`/workflows/${imported.id}`);
    } catch {
      toast.error("That file is not a valid FlowPilot workflow.");
    }
  };

  const removeWorkflow = () => {
    const confirmed = window.confirm(
      `Delete “${workflow.name}”? This cannot be undone.`,
    );
    if (!confirmed) return;
    deleteStoredWorkflow(workflow.id);
    toast.success("Workflow deleted");
    navigate("/workflows");
  };

  return (
    <header className="relative z-20 flex h-[78px] shrink-0 items-center gap-4 border-b border-hairline bg-app/95 px-4 backdrop-blur-xl">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="shrink-0 rounded-md px-1 text-[12.5px] font-medium text-ink-3 underline decoration-line-strong underline-offset-[5px] transition hover:text-ink"
        >
          Personal
        </button>
        <span className="text-ink-3/60">/</span>
        {renaming ? (
          <Input
            ref={inputRef}
            value={name}
            onChange={(event) => setName(event.target.value)}
            onBlur={commitName}
            onKeyDown={(event) => {
              if (event.key === "Enter") commitName();
              if (event.key === "Escape") {
                setName(workflow.name);
                setRenaming(false);
              }
            }}
            className="h-7 w-[240px] px-1.5 text-[13.5px] font-semibold"
            aria-label="Workflow name"
          />
        ) : (
          <button
            type="button"
            onClick={() => setRenaming(true)}
            className="group flex min-w-0 items-center gap-1.5 rounded-md px-1 py-0.5 text-[13.5px] font-semibold tracking-[-0.01em] text-ink transition hover:bg-surface-2"
            title="Rename workflow"
          >
            <span className="truncate">{workflow.name}</span>
            <Pencil className="size-3 shrink-0 text-ink-3 opacity-0 transition group-hover:opacity-100" />
          </button>
        )}

        <input
          ref={importRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => {
            void importJson(event.target.files?.[0]);
            event.target.value = "";
          }}
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="grid size-6 shrink-0 place-items-center rounded-md text-ink-3 transition hover:bg-surface-2 hover:text-ink"
              aria-label="Workflow options"
            >
              <MoreHorizontal className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Workflow</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => setRenaming(true)}>
              <Pencil className="size-3.5" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={duplicateWorkflow}>
              <Copy className="size-3.5" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => importRef.current?.click()}>
              <Upload className="size-3.5" />
              Import from JSON
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={download}>
              <Download className="size-3.5" />
              Download JSON
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate("/settings")}>
              <PanelTop className="size-3.5" />
              Workflow settings
            </DropdownMenuItem>
            <DropdownMenuItem danger onSelect={removeWorkflow}>
              <Trash2 className="size-3.5" />
              Delete workflow
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="ml-1.5 flex items-center gap-1.5">
          <span
            className="flex items-center gap-1 rounded-full border border-hairline bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-ink-3"
            title={
              saveState === "saved"
                ? "All changes saved"
                : "Saving changes…"
            }
          >
            {saveState === "saved" ? (
              <Check className="size-2.5 text-success" />
            ) : (
              <CloudUpload className="size-2.5 animate-pulse-soft" />
            )}
            {saveState === "saved" ? "Saved" : "Saving"}
          </span>
          <span className="hidden text-[10.5px] text-ink-3 lg:inline">
            v{workflow.version}
          </span>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="grid size-8 place-items-center rounded-full text-ink-3 transition hover:bg-surface-2 hover:text-ink"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="size-4" />
          ) : (
            <Moon className="size-4" />
          )}
        </button>

        <div
          className={cn(
            "flex h-8 items-stretch overflow-hidden rounded-full transition-colors",
            workflow.active
              ? "border border-line bg-surface-2 text-ink"
              : "border border-accent bg-accent text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_6px_18px_var(--accent-glow)]",
          )}
        >
          <button
            type="button"
            onClick={publish}
            className={cn(
              "flex items-center gap-1.5 pl-3 pr-2.5 text-[12.5px] font-medium transition-colors",
              workflow.active ? "hover:bg-surface-3" : "hover:bg-accent-hover",
            )}
          >
            {workflow.active ? (
              <>
                <Check className="size-3.5 text-success" />
                Published
              </>
            ) : (
              <>
                <Rocket className="size-3.5" />
                Publish
              </>
            )}
          </button>
          <span
            className={cn(
              "my-1.5 w-px shrink-0",
              workflow.active ? "bg-line-strong" : "bg-white/25",
            )}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "grid w-6 place-items-center transition-colors",
                  workflow.active ? "hover:bg-surface-3" : "hover:bg-accent-hover",
                )}
                aria-label="Publish options"
              >
                <ChevronDown className="size-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Publishing</DropdownMenuLabel>
              <DropdownMenuItem onSelect={publish}>
                <Rocket className="size-3.5" />
                {workflow.active ? "Re-publish" : "Publish workflow"}
              </DropdownMenuItem>
              {workflow.active ? (
                <DropdownMenuItem
                  onSelect={() => {
                    setWorkflowMeta({ active: false });
                    toast("Workflow unpublished");
                  }}
                >
                  <CloudUpload className="size-3.5" />
                  Unpublish
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
