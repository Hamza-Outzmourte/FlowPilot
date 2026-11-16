import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { Check, ChevronRight, X } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Tooltip                                                             */
/* ------------------------------------------------------------------ */

export const TooltipProvider = TooltipPrimitive.Provider;

export function Tooltip({
  children,
  content,
  side = "right",
  delay = 300,
  shortcut,
}: {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  delay?: number;
  shortcut?: string;
}) {
  return (
    <TooltipPrimitive.Root delayDuration={delay}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={8}
          className="z-[120] flex items-center gap-2 rounded-[8px] border border-line bg-surface px-2.5 py-1.5 text-[11.5px] font-medium text-ink shadow-[var(--shadow-float)] animate-scale-in"
        >
          {content}
          {shortcut ? <span className="kbd">{shortcut}</span> : null}
          <TooltipPrimitive.Arrow className="fill-[var(--bg-surface)]" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}

/* ------------------------------------------------------------------ */
/* Dialog                                                              */
/* ------------------------------------------------------------------ */

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    hideClose?: boolean;
    overlayClassName?: string;
  }
>(({ className, children, hideClose, overlayClassName, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay
      className={cn(
        "fixed inset-0 z-[100] bg-black/55 backdrop-blur-[3px] data-[state=open]:animate-[fp-fade-in_.18s_ease-out]",
        overlayClassName,
      )}
    />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-1/2 top-1/2 z-[101] w-[calc(100vw-48px)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-[16px] border border-line bg-surface shadow-[var(--shadow-float)] animate-scale-in",
        className,
      )}
      {...props}
    >
      {children}
      {!hideClose ? (
        <DialogPrimitive.Close
          className="absolute right-3.5 top-3.5 grid size-8 place-items-center rounded-lg text-ink-3 transition hover:bg-surface-2 hover:text-ink"
          aria-label="Close"
        >
          <X className="size-4" />
        </DialogPrimitive.Close>
      ) : null}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
DialogContent.displayName = "DialogContent";

export function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col gap-1 px-5 pb-3 pt-5", className)}
      {...props}
    />
  );
}

export function DialogTitle({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn(
        "text-[17px] font-semibold tracking-[-0.01em] text-ink",
        className,
      )}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn("text-[12.5px] leading-relaxed text-ink-3", className)}
      {...props}
    />
  );
}

export function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-2 border-t border-hairline px-5 py-3.5",
        className,
      )}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Dropdown menu                                                       */
/* ------------------------------------------------------------------ */

export const DropdownMenu = DropdownPrimitive.Root;
export const DropdownMenuTrigger = DropdownPrimitive.Trigger;
export const DropdownMenuGroup = DropdownPrimitive.Group;

export const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <DropdownPrimitive.Portal>
    <DropdownPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-[110] min-w-[200px] overflow-hidden rounded-[11px] border border-line bg-surface p-1 shadow-[var(--shadow-float)] animate-scale-in",
        className,
      )}
      {...props}
    />
  </DropdownPrimitive.Portal>
));
DropdownMenuContent.displayName = "DropdownMenuContent";

export const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Item> & {
    danger?: boolean;
    shortcut?: string;
  }
>(({ className, danger, shortcut, children, ...props }, ref) => (
  <DropdownPrimitive.Item
    ref={ref}
    className={cn(
      "flex h-8 cursor-pointer select-none items-center gap-2.5 rounded-[7px] px-2.5 text-[12.5px] text-ink-2 outline-none transition-colors",
      "data-[highlighted]:bg-surface-2 data-[highlighted]:text-ink",
      danger &&
        "text-danger data-[highlighted]:bg-[var(--danger-soft)] data-[highlighted]:text-danger",
      className,
    )}
    {...props}
  >
    <span className="flex flex-1 items-center gap-2.5 [&_svg]:size-3.5 [&_svg]:shrink-0">
      {children}
    </span>
    {shortcut ? <span className="kbd">{shortcut}</span> : null}
  </DropdownPrimitive.Item>
));
DropdownMenuItem.displayName = "DropdownMenuItem";

export function DropdownMenuLabel({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Label>) {
  return (
    <DropdownPrimitive.Label
      className={cn(
        "px-2.5 pb-1 pt-2 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-3",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Separator>) {
  return (
    <DropdownPrimitive.Separator
      className={cn("-mx-1 my-1 h-px bg-hairline", className)}
      {...props}
    />
  );
}

export function DropdownMenuSub({
  children,
  label,
  icon,
}: {
  children: React.ReactNode;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <DropdownPrimitive.Sub>
      <DropdownPrimitive.SubTrigger className="flex h-8 cursor-pointer select-none items-center gap-2.5 rounded-[7px] px-2.5 text-[12.5px] text-ink-2 outline-none data-[state=open]:bg-surface-2 data-[highlighted]:bg-surface-2 data-[highlighted]:text-ink">
        {icon}
        <span className="flex-1">{label}</span>
        <ChevronRight className="size-3.5 text-ink-3" />
      </DropdownPrimitive.SubTrigger>
      <DropdownPrimitive.Portal>
        <DropdownPrimitive.SubContent className="z-[111] min-w-[170px] rounded-[11px] border border-line bg-surface p-1 shadow-[var(--shadow-float)] animate-scale-in">
          {children}
        </DropdownPrimitive.SubContent>
      </DropdownPrimitive.Portal>
    </DropdownPrimitive.Sub>
  );
}

export function DropdownMenuCheckboxItem({
  checked,
  children,
  onCheckedChange,
}: {
  checked: boolean;
  children: React.ReactNode;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <DropdownPrimitive.CheckboxItem
      checked={checked}
      onCheckedChange={onCheckedChange}
      className="flex h-8 cursor-pointer select-none items-center gap-2 rounded-[7px] px-2.5 text-[12.5px] text-ink-2 outline-none data-[highlighted]:bg-surface-2 data-[highlighted]:text-ink"
    >
      <span className="grid size-3.5 place-items-center">
        {checked ? <Check className="size-3.5 text-accent" /> : null}
      </span>
      {children}
    </DropdownPrimitive.CheckboxItem>
  );
}
