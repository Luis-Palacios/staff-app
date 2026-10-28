import { HandRaisedIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import NextLink from "next/link";
import { useTranslations } from "next-intl";

/**
 * A tagged person (rule 11): their first name (first name and last initial when two tagged people
 * share one), the full name in the tooltip and for screen readers. Members have a soft accent fill,
 * guests an outline with the waving hand. `highlighted` is the person whose page it is. A chip with
 * an `href` is a link (rule 12); otherwise it's plain.
 */
export function ReportPersonChip({
  person,
  label,
  href,
  highlighted = false,
  className,
}: {
  person: { type: "member" | "guest"; name: string };
  label: string;
  href?: string;
  highlighted?: boolean;
  className?: string;
}) {
  const t = useTranslations("ReportItems");
  const full =
    person.type === "guest"
      ? t("chipGuest", { name: person.name })
      : person.name;
  const classes = clsx(
    "inline-flex items-center gap-1 rounded-md px-1.5 align-baseline text-[0.92em] font-semibold",
    highlighted
      ? "bg-accent text-accent-foreground"
      : person.type === "guest"
        ? "border border-field-border text-heading"
        : "bg-accent-soft text-accent-soft-foreground",
    href && "underline-offset-[3px] hover:underline",
    className,
  );
  const content = (
    <>
      {person.type === "guest" && (
        <HandRaisedIcon
          aria-hidden="true"
          className={clsx(
            "size-3 shrink-0",
            highlighted ? "text-current" : "text-eyebrow",
          )}
          strokeWidth={1.8}
        />
      )}
      <span aria-hidden="true">{label}</span>
      <span className="sr-only">{full}</span>
    </>
  );

  return href ? (
    <NextLink className={classes} href={href} title={full}>
      {content}
    </NextLink>
  ) : (
    <span className={classes} title={full}>
      {content}
    </span>
  );
}
