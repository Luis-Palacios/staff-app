"use client";

import type { LeadsGroup } from "@/app/(app)/members/_actions/status-actions";

import { UserGroupIcon } from "@heroicons/react/24/outline";
import { AlertDialog, Button, buttonVariants } from "@heroui/react";
import NextLink from "next/link";
import { useTranslations } from "next-intl";

// Rule 7: a group's leader can't be deactivated. The API refuses with the groups; this sends the
// caller to the leader swap on each group page. An alertdialog, since it blocks an action.
export function LeaderBlockDialog({
  groups,
  memberName,
  onOpenChange,
}: {
  /** The groups the member leads; the dialog is open while this is set. */
  groups: LeadsGroup[] | null;
  memberName: string;
  onOpenChange: (isOpen: boolean) => void;
}) {
  const t = useTranslations("LeaderBlockDialog");

  return (
    <AlertDialog.Backdrop
      isKeyboardDismissDisabled={false}
      isOpen={groups !== null}
      onOpenChange={onOpenChange}
    >
      <AlertDialog.Container placement="auto" size="sm">
        <AlertDialog.Dialog>
          {groups && (
            <>
              <AlertDialog.Header>
                <AlertDialog.Icon status="warning">
                  <UserGroupIcon aria-hidden="true" className="size-5" />
                </AlertDialog.Icon>
                <AlertDialog.Heading>{t("title")}</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body className="flex flex-col gap-4">
                <p className="text-sm text-muted">
                  {t(groups.length > 1 ? "bodyMany" : "body", {
                    name: memberName,
                  })}
                </p>
                <ul className="flex flex-col divide-y divide-separator rounded-xl border border-separator">
                  {groups.map((group) => (
                    <li
                      key={group.id}
                      className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                    >
                      <span className="min-w-0 break-words text-sm font-semibold text-heading">
                        {group.name}
                      </span>
                      <NextLink
                        aria-label={t("changeLeaderLabel", {
                          group: group.name,
                        })}
                        className={buttonVariants({
                          size: "sm",
                          variant: "outline",
                          className: "font-semibold",
                        })}
                        href={`/groups/${group.id}`}
                      >
                        {t("changeLeader")}
                      </NextLink>
                    </li>
                  ))}
                </ul>
                <p className="text-[13px] text-muted">{t("otherRoles")}</p>
              </AlertDialog.Body>
              <AlertDialog.Footer>
                {/* eslint-disable-next-line jsx-a11y/no-autofocus -- focus starts on the only button of the alertdialog */}
                <Button autoFocus className="font-semibold" slot="close">
                  {t("close")}
                </Button>
              </AlertDialog.Footer>
            </>
          )}
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
  );
}
