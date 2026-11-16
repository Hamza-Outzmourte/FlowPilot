import { useEffect, useRef } from "react";
import { useEditorStore } from "@/stores/editor.store";
import { saveStoredWorkflow } from "@/lib/storage";

export function useAutosave() {
  const revision = useEditorStore((state) => state.revision);
  const saveState = useEditorStore((state) => state.saveState);
  const setSaveState = useEditorStore((state) => state.setSaveState);
  const markSaved = useEditorStore((state) => state.markSaved);
  const timer = useRef<number | null>(null);
  const lastRevision = useRef(revision);

  useEffect(() => {
    if (revision === lastRevision.current) return;
    lastRevision.current = revision;
    if (saveState === "saved") setSaveState("unsaved");

    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const state = useEditorStore.getState();
      if (state.saveState === "saved") return;
      setSaveState("saving");
      saveStoredWorkflow({
        ...state.workflow,
        updatedAt: new Date().toISOString(),
        nodes: state.nodes.map((node) => ({
          ...node,
          selected: false,
          dragging: false,
        })),
        edges: state.edges.map((edge) => ({ ...edge, selected: false })),
      });
      markSaved();
    }, 800);

    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [revision, saveState, setSaveState, markSaved]);

  useEffect(() => {
    return () => {
      const state = useEditorStore.getState();
      if (state.saveState === "saved") return;
      saveStoredWorkflow({
        ...state.workflow,
        updatedAt: new Date().toISOString(),
        nodes: state.nodes.map((node) => ({
          ...node,
          selected: false,
          dragging: false,
        })),
        edges: state.edges.map((edge) => ({ ...edge, selected: false })),
      });
    };
  }, []);
}
