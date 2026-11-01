import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { buttonVariants } from "@heroui/react";
import NextLink from "next/link";
import { getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/empty-state";

// Unknown routes and `notFound()` calls inside the shell: the sidebar and top
// bar stay mounted, so the card sits in the main region like error.tsx.
export default async function NotFound() {
  const t = await getTranslations("NotFound");

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-xl items-center">
      <EmptyState
        action={
          <NextLink
            className={buttonVariants({
              variant: "outline",
              className: "font-semibold text-heading",
            })}
            href="/"
            prefetch={false}
          >
            {t("action")}
          </NextLink>
        }
        as="h1"
        className="w-full"
        icon={MagnifyingGlassIcon}
        title={t("title")}
      >
        {t("body")}
      </EmptyState>
    </div>
  );
}
