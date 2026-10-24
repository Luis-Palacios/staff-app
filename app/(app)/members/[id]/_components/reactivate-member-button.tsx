"use client";

import type { ReactivateSignIn } from "./reactivate-member-dialog";

import { useState } from "react";
import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";

import { ReactivateMemberDialog } from "./reactivate-member-dialog";

// The banner's *Reactivate…*. Success reloads with `?saved=…`: the banner is gone once the member
// is active, so it can't show the toast itself. The label comes from the server banner.
export function ReactivateMemberButton({
  label,
  member,
  signIn,
}: {
  label: string;
  member: { id: number; name: string };
  signIn: ReactivateSignIn | null;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        className="font-semibold"
        variant="primary"
        onPress={() => setIsOpen(true)}
      >
        {label}
      </Button>
      <ReactivateMemberDialog
        isOpen={isOpen}
        member={member}
        signIn={signIn}
        onDone={({ unbanFailed }) =>
          router.replace(
            `/members/${member.id}?saved=${unbanFailed ? "reactivatedUnbanFailed" : "reactivated"}`,
          )
        }
        onOpenChange={setIsOpen}
      />
    </>
  );
}
