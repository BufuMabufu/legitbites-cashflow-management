// =============================================================================
// Supabase Browser Client
// =============================================================================
// Creates a Supabase client for use in Client Components (browser-side).
// Uses `createBrowserClient` from `@supabase/ssr` which automatically
// manages the auth token via cookies, staying in sync with the server client.
// =============================================================================

import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates a Supabase client configured for browser-side (Client Component) usage.
 *
 * The browser client reads/writes auth tokens to cookies, which are then
 * accessible by the server client and middleware for seamless SSR auth.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
