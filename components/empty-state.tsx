import type { ComponentType, ReactNode, SVGProps } from "react";

import { title as titleStyles } from "@/components/primitives";

// Placeholder for a section with nothing in it yet: dashed card, icon tile,
// display-font title and one muted line. `as` sets the heading level so it
// fits the page outline (h2 under a page's h1, h3 inside a card).
export function EmptyState({
  icon: Icon,
  title,
  children,
  as: Heading = "h2",
  className,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: ReactNode;
  children?: ReactNode;
  as?: "h2" | "h3";
  className?: string;
}) {
  return (
    <section
      className={`flex flex-col items-start gap-2.5 rounded-card border border-dashed border-field-border px-[22px] py-6 ${className ?? ""}`}
    >
      <span className="flex size-11 items-center justify-center rounded-tile bg-accent-soft text-accent-soft-foreground">
        <Icon aria-hidden="true" className="size-[22px]" strokeWidth={1.6} />
      </span>
      <Heading className={titleStyles({ className: "text-xl leading-snug" })}>
        {title}
      </Heading>
      {children && (
        <p className="max-w-prose text-sm leading-[1.55] text-muted">
          {children}
        </p>
      )}
    </section>
  );
}
