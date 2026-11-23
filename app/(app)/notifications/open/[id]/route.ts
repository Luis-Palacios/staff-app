import { unstable_rethrow } from "next/navigation";

import { markNotificationRead } from "@/api/notifications-api/client";
import { safeReturnPath } from "@/lib/return-path";

/** Where an entry that can't be opened goes (not the caller's, gone, or anything else wrong). */
const LIST = "/notifications";

// A relative Location, so the redirect never depends on the host this server believes it has.
function redirectTo(path: string): Response {
  return new Response(null, {
    status: 307,
    headers: { Location: path, "Cache-Control": "no-store" },
  });
}

/**
 * The one way an entry opens (notifications rule 15): the list, the popover and, later, a clicked
 * push all link here. It marks the entry read and redirects to the entry's `path`. It does not
 * touch the conversation email throttle: the thread panel does that when it opens.
 *
 * Only a same-origin relative path is followed (`safeReturnPath`); a bad id, a 404, an unsafe
 * path or any failure lands on the list. A request without a session goes through the usual
 * sign-in redirect and comes back here. Links to this route must use `prefetch={false}`: a
 * prefetch would mark the entry read before anyone opened it.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;

  if (!/^[1-9]\d{0,15}$/.test(id)) return redirectTo(LIST);

  try {
    const { path } = await markNotificationRead(Number(id));

    return redirectTo(safeReturnPath(path) ?? LIST);
  } catch (error) {
    // The sign-in, needs-verification and needs-role redirects come out of the API call.
    unstable_rethrow(error);

    return redirectTo(LIST);
  }
}
