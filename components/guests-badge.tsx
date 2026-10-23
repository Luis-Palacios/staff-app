import { HandRaisedIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useTranslations } from "next-intl";

// Marks a guest group. An outline pill, never filled: it names a kind of group, not a status.
export function GuestsBadge({ className }: { className?: string }) {
  const t = useTranslations("GuestsBadge");

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-field-border py-0.5 pl-2 pr-2.5 text-[12.5px] font-semibold text-heading",
        className,
      )}
    >
      <HandRaisedIcon
        aria-hidden="true"
        className="size-3.5 text-eyebrow"
        strokeWidth={1.8}
      />
      {t("label")}
    </span>
  );
}
