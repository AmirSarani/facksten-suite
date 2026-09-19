import { NextResponse, type NextRequest } from "next/server";
import { applyCors, corsPreflight } from "@/lib/cors";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (req.method === "OPTIONS" && pathname.startsWith("/api/")) {
    return corsPreflight(req);
  }

  if (pathname.startsWith("/api/")) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-locale", "fa");
    const res = NextResponse.next({ request: { headers: requestHeaders } });
    applyCors(req, res);
    return res;
  }

  if (pathname === "/en" || pathname.startsWith("/en/")) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-locale", "en");
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Internal [locale]=fa — serve only (rewrite re-enters middleware)
  if (pathname === "/fa" || pathname.startsWith("/fa/")) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-locale", "fa");
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Root "/" → src/app/page.tsx (FA home + header)
  if (pathname === "/" || pathname === "") {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-locale", "fa");
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Other unprefixed FA paths → rewrite into /fa/...
  const url = req.nextUrl.clone();
  url.pathname = `/fa${pathname}`;
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-locale", "fa");
  return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/",
    "/((?!_next/static|_next/image|favicon.ico|covers|avatars|.*\\..*).*)",
  ],
};
