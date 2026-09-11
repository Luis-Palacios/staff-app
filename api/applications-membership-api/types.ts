export interface ApplicationMembershipSummary {
  applicationId: number;
  personId: number;
  personFullName: string;
  generatedDate: string;
  fulfilmentDate: string;
  isFulfilled: boolean;
}
