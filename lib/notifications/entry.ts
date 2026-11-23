import "server-only";

import type { Notification } from "@/api/notifications-api/types";
import type {
  NotificationKind,
  NotificationView,
} from "@/lib/notifications/view-types";
import type { Locale } from "@/lib/locale-shared";

import { getTranslations } from "next-intl/server";

import {
  churchDateOf,
  formatChurchTime,
  getChurchToday,
} from "@/lib/church-time";
import {
  formatCalendarDayHeading,
  formatCalendarRowDate,
  formatCalendarShortDate,
  formatCalendarShortWeekday,
} from "@/lib/format-date";

function loadTranslator(locale: Locale) {
  return getTranslations({ locale, namespace: "Notifications" });
}

type Translator = Awaited<ReturnType<typeof loadTranslator>>;

interface Text {
  kind: NotificationKind;
  title: string;
  secondary: string;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// `data` is the email delivery's data: a JSON object whose keys depend on the template. Read every
// key as untrusted, so an entry written by a newer API, or a malformed one, is skipped, not thrown on.
function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

function count(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : null;
}

function isoDate(value: unknown): string | null {
  return typeof value === "string" && ISO_DATE.test(value) ? value : null;
}

const SECTIONS = {
  prayer: "sectionPrayer",
  praise: "sectionPraise",
  followUp: "sectionFollowUp",
} as const;

function conversation(
  entry: Notification,
  t: Translator,
  locale: Locale,
): Text | null {
  const { data } = entry;
  const actor = text(data.actorName);
  const group = text(data.groupName);
  const meetingDate = isoDate(data.meetingDate);

  if (!actor || !group || !meetingDate) return null;

  const secondary = t("conversationSecondary", {
    group,
    date: formatCalendarRowDate(meetingDate, locale),
  });

  if (entry.template === "report-conversation.reply") {
    return {
      kind: "conversation",
      title: t("conversationReply", { actor }),
      secondary,
    };
  }

  if (data.topic === "person") {
    return {
      kind: "conversation",
      title: t("conversationNewPerson", { actor }),
      secondary,
    };
  }

  const topic = typeof data.topic === "string" ? data.topic : "";

  if (!Object.hasOwn(SECTIONS, topic)) return null;

  return {
    kind: "conversation",
    title: t("conversationNewSection", {
      actor,
      section: t(SECTIONS[topic as keyof typeof SECTIONS]),
    }),
    secondary,
  };
}

function submitted(
  entry: Notification,
  t: Translator,
  locale: Locale,
): Text | null {
  const { data } = entry;
  const group = text(data.groupName);
  const submitter = text(data.submitterName);
  const meetingDate = isoDate(data.meetingDate);

  if (!group || !submitter || !meetingDate || typeof data.held !== "boolean") {
    return null;
  }

  const date = formatCalendarRowDate(meetingDate, locale);

  if (!data.held) {
    return {
      kind: "noMeeting",
      title: t("submittedNoMeeting", { group }),
      secondary: t("submittedNoMeetingSecondary", { date, submitter }),
    };
  }

  const attended = count(data.attendedCount);
  const people = count(data.peopleCount);

  if (attended === null || people === null) return null;

  return {
    kind: "submitted",
    title: t("submittedHeld", { group }),
    secondary: t("submittedHeldSecondary", {
      date,
      attended: String(attended),
      people: String(people),
      submitter,
    }),
  };
}

function reminder(
  entry: Notification,
  t: Translator,
  locale: Locale,
): Text | null {
  const { data } = entry;
  const weekStart = isoDate(data.weekStart);
  const groups = Array.isArray(data.groups) ? data.groups : [];

  if (!weekStart || groups.length === 0) return null;

  const secondary = t("reminderSecondary", {
    weekStart: formatCalendarShortDate(weekStart, locale),
  });

  if (groups.length > 1) {
    return {
      kind: "reminder",
      title: t("reminderMany", { count: String(groups.length) }),
      secondary,
    };
  }

  const [only] = groups as { name?: unknown; hasDraft?: unknown }[];
  const group = text(only?.name);

  if (!group) return null;

  return {
    kind: "reminder",
    title:
      only.hasDraft === true
        ? t("reminderOneDraft", { group })
        : t("reminderOne", { group }),
    secondary,
  };
}

function textFor(
  entry: Notification,
  t: Translator,
  locale: Locale,
): Text | null {
  switch (entry.template) {
    case "report-conversation.new":
    case "report-conversation.reply":
      return conversation(entry, t, locale);
    case "report.submitted":
      return submitted(entry, t, locale);
    case "report.reminder":
      return reminder(entry, t, locale);
    default:
      // A template this build doesn't know (a newer API): leave the entry out.
      return null;
  }
}

function shiftDay(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day + days))
    .toISOString()
    .slice(0, 10);
}

function daysBetween(fromIso: string, toIso: string): number {
  const parse = (iso: string) => {
    const [year, month, day] = iso.split("-").map(Number);

    return Date.UTC(year, month - 1, day);
  };

  return Math.round((parse(toIso) - parse(fromIso)) / 86_400_000);
}

/**
 * The entries as the UI draws them, in the church's time zone: the copy from `template` + `data`
 * (the spec's *Copy* table), the day each belongs to and its time. Entries with a template or data
 * this build can't word are dropped.
 */
export async function toNotificationViews(
  items: readonly Notification[],
  locale: Locale,
  now: Date = new Date(),
): Promise<NotificationView[]> {
  const t = await loadTranslator(locale);
  const today = getChurchToday(now);
  const yesterday = shiftDay(today, -1);
  const kindLabels: Record<NotificationKind, string> = {
    conversation: t("kindConversation"),
    submitted: t("kindSubmitted"),
    noMeeting: t("kindNoMeeting"),
    reminder: t("kindReminder"),
  };
  const views: NotificationView[] = [];

  for (const entry of items) {
    const words = textFor(entry, t, locale);

    if (!words) continue;

    const dayKey = churchDateOf(entry.createdAt);
    const unread = entry.readAt === null;
    const time = formatChurchTime(entry.createdAt, locale);
    const age = daysBetween(dayKey, today);

    views.push({
      id: entry.id,
      kind: words.kind,
      title: words.title,
      secondary: words.secondary,
      unread,
      dayKey,
      dayLabel:
        dayKey === today
          ? t("today")
          : dayKey === yesterday
            ? t("yesterday")
            : formatCalendarDayHeading(dayKey, locale),
      time,
      short:
        dayKey === today
          ? time
          : dayKey === yesterday
            ? t("yesterday")
            : age > 0 && age < 7
              ? formatCalendarShortWeekday(dayKey, locale)
              : formatCalendarShortDate(dayKey, locale),
      label: `${kindLabels[words.kind]}: ${words.title}. ${words.secondary}. ${time}${unread ? t("unreadSuffix") : ""}`,
    });
  }

  return views;
}
