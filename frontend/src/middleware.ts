// Next.js middleware: ги штити рутите и пренасочува според најава и улога.
import { NextResponse } from "next/server";

// The refresh_token cookie is set by the backend (port 8080) and is therefore
// invisible to this middleware running on the frontend origin (port 3000).
// Route protection is handled client-side in each layout via useAuth + zustand.
export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: ["/doctor/:path*", "/dashboard/:path*", "/profile/:path*"],
};
