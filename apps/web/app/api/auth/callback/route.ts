import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Redirect to the app after successful OAuth
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("[auth/callback] exchange error:", error.message);
  }

  // Redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
