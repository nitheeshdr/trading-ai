import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CookieSet = { name: string; value: string; options?: any };

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    // Build the redirect response first so we can attach cookies to it
    const redirectUrl = new URL(next.startsWith("/") ? next : "/", origin);
    const response = NextResponse.redirect(redirectUrl);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet: CookieSet[]) {
            // Write the auth cookies directly onto the redirect response
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return response; // redirect with session cookies attached ✓
    }

    console.error("[auth/callback] exchange error:", error.message);
  }

  // Redirect to login with error
  return NextResponse.redirect(new URL(`/login?error=auth_callback_failed`, origin));
}
