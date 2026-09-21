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

function renderEventIcon(eventTypeName: string) {
  const EventIcon = getEventIcon(eventTypeName);

  return EventIcon ? <EventIcon height={34} width={34} /> : null;
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
    <div>
      <ul>
        {events.map((event) => (
          <li key={event.eventId}>
            {renderEventIcon(event.eventTypeName)}
            {event.eventTypeName} - <LocalDate value={event.eventDate} />
          </li>
        ))}
      </ul>
    </div>
  );
}
