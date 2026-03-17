// =============================================================================
// Next.js Middleware/Proxy — Auth Session Refresh & RBAC Route Protection
// =============================================================================
// This proxy runs on EVERY request that matches the `config.matcher`.
//
// It does three critical things:
// 1. REFRESHES the Supabase auth session (prevents stale tokens)
// 2. PROTECTS routes based on authentication and user role
// 3. HANDLES Maintenance Mode redirects for non-ADMIN users
//
// WHY middleware instead of layout-level checks?
// - Runs BEFORE any page rendering, so unauthenticated users never see
//   protected content (not even a flash of the dashboard)
// - Centralized auth logic — no need to repeat checks in every page
//
// IMPORTANT: Middleware runs in Edge Runtime. We cannot import Prisma here
// because the generated client uses `node:path` and `node:url` which are
// not available in Edge. Instead, we use Supabase's `@supabase/ssr` to
// manage sessions, defer OWNER role checks to the layout/page level, and
// use fetch to check maintenance mode status.
// =============================================================================

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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
  // This refreshes the session automatically if needed.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // ─── 1. RBAC: Protect /admin/* routes ───────────────────────────────────────
  // Only users with role === "ADMIN" (stored in app_metadata) may access /admin.
  // Anyone else (unauthenticated, OWNER, STAFF) is redirected to the root page.
  if (pathname.startsWith("/admin")) {
    const role = user?.app_metadata?.role as string | undefined;

    if (!user || role !== "ADMIN") {
      // Not an admin — redirect away from the admin panel
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = user ? "/" : "/login";
      return NextResponse.redirect(redirectUrl);
    }
  }

  // ─── 2. Maintenance Mode: redirect non-ADMIN users ──────────────────────────
  // When MAINTENANCE_MODE is active, all operational dashboard routes are
  // locked for OWNER and STAFF. ADMIN can always access everything.
  // Routes excluded from maintenance check:
  //   - /maintenance (the page we redirect TO — avoid infinite loop)
  //   - /login (users need to be able to log in even during maintenance)
  //   - /admin/* (already handled above; ADMIN is always allowed)
  //   - /api/* (API routes should not be redirected)
  const isExcludedFromMaintenance =
    pathname.startsWith("/maintenance") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next");

  if (!isExcludedFromMaintenance && user) {
    const role = user?.app_metadata?.role as string | undefined;

    // Admins bypass maintenance mode — they always have full access
    if (role !== "ADMIN") {
      try {
        // Fetch maintenance status from our API route handler
        // Use an absolute URL constructed from the request's origin
        const maintenanceApiUrl = new URL(
          "/api/settings/maintenance",
          request.nextUrl.origin
        );
        const res = await fetch(maintenanceApiUrl.toString(), {
          // Short timeout — if the API is down, don't block the user
          signal: AbortSignal.timeout(3000),
        });

        if (res.ok) {
          const data = (await res.json()) as { isActive: boolean };

          if (data.isActive) {
            // Maintenance is ON — redirect non-admin users to the maintenance page
            const maintenanceUrl = request.nextUrl.clone();
            maintenanceUrl.pathname = "/maintenance";
            return NextResponse.redirect(maintenanceUrl);
          }
        }
      } catch {
        // If the fetch fails (e.g., during cold start), silently allow access.
        // Better to show the app than to block users indefinitely.
      }
    }
  }

  // ─── 3. Protect operational routes / Allow public routes ─────────────────────
  const isPublicRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/maintenance") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next");

  if (isPublicRoute) {
    // If user is already logged in and tries to visit /login, redirect to dashboard
    if (pathname.startsWith("/login") && user) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // Redirect unauthenticated users to login for any other protected route
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
