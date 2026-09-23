"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type CardContextValue = { titleId?: string };
const CardContext = React.createContext<CardContextValue>({});

type CardProps = React.HTMLAttributes<HTMLElement> & {
  /** "article" and "section" are labelled by their CardTitle. */
  as?: "article" | "section" | "div" | "li";
  /** Lift and tilt on hover or keyboard focus inside the card. */
  interactive?: boolean;
};

const Card = React.forwardRef<HTMLElement, CardProps>(
  ({ as: Comp = "article", interactive = false, className, ...props }, ref) => {
    const titleId = React.useId();
    const labelled = Comp === "article" || Comp === "section";
    return (
      <CardContext.Provider value={{ titleId: labelled ? titleId : undefined }}>
        <Comp
          ref={ref as React.Ref<HTMLDivElement & HTMLLIElement>}
          aria-labelledby={labelled ? titleId : undefined}
          className={cn(
            "depth-card",
            interactive && "depth-card-interactive",
            className
          )}
          {...props}
        />
      </CardContext.Provider>
    );
  }
);
Card.displayName = "Card";

const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col gap-2 p-6", className)} {...props} />
);

type CardTitleProps = React.HTMLAttributes<HTMLHeadingElement> & {
  /** Heading level that fits the page outline. Defaults to h3. */
  as?: "h2" | "h3" | "h4";
};

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ as: Heading = "h3", className, id, ...props }, ref) => {
    const { titleId } = React.useContext(CardContext);
    return (
      <Heading
        ref={ref}
        id={id ?? titleId}
        className={cn("font-display text-display-sm", className)}
        {...props}
      />
    );
  }
);
CardTitle.displayName = "CardTitle";

const CardDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-base text-muted-foreground", className)} {...props} />
);

const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("px-6 pb-6", className)} {...props} />
);

const CardFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex items-center gap-3 px-6 pb-6", className)} {...props} />
);

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
