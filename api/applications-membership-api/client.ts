import type {
  ApplicationMembershipDetail,
  ApplicationMembershipSummary,
} from "@/api/applications-membership-api/types";

import { authenticatedFetch } from "@/api/authenticated-fetch";
import { getEnv } from "@/lib/env/server";

export function getRecentApplications(): Promise<
  ApplicationMembershipSummary[]
> {
  return authenticatedFetch<ApplicationMembershipSummary[]>(
    getEnv().APPLICATIONS_MEMBERSHIP_API_URL,
    "/applications/recents",
  );
}

export function getRecentApplicationsCount(): Promise<number> {
  return authenticatedFetch<number>(
    getEnv().APPLICATIONS_MEMBERSHIP_API_URL,
    "/applications/recents/count",
  );
}

export function getApplicationDetail(
  id: string,
): Promise<ApplicationMembershipDetail> {
  return authenticatedFetch<ApplicationMembershipDetail>(
    getEnv().APPLICATIONS_MEMBERSHIP_API_URL,
    `/applications/${id}`,
  );
}
