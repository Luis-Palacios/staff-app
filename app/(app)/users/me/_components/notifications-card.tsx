"use client";

import type { WatchedGroup } from "@/api/notifications-api/types";

import { Switch } from "@heroui/react";
import { useTranslations } from "next-intl";

import { PushDeviceRow } from "./push-device-row";

import {
  setConversationEmails,
  setConversationPush,
  setReportReminderEmails,
  setReportReminderPush,
  setSubmittedReportEmails,
  setSubmittedReportPush,
  setWatching,
} from "@/app/(app)/_actions/notification-actions";
import { DetailCardHeading } from "@/app/(app)/applications/[id]/_components/detail-card-heading";
import { card } from "@/components/primitives";
import { SettingSwitch, useSavedToggle } from "@/components/setting-switch";
import { StatusBadge } from "@/components/status-badge";

/** One kind's switches. A channel that is `undefined` has no cell: it is off at the server for
 *  this kind (`available` / `availablePush`). */
export interface KindChoice {
  email?: boolean;
  push?: boolean;
}

type SavedToggle = ReturnType<typeof useSavedToggle>;

function WatchedGroupRow({
  group,
  enabled,
}: {
  group: WatchedGroup;
  /** In-app notifications are on, or an email or push switch is: Watching has something to
   *  control. */
  enabled: boolean;
}) {
  const t = useTranslations("NotificationSettings");
  const watch = useSavedToggle(
    group.watching,
    (next) => setWatching(group.smallGroupId, next),
    t("saveFailed"),
  );

  return (
    <li className="border-t border-separator px-6 py-3">
      <SettingSwitch
        badge={
          group.closed ? (
            <StatusBadge variant="ring-dot">{t("closedGroup")}</StatusBadge>
          ) : undefined
        }
        error={watch.error}
        isDisabled={!enabled}
        isSelected={watch.isSelected}
        label={group.name}
        pending={watch.pending}
        onChange={watch.toggle}
      />
    </li>
  );
}

/** A grid cell: a switch with no visible label (the row and the column say what it is), in a
 *  56 × 44 target. */
function CellSwitch({ label, toggle }: { label: string; toggle: SavedToggle }) {
  return (
    <Switch
      aria-busy={toggle.pending || undefined}
      aria-label={label}
      className="flex h-11 w-14 items-center justify-center"
      isSelected={toggle.isSelected}
      onChange={toggle.toggle}
    >
      <Switch.Content>
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
      </Switch.Content>
    </Switch>
  );
}

function GridRow({
  label,
  hint,
  choice,
  email,
  push,
  showEmail,
  showPush,
  columns,
}: {
  label: string;
  hint: string;
  choice: KindChoice;
  email: SavedToggle;
  push: SavedToggle;
  showEmail: boolean;
  showPush: boolean;
  columns: string;
}) {
  const t = useTranslations("NotificationSettings");
  // Both cells fail with the same text, so show it once (and keep the keys unique).
  const errors = [
    ...new Set(
      [
        choice.email !== undefined ? email.error : null,
        choice.push !== undefined ? push.error : null,
      ].filter((message): message is string => message !== null),
    ),
  ];

  return (
    <div className="flex flex-col gap-1 border-t border-separator px-6 py-2">
      <div className={`grid items-center gap-x-2 ${columns}`}>
        <div className="flex min-w-0 flex-col gap-0.5 py-1">
          <span className="text-[15px] font-medium text-heading">{label}</span>
          <span className="text-[13.5px] leading-normal text-muted">
            {hint}
          </span>
        </div>
        {showEmail && (
          <div className="flex justify-center">
            {choice.email !== undefined && (
              <CellSwitch
                label={t("switchEmail", { kind: label })}
                toggle={email}
              />
            )}
          </div>
        )}
        {showPush && (
          <div className="flex justify-center">
            {choice.push !== undefined && (
              <CellSwitch
                label={t("switchPush", { kind: label })}
                toggle={push}
              />
            )}
          </div>
        )}
      </div>
      {errors.map((message) => (
        <p key={message} className="text-[13px] text-danger" role="alert">
          {message}
        </p>
      ))}
    </div>
  );
}

/**
 * My profile's notification settings: one row per kind (*Conversations*, and for the full-scope
 * audience *Submitted reports*, and for group leaders *Weekly report reminders*), each `undefined`
 * while hidden, with an Email and a Push switch (rule 24). A channel's column goes when it is off
 * at the server for every kind shown; with no Push column the card is the email-only card as before
 * (switches with their own hints, no *This device* row). Push switches cover all the user's
 * devices, so they work whether or not this one is on (`pushPublicKey` only decides whether the
 * *This device* row shows). For the audience (`watchedGroups` not undefined) a Watching switch per
 * group follows. The watch switches are disabled, not hidden, while every shown email and push
 * switch is off: the choice is kept for later. Not while in-app notifications are on (`inApp`,
 * notifications rule 7): Watching then covers the in-app list too, so it is never disabled. The
 * reminder switches don't count toward that: Watching doesn't cover them.
 */
export function NotificationsCard({
  conversations,
  submitted,
  reminders,
  watchedGroups,
  inApp,
  pushPublicKey,
}: {
  /** `undefined`: the row is hidden (the person doesn't see conversations, or both channels are
   *  off at the server). */
  conversations?: KindChoice;
  /** `undefined`: hidden (not a watcher, or the kind is off at the server). */
  submitted?: KindChoice;
  /** `undefined`: hidden (doesn't lead a group, or the kind is off at the server). */
  reminders?: KindChoice;
  /** `undefined`: not a watcher; `null`: the list failed to load. */
  watchedGroups?: WatchedGroup[] | null;
  /** In-app notifications are on at the server (the bell's `unread-count.enabled`). */
  inApp: boolean;
  /** The VAPID public key while push is on at the server; `null`/`undefined` hides *This device*. */
  pushPublicKey?: string | null;
}) {
  const t = useTranslations("NotificationSettings");
  const failed = t("saveFailed");
  // Hooks can't be conditional, so every switch has one; a hidden cell just never shows it.
  const conversationEmail = useSavedToggle(
    conversations?.email ?? false,
    setConversationEmails,
    failed,
  );
  const conversationPush = useSavedToggle(
    conversations?.push ?? false,
    setConversationPush,
    failed,
  );
  const submittedEmail = useSavedToggle(
    submitted?.email ?? false,
    setSubmittedReportEmails,
    failed,
  );
  const submittedPush = useSavedToggle(
    submitted?.push ?? false,
    setSubmittedReportPush,
    failed,
  );
  const reminderEmail = useSavedToggle(
    reminders?.email ?? false,
    setReportReminderEmails,
    failed,
  );
  const reminderPush = useSavedToggle(
    reminders?.push ?? false,
    setReportReminderPush,
    failed,
  );

  const kinds = [conversations, submitted, reminders];
  const showPush = kinds.some((kind) => kind?.push !== undefined);
  const showEmail = kinds.some((kind) => kind?.email !== undefined);
  const channelsOn =
    (conversations?.email !== undefined && conversationEmail.isSelected) ||
    (conversations?.push !== undefined && conversationPush.isSelected) ||
    (submitted?.email !== undefined && submittedEmail.isSelected) ||
    (submitted?.push !== undefined && submittedPush.isSelected);
  const watchEnabled = inApp || channelsOn;
  const columns =
    showEmail && showPush
      ? "grid-cols-[minmax(0,1fr)_3.5rem_3.5rem]"
      : "grid-cols-[minmax(0,1fr)_3.5rem]";

  return (
    <section
      aria-labelledby="my-notifications-title"
      className={card({
        className: "flex min-w-0 flex-col overflow-hidden pt-5",
      })}
    >
      <div className="flex flex-col gap-4 px-6 pb-5">
        <DetailCardHeading
          eyebrow={showPush ? t("eyebrowPush") : t("eyebrow")}
          id="my-notifications-title"
        >
          {t("title")}
        </DetailCardHeading>
        {!showPush && conversations?.email !== undefined && (
          <SettingSwitch
            description={t("conversationEmailsHint")}
            error={conversationEmail.error}
            isSelected={conversationEmail.isSelected}
            label={t("conversationEmails")}
            pending={conversationEmail.pending}
            onChange={conversationEmail.toggle}
          />
        )}
        {!showPush && submitted?.email !== undefined && (
          <SettingSwitch
            description={t("submittedEmailsHint")}
            error={submittedEmail.error}
            isSelected={submittedEmail.isSelected}
            label={t("submittedEmails")}
            pending={submittedEmail.pending}
            onChange={submittedEmail.toggle}
          />
        )}
        {!showPush && reminders?.email !== undefined && (
          <SettingSwitch
            description={t("reminderEmailsHint")}
            error={reminderEmail.error}
            isSelected={reminderEmail.isSelected}
            label={t("reminderEmails")}
            pending={reminderEmail.pending}
            onChange={reminderEmail.toggle}
          />
        )}
      </div>
      {showPush && pushPublicKey && <PushDeviceRow publicKey={pushPublicKey} />}
      {showPush && (
        <div className="flex flex-col border-t border-separator">
          <div
            aria-hidden="true"
            className={`grid items-end gap-x-2 px-6 pt-3 pb-1.5 ${columns}`}
          >
            <span />
            {showEmail && (
              <span className="text-center text-[12px] font-semibold tracking-[0.08em] text-muted uppercase">
                {t("colEmail")}
              </span>
            )}
            <span className="text-center text-[12px] font-semibold tracking-[0.08em] text-muted uppercase">
              {t("colPush")}
            </span>
          </div>
          {conversations && (
            <GridRow
              choice={conversations}
              columns={columns}
              email={conversationEmail}
              hint={t("conversationsHint")}
              label={t("conversationEmails")}
              push={conversationPush}
              showEmail={showEmail}
              showPush={showPush}
            />
          )}
          {submitted && (
            <GridRow
              choice={submitted}
              columns={columns}
              email={submittedEmail}
              hint={t("submittedHint")}
              label={t("submittedEmails")}
              push={submittedPush}
              showEmail={showEmail}
              showPush={showPush}
            />
          )}
          {reminders && (
            <GridRow
              choice={reminders}
              columns={columns}
              email={reminderEmail}
              hint={t("reminderHint")}
              label={t("reminderEmails")}
              push={reminderPush}
              showEmail={showEmail}
              showPush={showPush}
            />
          )}
          <p className="px-6 pt-1 pb-5 text-[13.5px] leading-normal text-muted">
            {t("pushHelp")}
          </p>
        </div>
      )}
      {watchedGroups !== undefined && (
        <div className="flex flex-col border-t border-separator">
          <div className="flex flex-col gap-1 px-6 pb-3 pt-4">
            <h3 className="text-[15px] font-semibold text-heading">
              {t("watchedGroupsTitle")}
            </h3>
            <p className="text-[13.5px] text-muted">
              {inApp
                ? t("watchedGroupsHintInApp")
                : channelsOn
                  ? t("watchedGroupsHint")
                  : t("emailsOffHint")}
            </p>
          </div>
          {watchedGroups === null ? (
            <p className="px-6 pb-5 text-[13px] text-danger" role="alert">
              {t("watchedGroupsLoadFailed")}
            </p>
          ) : (
            <ul className="m-0 flex list-none flex-col p-0">
              {watchedGroups.map((group) => (
                <WatchedGroupRow
                  key={group.smallGroupId}
                  enabled={watchEnabled}
                  group={group}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
