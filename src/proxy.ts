import { NextResponse, type NextRequest } from "next/server";

// Optimistic check only: bounce visitors without a session cookie away from
// private areas before rendering. Real authorisation (session validity, role)
// is enforced on the server in src/lib/server/auth.ts for every page, action
// and route handler.
export function proxy(request: NextRequest) {
  if (!request.cookies.has("lifeos_session")) {
    const url = new URL("/sign-in", request.url);
    url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/admin/:path*", "/onboarding"],
};
