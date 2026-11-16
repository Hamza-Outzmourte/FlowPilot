import { useEffect } from "react";
import { toast } from "sonner";
import { useEditorStore } from "@/stores/editor.store";
import { useUiStore } from "@/stores/ui.store";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    target.isContentEditable
  );
}

export function useEditorShortcuts() {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const state = useEditorStore.getState();
      const mod = event.metaKey || event.ctrlKey;
      const typing = isTypingTarget(event.target);

      if (mod && event.key.toLowerCase() === "k") {
        event.preventDefault();
        useUiStore.getState().setCommandOpen(true);
        return;
      }

      if (mod && event.key === "Enter") {
        event.preventDefault();
        if (state.execution.status === "running") {
          state.stopExecution();
        } else {
          void state.execute();
        }
        return;
      }

      if (typing) return;

      if (mod && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) state.redo();
        else state.undo();
        return;
      }

      if (mod && event.key.toLowerCase() === "d") {
        event.preventDefault();
        if (state.selectedNodeId) {
          state.duplicateNode(state.selectedNodeId);
          toast("Node duplicated");
        }
        return;
      }

      if (event.key === "Tab" && !state.ndvNodeId) {
        event.preventDefault();
        state.openCreator(
          state.selectedNodeId
            ? { sourceNodeId: state.selectedNodeId, sourceHandle: "out-0" }
            : undefined,
        );
        return;
      }

      if (event.key === "Escape") {
        if (state.creator.open) state.closeCreator();
        else if (state.ndvNodeId) state.closeNdv();
        else if (state.assistantOpen) state.setAssistantOpen(false);
        else if (state.overviewOpen) state.setOverviewOpen(false);
        return;
      }

      if (!state.selectedNodeId) return;

      if (event.key.toLowerCase() === "d" && !mod) {
        state.toggleNodeDisabled(state.selectedNodeId);
        return;
      }
      if (event.key.toLowerCase() === "p" && !mod) {
        state.toggleNodePinned(state.selectedNodeId);
        return;
      }
      if (event.key === "F2") {
        event.preventDefault();
        state.openNdv(state.selectedNodeId);
      }
      if (mod && event.key === "Delete") {
        event.preventDefault();
        state.deleteNode(state.selectedNodeId);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
}
