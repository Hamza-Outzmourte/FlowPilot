import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type = "text", ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn(
      "h-9 w-full rounded-[10px] border border-line bg-surface-2 px-3 text-[13px] text-ink placeholder:text-ink-3",
      "transition-[border-color,box-shadow,background] duration-150",
      "hover:border-line-strong focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent-soft",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full resize-y rounded-[10px] border border-line bg-surface-2 px-3 py-2.5 text-[13px] leading-relaxed text-ink placeholder:text-ink-3",
      "transition-[border-color,box-shadow,background] duration-150",
      "hover:border-line-strong focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent-soft",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "text-[12px] font-medium tracking-[0.005em] text-ink-2",
      className,
    )}
    {...props}
  />
));
Label.displayName = "Label";

export function Field({
  label,
  hint,
  required,
  children,
  className,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <Label>
          {label}
          {required ? <span className="ml-1 text-danger">*</span> : null}
        </Label>
      </div>
      {children}
      {hint ? (
        <p className="text-[11.5px] leading-snug text-ink-3">{hint}</p>
      ) : null}
    </div>
  );
}

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      className={cn(
        "h-9 w-full appearance-none rounded-[10px] border border-line bg-surface-2 pl-3 pr-8 text-[13px] text-ink",
        "transition-[border-color,box-shadow] duration-150",
        "hover:border-line-strong focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent-soft",
        className,
      )}
      {...props}
    >
      {children}
    </select>
    <svg
      viewBox="0 0 16 16"
      className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d="m4 6.5 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
));
Select.displayName = "Select";
