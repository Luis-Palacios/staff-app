import NextLink from "next/link";
import { getTranslations } from "next-intl/server";

import { listConversations } from "@/api/conversations-api/client";
import { ConversationRow } from "@/app/(app)/conversations/_components/conversation-row";
import { card, textLink, title } from "@/components/primitives";
import { getPermissions } from "@/lib/auth/get-permissions";
import {
  canSeeConversationsInbox,
  getSmallGroupAccess,
} from "@/lib/auth/permissions";
import { isPersonInboxItem } from "@/lib/conversation-format";
import { getEnv } from "@/lib/env/server";
import { settle } from "@/lib/settle";

const ROWS = 3;

/**
 * "Waiting for your reply": up to 3 conversations at the top of the leader and elder dashboards,
 * with the full count and a link to the inbox. Hidden when there are none, when the caller can't
 * see conversations, and when the read fails (the rest of the dashboard doesn't depend on it).
 */
export async function WaitingForReplyCard() {
  const permissions = await getPermissions();

  if (!canSeeConversationsInbox(permissions)) return null;

  const [t, inbox] = await Promise.all([
    getTranslations("Conversations"),
    settle(listConversations({ tab: "reply", limit: ROWS })),
  ]);

  if (!inbox.ok) return null;

  const { counts } = inbox.value;
  const items = inbox.value.items.filter(isPersonInboxItem);

  if (items.length === 0) return null;

  const elder = getSmallGroupAccess(permissions) === "full";

  return (
    <section
      aria-labelledby="waiting-for-reply"
      className={card({ className: "mb-7 flex flex-col overflow-hidden" })}
    >
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 px-[18px] pb-3 pt-5 sm:px-[22px]">
        <div className="flex flex-col gap-1">
          <h2
            className={title({
              size: "sm",
              className: "flex items-center gap-2.5 text-[22px]",
            })}
            id="waiting-for-reply"
          >
            {t("waitingTitle")}
            <span className="rounded-full bg-gold-500 px-2 py-px text-xs font-bold tabular-nums text-navy-900">
              {counts.reply}
            </span>
          </h2>
          <p className="text-[13.5px] text-muted">
            {elder ? t("waitingElder") : t("waitingLeader")}
          </p>
        </div>
        <NextLink className={textLink()} href="/conversations">
          {t("all")}
        </NextLink>
      </header>
      <ul className="divide-y divide-separator border-t border-separator">
        {items.map((item) => (
          <li key={item.id}>
            <ConversationRow
              compact
              item={item}
              timeZone={getEnv().CHURCH_TIMEZONE}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
