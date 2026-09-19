import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPanel =
    pathname.startsWith("/account") ||
    pathname.startsWith("/partner") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login");

  const requestHeaders = new Headers(req.headers);
  if (isPanel) requestHeaders.set("x-panel", "1");

  const res = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  const user = session.user;

  const needAuth =
    pathname.startsWith("/account") ||
    pathname.startsWith("/partner") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/checkout");

  if (needAuth && !user) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin") && user?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }
  if (pathname.startsWith("/partner") && user?.role !== "PARTNER" && user?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }
  if (pathname.startsWith("/account") && user && user.role !== "CUSTOMER" && user.role !== "ADMIN") {
    if (user.role === "PARTNER") {
      return NextResponse.redirect(new URL("/partner", req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ["/account/:path*", "/partner/:path*", "/admin/:path*", "/checkout/:path*", "/login"],
};
