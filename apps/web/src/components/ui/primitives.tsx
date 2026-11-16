import * as AvatarPrimitive from "@radix-ui/react-avatar";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { Check, Copy } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

export function Switch({
  checked,
  onCheckedChange,
  disabled,
  className,
  id,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}) {
  return (
    <SwitchPrimitive.Root
      id={id}
      checked={checked}
      disabled={disabled}
      onCheckedChange={onCheckedChange}
      className={cn(
        "relative h-[20px] w-[34px] shrink-0 rounded-full border border-line bg-surface-3 transition-colors duration-150",
        "data-[state=checked]:border-accent data-[state=checked]:bg-accent",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      <SwitchPrimitive.Thumb className="block size-[14px] translate-x-[2px] rounded-full bg-ink shadow-[0_1px_2px_rgba(0,0,0,.4)] transition-transform duration-150 data-[state=checked]:translate-x-[16px] data-[state=checked]:bg-white" />
    </SwitchPrimitive.Root>
  );
}

export const Tabs = TabsPrimitive.Root;
export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-8 items-center gap-0.5 rounded-[9px] border border-hairline bg-surface-2 p-0.5",
      className,
    )}
    {...props}
  />
));
TabsList.displayName = "TabsList";

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex h-7 items-center justify-center gap-1.5 rounded-[7px] px-2.5 text-[12px] font-medium text-ink-3 transition-colors",
      "hover:text-ink-2 data-[state=active]:bg-surface data-[state=active]:text-ink data-[state=active]:shadow-sm",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = "TabsTrigger";

export const TabsContent = TabsPrimitive.Content;

export function Avatar({
  initials,
  className,
  src,
}: {
  initials: string;
  className?: string;
  src?: string;
}) {
  return (
    <AvatarPrimitive.Root
      className={cn(
        "relative grid size-8 shrink-0 place-items-center overflow-hidden rounded-full border border-line bg-surface-2",
        className,
      )}
    >
      {src ? <AvatarPrimitive.Image src={src} className="size-full object-cover" /> : null}
      <AvatarPrimitive.Fallback className="grid size-full place-items-center bg-[linear-gradient(135deg,var(--accent),#22d3ee)] text-[11px] font-semibold text-white">
        {initials}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("skeleton", className)} {...props} />;
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return <span className="kbd">{children}</span>;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-14 text-center",
        className,
      )}
    >
      <div className="mb-4 grid size-12 place-items-center rounded-[14px] border border-line bg-surface-2 text-ink-3">
        {icon}
      </div>
      <h3 className="text-[14px] font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-sm text-[12.5px] leading-relaxed text-ink-3">
        {description}
      </p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function CodeBlock({
  value,
  language = "json",
  className,
  maxHeight = "100%",
}: {
  value: string;
  language?: "json" | "text";
  className?: string;
  maxHeight?: string;
}) {
  const [copied, setCopied] = React.useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-[10px] border border-hairline bg-canvas",
        className,
      )}
    >
      <button
        type="button"
        onClick={copy}
        className="absolute right-2 top-2 z-10 grid size-7 place-items-center rounded-md border border-line bg-surface/80 text-ink-3 opacity-0 backdrop-blur transition hover:text-ink group-hover:opacity-100"
        aria-label="Copy JSON"
      >
        {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
      </button>
      <pre
        className="overflow-auto p-3.5 font-mono text-[11.5px] leading-[1.7] text-ink-2"
        style={{ maxHeight }}
      >
        <code>{value}</code>
      </pre>
      {language === "json" ? (
        <span className="pointer-events-none absolute bottom-2 right-2.5 font-mono text-[9.5px] uppercase tracking-widest text-ink-3/60">
          JSON
        </span>
      ) : null}
    </div>
  );
}

export function ProgressBar({
  value,
  className,
  color = "var(--accent)",
}: {
  value: number;
  className?: string;
  color?: string;
}) {
  return (
    <div
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-surface-3", className)}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-[width] duration-300"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }}
      />
    </div>
  );
}
