import { Outlet } from "react-router-dom";
import { CommandPalette } from "./CommandPalette";
import { Sidebar } from "./Sidebar";

export function AppShell() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-app text-ink">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Outlet />
      </main>
      <CommandPalette />
    </div>
  );
}
