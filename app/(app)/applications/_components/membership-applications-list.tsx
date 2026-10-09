import ApplicationsBrowser from "./applications-browser";

import { getRecentApplications } from "@/api/applications-membership-api/client";

export default async function MembershipApplicationsList() {
  const data = await getRecentApplications();

  return <ApplicationsBrowser applications={data} />;
}
