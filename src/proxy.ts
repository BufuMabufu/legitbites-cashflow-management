// =============================================================================
// Next.js Middleware — Auth Session Refresh & RBAC Route Protection
// =============================================================================
// This middleware runs on EVERY request that matches the `config.matcher`.
//
// It does two critical things:
// 1. REFRESHES the Supabase auth session (prevents stale tokens)
// 2. PROTECTS routes based on authentication and user role
//
// WHY middleware instead of layout-level checks?
// - Runs BEFORE any page rendering, so unauthenticated users never see
//   protected content (not even a flash of the dashboard)
// - Centralized auth logic — no need to repeat checks in every page
//
// IMPORTANT: Middleware runs in Edge Runtime. We cannot import Prisma here
// because the generated client uses `node:path` and `node:url` which are
// not available in Edge. Instead, we use Supabase's `@supabase/ssr` to
// manage sessions, and defer role checks to the layout/page level.
// =============================================================================

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes that don't require authentication
const PUBLIC_ROUTES = ["/login"];

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Create Supabase client that can read/write cookies in the middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Forward cookies to the browser response
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do NOT use `supabase.auth.getSession()` here.
  // `getUser()` actually verifies the JWT with Supabase's servers,
  // while `getSession()` only reads the local token (which could be spoofed).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // --- Rule 1: Allow public routes ---
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    // If user is already logged in and tries to visit /login, redirect to dashboard
    if (user) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // --- Rule 2: Redirect unauthenticated users to login ---
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // --- Rule 3: RBAC — block STAFF from OWNER-only routes ---
  // WHY check user_metadata here?
  // We can't use Prisma in Edge Runtime. Instead, the RBAC check for
  // OWNER-only routes is handled in the dashboard layout (server-side).
  // The middleware only handles auth session refresh and basic auth redirect.
  // This is acceptable because:
  // 1. The layout runs server-side and CAN access Prisma for role checks
  // 2. The middleware still prevents unauthenticated access
  // 3. Defense in depth: Server Actions also verify roles before mutations

  return supabaseResponse;
}

// Only run middleware on app routes, not on static files or API internals
export const config = {
  matcher: [
    // Match all routes EXCEPT: static files, images, favicon, _next internals
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
