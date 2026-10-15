"use client";

import type { LinkedMembers } from "./users-browser";

import NextLink from "next/link";
import { useTranslations } from "next-intl";

import { textLink } from "@/components/primitives";

// The member a user is linked to, or muted "Not linked".
export function UserMemberLink({ member }: { member?: LinkedMembers[string] }) {
  const t = useTranslations("UsersTable");

  if (!member) return <span className="text-subtle">{t("notLinked")}</span>;

  return (
    <NextLink className={textLink()} href={`/members/${member.id}`}>
      {member.name}
    </NextLink>
  );
}
