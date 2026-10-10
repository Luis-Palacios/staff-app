import type { ReactNode } from "react";

import { title } from "@/components/primitives";

// The <h1> and one muted line at the top of every auth screen.
export function AuthHeading({
  title: heading,
  children,
}: {
  title: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <h1 className={title({ size: "md" })}>{heading}</h1>
      {children && <p className="text-[15.5px] text-muted">{children}</p>}
    </div>
  );
}
