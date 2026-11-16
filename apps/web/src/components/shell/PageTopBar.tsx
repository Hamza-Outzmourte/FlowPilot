import { Bell, Moon, Search, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar } from "@/components/ui/primitives";
import { Tooltip } from "@/components/ui/overlays";
import { DEMO_USER } from "@/data/demo";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui.store";

export function PageTopBar({
  title,
  subtitle,
  actions,
  breadcrumb,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumb?: string;
}) {
  const navigate = useNavigate();
  const theme = useUiStore((state) => state.theme);
  const setTheme = useUiStore((state) => state.setTheme);
  const setCommandOpen = useUiStore((state) => state.setCommandOpen);

  return (
    <header className="flex h-[78px] shrink-0 items-center gap-4 border-b border-hairline bg-app/95 px-6 backdrop-blur-xl">
      <div className="min-w-0 flex-1">
        {breadcrumb ? (
          <div className="mb-0.5 text-[10.5px] font-medium uppercase tracking-[0.08em] text-ink-3">
            {breadcrumb}
          </div>
        ) : null}
        <h1 className="truncate text-[20px] font-semibold tracking-[-0.02em] text-ink">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-0.5 truncate text-[12px] text-ink-3">{subtitle}</p>
        ) : null}
      </div>

      <div className="flex items-center gap-1.5">
        {actions}
        <button
          type="button"
          onClick={() => setCommandOpen(true)}
          className={cn(
            "hidden h-8 items-center gap-2 rounded-full border border-hairline bg-surface-2/70 pl-2.5 pr-2 text-[11.5px] text-ink-3 transition hover:border-line hover:text-ink-2 md:flex",
          )}
        >
          <Search className="size-3.5" />
          Search
          <span className="kbd ml-2">Ctrl K</span>
        </button>
        <Tooltip content="Notifications" side="bottom">
          <button
            type="button"
            className="relative grid size-8 place-items-center rounded-full text-ink-3 transition hover:bg-surface-2 hover:text-ink"
            aria-label="Notifications"
          >
            <Bell className="size-4" />
            <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-danger ring-2 ring-app" />
          </button>
        </Tooltip>
        <button
          type="button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="grid size-8 place-items-center rounded-full text-ink-3 transition hover:bg-surface-2 hover:text-ink"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="size-4" />
          ) : (
            <Moon className="size-4" />
          )}
        </button>
        <div className="mx-1 h-5 w-px bg-hairline" />
        <button
          type="button"
          onClick={() => navigate("/settings")}
          className="flex items-center gap-2 rounded-full p-0.5 pr-2 transition hover:bg-surface-2"
          aria-label="Open profile"
        >
          <Avatar initials={DEMO_USER.initials} className="size-7" />
          <span className="hidden text-[12px] font-medium text-ink-2 lg:block">
            {DEMO_USER.name.split(" ")[0]}
          </span>
        </button>
      </div>
    </header>
  );
}
