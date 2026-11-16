import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-[18px] whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "border-line bg-surface-2 text-ink-2",
        accent: "border-accent/25 bg-accent-soft text-accent",
        success: "border-success/25 bg-[var(--success-soft)] text-success",
        warning: "border-warning/25 bg-[var(--warning-soft)] text-warning",
        danger: "border-danger/25 bg-[var(--danger-soft)] text-danger",
        info: "border-info/25 bg-[color-mix(in_oklab,var(--info)_14%,transparent)] text-info",
        outline: "border-line-strong bg-transparent text-ink-2",
        solid: "border-transparent bg-surface-3 text-ink",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export function StatusDot({
  tone = "idle",
  pulse,
  className,
}: {
  tone?: "idle" | "running" | "success" | "error" | "warning" | "accent";
  pulse?: boolean;
  className?: string;
}) {
  const colors: Record<string, string> = {
    idle: "var(--text-muted)",
    running: "var(--accent)",
    success: "var(--success)",
    error: "var(--danger)",
    warning: "var(--warning)",
    accent: "var(--accent)",
  };
  return (
    <span
      className={cn("status-dot", pulse && "animate-pulse-soft", className)}
      style={{ background: colors[tone] }}
    />
  );
}
