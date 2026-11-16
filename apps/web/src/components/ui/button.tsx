import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-[13px] font-medium transition-[background,color,border-color,box-shadow,transform] duration-150 ease-out disabled:pointer-events-none disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:translate-y-px [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_6px_18px_var(--accent-glow)] hover:bg-accent-hover",
        secondary:
          "border border-line bg-surface-2 text-ink hover:border-line-strong hover:bg-surface-3",
        outline:
          "border border-line-strong bg-transparent text-ink hover:bg-surface-2",
        ghost:
          "text-ink-2 hover:bg-surface-2 hover:text-ink",
        soft: "bg-accent-soft text-accent hover:bg-[color-mix(in_oklab,var(--accent)_22%,transparent)]",
        inverse:
          "bg-[#f4f4f6] text-[#111114] shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_8px_26px_rgba(0,0,0,0.35)] hover:bg-white",
        danger:
          "bg-danger text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] hover:bg-[#dc2f2f]",
        dangerGhost:
          "text-danger hover:bg-danger-soft",
        link: "text-accent underline-offset-4 hover:underline",
      },
      size: {
        xs: "h-7 rounded-lg px-2.5 text-xs [&_svg]:size-3.5",
        sm: "h-8 px-3 text-[12.5px] [&_svg]:size-4",
        md: "h-9 px-3.5 [&_svg]:size-4",
        lg: "h-10 px-4 text-sm [&_svg]:size-4",
        xl: "h-11 px-5 text-sm [&_svg]:size-[18px]",
        icon: "size-9 [&_svg]:size-4",
        iconSm: "size-7 rounded-lg [&_svg]:size-3.5",
        iconXs: "size-6 rounded-md [&_svg]:size-3",
        iconLg: "size-11 rounded-xl [&_svg]:size-[18px]",
      },
      pill: {
        true: "rounded-full",
      },
    },
    defaultVariants: {
      variant: "secondary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, pill, asChild = false, ...props }, ref) => {
    const Component = asChild ? Slot : "button";
    return (
      <Component
        ref={ref}
        className={cn(buttonVariants({ variant, size, pill }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
