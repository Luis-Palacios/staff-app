import "server-only";

import { z } from "zod";

import { formatEnvError } from "@/lib/env/format-error";

const schema = z.object({
  APPLICATIONS_MEMBERSHIP_API_URL: z.url(),
  NEXT_PUBLIC_AUTH_SERVER_URL: z.url(),
});

const parsed = schema.safeParse({
  APPLICATIONS_MEMBERSHIP_API_URL: process.env.APPLICATIONS_MEMBERSHIP_API_URL,
  NEXT_PUBLIC_AUTH_SERVER_URL: process.env.NEXT_PUBLIC_AUTH_SERVER_URL,
});

if (!parsed.success) {
  throw new Error(formatEnvError(parsed.error));
}

export const env = parsed.data;
