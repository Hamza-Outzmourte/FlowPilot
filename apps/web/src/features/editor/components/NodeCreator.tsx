import Fuse from "fuse.js";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Clock3,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CREATOR_CATEGORIES,
  getNodeDefinition,
  NODE_DEFINITIONS,
  nodesForGroup,
  nodesForSubcategory,
  subcategoriesForGroup,
} from "@/data/node-catalog";
import { NodeIcon } from "@/lib/node-icons";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/stores/editor.store";
import type { NodeDefinition, NodeGroup } from "@/types/workflow";

const RECENTS_KEY = "flowpilot.recents.v1";

const fuse = new Fuse(NODE_DEFINITIONS, {
  keys: [
    { name: "displayName", weight: 3 },
    { name: "description", weight: 2 },
    { name: "keywords", weight: 2 },
    { name: "subcategory", weight: 1.5 },
    { name: "group", weight: 1 },
  ],
  threshold: 0.32,
  ignoreLocation: true,
  minMatchCharLength: 2,
});

const CONNECTION_TITLES: Record<string, string> = {
  ai_languageModel: "Chat Model",
  ai_memory: "Memory",
  ai_tool: "Tool",
  ai_embedding: "Embeddings",
  ai_vectorStore: "Vector Store",
  ai_retriever: "Retriever",
  ai_document: "Document Loader",
  ai_textSplitter: "Text Splitter",
  ai_outputParser: "Output Parser",
};

function readRecents(): string[] {
  try {
    const raw = window.localStorage.getItem(RECENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

function pushRecent(type: string): void {
  try {
    const current = readRecents().filter((item) => item !== type);
    window.localStorage.setItem(
      RECENTS_KEY,
      JSON.stringify([type, ...current].slice(0, 4)),
    );
  } catch {
    // ignore
  }
}

function positionForNode(nodes: ReturnType<typeof useEditorStore.getState>["nodes"], group: NodeGroup) {
  if (nodes.length === 0) return { x: 140, y: 160 };
  if (group === "trigger") {
    const triggers = nodes.filter((node) => node.data.group === "trigger");
    if (triggers.length > 0) {
      const minX = Math.min(...triggers.map((node) => node.position.x));
      const maxY = Math.max(
        ...triggers.map((node) => node.position.y + (node.measured?.height ?? 110)),
      );
      return { x: minX, y: maxY + 130 };
    }
  }
  const maxX = Math.max(
    ...nodes.map((node) => node.position.x + (node.measured?.width ?? 110)),
  );
  const minY = Math.min(...nodes.map((node) => node.position.y));
  return { x: maxX + 130, y: minY };
}

function NodeRow({
  definition,
  focused,
  onHover,
  onSelect,
}: {
  definition: NodeDefinition;
  focused: boolean;
  onHover: () => void;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onMouseEnter={onHover}
      onClick={onSelect}
      className={cn(
        "group relative flex w-full items-center gap-3 rounded-[10px] px-2.5 py-2.5 text-left transition-colors",
        focused ? "bg-surface-2" : "hover:bg-surface-2/70",
      )}
    >
      <span className="absolute inset-y-2 left-0 w-[2px] rounded-full bg-accent opacity-0 transition-opacity group-hover:opacity-100" />
      <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-[9px] border border-hairline bg-surface-2">
        <NodeIcon name={definition.icon} className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-[13px] font-medium text-ink">
            {definition.displayName}
          </span>
          {definition.credentials?.some((credential) => credential.required) ? (
            <span className="size-1.5 shrink-0 rounded-full bg-warning" title="Requires credentials" />
          ) : null}
        </span>
        <span className="mt-0.5 line-clamp-1 block text-[11.5px] text-ink-3">
          {definition.description}
        </span>
      </span>
      <ChevronRight className="size-3.5 shrink-0 text-ink-3/0 transition group-hover:text-ink-3" />
    </button>
  );
}

export function NodeCreator() {
  const creator = useEditorStore((state) => state.creator);
  const closeCreator = useEditorStore((state) => state.closeCreator);
  const addNode = useEditorStore((state) => state.addNode);
  const nodes = useEditorStore((state) => state.nodes);
  const reducedMotion = useReducedMotion();

  const [query, setQuery] = useState(creator.query ?? "");
  const [activeGroup, setActiveGroup] = useState<NodeGroup | null>(
    creator.group ?? null,
  );
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [recents, setRecents] = useState<string[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  const connectionType = creator.connectionType;

  useEffect(() => {
    if (!creator.open) return;
    setQuery(creator.query ?? "");
    setActiveGroup(creator.group ?? null);
    setFocusedIndex(0);
    setRecents(readRecents());
    const timer = window.setTimeout(() => searchRef.current?.focus(), 80);
    return () => window.clearTimeout(timer);
  }, [creator.open, creator.query, creator.group]);

  const isCompatible = (definition: NodeDefinition): boolean => {
    if (!connectionType || connectionType === "main") {
      if (!connectionType) return true;
      return definition.inputs.some((port) => port.type === "main");
    }
    return definition.outputs.some((port) => port.type === connectionType);
  };

  const compatible = useMemo(
    () => NODE_DEFINITIONS.filter(isCompatible),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [connectionType],
  );

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return fuse
      .search(query.trim())
      .map((result) => result.item)
      .filter(isCompatible)
      .slice(0, 32);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, connectionType]);

  const sections = useMemo(() => {
    if (!activeGroup) return [];
    const groupNodes = nodesForGroup(activeGroup).filter(isCompatible);
    const subcategories = subcategoriesForGroup(activeGroup);
    if (subcategories.length === 0) {
      return [{ title: "", nodes: groupNodes }];
    }
    return subcategories
      .map((subcategory) => ({
        title: subcategory,
        nodes: nodesForSubcategory(activeGroup, subcategory).filter(isCompatible),
      }))
      .filter((section) => section.nodes.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGroup, connectionType]);

  const visibleNodes = useMemo(() => {
    if (query.trim()) return results;
    if (connectionType && connectionType !== "main") return results.length ? results : compatible;
    return sections.flatMap((section) => section.nodes);
  }, [query, results, sections, connectionType, compatible]);

  const activeCategory = activeGroup
    ? CREATOR_CATEGORIES.find((category) => category.id === activeGroup)
    : undefined;

  const categories = useMemo(
    () =>
      CREATOR_CATEGORIES.filter((category) =>
        nodesForGroup(category.id).some(isCompatible),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [connectionType],
  );

  const showCategories =
    !query.trim() && !activeGroup && (!connectionType || connectionType === "main");
  const showFlatAi =
    Boolean(connectionType && connectionType !== "main") && !query.trim();

  const add = (definition: NodeDefinition) => {
    const position = creator.sourceNodeId
      ? { x: 0, y: 0 }
      : positionForNode(nodes, definition.group);
    pushRecent(definition.type);
    addNode(
      definition.type,
      position,
      creator.sourceNodeId
        ? { nodeId: creator.sourceNodeId, handleId: creator.sourceHandle ?? null }
        : undefined,
      true,
    );
  };

  const openGroup = (group: NodeGroup) => {
    setActiveGroup(group);
    setFocusedIndex(0);
    setQuery("");
  };

  useEffect(() => {
    if (!creator.open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (activeGroup) {
          setActiveGroup(null);
          setFocusedIndex(0);
        } else {
          closeCreator();
        }
        return;
      }
      if (event.key === "ArrowLeft" && activeGroup) {
        event.preventDefault();
        setActiveGroup(null);
        setFocusedIndex(0);
        return;
      }
      if (showCategories) {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          setFocusedIndex((index) => (index + 1) % Math.max(1, categories.length));
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          setFocusedIndex(
            (index) =>
              (index - 1 + Math.max(1, categories.length)) %
              Math.max(1, categories.length),
          );
        } else if (event.key === "Enter" || event.key === "ArrowRight") {
          event.preventDefault();
          const category = categories[focusedIndex];
          if (category) openGroup(category.id);
        }
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setFocusedIndex((index) =>
          visibleNodes.length === 0 ? 0 : (index + 1) % visibleNodes.length,
        );
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setFocusedIndex((index) =>
          visibleNodes.length === 0
            ? 0
            : (index - 1 + visibleNodes.length) % visibleNodes.length,
        );
      } else if (event.key === "Enter") {
        event.preventDefault();
        const node = visibleNodes[focusedIndex];
        if (node) add(node);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creator.open, activeGroup, showCategories, focusedIndex, visibleNodes, connectionType]);

  const title = connectionType && connectionType !== "main"
    ? `Select a ${CONNECTION_TITLES[connectionType] ?? "sub-node"}`
    : creator.sourceNodeId
      ? "What happens next?"
      : activeCategory
        ? activeCategory.title
        : "Add a node";

  const subtitle = connectionType && connectionType !== "main"
    ? "Only compatible sub-nodes are shown."
    : creator.sourceNodeId
      ? "Choose the next step in your workflow."
      : activeCategory
        ? activeCategory.description
        : "Search for a trigger, app, AI model or utility.";

  return (
    <AnimatePresence>
      {creator.open ? (
        <motion.div
          className="absolute inset-0 z-40 flex justify-end"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.button
            type="button"
            aria-label="Close node creator"
            className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={closeCreator}
          />
          <motion.aside
            role="dialog"
            aria-label="Node creator"
            aria-modal="true"
            className="relative flex h-full w-[460px] max-w-[calc(100vw-48px)] flex-col border-l border-line bg-surface shadow-[-24px_0_60px_rgba(0,0,0,.4)]"
            initial={{ x: reducedMotion ? 0 : 44, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: reducedMotion ? 0 : 44, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="relative border-b border-hairline bg-surface-2/50 px-5 pb-4 pt-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    {activeGroup ? (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveGroup(null);
                          setFocusedIndex(0);
                        }}
                        className="grid size-6 place-items-center rounded-md text-ink-3 transition hover:bg-surface-2 hover:text-ink"
                        aria-label="Back to categories"
                      >
                        <ArrowLeft className="size-3.5" />
                      </button>
                    ) : null}
                    <h2 className="text-[16px] font-semibold tracking-[-0.01em] text-ink">
                      {title}
                    </h2>
                  </div>
                  <p className="mt-1 text-[11.5px] leading-snug text-ink-3">
                    {subtitle}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeCreator}
                  className="grid size-7 shrink-0 place-items-center rounded-lg text-ink-3 transition hover:bg-surface-2 hover:text-ink"
                  aria-label="Close"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setFocusedIndex(0);
                  }}
                  placeholder="Search nodes..."
                  className="h-10 w-full rounded-[10px] border border-line bg-surface pl-9 pr-9 text-[13px] text-ink placeholder:text-ink-3 transition focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent-soft"
                  aria-label="Search nodes"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setFocusedIndex(0);
                    }}
                    className="absolute right-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-ink-3 hover:bg-surface-2 hover:text-ink"
                    aria-label="Clear search"
                  >
                    <X className="size-3.5" />
                  </button>
                ) : (
                  <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
                    <span className="kbd">/</span>
                  </span>
                )}
              </div>
            </div>

            <div className="fp-scroll min-h-0 flex-1 overflow-y-auto px-3 py-3">
              {showCategories ? (
                <div className="space-y-0.5">
                  {categories.map((category, index) => (
                    <div key={category.id}>
                      {category.divider ? (
                        <div className="my-2 h-px bg-hairline" />
                      ) : null}
                      <button
                        type="button"
                        onMouseEnter={() => setFocusedIndex(index)}
                        onClick={() => openGroup(category.id)}
                        className={cn(
                          "group relative flex w-full items-center gap-3 rounded-[10px] px-2.5 py-2.5 text-left transition-colors",
                          focusedIndex === index
                            ? "bg-surface-2"
                            : "hover:bg-surface-2/60",
                        )}
                      >
                        <span
                          className={cn(
                            "absolute inset-y-2 left-0 w-[2px] rounded-full bg-accent transition-opacity",
                            focusedIndex === index
                              ? "opacity-100"
                              : "opacity-0 group-hover:opacity-60",
                          )}
                        />
                        <span className="grid size-9 shrink-0 place-items-center rounded-[9px] border border-hairline bg-surface-2 text-ink-2">
                          <NodeIcon name={category.icon} className="size-[18px]" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13px] font-medium text-ink">
                            {category.title}
                          </span>
                          <span className="mt-0.5 block text-[11.5px] leading-snug text-ink-3">
                            {category.description}
                          </span>
                        </span>
                        <ArrowRight className="size-3.5 shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5 group-hover:text-ink-2" />
                      </button>
                    </div>
                  ))}

                  {recents.length > 0 ? (
                    <div className="pt-4">
                      <div className="mb-1.5 flex items-center gap-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-[0.09em] text-ink-3">
                        <Clock3 className="size-3" />
                        Recently used
                      </div>
                      {recents.map((type) => {
                        const definition = getNodeDefinition(type);
                        if (!definition) return null;
                        return (
                          <NodeRow
                            key={type}
                            definition={definition}
                            focused={false}
                            onHover={() => undefined}
                            onSelect={() => add(definition)}
                          />
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              ) : query.trim() ? (
                <div className="space-y-0.5">
                  <div className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.09em] text-ink-3">
                    {results.length} result{results.length === 1 ? "" : "s"}
                  </div>
                  {results.map((definition, index) => (
                    <NodeRow
                      key={definition.type}
                      definition={definition}
                      focused={focusedIndex === index}
                      onHover={() => setFocusedIndex(index)}
                      onSelect={() => add(definition)}
                    />
                  ))}
                  {results.length === 0 ? (
                    <div className="flex flex-col items-center px-5 py-10 text-center">
                      <Sparkles className="mb-3 size-6 text-ink-3" />
                      <p className="text-[13px] font-medium text-ink">
                        No nodes found
                      </p>
                      <p className="mt-1 text-[11.5px] text-ink-3">
                        Try “agent”, “Telegram”, “HTTP” or “filter”.
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : showFlatAi ? (
                <div className="space-y-0.5">
                  <div className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.09em] text-ink-3">
                    Compatible {CONNECTION_TITLES[connectionType ?? ""] ?? "nodes"}
                  </div>
                  {compatible.map((definition, index) => (
                    <NodeRow
                      key={definition.type}
                      definition={definition}
                      focused={focusedIndex === index}
                      onHover={() => setFocusedIndex(index)}
                      onSelect={() => add(definition)}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {sections.map((section) => (
                    <div key={section.title || "all"}>
                      {section.title ? (
                        <div className="mb-1 px-2.5 text-[10px] font-semibold uppercase tracking-[0.09em] text-ink-3">
                          {section.title}
                        </div>
                      ) : null}
                      <div className="space-y-0.5">
                        {section.nodes.map((definition) => {
                          const index = visibleNodes.findIndex(
                            (node) => node.type === definition.type,
                          );
                          return (
                            <NodeRow
                              key={definition.type}
                              definition={definition}
                              focused={focusedIndex === index}
                              onHover={() => setFocusedIndex(index)}
                              onSelect={() => add(definition)}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex h-9 items-center justify-between border-t border-hairline bg-surface-2/40 px-4 text-[10px] text-ink-3">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="kbd">↑</span>
                  <span className="kbd">↓</span> navigate
                </span>
                <span className="flex items-center gap-1">
                  <span className="kbd">↵</span> select
                </span>
              </div>
              <span className="flex items-center gap-1">
                <span className="kbd">esc</span> close
              </span>
            </div>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
