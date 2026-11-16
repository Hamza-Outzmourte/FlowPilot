import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Database,
  FileText,
  Globe,
  Link2,
  Loader2,
  Play,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Upload,
  XCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/primitives";
import { PageTopBar } from "@/components/shell/PageTopBar";
import {
  cn,
  formatRelative,
  uid,
} from "@/lib/utils";
import {
  DEMO_COLLECTIONS,
  DEMO_DOCUMENTS,
  DEMO_RETRIEVAL_HITS,
} from "@/data/demo";
import type {
  KnowledgeCollection,
  KnowledgeDocument,
  RetrievalHit,
} from "@/types/workflow";

type Tab = "documents" | "playground";

const KNOWLEDGE_KEY = "flowpilot.knowledge.v1";

interface KnowledgeStore {
  collections: KnowledgeCollection[];
  documents: KnowledgeDocument[];
}

function readKnowledge(): KnowledgeStore {
  try {
    const raw = window.localStorage.getItem(KNOWLEDGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as KnowledgeStore;
      if (parsed.collections && parsed.documents) return parsed;
    }
  } catch {
    // Fall back to the seeded demo data.
  }
  return { collections: DEMO_COLLECTIONS, documents: DEMO_DOCUMENTS };
}

function writeKnowledge(store: KnowledgeStore): void {
  try {
    window.localStorage.setItem(KNOWLEDGE_KEY, JSON.stringify(store));
  } catch {
    // Quota errors are non-fatal in the local demo.
  }
}

const DOC_ICON: Record<string, React.ReactNode> = {
  pdf: <FileText className="size-3.5 text-danger" />,
  md: <FileText className="size-3.5 text-info" />,
  txt: <FileText className="size-3.5 text-ink-3" />,
  url: <Globe className="size-3.5 text-success" />,
  csv: <FileText className="size-3.5 text-warning" />,
  docx: <FileText className="size-3.5 text-accent" />,
};

export function KnowledgePage() {
  const initial = useRef<KnowledgeStore | null>(null);
  if (initial.current === null) initial.current = readKnowledge();
  const [collections, setCollections] = useState<KnowledgeCollection[]>(
    initial.current.collections,
  );
  const [documents, setDocuments] = useState<KnowledgeDocument[]>(
    initial.current.documents,
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    initial.current.collections[0]?.id ?? null,
  );
  const [tab, setTab] = useState<Tab>("documents");
  const [query, setQuery] = useState(
    "How do I download the invoice for my last billing cycle?",
  );
  const [hits, setHits] = useState<RetrievalHit[]>(DEMO_RETRIEVAL_HITS);
  const [querying, setQuerying] = useState(false);
  const [uploadUrl, setUploadUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    writeKnowledge({ collections, documents });
  }, [collections, documents]);

  const selected = collections.find((item) => item.id === selectedId);

  const createCollection = () => {
    const name = window.prompt("Name the new collection");
    if (!name?.trim()) return;
    const collection: KnowledgeCollection = {
      id: uid("col"),
      name: name.trim(),
      description: "New collection — add documents to start indexing.",
      embeddingModel: "text-embedding-3-small · 1536d",
      documents: 0,
      chunks: 0,
      lastIndexedAt: new Date().toISOString(),
      status: "ready",
      color: "#8b5cf6",
    };
    setCollections((current) => [...current, collection]);
    setSelectedId(collection.id);
    setTab("documents");
    toast.success(`Collection “${collection.name}” created`);
  };

  const reindex = () => {
    if (!selected) return;
    const id = selected.id;
    setCollections((current) =>
      current.map((item) =>
        item.id === id ? { ...item, status: "indexing" } : item,
      ),
    );
    toast(`Re-indexing “${selected.name}”…`);
    window.setTimeout(() => {
      setCollections((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                status: "ready",
                lastIndexedAt: new Date().toISOString(),
              }
            : item,
        ),
      );
      toast.success("Re-index complete", {
        description: `${selected.chunks.toLocaleString()} chunks embedded`,
      });
    }, 1400);
  };

  const addDocument = (document: KnowledgeDocument) => {
    setDocuments((current) => [document, ...current]);
    setCollections((current) =>
      current.map((item) =>
        item.id === selectedId
          ? {
              ...item,
              documents: item.documents + 1,
              chunks: item.chunks + document.chunks,
              status: "indexing",
            }
          : item,
      ),
    );
    window.setTimeout(() => {
      setDocuments((current) =>
        current.map((item) =>
          item.id === document.id ? { ...item, status: "indexed" } : item,
        ),
      );
      setCollections((current) =>
        current.map((item) =>
          item.id === selectedId
            ? {
                ...item,
                status: "ready",
                lastIndexedAt: new Date().toISOString(),
              }
            : item,
        ),
      );
      toast.success(`Indexed ${document.name}`, {
        description: `${document.chunks} chunks embedded`,
      });
    }, 1600);
  };

  const ingestFiles = (files: FileList | null) => {
    if (!files || files.length === 0 || !selected) return;
    for (const file of Array.from(files)) {
      const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
      const type: KnowledgeDocument["type"] = [
        "pdf",
        "md",
        "txt",
        "csv",
        "docx",
      ].includes(extension)
        ? (extension as KnowledgeDocument["type"])
        : "txt";
      const sizeKb = Math.max(1, Math.round(file.size / 1024));
      addDocument({
        id: uid("doc"),
        name: file.name,
        type,
        chunks: Math.max(1, Math.round(sizeKb / 2.4)),
        sizeKb,
        status: "processing",
        updatedAt: new Date().toISOString(),
        source: "Local upload",
      });
    }
    toast(`Uploading ${files.length} file${files.length === 1 ? "" : "s"}…`);
  };

  const ingestUrl = () => {
    const value = uploadUrl.trim();
    if (!value || !selected) return;
    try {
      new URL(value);
    } catch {
      toast.error("Enter a valid URL, including https://");
      return;
    }
    addDocument({
      id: uid("doc"),
      name: value.replace(/^https?:\/\//, "").slice(0, 60),
      type: "url",
      chunks: 18,
      sizeKb: 0,
      status: "processing",
      updatedAt: new Date().toISOString(),
      source: value,
    });
    setUploadUrl("");
  };

  const runQuery = () => {
    if (!query.trim()) return;
    setQuerying(true);
    window.setTimeout(() => {
      setHits(
        DEMO_RETRIEVAL_HITS.map((hit) => ({
          ...hit,
          score: Math.min(0.99, Math.max(0.4, hit.score + (Math.random() - 0.4) * 0.06)),
        })).sort((a, b) => b.score - a.score),
      );
      setQuerying(false);
      toast.success("Retrieval complete", {
        description: `${DEMO_RETRIEVAL_HITS.length} chunks returned from pgvector`,
      });
    }, 900);
  };

  const totalDocuments = collections.reduce(
    (sum, item) => sum + item.documents,
    0,
  );
  const totalChunks = collections.reduce((sum, item) => sum + item.chunks, 0);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-app">
      <PageTopBar
        title="Knowledge"
        subtitle={`${collections.length} collections · ${totalDocuments} documents · ${totalChunks.toLocaleString()} chunks`}
        breadcrumb="RAG pipeline"
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={createCollection}
          >
            <Plus className="size-3.5" />
            New collection
          </Button>
        }
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="flex w-[300px] shrink-0 flex-col border-r border-hairline">
          <div className="flex h-10 shrink-0 items-center justify-between border-b border-hairline px-4">
            <span className="text-[10px] font-semibold uppercase tracking-[0.09em] text-ink-3">
              Collections
            </span>
            <span className="font-mono text-[9.5px] text-ink-3">
              {collections.length}
            </span>
          </div>
          <div className="fp-scroll min-h-0 flex-1 overflow-y-auto p-2">
            {collections.map((collection) => {
              const active = collection.id === selectedId;
              return (
                <button
                  key={collection.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(collection.id);
                    setTab("documents");
                  }}
                  className={cn(
                    "relative mb-1 w-full rounded-[10px] border px-3 py-2.5 text-left transition",
                    active
                      ? "border-accent/25 bg-accent-soft/60"
                      : "border-transparent hover:bg-surface-2",
                  )}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={cn(
                        "mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg border border-hairline",
                        active ? "bg-surface text-accent" : "bg-surface-2 text-ink-3",
                      )}
                    >
                      <Database className="size-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-[12px] font-medium text-ink">
                          {collection.name}
                        </span>
                        {collection.status === "indexing" ? (
                          <Loader2 className="size-3 shrink-0 animate-spin text-accent" />
                        ) : collection.status === "failed" ? (
                          <XCircle className="size-3 shrink-0 text-danger" />
                        ) : (
                          <CheckCircle2 className="size-3 shrink-0 text-success" />
                        )}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-ink-3">
                        {collection.description}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2 font-mono text-[9px] text-ink-3">
                        <span>{collection.documents} docs</span>
                        <span>·</span>
                        <span>{collection.chunks} chunks</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="shrink-0 border-t border-hairline p-3">
            <div className="rounded-[10px] border border-hairline bg-surface-2/40 px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-[10.5px] font-medium text-ink-2">
                <BookOpen className="size-3" />
                Hybrid retrieval
              </div>
              <p className="mt-1 text-[10px] leading-relaxed text-ink-3">
                pgvector cosine + tsvector BM25, fused with RRF. HNSW index on
                every chunk.
              </p>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {selected ? (
            <>
              <div className="shrink-0 border-b border-hairline px-6 pt-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-[17px] font-semibold tracking-[-0.015em] text-ink">
                        {selected.name}
                      </h2>
                      <Badge
                        variant={
                          selected.status === "ready"
                            ? "success"
                            : selected.status === "indexing"
                              ? "accent"
                              : "danger"
                        }
                      >
                        {selected.status}
                      </Badge>
                    </div>
                    <p className="mt-1 max-w-xl text-[11.5px] text-ink-3">
                      {selected.description}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] text-ink-3">
                      <span className="flex items-center gap-1">
                        <Sparkles className="size-3" />
                        {selected.embeddingModel}
                      </span>
                      <span className="flex items-center gap-1">
                        <Database className="size-3" />
                        {selected.chunks.toLocaleString()} chunks
                      </span>
                      <span className="flex items-center gap-1">
                        <RefreshCw className="size-3" />
                        Indexed {formatRelative(selected.lastIndexedAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={reindex}
                    >
                      <RefreshCw className="size-3.5" />
                      Re-index
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setTab("playground")}
                    >
                      <Play className="size-3.5" />
                      Playground
                    </Button>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-1 border-b border-transparent">
                  {(
                    [
                      ["documents", "Documents"],
                      ["playground", "Retrieval playground"],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setTab(id)}
                      className={cn(
                        "relative -mb-px px-3 py-2 text-[12px] font-medium transition",
                        tab === id
                          ? "text-ink"
                          : "text-ink-3 hover:text-ink-2",
                      )}
                    >
                      {label}
                      {tab === id ? (
                        <span className="absolute inset-x-2 bottom-0 h-[2px] rounded-full bg-accent" />
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>

              <div className="fp-scroll min-h-0 flex-1 overflow-y-auto px-6 py-5">
                {tab === "documents" ? (
                  <>
                    <div className="grid gap-2.5 lg:grid-cols-[1fr_1fr]">
                      <div className="surface-card flex items-center gap-3 px-4 py-3">
                        <span className="grid size-9 place-items-center rounded-[10px] bg-accent-soft text-accent">
                          <Upload className="size-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-[12px] font-medium text-ink">
                            Drop files to ingest
                          </div>
                          <div className="text-[10px] text-ink-3">
                            PDF, DOCX, MD, TXT, CSV · automatic chunking
                          </div>
                        </div>
                        <Button
                          variant="secondary"
                          size="xs"
                          onClick={() => fileRef.current?.click()}
                        >
                          Browse
                        </Button>
                        <input
                          ref={fileRef}
                          type="file"
                          multiple
                          accept=".pdf,.docx,.md,.txt,.csv"
                          className="hidden"
                          onChange={(event) => {
                            ingestFiles(event.target.files);
                            event.target.value = "";
                          }}
                        />
                      </div>
                      <div className="surface-card flex items-center gap-2 px-3 py-2">
                        <Link2 className="size-4 shrink-0 text-ink-3" />
                        <Input
                          value={uploadUrl}
                          onChange={(event) => setUploadUrl(event.target.value)}
                          placeholder="https://docs.example.com/page"
                          className="h-7 border-0 bg-transparent px-0 text-[11.5px] focus:ring-0"
                        />
                        <Button
                          variant="soft"
                          size="xs"
                          disabled={!uploadUrl.trim()}
                          onClick={ingestUrl}
                        >
                          Ingest
                        </Button>
                      </div>
                    </div>

                    <div className="surface-card mt-4 overflow-hidden">
                      <div className="grid grid-cols-[2fr_0.6fr_0.6fr_0.8fr_0.8fr] gap-3 border-b border-hairline px-4 py-2 text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-3">
                        <span>Document</span>
                        <span>Chunks</span>
                        <span>Size</span>
                        <span>Status</span>
                        <span>Updated</span>
                      </div>
                      {documents.map((document) => (
                        <div
                          key={document.id}
                          className="grid grid-cols-[2fr_0.6fr_0.6fr_0.8fr_0.8fr] items-center gap-3 border-b border-hairline px-4 py-2.5 last:border-b-0 hover:bg-surface-2/40"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="grid size-6 shrink-0 place-items-center rounded-md border border-hairline bg-surface-2">
                              {DOC_ICON[document.type]}
                            </span>
                            <div className="min-w-0">
                              <div className="truncate text-[11.5px] font-medium text-ink">
                                {document.name}
                              </div>
                              <div className="truncate text-[9.5px] text-ink-3">
                                {document.source}
                              </div>
                            </div>
                          </div>
                          <span className="font-mono text-[10.5px] text-ink-2">
                            {document.chunks}
                          </span>
                          <span className="font-mono text-[10.5px] text-ink-3">
                            {document.sizeKb > 0
                              ? `${(document.sizeKb / 1024).toFixed(1)} MB`
                              : "URL"}
                          </span>
                          <span>
                            <Badge
                              variant={
                                document.status === "indexed"
                                  ? "success"
                                  : document.status === "processing"
                                    ? "accent"
                                    : "danger"
                              }
                            >
                              {document.status === "processing" ? (
                                <Loader2 className="size-2.5 animate-spin" />
                              ) : null}
                              {document.status}
                            </Badge>
                          </span>
                          <span className="text-[10.5px] text-ink-3">
                            {formatRelative(document.updatedAt)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      {[
                        {
                          label: "Ingestion",
                          value: "Async Celery worker",
                          hint: "parsing → chunking → embedding → indexed",
                        },
                        {
                          label: "Splitter",
                          value: "Recursive · 900 / 120",
                          hint: "10–15% overlap, markdown aware",
                        },
                        {
                          label: "Store",
                          value: "pgvector + HNSW",
                          hint: "cosine similarity, metadata JSONB",
                        },
                      ].map((item) => (
                        <div key={item.label} className="surface-card px-4 py-3">
                          <div className="text-[9.5px] uppercase tracking-wider text-ink-3">
                            {item.label}
                          </div>
                          <div className="mt-1 text-[12px] font-medium text-ink">
                            {item.value}
                          </div>
                          <div className="mt-0.5 text-[10px] text-ink-3">
                            {item.hint}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="surface-card px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <Search className="size-3.5 text-ink-3" />
                        <span className="text-[11.5px] font-medium text-ink">
                          Query the collection
                        </span>
                        <span className="ml-auto flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => {
                              setQuery("");
                              setHits([]);
                            }}
                          >
                            Clear
                          </Button>
                          <Button
                            variant="primary"
                            size="xs"
                            onClick={runQuery}
                            disabled={querying || !query.trim()}
                          >
                            {querying ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <Play className="size-3" />
                            )}
                            Retrieve
                          </Button>
                        </span>
                      </div>
                      <textarea
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        onKeyDown={(event) => {
                          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                            runQuery();
                          }
                        }}
                        rows={2}
                        className="mt-2 w-full resize-none rounded-lg border border-hairline bg-surface-2/50 px-2.5 py-2 text-[11.5px] leading-relaxed text-ink outline-none focus:border-accent focus:ring-[3px] focus:ring-accent-soft"
                        placeholder="Ask a question to debug retrieval…"
                      />
                      <div className="mt-1.5 flex items-center gap-3 text-[9.5px] text-ink-3">
                        <span>hybrid: vector + BM25 (RRF)</span>
                        <span>·</span>
                        <span>topK 4</span>
                        <span>·</span>
                        <span>MMR on</span>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2.5">
                      {querying
                        ? Array.from({ length: 3 }).map((_, index) => (
                            <div
                              key={index}
                              className="surface-card px-4 py-3"
                            >
                              <div className="skeleton h-3 w-1/3" />
                              <div className="skeleton mt-2 h-2.5 w-full" />
                              <div className="skeleton mt-1.5 h-2.5 w-4/5" />
                            </div>
                          ))
                        : hits.map((hit, index) => (
                            <div
                              key={hit.id}
                              className="surface-card px-4 py-3"
                            >
                              <div className="flex items-center gap-2">
                                <span className="grid size-5 place-items-center rounded-md border border-hairline bg-surface-2 font-mono text-[9px] text-ink-3">
                                  {index + 1}
                                </span>
                                <span className="text-[11.5px] font-medium text-ink">
                                  {hit.source}
                                  {hit.page ? (
                                    <span className="ml-1.5 text-[10px] font-normal text-ink-3">
                                      p. {hit.page}
                                    </span>
                                  ) : null}
                                </span>
                                <span className="ml-auto flex items-center gap-2">
                                  <ProgressBar
                                    value={hit.score * 100}
                                    className="h-1 w-16"
                                    color={
                                      hit.score > 0.85
                                        ? "var(--success)"
                                        : "var(--accent)"
                                    }
                                  />
                                  <span className="font-mono text-[10px] text-ink-2">
                                    {hit.score.toFixed(2)}
                                  </span>
                                </span>
                              </div>
                              <p className="mt-2 text-[11.5px] leading-relaxed text-ink-2">
                                {hit.content}
                              </p>
                            </div>
                          ))}
                      {!querying && hits.length === 0 ? (
                        <div className="surface-card flex flex-col items-center px-6 py-14 text-center">
                          <Search className="mb-2 size-5 text-ink-3" />
                          <p className="text-[12px] font-medium text-ink">
                            No chunks yet
                          </p>
                          <p className="mt-1 text-[11px] text-ink-3">
                            Run a query to inspect ranked passages and scores.
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="grid h-full place-items-center">
              <div className="text-center">
                <ArrowLeft className="mx-auto mb-2 size-5 text-ink-3" />
                <p className="text-[12px] text-ink-3">
                  Select a collection to get started.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
