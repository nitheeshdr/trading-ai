import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@db/types/database";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CookieSet = { name: string; value: string; options?: any };

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — can be safely ignored
          }
        },
      },
    }
  );
}
