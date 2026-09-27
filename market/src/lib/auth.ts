import { getIronSession, SessionOptions } from "iron-session";
import { cookies, headers } from "next/headers";
import type { Role } from "@/generated/prisma/client";
import { resolveSessionSecret } from "@/lib/session-secret";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type GuestCartLine = {
  productId: string;
  qty: number;
};

export type SessionData = {
  user?: SessionUser;
  guestCart?: GuestCartLine[];
};

function resolveCookieSecure(protocol?: string): boolean {
  const explicit = process.env.COOKIE_SECURE?.trim().toLowerCase();
  if (explicit && ["1", "true", "yes", "on"].includes(explicit)) return true;
  if (explicit && ["0", "false", "no", "off"].includes(explicit)) return false;

  const proto = protocol?.split(",")[0]?.trim().toLowerCase();
  if (proto === "https") return true;
  if (proto === "http") return false;
  return process.env.NODE_ENV === "production";
}

/** Built per request so a missing SESSION_SECRET fails at runtime, never at import/build. */
export function buildSessionOptions(protocol?: string): SessionOptions {
  return {
    password: resolveSessionSecret(),
    cookieName: "facksten_market_session",
    cookieOptions: {
      secure: resolveCookieSecure(protocol),
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    },
  };
}

export async function getSession() {
  let protocol: string | undefined;
  try {
    protocol = (await headers()).get("x-forwarded-proto") ?? undefined;
  } catch {
    protocol = undefined;
  }
  return getIronSession<SessionData>(await cookies(), buildSessionOptions(protocol));
}

export async function requireUser(roles?: Role[]) {
  const session = await getSession();
  if (!session.user) return null;
  if (roles && !roles.includes(session.user.role)) return null;
  return session.user;
}
