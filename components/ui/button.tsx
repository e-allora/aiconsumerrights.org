import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// tap-target: 24px minimum with a mouse, 44px on touch (SC 2.5.8).
// focus-visible ring: 3px, 3:1+ on the canvas in both themes (SC 2.4.13).
// press: small scale-in on click, removed under prefers-reduced-motion.
export const buttonBase =
  "tap-target press inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-semibold focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-5 [&_svg]:shrink-0";

const buttonVariants = cva(buttonBase, {
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground shadow-depth-1 hover:bg-primary/90",
      secondary: "bg-secondary text-secondary-foreground shadow-depth-1 hover:bg-secondary/85",
      outline: "border-2 border-foreground bg-transparent hover:bg-muted",
      ghost: "hover:bg-muted",
      link: "text-primary underline underline-offset-4 hover:decoration-2",
    },
    size: {
      default: "h-11 px-5 text-base",
      sm: "h-9 px-3 text-sm",
      lg: "h-12 px-8 text-lg",
      icon: "size-11",
    },
  },
  defaultVariants: { variant: "default", size: "default" },
});

type BaseProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  Omit<VariantProps<typeof buttonVariants>, "size"> & {
    asChild?: boolean;
  };

// An icon-only button has no visible text, so it must carry an aria-label.
export type ButtonProps = BaseProps &
  (
    | { size?: "default" | "sm" | "lg" | null }
    | { size: "icon"; "aria-label": string }
  );

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        // A plain <button> inside a form submits it by default; opt in instead.
        type={asChild ? type : (type ?? "button")}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
