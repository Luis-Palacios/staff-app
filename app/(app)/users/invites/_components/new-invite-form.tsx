"use client";

import type { SubmitEvent } from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, InputGroup, ListBox, Select, TextField } from "@heroui/react";
import { Label } from "@heroui/react/label";
import { useTranslations } from "next-intl";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { card, title } from "@/components/primitives";
import { authClient } from "@/lib/auth/auth-client";
import { AUTH_ROLES, AuthRole } from "@/lib/auth/roles";
import { useAuthErrorMessage } from "@/lib/auth/use-auth-error-message";

// Same "don't invite someone directly into pending" reasoning as AssignPendingRole's own
// ASSIGNABLE_ROLES filter (duplicated here rather than shared - see assign-pending-role.tsx).
const ASSIGNABLE_ROLES = AUTH_ROLES.filter((role) => role !== AuthRole.Pending);

export function NewInviteForm() {
  const t = useTranslations("NewInviteForm");
  const tRoles = useTranslations("Roles");
  const authErrorMessage = useAuthErrorMessage();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AuthRole | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Admin invites need a second look before they go out.
  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email || !role) return;

    if (role === AuthRole.Admin) {
      setIsConfirmOpen(true);

      return;
    }

    sendInvite(email, role);
  }

  async function sendInvite(email: string, role: AuthRole) {
    setIsSubmitting(true);
    setError(null);

    const { error: createError } = await authClient.invite.create({
      email,
      role,
      // redirectToSignUp/redirectToSignIn are deliberately not sent - auth-server's
      // sendUserInvitation builds its own accept-invite URL (see its auth.ts) rather than using
      // the plugin's own link-building, so these would never be read anyway. redirectToAfterUpgrade
      // is still real: persisted on the invite row itself and read back at click-time to redirect
      // here after the role-upgrade hook fires (see better-invite's hooks.ts).
      redirectToAfterUpgrade: `${window.location.origin}/`,
    });

    if (createError) {
      setError(authErrorMessage(createError));
      setIsSubmitting(false);

      return;
    }

    setEmail("");
    setRole(null);
    setIsSubmitting(false);
    router.refresh();
  }

  return (
    <section className={card({ className: "flex flex-col gap-4 p-[22px]" })}>
      <div>
        <h2 className={title({ size: "sm" })}>{t("title")}</h2>
        <p className="mt-0.5 text-[13.5px] text-muted">{t("subtitle")}</p>
      </div>
      <form className="flex flex-wrap items-end gap-3" onSubmit={handleSubmit}>
        <TextField
          isRequired
          className="flex-[1_1_260px] gap-1.5"
          isDisabled={isSubmitting}
          type="email"
          value={email}
          onChange={setEmail}
        >
          <Label className="font-semibold text-heading">{t("email")}</Label>
          <InputGroup className="h-10 w-full">
            <InputGroup.Input
              className="text-sm sm:text-sm"
              placeholder="person@example.com"
            />
          </InputGroup>
        </TextField>

        <Select.Root
          isRequired
          className="w-full gap-1.5 sm:w-[200px]"
          isDisabled={isSubmitting}
          placeholder={t("rolePlaceholder")}
          selectedKey={role}
          onSelectionChange={(key) => setRole(key as AuthRole | null)}
        >
          <Label className="font-semibold text-heading">{t("role")}</Label>
          <Select.Trigger className="h-10 min-h-10 items-center rounded-control py-0">
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {ASSIGNABLE_ROLES.map((r) => (
                <ListBox.Item key={r} id={r}>
                  {tRoles(r)}
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select.Root>

        <Button
          className="h-10 px-[18px] font-semibold md:h-10"
          isDisabled={!email || !role}
          isPending={isSubmitting}
          type="submit"
        >
          {t("send")}
        </Button>
      </form>

      {error && <p className="text-sm text-danger">{error}</p>}

      <ConfirmDialog
        confirmLabel={t("confirmLabel")}
        isOpen={isConfirmOpen}
        title={t("confirmTitle")}
        onConfirm={() => sendInvite(email, AuthRole.Admin)}
        onOpenChange={setIsConfirmOpen}
      >
        {t("confirmBody", { email })}
      </ConfirmDialog>
    </section>
  );
}
