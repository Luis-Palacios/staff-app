"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button } from "@heroui/react";
import { useTranslations } from "next-intl";

import { authButton, authStack } from "../../_components/auth-styles";

import { authClient } from "@/lib/auth/auth-client";

export function NeedsRoleActions() {
  const t = useTranslations("NeedsRolePage");
  const router = useRouter();
  const [isChecking, startTransition] = useTransition();
  const [hasChecked, setHasChecked] = useState(false);

  // Every check is router.refresh(): it re-renders the server page, which
  // redirects to "/" once the user has a role. If they are still pending,
  // this component stays mounted and the transition just ends.

  // Re-check when the user comes back to the tab, e.g. after an admin tells
  // them they have been approved. Silent: no "still waiting" note.
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        startTransition(() => router.refresh());
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [router]);

  function handleCheckAccess() {
    setHasChecked(true);
    startTransition(() => router.refresh());
  }

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/sign-in");
  }

  return (
    <div className={authStack}>
      {hasChecked && !isChecking ? (
        <Alert status="warning">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{t("stillWaiting")}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}

      <Button
        fullWidth
        className={authButton}
        isPending={isChecking}
        onPress={handleCheckAccess}
      >
        {t("checkAccess")}
      </Button>
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
