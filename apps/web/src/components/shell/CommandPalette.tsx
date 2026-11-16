import Fuse from "fuse.js";
import {
  BookOpen,
  Bot,
  Boxes,
  CornerDownLeft,
  Grid2x2,
  Home,
  LayoutDashboard,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
  Workflow,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { createStoredWorkflow, listWorkflowMetas } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/stores/editor.store";
import { useUiStore } from "@/stores/ui.store";
import { NODE_DEFINITIONS } from "@/data/node-catalog";

interface CommandItem {
  id: string;
  label: string;
  hint?: string;
  icon: React.ReactNode;
  group: "Navigate" | "Actions" | "Workflows" | "Nodes";
  run: () => void;
  keywords?: string;
}

export function CommandPalette() {
  const open = useUiStore((state) => state.commandOpen);
  const setOpen = useUiStore((state) => state.setCommandOpen);
  const theme = useUiStore((state) => state.theme);
  const setTheme = useUiStore((state) => state.setTheme);
  const navigate = useNavigate();
  const location = useLocation();
  const inEditor = /^\/workflows\/[^/]+/.test(location.pathname);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands = useMemo<CommandItem[]>(() => {
    const go = (path: string) => () => {
      navigate(path);
      setOpen(false);
    };
    const workflows = listWorkflowMetas().slice(0, 6);

    const addNode = (type: string, label: string) => () => {
      const state = useEditorStore.getState();
      const rightmost = state.nodes.reduce(
        (max, node) => Math.max(max, node.position.x + 300),
        0,
      );
      const topmost = state.nodes.reduce(
        (min, node) => Math.min(min, node.position.y),
        0,
      );
      const position =
        state.nodes.length > 0
          ? { x: rightmost + 80, y: Number.isFinite(topmost) ? topmost : 0 }
          : { x: 120, y: 160 };
      state.addNode(type, position, undefined, false);
      setOpen(false);
      toast.success(`${label} added to the canvas`);
    };

    return [
      {
        id: "nav-home",
        label: "Go to dashboard",
        icon: <Home className="size-3.5" />,
        group: "Navigate",
        run: go("/dashboard"),
      },
      {
        id: "nav-workflows",
        label: "Go to workflows",
        icon: <Workflow className="size-3.5" />,
        group: "Navigate",
        run: go("/workflows"),
      },
      {
        id: "nav-executions",
        label: "Go to executions",
        icon: <LayoutDashboard className="size-3.5" />,
        group: "Navigate",
        run: go("/executions"),
      },
      {
        id: "nav-knowledge",
        label: "Go to knowledge",
        icon: <BookOpen className="size-3.5" />,
        group: "Navigate",
        run: go("/knowledge"),
      },
      {
        id: "nav-templates",
        label: "Browse templates",
        icon: <Grid2x2 className="size-3.5" />,
        group: "Navigate",
        run: go("/templates"),
      },
      {
        id: "nav-settings",
        label: "Open settings",
        icon: <Settings className="size-3.5" />,
        group: "Navigate",
        run: go("/settings"),
      },
      {
        id: "action-new",
        label: "Create a new workflow",
        icon: <Plus className="size-3.5" />,
        group: "Actions",
        run: () => {
          const workflow = createStoredWorkflow({ name: "Untitled workflow" });
          navigate(`/workflows/${workflow.id}`);
          setOpen(false);
          toast.success("New workflow created");
        },
      },
      {
        id: "action-theme",
        label: `Switch to ${theme === "dark" ? "light" : "dark"} mode`,
        icon:
          theme === "dark" ? (
            <Sun className="size-3.5" />
          ) : (
            <Moon className="size-3.5" />
          ),
        group: "Actions",
        run: () => {
          setTheme(theme === "dark" ? "light" : "dark");
          toast(`Theme: ${theme === "dark" ? "light" : "dark"}`);
          setOpen(false);
        },
      },
      {
        id: "action-trigger",
        label: "Add a trigger to the open workflow",
        icon: <Zap className="size-3.5" />,
        group: "Actions",
        run: () => {
          setOpen(false);
          if (!inEditor) {
            toast("Pick a workflow first, then add a trigger from the canvas");
            navigate("/workflows");
            return;
          }
          useEditorStore.getState().openCreator({ group: "trigger" });
        },
      },
      ...workflows.map((workflow) => ({
        id: `wf-${workflow.id}`,
        label: workflow.name,
        hint: `v${workflow.version}`,
        icon: <Workflow className="size-3.5" />,
        group: "Workflows" as const,
        keywords: "open workflow edit",
        run: go(`/workflows/${workflow.id}`),
      })),
      ...(inEditor
        ? NODE_DEFINITIONS.slice(0, 24).map((node) => ({
            id: `node-${node.type}`,
            label: node.displayName,
            hint: node.subcategory ?? node.group,
            icon: <Boxes className="size-3.5" />,
            group: "Nodes" as const,
            keywords: `${node.description} ${node.group} ${node.subcategory ?? ""}`,
            run: addNode(node.type, node.displayName),
          }))
        : []),
    ];
  }, [inEditor, navigate, setOpen, setTheme, theme]);

  const fuse = useMemo(
    () =>
      new Fuse(commands, {
        keys: [
          { name: "label", weight: 3 },
          { name: "keywords", weight: 2 },
          { name: "hint", weight: 1 },
          { name: "group", weight: 1 },
        ],
        threshold: 0.35,
        ignoreLocation: true,
      }),
    [commands],
  );

  const results = useMemo(() => {
    if (!query.trim()) return commands.slice(0, 14);
    return fuse
      .search(query.trim())
      .map((result) => result.item)
      .slice(0, 24);
  }, [commands, fuse, query]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setIndex(0);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 60);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setIndex((current) =>
          results.length === 0 ? 0 : (current + 1) % results.length,
        );
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setIndex((current) =>
          results.length === 0
            ? 0
            : (current - 1 + results.length) % results.length,
        );
      }
      if (event.key === "Enter") {
        event.preventDefault();
        results[index]?.run();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, results, index, setOpen]);

  if (!open) return null;

  const grouped = results.reduce<Record<string, CommandItem[]>>((acc, item) => {
    acc[item.group] = [...(acc[item.group] ?? []), item];
    return acc;
  }, {});

  let cursor = -1;

  return (
    <div className="fixed inset-0 z-[130] flex items-start justify-center pt-[12vh]">
      <button
        type="button"
        aria-label="Close command palette"
        className="absolute inset-0 bg-black/55 backdrop-blur-[4px]"
        onClick={() => setOpen(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="relative w-[600px] max-w-[calc(100vw-32px)] overflow-hidden rounded-[16px] border border-line bg-surface shadow-[0_32px_80px_rgba(0,0,0,.6)] animate-scale-in"
      >
        <div className="flex h-12 items-center gap-2.5 border-b border-hairline px-4">
          <Search className="size-4 text-ink-3" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setIndex(0);
            }}
            placeholder="Search workflows, nodes and commands…"
            className="h-full flex-1 bg-transparent text-[13.5px] text-ink outline-none placeholder:text-ink-3"
            aria-label="Command search"
          />
          <span className="kbd">esc</span>
        </div>

        <div className="fp-scroll max-h-[52vh] overflow-y-auto p-2">
          {results.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-12 text-center">
              <Bot className="mb-2 size-5 text-ink-3" />
              <p className="text-[12.5px] font-medium text-ink">No matches</p>
              <p className="mt-1 text-[11px] text-ink-3">
                Try “Telegram”, “workflow” or “theme”.
              </p>
            </div>
          ) : (
            Object.entries(grouped).map(([group, items]) => (
              <div key={group} className="mb-1">
                <div className="px-2.5 pb-1 pt-1.5 text-[9.5px] font-semibold uppercase tracking-[0.1em] text-ink-3">
                  {group}
                </div>
                {items.map((item) => {
                  cursor += 1;
                  const active = cursor === index;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onMouseEnter={() => setIndex(results.indexOf(item))}
                      onClick={item.run}
                      className={cn(
                        "flex h-9 w-full items-center gap-2.5 rounded-[8px] px-2.5 text-left text-[12.5px] transition-colors",
                        active
                          ? "bg-surface-2 text-ink"
                          : "text-ink-2 hover:bg-surface-2/60",
                      )}
                    >
                      <span className="grid size-5 place-items-center text-ink-3">
                        {item.icon}
                      </span>
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.hint ? (
                        <span className="max-w-[130px] truncate font-mono text-[9.5px] text-ink-3">
                          {item.hint}
                        </span>
                      ) : null}
                      {active ? (
                        <CornerDownLeft className="size-3 text-ink-3" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="flex h-9 items-center gap-3 border-t border-hairline bg-surface-2/40 px-4 text-[10px] text-ink-3">
          <span className="flex items-center gap-1">
            <span className="kbd">↑</span>
            <span className="kbd">↓</span> navigate
          </span>
          <span className="flex items-center gap-1">
            <span className="kbd">↵</span> select
          </span>
          <span className="ml-auto">{results.length} results</span>
        </div>
      </div>
    </div>
  );
}
