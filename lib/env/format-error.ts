import type { z } from "zod";

export function formatEnvError(error: z.ZodError): string {
  const issues = error.issues
    .map((issue) => `  ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");

  return `Invalid environment variables:\n${issues}\n\nSet them in .env.local for local dev, or in the deployment environment.`;
}
