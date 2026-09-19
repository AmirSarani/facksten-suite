import { getIronSession, type SessionOptions } from "iron-session";
import { cookies, headers } from "next/headers";

export type SessionUser = {
  id: string;
  email: string;
};

export type SessionData = {
  user?: SessionUser;
};

export type SessionSameSite = "lax" | "strict" | "none";

export type SessionCookieOptions = {
  httpOnly: true;
  path: "/";
  sameSite: SessionSameSite;
  secure: boolean;
  /** Persist across tab navigations / browser back (seconds). */
  maxAge: number;
};

export type SessionCookieEnv = {
  NODE_ENV?: string;
  COOKIE_SECURE?: string;
  SESSION_SAMESITE?: string;
};

const secret = process.env.SESSION_SECRET ?? "facksten-portfolio-dev-secret-change-me-32";

export const ADMIN_SESSION_COOKIE = "facksten_portfolio_admin";

function parseBool(value: string | undefined): boolean | undefined {
  if (value == null || value.trim() === "") return undefined;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return undefined;
}

function parseSameSite(value: string | undefined): SessionSameSite | undefined {
  if (value == null || value.trim() === "") return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === "lax" || normalized === "strict" || normalized === "none") {
    return normalized;
  }
  return undefined;
}

function requestProtocol(value: string | undefined): "http" | "https" | undefined {
  const proto = value?.split(",")[0]?.trim().toLowerCase();
  if (proto === "http" || proto === "https") return proto;
  return undefined;
}

/**
 * Cookie flags Chrome will accept.
 * Local HTTP cannot use SameSite=None without Secure — Chrome drops that cookie.
 * :5174 and :3020 are same-site (same host + scheme), so Lax works for local admin fetch.
 */
export function resolveSessionCookieOptions(
  env: SessionCookieEnv = process.env,
  protocol?: string,
): SessionCookieOptions {
  const proto = requestProtocol(protocol);
  const production = env.NODE_ENV === "production";
  const explicitSameSite = parseSameSite(env.SESSION_SAMESITE);
  const explicitSecure = parseBool(env.COOKIE_SECURE);

  let secure = explicitSecure ?? (proto === "https" || (production && proto !== "http"));
  let sameSite = explicitSameSite ?? (production && proto !== "http" ? "none" : "lax");

  // Never emit the combo Chrome rejects on http://localhost.
  if (sameSite === "none" && !secure) {
    sameSite = "lax";
  }

  return {
    httpOnly: true,
    path: "/",
    sameSite,
    secure,
    maxAge: 60 * 60 * 24 * 14, // 14 days
  };
}

export function getSessionOptions(protocol?: string): SessionOptions {
  return {
    password: secret,
    cookieName: ADMIN_SESSION_COOKIE,
    cookieOptions: resolveSessionCookieOptions(process.env, protocol),
  };
}

export const sessionOptions: SessionOptions = getSessionOptions();

async function forwardedProtocol(): Promise<string | undefined> {
  try {
    return (await headers()).get("x-forwarded-proto") ?? undefined;
  } catch {
    return undefined;
  }
}

export async function getSession() {
  const options = getSessionOptions(await forwardedProtocol());
  return getIronSession<SessionData>(await cookies(), options);
}

export async function requireAdmin() {
  const session = await getSession();
  return session.user ?? null;
}
