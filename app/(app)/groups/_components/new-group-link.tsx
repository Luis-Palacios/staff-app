import { PlusIcon } from "@heroicons/react/24/outline";
import { buttonVariants } from "@heroui/react";
import NextLink from "next/link";
import { useTranslations } from "next-intl";

// "New group" entry point. `primary` is the Groups page header action and
// `empty` is the "Create the first group" action of the empty state.
export function NewGroupLink({ variant }: { variant: "primary" | "empty" }) {
  const t = useTranslations("NewGroupLink");

  return (
    <NextLink
      className={buttonVariants({
        variant: variant === "primary" ? "primary" : "outline",
        className: "h-[42px] gap-2 px-[18px] md:h-[42px]",
      })}
      href="/groups/new"
    >
      <PlusIcon aria-hidden="true" className="size-[18px]" strokeWidth={1.8} />
      {variant === "empty" ? t("first") : t("label")}
    </NextLink>
  );
}
