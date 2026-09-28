import { NextResponse } from "next/server";

import { env } from "@/lib/env/server";

// ALB target-group health check, a readiness check. It is deliberately shallow: it checks only
// this instance (the process answers and its config is valid), never auth-server or other
// dependencies. Replacing staff-app wouldn't fix those, and failing on them would make ECS
// restart every task during another service's outage. Importing env validates the config on
// the first request; an invalid value throws, so this returns 500 and the ALB never sends
// traffic to the task. Any new config module must be imported here too.
export const dynamic = "force-dynamic";

export function GET() {
  void env;

  return NextResponse.json({ status: "ok" });
}
