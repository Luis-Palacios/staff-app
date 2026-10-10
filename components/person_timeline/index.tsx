import type { ComponentType, SVGProps } from "react";

import {
  AcademicCapIcon,
  BookOpenIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";

import { LocalDate } from "../local-date";

import { DropIcon } from "./icons";

import {
  getFirstPersonAssistanceSummary,
  getPersonEventsSummary,
} from "@/api/applications-membership-api/person-service";
import { PersonEventSummary } from "@/api/applications-membership-api/types";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

const FIRST_ASSISTANCE = "First Assistance";

const eventTypeNameToIcon: Record<string, Icon> = {
  [FIRST_ASSISTANCE]: MapPinIcon,
  Bautismo: DropIcon,
  "Doctrina Basica": BookOpenIcon,
  "Alto Funcionamiento S1": BookOpenIcon,
  "Presentacion de Miembros": AcademicCapIcon,
};

// Display names for event types whose data key reads oddly on screen. The
// key itself stays as the API sends it.
const eventTypeNameToLabel: Record<string, string> = {
  [FIRST_ASSISTANCE]: "First visit",
};

// The marker is the circle on the rail. The current (most recent) event is
// gold, the same in both modes; earlier events use the soft accent tone. The
// ring separates the marker from the connector line behind it.
function TimelineMarker({
  eventTypeName,
  isCurrent,
}: {
  eventTypeName: string;
  isCurrent: boolean;
}) {
  const EventIcon = eventTypeNameToIcon[eventTypeName];

  return (
    <span
      className={clsx(
        "relative z-10 flex size-[38px] shrink-0 items-center justify-center rounded-full ring-4",
        isCurrent
          ? "bg-gold-500 text-navy-900 ring-marker-ring"
          : "bg-accent-soft text-accent-soft-foreground ring-surface",
      )}
    >
      {EventIcon ? (
        <EventIcon
          aria-hidden="true"
          className="size-[18px]"
          strokeWidth={1.7}
        />
      ) : (
        <span className="size-2.5 rounded-full bg-current" />
      )}
    </span>
  );
}

export default async function PersonTimeline({
  personId,
}: {
  personId: number;
}) {
  const [personEvents, personFirstAssistance] = await Promise.all([
    getPersonEventsSummary(personId),
    getFirstPersonAssistanceSummary(personId),
  ]);

  const firstAssistanceEvent: PersonEventSummary = {
    eventId: 0,
    personId: personId,
    eventName: FIRST_ASSISTANCE,
    eventDate: personFirstAssistance?.assistanceDate || "",
    eventTypeName: FIRST_ASSISTANCE,
  };

  const events: PersonEventSummary[] = [firstAssistanceEvent, ...personEvents];

  return (
    <ol className="flex flex-col">
      {events.map((event, index) => {
        const isLast = index === events.length - 1;
        // The API has no per-event description; the event's own name is the
        // sub-line when it says more than its type.
        const showEventName = event.eventName !== event.eventTypeName;

        return (
          <li
            key={event.eventId}
            aria-current={isLast ? "step" : undefined}
            className="flex gap-3.5"
          >
            {/* Rail: marker + connector line down to the next item */}
            <div className="flex flex-col items-center">
              <TimelineMarker
                eventTypeName={event.eventTypeName}
                isCurrent={isLast}
              />
              {!isLast && (
                <span
                  aria-hidden="true"
                  className="my-1.5 min-h-[26px] w-0.5 flex-1 bg-separator"
                />
              )}
            </div>

            {/* Content */}
            <div
              className={clsx(
                "flex flex-1 flex-col gap-0.5 pt-2",
                !isLast && "pb-[22px]",
              )}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <h3 className="text-[14.5px] font-semibold text-heading">
                  {eventTypeNameToLabel[event.eventTypeName] ??
                    event.eventTypeName}
                </h3>
                <span className="text-[13px] text-muted">
                  {event.eventDate ? (
                    <LocalDate value={event.eventDate} />
                  ) : (
                    "No date recorded"
                  )}
                </span>
              </div>
              {showEventName && (
                <p className="text-[13px] text-muted">{event.eventName}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
