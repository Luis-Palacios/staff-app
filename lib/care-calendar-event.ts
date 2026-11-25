// *Add to calendar* (care spec rules 47–49): the event a planned care log entry becomes in the
// viewer's own calendar, and the three ways to hand it over (Google Calendar link, Outlook link, an
// `.ics` file). Pure and browser-safe: nothing here reads the environment, the clock or the DOM, so
// the same entry always gives the same event. There is no test runner in this repo; the builders
// take everything as arguments so one can be added without changing them.
//
// What leaves the app is the minimum (rule 48): the kind, the first person's first name and
// initial (nothing but the kind for an *Elders only* entry), a link back to the entry's page, and
// "Online" for an online meeting. Never the text, *Others*, *who told us*, the participants or the
// visibility.

import type { CareLogEntry } from "@/api/care-log-api/types";

/** The entry fields the event is made from. */
export type CalendarEntry = Pick<
  CareLogEntry,
  | "id"
  | "kind"
  | "meetingMode"
  | "occurredOn"
  | "occurredAtTime"
  | "people"
  | "visibility"
>;

/** Words in the viewer's language; the caller translates them. */
export interface CalendarText {
  /** The kind: "Call", "Llamada". */
  kind: string;
  /** The neutral title of an *Elders only* entry: "Care call", "Llamada de cuidado". */
  privateTitle: string;
  /** "Care log entry in ekklesiaio". */
  description: string;
  /** "Online", "En línea". */
  online: string;
}

export interface CalendarEvent {
  title: string;
  /** One line and the link to the entry's page (rule 48). */
  description: string;
  location: string | null;
  /** True when the plan has no time: an all-day event. */
  allDay: boolean;
  /** The first moment; for an all-day event, midnight UTC of the date (only its date counts). */
  start: Date;
  /** The end: start plus the kind's length; for an all-day event, the next day. */
  end: Date;
  uid: string;
  url: string;
}

/** Call 30 minutes, meeting and visit one hour (a plan has no length of its own). */
function durationMinutes(kind: CalendarEntry["kind"]): number {
  return kind === "call" ? 30 : 60;
}

/** "Óscar A.": the first name and the initial of the word after it (the first surname). */
export function shortPersonName(name: string): string {
  const words = name.trim().split(/\s+/);
  const first = words[0] ?? "";
  const initial = words[1]?.[0];

  return initial ? `${first} ${initial.toLocaleUpperCase()}.` : first;
}

/**
 * The event's title (rule 48): "Call · Óscar A." and "Visit · Marisol T. +1" with more people; an
 * *Elders only* entry gets the neutral title with no name.
 */
export function calendarTitle(
  entry: Pick<CalendarEntry, "people" | "visibility">,
  text: Pick<CalendarText, "kind" | "privateTitle">,
): string {
  if (entry.visibility === "private" || entry.people.length === 0) {
    return entry.visibility === "private" ? text.privateTitle : text.kind;
  }

  const more = entry.people.length > 1 ? ` +${entry.people.length - 1}` : "";

  return `${text.kind} · ${shortPersonName(entry.people[0].name)}${more}`;
}

/** The offset of `timeZone` from UTC at an instant, in minutes. */
function zoneOffsetMinutes(instant: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(instant));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(
    part("year"),
    part("month") - 1,
    part("day"),
    part("hour"),
    part("minute"),
    part("second"),
  );

  return (asUtc - (instant - (instant % 1000))) / 60000;
}

/**
 * The instant at which the wall clock of `timeZone` reads `date` ("YYYY-MM-DD") and `time`
 * ("HH:MM" or "HH:MM:SS"). Two passes settle the offset around a daylight-saving change.
 */
export function zonedTimeToInstant(
  date: string,
  time: string,
  timeZone: string,
): Date {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  const wall = Date.UTC(year, month - 1, day, hours, minutes);
  const first = wall - zoneOffsetMinutes(wall, timeZone) * 60000;

  return new Date(wall - zoneOffsetMinutes(first, timeZone) * 60000);
}

function addDays(date: string, days: number): Date {
  const [year, month, day] = date.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day + days));
}

/**
 * The event for a planned entry. `url` is the entry's page (`https://host/care-log/{id}`) and
 * `host` the app's host (the `UID`'s domain, so a client importing the file again recognises it).
 * `timeZone` is the church's: the plan's date and time are read there.
 */
export function buildCalendarEvent(
  entry: CalendarEntry,
  text: CalendarText,
  where: { url: string; host: string; timeZone: string },
): CalendarEvent {
  const allDay = !entry.occurredAtTime;
  const start = allDay
    ? addDays(entry.occurredOn, 0)
    : zonedTimeToInstant(
        entry.occurredOn,
        entry.occurredAtTime!,
        where.timeZone,
      );
  const end = allDay
    ? addDays(entry.occurredOn, 1)
    : new Date(start.getTime() + durationMinutes(entry.kind) * 60000);

  return {
    title: calendarTitle(entry, text),
    description: `${text.description}\n${where.url}`,
    location:
      entry.kind === "meeting" && entry.meetingMode === "online"
        ? text.online
        : null,
    allDay,
    start,
    end,
    uid: `care-log-${entry.id}@${where.host}`,
    url: where.url,
  };
}

function pad(value: number, length = 2): string {
  return String(value).padStart(length, "0");
}

/** "20261017" */
function basicDate(date: Date): string {
  return `${pad(date.getUTCFullYear(), 4)}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`;
}

/** "20261017T210000Z" */
function basicInstant(date: Date): string {
  return `${basicDate(date)}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

function query(params: [string, string][]): string {
  return params
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");
}

/** A `calendar.google.com/calendar/render?action=TEMPLATE…` link (rule 47). */
export function googleCalendarUrl(event: CalendarEvent): string {
  const dates = event.allDay
    ? `${basicDate(event.start)}/${basicDate(event.end)}`
    : `${basicInstant(event.start)}/${basicInstant(event.end)}`;
  const params: [string, string][] = [
    ["action", "TEMPLATE"],
    ["text", event.title],
    ["dates", dates],
    ["details", event.description],
  ];

  if (event.location) params.push(["location", event.location]);

  return `https://calendar.google.com/calendar/render?${query(params)}`;
}

/** An `outlook.office.com/calendar/deeplink/compose?…` link (rule 47). */
export function outlookCalendarUrl(event: CalendarEvent): string {
  const iso = (date: Date) => date.toISOString().slice(0, 19) + "Z";
  const params: [string, string][] = [
    ["path", "/calendar/action/compose"],
    ["rru", "addevent"],
    ["subject", event.title],
    [
      "startdt",
      event.allDay ? event.start.toISOString().slice(0, 10) : iso(event.start),
    ],
    [
      "enddt",
      event.allDay ? event.end.toISOString().slice(0, 10) : iso(event.end),
    ],
    ["body", event.description],
  ];

  if (event.allDay) params.push(["allday", "true"]);

  if (event.location) params.push(["location", event.location]);

  return `https://outlook.office.com/calendar/deeplink/compose?${query(params)}`;
}

/** RFC 5545 text escaping. */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Lines are at most 75 octets: longer ones continue on the next line after a space. */
function fold(line: string): string {
  const encoder = new TextEncoder();
  const lines: string[] = [];
  let current = "";
  let size = 0;

  for (const char of line) {
    const bytes = encoder.encode(char).length;
    // The continuation lines start with a space, which counts too.
    const limit = lines.length === 0 ? 75 : 74;

    if (size + bytes > limit) {
      lines.push(current);
      current = "";
      size = 0;
    }

    current += char;
    size += bytes;
  }

  lines.push(current);

  return lines.join("\r\n ");
}

/**
 * The `.ics` file (rule 47): one event with a stable `UID` (rule 48). Times are UTC instants, which
 * show at the church's wall-clock time in the viewer's calendar, so the file needs no `VTIMEZONE`.
 * `stamp` is when the file was made.
 */
export function buildIcs(event: CalendarEvent, stamp: Date): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ekklesiaio//Care log//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    `DTSTAMP:${basicInstant(stamp)}`,
    event.allDay
      ? `DTSTART;VALUE=DATE:${basicDate(event.start)}`
      : `DTSTART:${basicInstant(event.start)}`,
    event.allDay
      ? `DTEND;VALUE=DATE:${basicDate(event.end)}`
      : `DTEND:${basicInstant(event.end)}`,
    `SUMMARY:${escapeText(event.title)}`,
    `DESCRIPTION:${escapeText(event.description)}`,
    `URL:${event.url}`,
  ];

  if (event.location) lines.push(`LOCATION:${escapeText(event.location)}`);

  lines.push("END:VEVENT", "END:VCALENDAR");

  return lines.map(fold).join("\r\n") + "\r\n";
}
