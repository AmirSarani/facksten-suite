import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import type { Role } from "@/generated/prisma/client";

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

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET ?? "complex_password_at_least_32_characters_long",
  cookieName: "facksten_market_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  },
};

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

export async function requireUser(roles?: Role[]) {
  const session = await getSession();
  if (!session.user) return null;
  if (roles && !roles.includes(session.user.role)) return null;
  return session.user;
}
