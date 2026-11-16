import { Home, LogOut, PanelLeft, Plus, Search, Workflow } from "lucide-react";
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Tooltip } from "@/components/ui/overlays";
import { cn } from "@/lib/utils";
import { createStoredWorkflow } from "@/lib/storage";
import { useUiStore } from "@/stores/ui.store";

interface RailItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  to?: string;
  onClick?: () => void;
  badge?: boolean;
  accent?: boolean;
}

interface RailGroup {
  id: string;
  label: string;
  items: RailItem[];
}

export function Sidebar() {
  const navigate = useNavigate();
  const setCommandOpen = useUiStore((state) => state.setCommandOpen);
  const [expanded, setExpanded] = useState(false);

  const newWorkflow = () => {
    const workflow = createStoredWorkflow({ name: "Untitled workflow" });
    navigate(`/workflows/${workflow.id}`);
  };

  const quickItems: RailItem[] = [
    {
      id: "add",
      label: "New workflow",
      icon: <Plus className="size-[18px]" />,
      onClick: newWorkflow,
    },
    {
      id: "search",
      label: "Search",
      icon: <Search className="size-[18px]" />,
      onClick: () => setCommandOpen(true),
    },
    {
      id: "toggle",
      label: expanded ? "Collapse panel" : "Expand panel",
      icon: <PanelLeft className="size-[18px]" />,
      onClick: () => setExpanded((value) => !value),
    },
  ];

  const groups: RailGroup[] = [
    {
      id: "workspace",
      label: "Workspace",
      items: [
        {
          id: "home",
          label: "Dashboard",
          icon: <Home className="size-[18px]" />,
          to: "/dashboard",
        },
        {
          id: "workflows",
          label: "Workflows",
          icon: <Workflow className="size-[18px]" />,
          to: "/workflows",
        },
      ],
    },
  ];

  const footerItems: RailItem[] = [
    {
      id: "signout",
      label: "Sign out",
      icon: <LogOut className="size-[18px]" />,
      onClick: () => navigate("/login"),
    },
  ];

  return (
    <aside
      className={cn(
        "relative z-30 flex h-full shrink-0 flex-col border-r border-hairline bg-app transition-[width] duration-200",
        expanded ? "w-[196px]" : "w-12",
      )}
    >
      <div
        className={cn(
          "flex h-[78px] shrink-0 items-center",
          expanded ? "gap-2 px-3" : "justify-center",
        )}
      >
        <Tooltip content="FlowPilot" side="right">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="grid size-7 shrink-0 place-items-center rounded-[9px] bg-accent text-white shadow-[0_4px_14px_var(--accent-glow)]"
            aria-label="FlowPilot home"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
              <path d="M13.6 2 5.3 13.5h4.3L9 22l8.4-11.5h-4.3L13.6 2Z" />
            </svg>
          </button>
        </Tooltip>
        {expanded ? (
          <span className="truncate text-[13px] font-semibold tracking-[-0.01em] text-ink">
            FlowPilot
          </span>
        ) : null}
      </div>

      <nav className="flex flex-1 flex-col items-stretch px-1.5">
        <div className="flex flex-col gap-0.5">
          {quickItems.map((item) => (
            <RailButton key={item.id} item={item} expanded={expanded} />
          ))}
        </div>

        {groups.map((group, index) => (
          <div
            key={group.id}
            className={cn("flex flex-col gap-0.5", index > 0 && "mt-2")}
          >
            <RailGroupLabel expanded={expanded}>{group.label}</RailGroupLabel>
            {group.items.map((item) => (
              <RailButton key={item.id} item={item} expanded={expanded} />
            ))}
          </div>
        ))}

        <div className="mt-auto flex flex-col gap-0.5 pb-2">
          <div className="mx-1.5 mb-1.5 h-px bg-hairline" />
          {footerItems.map((item) => (
            <RailButton key={item.id} item={item} expanded={expanded} />
          ))}
          {expanded ? (
            <p className="px-2.5 pt-2 text-[9.5px] font-medium uppercase tracking-[0.1em] text-ink-3/60">
              Local workspace
            </p>
          ) : null}
        </div>
      </nav>
    </aside>
  );
}

function RailGroupLabel({
  expanded,
  children,
}: {
  expanded: boolean;
  children: React.ReactNode;
}) {
  if (!expanded) {
    return <div className="mx-1.5 my-2 h-px bg-hairline" aria-hidden />;
  }
  return (
    <div className="px-2.5 pb-1 pt-3 text-[9.5px] font-semibold uppercase tracking-[0.12em] text-ink-3/70">
      {children}
    </div>
  );
}

function RailButton({ item, expanded }: { item: RailItem; expanded: boolean }) {
  const content = (
    <>
      <span className="fp-rail-active-bar" aria-hidden />
      <div className="grid size-6 place-items-center">{item.icon}</div>
      {item.badge ? (
        <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-danger ring-2 ring-app" />
      ) : null}
    </>
  );

  if (item.to) {
    return (
      <Tooltip content={item.label} side="right" delay={240}>
        <NavLink
          to={item.to}
          end={item.to === "/"}
          className={({ isActive }) =>
            cn(
              "group relative flex h-9 items-center gap-2.5 rounded-[9px] text-ink-3 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
              expanded ? "px-2.5" : "justify-center",
              isActive
                ? "bg-surface-2 text-ink shadow-[inset_0_0_0_1px_var(--line-subtle)]"
                : "hover:bg-surface-2/70 hover:text-ink-2",
            )
          }
          aria-label={item.label}
        >
          {content}
          {expanded ? (
            <span className="truncate text-[12.5px] font-medium">
              {item.label}
            </span>
          ) : null}
        </NavLink>
      </Tooltip>
    );
  }

  return (
    <Tooltip content={item.label} side="right" delay={240}>
      <button
        type="button"
        onClick={item.onClick}
        aria-label={item.label}
        className={cn(
          "group relative flex h-9 items-center gap-2.5 rounded-[9px] text-ink-3 transition-colors hover:bg-surface-2/70 hover:text-ink-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          expanded ? "px-2.5" : "justify-center",
          item.accent && "text-accent hover:bg-accent-soft hover:text-accent",
        )}
      >
        {content}
        {expanded ? (
          <span className="truncate text-[12.5px] font-medium">
            {item.label}
          </span>
        ) : null}
      </button>
    </Tooltip>
  );
}
