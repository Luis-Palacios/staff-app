import type { AuthSession } from "@/api/auth-api/types";

import { redirect } from "next/navigation";

import { getServerSession } from "@/api/auth-api/helpers/get-server-session";
import { AuthRole } from "@/lib/auth/roles";

// Returns the session of a user who may use the app: signed in, email verified and given a role.
// Anyone else is redirected to the page that explains what is missing.
//
// The (app) layout calls this, but a layout's redirect doesn't stop its page: the App Router
// renders both in parallel, so a page's fetches have already started by the time the layout
// redirects. authenticatedFetch calls it too, so no API request goes out for such a user.
export async function requireStaffSession(): Promise<AuthSession> {
  const session = await getServerSession();

  if (!session) {
    redirect("/sign-in");
  }

  if (!session.user.emailVerified) {
    redirect("/needs-verification");
  }

  // A user with no role yet is `pending` (rule 10): fail closed.
  if (!session.user.role || session.user.role === AuthRole.Pending) {
    redirect("/needs-role");
  }

  return session;
}
