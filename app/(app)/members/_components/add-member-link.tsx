import { PlusIcon, UserPlusIcon } from "@heroicons/react/24/outline";
import { buttonVariants } from "@heroui/react";
import NextLink from "next/link";
import { useTranslations } from "next-intl";

// "Add member" entry point. `primary` is the Members page header action,
// `outline` sits beside "Invite staff" on the dashboard, and `empty` is the
// "Add the first member" action of the empty state.
export function AddMemberLink({
  variant,
}: {
  variant: "primary" | "outline" | "empty";
}) {
  const t = useTranslations("AddMemberLink");
  const Icon = variant === "empty" ? PlusIcon : UserPlusIcon;

  return (
    <NextLink
      className={buttonVariants({
        variant: variant === "primary" ? "primary" : "outline",
        className: "h-[42px] gap-2 px-[18px] md:h-[42px]",
      })}
      href="/members/new"
    >
      <Icon aria-hidden="true" className="size-[18px]" strokeWidth={1.8} />
      {variant === "empty" ? t("first") : t("label")}
    </NextLink>
  );
}
