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

export async function middleware(request: NextRequest) {
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
  const role = user?.app_metadata?.role as string | undefined;

  // ─── 0. Public Routes Bypass ───────────────────────────────────────────────
  const isPublicRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/maintenance") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next");

  if (isPublicRoute) {
    // If user is already logged in and tries to visit /login, redirect appropriately
    if (pathname.startsWith("/login") && user) {
      const url = request.nextUrl.clone();
      url.pathname = role === "ADMIN" ? "/admin" : "/";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // ─── 1. Authenticated Check ────────────────────────────────────────────────
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // ─── 2. RBAC: Protect /admin/* routes ───────────────────────────────────────
  // Only users with role === "ADMIN" can access the Admin Panel.
  if (pathname.startsWith("/admin")) {
    if (role !== "ADMIN") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // ─── 3. RBAC: Restricted operational routes ────────────────────────────────
  // Operational dashboard is NOT for ADMINs.
  if (role === "ADMIN" && (pathname === "/" || pathname.startsWith("/transactions") || pathname.startsWith("/categories"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  // Categories management is OWNER only.
  if (pathname.startsWith("/categories")) {
    if (role !== "OWNER") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  // ─── 4. Maintenance Mode Check ─────────────────────────────────────────────
  // Admins bypass maintenance mode — they always have full access.
  if (role !== "ADMIN" && !pathname.startsWith("/maintenance")) {
    try {
      const maintenanceApiUrl = new URL(
        "/api/settings/maintenance",
        request.nextUrl.origin
      );
      const res = await fetch(maintenanceApiUrl.toString(), {
        signal: AbortSignal.timeout(3000),
      });

      if (res.ok) {
        const data = (await res.json()) as { isActive: boolean };
        if (data.isActive) {
          const maintenanceUrl = request.nextUrl.clone();
          maintenanceUrl.pathname = "/maintenance";
          return NextResponse.redirect(maintenanceUrl);
        }
      }
    } catch {
      // Silently allow on failure
    }
  }

  return supabaseResponse;
}

// Only run middleware on app routes, not on static files or API internals
export const config = {
  matcher: [
    // Match all routes EXCEPT: static files, images, favicon, _next internals
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
