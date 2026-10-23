import { PlusIcon, UserPlusIcon } from "@heroicons/react/24/outline";
import { buttonVariants } from "@heroui/react";
import NextLink from "next/link";
import { useTranslations } from "next-intl";

// "Add guest" entry point: the Guests page header action, or the empty state's.
export function AddGuestLink({ variant }: { variant: "primary" | "empty" }) {
  const t = useTranslations("AddGuestLink");
  const Icon = variant === "empty" ? PlusIcon : UserPlusIcon;

  return (
    <NextLink
      className={buttonVariants({
        variant: variant === "primary" ? "primary" : "outline",
        className: "h-[42px] gap-2 px-[18px] md:h-[42px]",
      })}
      href="/guests/new"
    >
      <Icon aria-hidden="true" className="size-[18px]" strokeWidth={1.8} />
      {variant === "empty" ? t("first") : t("label")}
    </NextLink>
  );
}
