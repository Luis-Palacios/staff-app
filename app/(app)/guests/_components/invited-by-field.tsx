"use client";

import type { MemberOption } from "@/api/members-api/types";

import { useEffect, useMemo, useState } from "react";
import { ComboBox, Input, Label, ListBox } from "@heroui/react";
import { useTranslations } from "next-intl";

import { listMembersForPickerAction } from "@/app/(app)/groups/_actions/group-actions";
import { InitialsAvatar } from "@/components/initials-avatar";
import { normalizeText } from "@/lib/normalize-text";

const MAX_MEMBERS = 6;

// The member who invited the guest (optional). Members come from the picker action; a caller who
// can't read them (the action says no) keeps what is there and can't change it.
export function InvitedByField({
  value,
  isDisabled,
  onChange,
  onUnavailable,
}: {
  value: { id: number; name: string } | null;
  isDisabled: boolean;
  onChange: (member: { id: number; name: string } | null) => void;
  /** Called once if the members can't be loaded, so the form can stop sending this field. */
  onUnavailable: () => void;
}) {
  const t = useTranslations("GuestForm");
  const [members, setMembers] = useState<MemberOption[] | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [input, setInput] = useState(value?.name ?? "");

  useEffect(() => {
    let active = true;

    void listMembersForPickerAction().then((result) => {
      if (!active) return;

      if (result.ok) {
        setMembers(result.members);
      } else {
        setMembers([]);
        setUnavailable(true);
        onUnavailable();
      }
    });

    return () => {
      active = false;
    };
    // Loaded once on mount.
  }, []);

  const results = useMemo(() => {
    const query = normalizeText(input);

    return (members ?? [])
      .filter((member) => !query || normalizeText(member.name).includes(query))
      .slice(0, MAX_MEMBERS);
  }, [members, input]);

  return (
    <ComboBox
      allowsEmptyCollection
      fullWidth
      inputValue={input}
      isDisabled={isDisabled || unavailable}
      items={results}
      menuTrigger="focus"
      selectedKey={value ? String(value.id) : null}
      onInputChange={(text) => {
        setInput(text);
        if (value && text !== value.name) onChange(null);
      }}
      onSelectionChange={(key) => {
        const member =
          members?.find((candidate) => String(candidate.id) === key) ?? null;

        onChange(member);
        if (member) setInput(member.name);
      }}
    >
      <Label className="text-[13px] font-semibold text-heading">
        {t("invitedBy")}
      </Label>
      <ComboBox.InputGroup>
        <Input autoComplete="off" placeholder={t("invitedByPlaceholder")} />
        <ComboBox.Trigger />
      </ComboBox.InputGroup>
      <ComboBox.Popover>
        <ListBox
          renderEmptyState={() => (
            <p className="px-3 py-2 text-sm text-muted">
              {members === null ? t("loading") : t("noMembers")}
            </p>
          )}
        >
          {(member: MemberOption) => (
            <ListBox.Item id={String(member.id)} textValue={member.name}>
              <InitialsAvatar name={member.name} />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-heading">
                {member.name}
              </span>
            </ListBox.Item>
          )}
        </ListBox>
      </ComboBox.Popover>
    </ComboBox>
  );
}
