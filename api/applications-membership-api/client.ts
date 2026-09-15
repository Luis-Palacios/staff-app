import type {
  ApplicationMembershipDetail,
  ApplicationMembershipSummary,
} from "@/api/applications-membership-api/types";

import { authenticatedFetch } from "@/lib/authenticated-fetch";
import { env } from "@/lib/env/server";

const BASE_URL = env.APPLICATIONS_MEMBERSHIP_API_URL;

export function getRecentApplications(): Promise<
  ApplicationMembershipSummary[]
> {
  return authenticatedFetch<ApplicationMembershipSummary[]>(
    BASE_URL,
    "/applications/recents",
  );
}

export function getApplicationDetail(
  id: string,
): Promise<ApplicationMembershipDetail> {
  return authenticatedFetch<ApplicationMembershipDetail>(
    BASE_URL,
    `/applications/${id}`,
  );
}
