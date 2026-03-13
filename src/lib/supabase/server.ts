// =============================================================================
// Supabase Server Client
// =============================================================================
// Creates a Supabase client for use in Server Components, Server Actions,
// and Route Handlers. Uses cookies to maintain the user's auth session.
//
// WHY separate from a browser client?
// Server-side code cannot access `localStorage`, so we use cookies to
// read/write the auth token. The `@supabase/ssr` package provides helpers
// to handle this seamlessly with Next.js App Router.
// =============================================================================

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Creates a Supabase client configured for server-side usage.
 *
 * Must be called within a Server Component, Server Action, or Route Handler
 * where `cookies()` is available.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method is called from a Server Component where
            // cookies cannot be mutated. This is safe to ignore because
            // the middleware will refresh the session on the next request.
          }
        },
      },
    }
  );
}
