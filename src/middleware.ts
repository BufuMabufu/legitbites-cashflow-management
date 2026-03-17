// =============================================================================
// Next.js Middleware — RBAC & Maintenance Mode
// =============================================================================
// Runs on EVERY request before rendering. Handles:
//   1. Session refresh: keeps Supabase auth session alive via cookies
//   2. RBAC: protects /admin/* — only ADMIN role is allowed
//   3. Maintenance Mode: redirects non-ADMIN users to /maintenance when active
//
// WHY read role from app_metadata (JWT) instead of Prisma?
//   Middleware runs on the Edge Runtime where Prisma is not supported.
//   We store the user's role in `app_metadata.role` in Supabase so it is
//   embedded in the JWT token and readable without a database round-trip.
//   When a role changes, the admin action MUST also call supabaseAdmin to
//   update app_metadata so the change is reflected on the next session refresh.
// =============================================================================

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // ─── 1. Set up response and Supabase client with cookie forwarding ──────────
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Forward cookies to both the request (for downstream) and response (for browser)
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

  // ─── 2. Refresh session — MUST be called before any logic ───────────────────
  // This refreshes the user's session token if it is close to expiry.
  // Do NOT add any logic between createServerClient and getUser.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // ─── 3. RBAC: Protect /admin/* routes ───────────────────────────────────────
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

  // ─── 4. Maintenance Mode: redirect non-ADMIN users ──────────────────────────
  // When MAINTENANCE_MODE is active, all operational dashboard routes are
  // locked for OWNER and STAFF. ADMIN can always access everything.
  //
  // We read the maintenance status from the /api/settings/maintenance endpoint
  // rather than Prisma directly (Edge Runtime limitation).
  //
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

  // ─── 5. Protect dashboard routes — require authentication ───────────────────
  // If the user is not logged in and tries to access a protected route,
  // redirect them to /login.
  const isPublicRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/maintenance") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next");

  if (!isPublicRoute && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image  (image optimization)
     * - favicon.ico, icon.svg, and other static assets
     */
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
