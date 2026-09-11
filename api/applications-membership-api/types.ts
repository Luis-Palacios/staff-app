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
