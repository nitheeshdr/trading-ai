import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Protected dashboard routes
const PROTECTED_PATHS = ["/watchlist", "/chart", "/options", "/portfolio", "/paper-trading", "/ai-signals", "/ai-dashboard", "/auto-trade"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Refresh Supabase session on every request
  const response = await updateSession(request);

  // Check auth for protected routes
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  if (isProtected) {
    const sessionCookie = request.cookies.get("sb-access-token") || request.cookies.get("sb-auth-token");
    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|charting_library|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
