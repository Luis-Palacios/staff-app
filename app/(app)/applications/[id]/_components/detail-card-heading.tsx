import { title } from "@/components/primitives";

// Eyebrow + display title at the top of the testimony and timeline cards.
export function DetailCardHeading({
  eyebrow,
  children,
}: {
  eyebrow: string;
  children: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-eyebrow">
        {eyebrow}
      </span>
      <h2 className={title({ size: "sm" })}>{children}</h2>
    </div>
  );
}
