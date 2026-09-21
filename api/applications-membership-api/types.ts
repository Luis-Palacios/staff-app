export interface ApplicationMembershipSummary {
  applicationId: number;
  personId: number;
  personFullName: string;
  generatedDate: string;
  fulfilmentDate: string;
  isFulfilled: boolean;
}

export interface ApplicationMembershipDetail
  extends ApplicationMembershipSummary {
  firstName: string;
  lastName: string;
  lifeBefore: string;
  conversion: string;
  lifeAfter: string;
}

export interface PersonEventSummary {
  eventId: number;
  personId: number;
  eventName: string;
  eventDate: string;
  eventTypeName: string;
}

export interface PersonAssistanceSummary {
  personId: number;
  assistanceDate: string;
  assistanceTypeId: number;
}
