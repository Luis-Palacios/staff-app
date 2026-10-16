import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { AuthHeading } from "../_components/auth-heading";
import { authStack } from "../_components/auth-styles";

import { NeedsRoleActions } from "./_components/needs-role-actions";

import { getServerSession } from "@/api/auth-api/helpers/get-server-session";
import { AuthRole } from "@/lib/auth/roles";

export default async function NeedsRolePage() {
  const [session, t] = await Promise.all([
    getServerSession(),
    getTranslations("NeedsRolePage"),
  ]);

  if (!session) {
    redirect("/sign-in");
  }

  // auth-server reads the user row on every get-session (no cookie cache), so
  // a role given since sign-in shows up here on the next request. Send the
  // user on; the (app) layout re-checks everything else. No role counts as
  // `pending`, like in requireStaffSession, or the two would redirect in a loop.
  if (session.user.role && session.user.role !== AuthRole.Pending) {
    redirect("/");
  }

  return (
    <div className={authStack}>
      <AuthHeading title={t("title")}>{t("body")}</AuthHeading>
      <NeedsRoleActions />
    </div>
  );
}
