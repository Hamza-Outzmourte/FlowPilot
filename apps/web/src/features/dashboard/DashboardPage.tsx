import { Plus, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PageTopBar } from "@/components/shell/PageTopBar";
import { createStoredWorkflow } from "@/lib/storage";

export function DashboardPage() {
  const navigate = useNavigate();

  const newWorkflow = () => {
    const workflow = createStoredWorkflow({ name: "Untitled workflow" });
    navigate(`/workflows/${workflow.id}`);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-app">
      <PageTopBar
        title="Workspace"
        subtitle="Build your first automation workflow."
        actions={
          <Button variant="primary" size="sm" onClick={newWorkflow}>
            <Plus className="size-3.5" />
            New workflow
          </Button>
        }
      />

      <div className="fp-scroll min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[700px] px-6 py-12">
          <div className="surface-card overflow-hidden flex flex-col items-center justify-center text-center py-16 px-6">
            <div className="mb-6 grid size-16 place-items-center rounded-[20px] border border-accent/25 bg-accent-soft text-accent">
              <Sparkles className="size-8" />
            </div>
            <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-ink mb-2">
              No workflows yet
            </h2>
            <p className="max-w-[420px] text-[13px] leading-relaxed text-ink-3 mb-8">
              Create your first workflow to start automating. Drag triggers,
              agents, tools and app actions onto the canvas and watch them run
              in realtime.
            </p>
            <Button variant="primary" size="md" onClick={newWorkflow}>
              <Plus className="size-4" />
              Create your first workflow
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
