"use client";

import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { useTranslations } from "next-intl";

import { AuthHeading } from "../_components/auth-heading";
import { authButton, authStack } from "../_components/auth-styles";

import { authClient } from "@/lib/auth/auth-client";

export default function NeedsRolePage() {
  const t = useTranslations("NeedsRolePage");
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/sign-in");
  }

  return (
    <div className={authStack}>
      <AuthHeading title={t("title")}>{t("body")}</AuthHeading>
      <Button
        fullWidth
        className={authButton}
        variant="danger-soft"
        onPress={handleSignOut}
      >
        {t("signOut")}
      </Button>
    </div>
  );
}
