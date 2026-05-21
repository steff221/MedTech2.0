import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/doctor", "/dashboard", "/profile"];

/**
 * Edge middleware: if the request targets a protected route and the browser
 * hasn't sent the httpOnly refresh_token cookie, redirect to /login before
 * Next.js even renders a page.  This is a first-line gate — the layouts still
 * re-validate role and hydration state on the client.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has("refresh_token");

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  if (isProtected && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/doctor/:path*", "/dashboard/:path*", "/profile/:path*"],
};
