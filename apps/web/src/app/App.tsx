import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/overlays";
import { AppShell } from "@/components/shell/AppShell";
import { FloatingAssistant } from "@/components/ai/FloatingAssistant";
import { EditorPage } from "@/features/editor/EditorPage";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { WorkflowsPage } from "@/features/workflows/WorkflowsPage";
import { ExecutionDetailPage } from "@/features/executions/ExecutionDetailPage";
import { CredentialsPage } from "@/features/credentials/CredentialsPage";
import { SettingsPage } from "@/features/settings/SettingsPage";
import { LoginPage } from "@/features/auth/LoginPage";
import { NotFoundPage } from "@/app/NotFoundPage";
import { useUiStore } from "@/stores/ui.store";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "workflows", element: <WorkflowsPage /> },
      { path: "workflows/:workflowId", element: <EditorPage /> },
      { path: "workflows/:workflowId/executions", element: <EditorPage /> },
      { path: "workflows/:workflowId/evaluations", element: <EditorPage /> },
      { path: "executions/:executionId", element: <ExecutionDetailPage /> },
      { path: "credentials", element: <CredentialsPage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);

function ThemedApp() {
  const initTheme = useUiStore((state) => state.initTheme);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={280}>
        <RouterProvider router={router} />
        <Toaster
          position="bottom-right"
          gap={8}
          toastOptions={{
            style: {
              background: "var(--bg-surface)",
              border: "1px solid var(--line-default)",
              color: "var(--text-primary)",
              fontSize: "13px",
              borderRadius: "12px",
              boxShadow: "var(--shadow-float)",
            },
            closeButton: true,
          }}
        />
        <FloatingAssistant />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export function App() {
  return <ThemedApp />;
}
