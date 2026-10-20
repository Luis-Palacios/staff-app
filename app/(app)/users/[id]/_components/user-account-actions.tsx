"use client";

import type { BanInput } from "./ban-user-dialog";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ListBox, Select } from "@heroui/react";
import { useTranslations } from "next-intl";

import { BanUserDialog } from "./ban-user-dialog";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { SavedToast } from "@/components/saved-toast";
import { authClient } from "@/lib/auth/auth-client";
import { userAccountAccess } from "@/lib/auth/permissions";
import { AUTH_ROLES, AuthRole } from "@/lib/auth/roles";
import { useAuthErrorMessage } from "@/lib/auth/use-auth-error-message";
import { useCurrentUser, usePermissions } from "@/lib/contexts/user-context";

type Overlay = "admin" | "ban" | "unban" | null;

interface ToastState {
  id: number;
  message: string;
  tone: "success" | "danger";
}

const SECONDS_PER_DAY = 60 * 60 * 24;

// Change role, ban and unban on the Account card. The controls follow the caller's permissions and
// disappear on their own row; auth-server's guard (user-admin-actions rules 5-7) is what enforces
// them, and its error codes are shown as translated text. Calls go straight to better-auth with the
// session cookie, like AssignPendingRole, then `router.refresh()` re-renders the card.
export function UserAccountActions({
  user,
}: {
  user: {
    id: string;
    name: string;
    role: AuthRole | null;
    banned: boolean | null;
  };
}) {
  const t = useTranslations("UserAccountActions");
  const tRoles = useTranslations("Roles");
  const authErrorMessage = useAuthErrorMessage();
  const router = useRouter();
  const me = useCurrentUser();
  const access = userAccountAccess(usePermissions(), me.id, user.id);

  const currentRole = user.role ?? AuthRole.Pending;
  const [role, setRole] = useState<AuthRole>(currentRole);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [isPending, setIsPending] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  // Only a caller who can manage admin accounts is offered the Admin role (rule 5).
  const roles = AUTH_ROLES.filter(
    (option) => option !== AuthRole.Admin || access.assignAdmin,
  );

  if (!access.changeRole && !access.ban) return null;

  function showToast(message: string, tone: ToastState["tone"] = "success") {
    setToast((current) => ({ id: (current?.id ?? 0) + 1, message, tone }));
  }

  // Runs one auth-server call. A failure goes to the toast, or into the dialog that is open.
  async function run(
    call: () => Promise<{
      error: { code?: string; status?: number } | null;
    }>,
    successMessage: string,
    inDialog = false,
  ) {
    setIsPending(true);
    setDialogError(null);

    const { error } = await call();

    setIsPending(false);

    if (error) {
      const message = authErrorMessage(error);

      if (inDialog) setDialogError(message);
      else {
        setOverlay(null);
        showToast(message, "danger");
      }

      return;
    }

    setOverlay(null);
    showToast(successMessage);
    router.refresh();
  }

  function saveRole() {
    if (role === currentRole) return;

    if (role === AuthRole.Admin) {
      setOverlay("admin");

      return;
    }

    void changeRole();
  }

  function changeRole() {
    return run(
      () => authClient.admin.setRole({ userId: user.id, role }),
      t("roleToast", { name: user.name }),
    );
  }

  function ban({ reason, days }: BanInput) {
    return run(
      () =>
        authClient.admin.banUser({
          userId: user.id,
          ...(reason ? { banReason: reason } : {}),
          ...(days ? { banExpiresIn: days * SECONDS_PER_DAY } : {}),
        }),
      t("bannedToast", { name: user.name }),
      true,
    );
  }

  function unban() {
    return run(
      () => authClient.admin.unbanUser({ userId: user.id }),
      t("unbannedToast", { name: user.name }),
    );
  }

  return (
    <div className="flex flex-col gap-4 border-t border-border pt-4">
      {access.changeRole && (
        <div className="flex flex-wrap items-center gap-2">
          <Select.Root
            aria-label={t("roleLabel", { name: user.name })}
            isDisabled={isPending}
            selectedKey={role}
            onSelectionChange={(key) => setRole(key as AuthRole)}
          >
            <Select.Trigger className="h-[34px] min-h-[34px] min-w-[160px] items-center rounded-control py-0 text-[13px]">
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {roles.map((option) => (
                  <ListBox.Item key={option} id={option}>
                    {tRoles(option)}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select.Root>
          <Button
            className="h-[34px] px-3 text-[13px] font-semibold md:h-[34px]"
            isDisabled={role === currentRole}
            isPending={isPending && overlay === null}
            size="sm"
            onPress={saveRole}
          >
            {t("saveRole")}
          </Button>
        </div>
      )}

      {access.ban && (
        <div>
          {user.banned ? (
            <Button
              className="font-semibold"
              isPending={isPending && overlay === null}
              variant="outline"
              onPress={() => setOverlay("unban")}
            >
              {t("unban")}
            </Button>
          ) : (
            <Button
              className="font-semibold"
              variant="danger-soft"
              onPress={() => {
                setDialogError(null);
                setOverlay("ban");
              }}
            >
              {t("ban")}
            </Button>
          )}
        </div>
      )}

      <ConfirmDialog
        confirmLabel={t("confirmAdminLabel")}
        isOpen={overlay === "admin"}
        title={t("confirmAdminTitle")}
        onConfirm={changeRole}
        onOpenChange={(isOpen) => !isOpen && setOverlay(null)}
      >
        {t("confirmAdminBody", { name: user.name })}
      </ConfirmDialog>

      <ConfirmDialog
        confirmLabel={t("unbanLabel")}
        isOpen={overlay === "unban"}
        title={t("unbanTitle", { name: user.name })}
        onConfirm={unban}
        onOpenChange={(isOpen) => !isOpen && setOverlay(null)}
      >
        {t("unbanBody")}
      </ConfirmDialog>

      <BanUserDialog
        error={dialogError}
        isOpen={overlay === "ban"}
        isPending={isPending}
        userName={user.name}
        onOpenChange={(isOpen) => !isOpen && setOverlay(null)}
        onSubmit={ban}
      />

      {toast && (
        <SavedToast key={toast.id} message={toast.message} tone={toast.tone} />
      )}
    </div>
  );
}
