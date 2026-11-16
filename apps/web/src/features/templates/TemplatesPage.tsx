import {
  ArrowRight,
  Check,
  CopyPlus,
  Layers,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Workflow as WorkflowIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/primitives";
import { PageTopBar } from "@/components/shell/PageTopBar";
import { NodeIcon } from "@/lib/node-icons";
import {
  createStoredWorkflow,
  duplicateStoredWorkflow,
  getStoredWorkflow,
} from "@/lib/storage";
import { cn } from "@/lib/utils";
import { DEMO_TEMPLATES } from "@/data/demo";
import type { TemplateRecord } from "@/types/workflow";

export function TemplatesPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [appliedId, setAppliedId] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    DEMO_TEMPLATES.forEach((template) => set.add(template.category));
    return ["All", ...Array.from(set).sort()];
  }, []);

  const filtered = DEMO_TEMPLATES.filter((template) => {
    const matchesCategory =
      category === "All" || template.category === category;
    const matchesQuery =
      !query.trim() ||
      `${template.name} ${template.description} ${template.category}`
        .toLowerCase()
        .includes(query.trim().toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const featured = DEMO_TEMPLATES.filter((template) => template.featured).slice(
    0,
    2,
  );

  const applyTemplate = (template: TemplateRecord) => {
    const source = template.workflowId
      ? getStoredWorkflow(template.workflowId)
      : null;

    const workflow = source
      ? duplicateStoredWorkflow(source)
      : createStoredWorkflow({
          name: template.name,
          description: template.description,
          tags: [template.category.toLowerCase(), "template"],
        });

    if (source) {
      workflow.name = template.name;
      workflow.description = template.description;
      workflow.tags = [template.category.toLowerCase(), "template"];
    }

    setAppliedId(template.id);
    toast.success(`“${template.name}” added to your workspace`, {
      description: "The template was cloned so the original stays untouched.",
    });
    navigate(`/workflows/${workflow.id}`);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-app">
      <PageTopBar
        title="Templates"
        subtitle="Production-ready automations you can clone and adapt in minutes."
        breadcrumb="Gallery"
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate("/workflows")}
          >
            <WorkflowIcon className="size-3.5" />
            My workflows
          </Button>
        }
      />

      <div className="fp-scroll min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1320px] px-6 py-6">
          {featured.length > 0 ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {featured.map((template) => (
                <article
                  key={template.id}
                  className="group relative overflow-hidden rounded-[14px] border border-line bg-surface p-5"
                >
                  <div
                    className={cn(
                      "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-70 transition-opacity duration-300 group-hover:opacity-100",
                      template.gradient,
                    )}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent,var(--bg-surface)_82%)]" />
                  <div className="relative">
                    <div className="flex items-start justify-between">
                      <span className="grid size-10 place-items-center rounded-[12px] border border-line bg-surface/80 backdrop-blur">
                        <NodeIcon name={template.icon} className="size-5" />
                      </span>
                      <Badge variant="accent">
                        <Star className="size-3" />
                        Featured
                      </Badge>
                    </div>
                    <h2 className="mt-4 text-[18px] font-semibold tracking-[-0.015em] text-ink">
                      {template.name}
                    </h2>
                    <p className="mt-1 max-w-md text-[12px] leading-relaxed text-ink-2">
                      {template.description}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <Button
                        variant="inverse"
                        size="sm"
                        onClick={() => applyTemplate(template)}
                      >
                        {appliedId === template.id ? (
                          <Check className="size-3.5" />
                        ) : (
                          <CopyPlus className="size-3.5" />
                        )}
                        Use template
                      </Button>
                      <span className="flex items-center gap-1.5 text-[10.5px] text-ink-3">
                        <Layers className="size-3" />
                        {template.nodes} nodes
                      </span>
                      <span className="text-[10.5px] text-ink-3">
                        by {template.author}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <div className="relative w-[260px]">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-3" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search templates…"
                className="h-8 pl-8 text-[12px]"
                aria-label="Search templates"
              />
            </div>
            <div className="flex flex-wrap items-center gap-1">
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11px] font-medium transition",
                    category === item
                      ? "border-accent/30 bg-accent-soft text-accent"
                      : "border-hairline bg-surface text-ink-3 hover:text-ink-2",
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
            <span className="ml-auto text-[10.5px] text-ink-3">
              {filtered.length} template{filtered.length === 1 ? "" : "s"}
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="surface-card mt-4">
              <EmptyState
                icon={<Search className="size-5" />}
                title="No templates match"
                description="Try another category, or start from a blank canvas in the editor."
                action={
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate("/workflows")}
                  >
                    Browse workflows
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((template) => (
                <article
                  key={template.id}
                  className="surface-card surface-card-hover group flex flex-col overflow-hidden"
                >
                  <div className="relative h-[104px] overflow-hidden border-b border-hairline">
                    <div
                      className={cn(
                        "absolute inset-0 bg-gradient-to-br opacity-80 transition-transform duration-300 group-hover:scale-[1.04]",
                        template.gradient,
                      )}
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,var(--bg-surface)_96%)]" />
                    <span className="absolute left-3 top-3 grid size-8 place-items-center rounded-[10px] border border-line bg-surface/85 backdrop-blur">
                      <NodeIcon name={template.icon} className="size-4" />
                    </span>
                    {template.featured ? (
                      <Star className="absolute right-3 top-3 size-3.5 text-warning" />
                    ) : null}
                  </div>
                  <div className="flex min-h-0 flex-1 flex-col px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-[12.5px] font-semibold text-ink">
                        {template.name}
                      </h3>
                      <Badge variant="default">{template.category}</Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 flex-1 text-[11px] leading-relaxed text-ink-3">
                      {template.description}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-[10px] text-ink-3">
                        <Layers className="size-3" />
                        {template.nodes} nodes
                      </span>
                      <button
                        type="button"
                        onClick={() => applyTemplate(template)}
                        className="flex items-center gap-1 rounded-full border border-hairline bg-surface-2 px-2.5 py-1 text-[10.5px] font-medium text-ink-2 transition hover:border-accent/30 hover:text-accent"
                      >
                        Use
                        <ArrowRight className="size-3" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-hairline bg-surface px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-[10px] bg-[var(--accent-grad)] text-white shadow-[0_4px_16px_var(--accent-glow)]">
                <Sparkles className="size-4" />
              </span>
              <div>
                <div className="text-[12.5px] font-semibold text-ink">
                  Need something custom?
                </div>
                <div className="text-[11px] text-ink-3">
                  Describe the automation to the AI assistant and it will draft
                  the canvas for you.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden items-center gap-1.5 text-[10.5px] text-ink-3 sm:flex">
                <ShieldCheck className="size-3.5" />
                Reviewed templates only
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate("/workflows")}
              >
                Open editor
                <ArrowRight className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
