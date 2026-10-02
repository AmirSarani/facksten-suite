const MIN_SECRET_LENGTH = 32;
const DEV_FALLBACK_SECRET = "pushrsp-portfolio-dev-only-secret-not-for-production";

type SecretEnv = {
  NODE_ENV?: string;
  NEXT_PHASE?: string;
  SESSION_SECRET?: string;
};

/**
 * Session secret. Production must provide SESSION_SECRET (>= 32 chars);
 * the dev fallback is never used when NODE_ENV=production.
 */
export function resolveSessionSecret(env: SecretEnv = process.env): string {
  const secret = env.SESSION_SECRET?.trim();
  if (secret && secret.length >= MIN_SECRET_LENGTH) return secret;

  const isProduction = env.NODE_ENV === "production";
  const isBuild = env.NEXT_PHASE === "phase-production-build";
  if (isProduction && !isBuild) {
    throw new Error(
      `SESSION_SECRET is missing or shorter than ${MIN_SECRET_LENGTH} characters. Set it in the server .env.`,
    );
  }
  return DEV_FALLBACK_SECRET;
}
