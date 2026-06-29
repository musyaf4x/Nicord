import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Paths that don't require auth
const PUBLIC_PATHS = ["/login", "/register", "/api/auth"];

export default auth(function middleware(req: NextRequest) {
  const { nextUrl, auth: session } = req as typeof req & { auth: unknown };

  const isPublicPath = PUBLIC_PATHS.some((path) =>
    nextUrl.pathname.startsWith(path)
  );

  if (!session && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (session && (nextUrl.pathname === "/login" || nextUrl.pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Match all paths except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/).*)",
  ],
};
