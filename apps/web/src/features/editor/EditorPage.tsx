import { AlertCircle, ArrowLeft } from "lucide-react";
import { useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { WorkflowCanvas } from "./canvas/WorkflowCanvas";
import { AssistantPanel } from "./components/AssistantPanel";
import { ExecuteDialog } from "./components/ExecuteDialog";
import { EditorTopBar } from "./components/EditorTopBar";
import { LogsPanel } from "./components/LogsPanel";
import { NodeCreator } from "./components/NodeCreator";
import { NodeDetail } from "./components/NodeDetail";
import { OverviewPanel } from "./components/OverviewPanel";
import { WebhookSetup } from "./components/WebhookSetup";
import { useAutosave } from "@/hooks/useAutosave";
import { useEditorShortcuts } from "@/hooks/useEditorShortcuts";
import { getStoredWorkflow, listWorkflowMetas } from "@/lib/storage";
import { useEditorStore } from "@/stores/editor.store";

export function EditorPage() {
  const { workflowId } = useParams<{ workflowId: string }>();
  const init = useEditorStore((state) => state.init);
  const execute = useEditorStore((state) => state.execute);
  const resetExecution = useEditorStore((state) => state.resetExecution);
  const loadedRef = useRef<string | null>(null);

  const workflow = workflowId ? getStoredWorkflow(workflowId) : null;

  useEffect(() => {
    if (!workflow) return;
    if (loadedRef.current === workflow.id) return;
    loadedRef.current = workflow.id;
    init(workflow);
    resetExecution();
    document.title = `${workflow.name} · FlowPilot`;
    return () => {
      document.title = "FlowPilot — AI workflow automation";
    };
  }, [workflow, init, resetExecution]);

  const workflowIdForRun = workflow?.id;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void execute();
    }, 500);
    return () => window.clearTimeout(timer);
  }, [execute, workflowIdForRun]);

  useEditorShortcuts();
  useAutosave();

  if (!workflow || !workflowId) {
    const alternatives = listWorkflowMetas().slice(0, 4);
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-app px-6">
        <div className="grid size-12 place-items-center rounded-[14px] border border-line bg-surface-2 text-ink-3">
          <AlertCircle className="size-6" />
        </div>
        <h1 className="mt-4 text-[18px] font-semibold tracking-[-0.01em] text-ink">
          Workflow not found
        </h1>
        <p className="mt-1.5 max-w-sm text-center text-[12.5px] leading-relaxed text-ink-3">
          “{workflowId}” doesn’t exist in this workspace. It may have been
          deleted, or the link is out of date.
        </p>
        <Button asChild variant="primary" size="sm" className="mt-5">
          <Link to="/workflows">
            <ArrowLeft className="size-3.5" />
            Back to workflows
          </Link>
        </Button>
        {alternatives.length > 0 ? (
          <div className="mt-8 w-full max-w-sm">
            <div className="mb-2 text-center text-[10px] font-semibold uppercase tracking-[0.09em] text-ink-3">
              Try one of these
            </div>
            <div className="space-y-1">
              {alternatives.map((item) => (
                <Link
                  key={item.id}
                  to={`/workflows/${item.id}`}
                  className="flex items-center justify-between rounded-lg border border-hairline bg-surface px-3 py-2 text-[12px] text-ink-2 transition hover:border-line hover:bg-surface-2"
                >
                  {item.name}
                  <span className="font-mono text-[10px] text-ink-3">
                    v{item.version}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-app">
      <EditorTopBar />

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <WorkflowCanvas />
        <NodeCreator />
        <OverviewPanel />
        <AssistantPanel />
        <WebhookSetup />
      </div>
      <LogsPanel />

      <ExecuteDialog />
      <NodeDetail />
    </div>
  );
}
