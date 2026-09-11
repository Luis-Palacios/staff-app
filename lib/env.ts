function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Set it in .env.local for local dev, or in the deployment environment.`,
    );
  }

  return value;
}

export const env = {
  applicationsMembershipApiUrl: requireEnv("APPLICATIONS_MEMBERSHIP_API_URL"),
} as const;
