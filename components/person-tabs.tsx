import clsx from "clsx";
import NextLink from "next/link";
import { useTranslations } from "next-intl";

// Profile · Timeline under a person's header (rule 19). Two links, each its own route, so Back
// works and the tab can be shared; the current one carries `aria-current` and a gold underline
// (decorative: the word itself is in the heading color).
export function PersonTabs({
  basePath,
  current,
  name,
}: {
  /** `/members/12` or `/guests/7`. */
  basePath: string;
  current: "profile" | "timeline";
  /** The person's name, the nav's label. */
  name: string;
}) {
  const t = useTranslations("PersonTabs");
  const tabs = [
    { key: "profile", href: basePath },
    { key: "timeline", href: `${basePath}/timeline` },
  ] as const;

  return (
    <nav aria-label={name} className="-mt-2 mb-6 border-b border-border">
      <ul className="flex gap-6">
        {tabs.map((tab) => (
          <li key={tab.key}>
            <NextLink
              aria-current={current === tab.key ? "page" : undefined}
              className={clsx(
                "-mb-px inline-flex h-11 items-center border-b-[3px] text-[15px] font-semibold",
                current === tab.key
                  ? "border-gold-500 text-heading"
                  : "border-transparent text-muted hover:text-heading",
              )}
              href={tab.href}
            >
              {t(tab.key)}
            </NextLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
