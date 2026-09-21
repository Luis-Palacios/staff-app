import { AcademicCapIcon, BookOpenIcon } from "@heroicons/react/24/solid";

import { LocalDate } from "../local-date";

import { ChildReachingIcon, PersonWaterIcon } from "./icons";

import {
  getFirstPersonAssistanceSummary,
  getPersonEventsSummary,
} from "@/api/applications-membership-api/person-service";
import { PersonEventSummary } from "@/api/applications-membership-api/types";

const eventTypeNameToIcon: Record<string, React.FC<any>> = {
  "First Assistance": ChildReachingIcon,
  Bautismo: PersonWaterIcon,
  "Doctrina Basica": BookOpenIcon,
  "Alto Funcionamiento S1": BookOpenIcon,
  "Presentacion de Miembros": AcademicCapIcon,
};

function getEventIcon(eventTypeName: string): React.FC<any> | undefined {
  return eventTypeNameToIcon[eventTypeName];
}

// The marker is the circle on the rail. "current" (the most recent event)
// gets the solid accent tone; earlier events use the soft accent tone.
function TimelineMarker({
  eventTypeName,
  isCurrent,
}: {
  eventTypeName: string;
  isCurrent: boolean;
}) {
  const EventIcon = getEventIcon(eventTypeName);
  const tone = isCurrent
    ? "bg-accent text-accent-foreground ring-accent-soft"
    : "bg-accent-soft text-accent-soft-foreground ring-surface";

  return (
    <span
      className={`relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full ring-4 ${tone}`}
    >
      {EventIcon ? (
        <EventIcon height={20} width={20} />
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
  const personEvents = await getPersonEventsSummary(personId);
  const personFirstAssistance = await getFirstPersonAssistanceSummary(personId);

  const firstAssistanceEvent: PersonEventSummary = {
    eventId: 0,
    personId: personId,
    eventName: "First Assistance",
    eventDate: personFirstAssistance?.assistanceDate || "",
    eventTypeName: "First Assistance",
  };

  const events: PersonEventSummary[] = [firstAssistanceEvent, ...personEvents];

  return (
    <ol className="flex flex-col">
      {events.map((event, index) => {
        const isLast = index === events.length - 1;
        const showEventName = event.eventName !== event.eventTypeName;

        return (
          <li
            key={event.eventId}
            aria-current={isLast ? "true" : undefined}
            className="flex gap-4"
          >
            {/* Rail: marker + connector line down to the next item */}
            <div className="flex flex-col items-center">
              <TimelineMarker
                eventTypeName={event.eventTypeName}
                isCurrent={isLast}
              />
              {!isLast && (
                <span aria-hidden className="w-px flex-1 bg-separator" />
              )}
            </div>

            {/* Content */}
            <article className={`flex-1 pt-2 ${isLast ? "" : "pb-8"}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3 className="text-sm font-semibold text-foreground">
                  {event.eventTypeName}
                </h3>
                <span className="text-xs text-muted">
                  {event.eventDate ? (
                    <LocalDate value={event.eventDate} />
                  ) : (
                    "No date recorded"
                  )}
                </span>
              </div>
              {showEventName && (
                <p className="mt-1 text-sm text-muted">{event.eventName}</p>
              )}
            </article>
          </li>
        );
      })}
    </ol>
  );
}
