"use client";

import type { SmallGroupRole } from "@/api/members-api/types";
import type { SmallGroupMember } from "@/api/small-groups-api/types";

import { Dropdown, Header } from "@heroui/react";
import {
  CheckIcon,
  EllipsisVerticalIcon,
  UserCircleIcon,
  UserMinusIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { tv } from "tailwind-variants";

// Same row and group styling as the account menu (components/topbar.tsx).
const menuGroup = "w-full gap-0.5 border-t border-separator p-1.5";
const menuItem = tv({
  slots: {
    base: "h-10 min-h-0 gap-2.5 rounded-[10px] px-2.5 py-0 text-sm font-medium text-heading data-focused:bg-surface-secondary data-hovered:bg-surface-secondary",
    icon: "size-[18px] shrink-0 text-muted",
  },
  variants: {
    danger: {
      true: {
        base: "text-danger data-focused:bg-danger-soft data-hovered:bg-danger-soft",
        icon: "text-danger",
      },
    },
  },
});
const { base: item, icon: itemIcon } = menuItem();

export const ROLES: SmallGroupRole[] = ["leader", "co_leader", "member"];

// Scoped users can't assign or change the leader (rule 9).
export const SCOPED_ROLES: SmallGroupRole[] = ["co_leader", "member"];

// The dot is the same one the role badge uses: solid for leaders, hollow for
// plain members.
const ROLE_DOT: Record<SmallGroupRole, string> = {
  leader: "bg-warning-soft-foreground",
  co_leader: "bg-accent",
  member: "border-[1.5px] border-subtle",
};

// The ⋯ menu on a member row: role, a link to the member, and removal. It only
// reports what was picked; the card decides what needs confirming.
export function MemberRowMenu({
  member,
  roles,
  isDisabled,
  onChangeRole,
  onRemove,
}: {
  member: SmallGroupMember;
  /** The roles the menu offers. */
  roles: SmallGroupRole[];
  isDisabled: boolean;
  onChangeRole: (role: SmallGroupRole) => void;
  onRemove: () => void;
}) {
  const t = useTranslations("GroupMembers");
  const tRole = useTranslations("SmallGroupRole");
  const router = useRouter();

  return (
    <Dropdown.Root>
      <Dropdown.Trigger
        aria-label={t("actionsFor", { name: member.memberName })}
        className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface-secondary hover:text-heading aria-expanded:bg-surface-secondary data-pressed:transform-none"
        isDisabled={isDisabled}
      >
        <EllipsisVerticalIcon
          aria-hidden="true"
          className="size-5"
          strokeWidth={1.8}
        />
      </Dropdown.Trigger>
      <Dropdown.Popover
        className="w-[260px] max-w-[calc(100vw-2rem)] rounded-[14px] border border-overlay-border bg-surface p-0 shadow-overlay-menu"
        offset={8}
        placement="bottom end"
      >
        <Dropdown.Menu
          aria-label={t("actionsFor", { name: member.memberName })}
          className="gap-0 p-0"
        >
          <Dropdown.Section
            disallowEmptySelection
            className="w-full gap-0.5 p-1.5"
            selectedKeys={[member.role]}
            selectionMode="single"
            onSelectionChange={(keys) => {
              const [next] = keys === "all" ? [] : [...keys];

              if (
                typeof next === "string" &&
                roles.includes(next as SmallGroupRole) &&
                next !== member.role
              ) {
                onChangeRole(next as SmallGroupRole);
              }
            }}
          >
            <Header className="px-2.5 pt-1.5 pb-1 text-xs font-semibold text-muted">
              {t("roleSection")}
            </Header>
            {roles.map((role) => (
              <Dropdown.Item
                key={role}
                className={item()}
                id={role}
                textValue={tRole(role)}
              >
                {({ isSelected }) => (
                  <>
                    <span
                      aria-hidden="true"
                      className={clsx(
                        "size-[7px] shrink-0 rounded-full",
                        ROLE_DOT[role],
                      )}
                    />
                    <span className="flex-1">{tRole(role)}</span>
                    {isSelected && (
                      <CheckIcon
                        aria-hidden="true"
                        className="size-4 shrink-0 text-accent"
                        strokeWidth={2.2}
                      />
                    )}
                  </>
                )}
              </Dropdown.Item>
            ))}
          </Dropdown.Section>
          <Dropdown.Section aria-label={t("viewSection")} className={menuGroup}>
            <Dropdown.Item
              className={item()}
              textValue={t("viewMember")}
              onAction={() => router.push(`/members/${member.memberId}`)}
            >
              <UserCircleIcon
                aria-hidden="true"
                className={itemIcon()}
                strokeWidth={1.8}
              />
              <span className="flex-1">{t("viewMember")}</span>
            </Dropdown.Item>
          </Dropdown.Section>
          <Dropdown.Section
            aria-label={t("removeSection")}
            className={menuGroup}
          >
            <Dropdown.Item
              className={item({ danger: true })}
              textValue={t("remove")}
              variant="danger"
              onAction={onRemove}
            >
              <UserMinusIcon
                aria-hidden="true"
                className={itemIcon({ danger: true })}
                strokeWidth={1.8}
              />
              <span className="flex-1">{t("remove")}</span>
            </Dropdown.Item>
          </Dropdown.Section>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown.Root>
  );
}
