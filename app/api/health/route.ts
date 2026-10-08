import { NextResponse } from "next/server";

import { getEnv } from "@/lib/env/server";

// ALB target-group health check, a readiness check. It is deliberately shallow: it checks only
// this instance (the process answers and its config is valid), never auth-server or other
// dependencies. Replacing staff-app wouldn't fix those, and failing on them would make ECS
// restart every task during another service's outage. Calling getEnv() validates the config on
// the first request: getEnv() throws on an invalid value, so this returns 500 and the ALB never
// sends traffic to the task. Any new config module's getter must be called here too.
export const dynamic = "force-dynamic";

export function GET() {
  getEnv();

  return NextResponse.json({ status: "ok" });
}
