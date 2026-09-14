import { z } from "zod";

import { formatEnvError } from "@/lib/env/format-error";

const schema = z.object({
  NEXT_PUBLIC_AUTH_SERVER_URL: z.url(),
});

// Next.js inlines `process.env.NEXT_PUBLIC_*` into the browser bundle only when the member
// expression appears literally in source — so each var must be referenced this way (not via
// `process.env[name]` or by spreading the whole `process.env` object). See the comment on
// NEXT_PUBLIC_AUTH_SERVER_URL in .env.example.
const parsed = schema.safeParse({
  NEXT_PUBLIC_AUTH_SERVER_URL: process.env.NEXT_PUBLIC_AUTH_SERVER_URL,
});

if (!parsed.success) {
  throw new Error(formatEnvError(parsed.error));
}

export const env = parsed.data;
