// =============================================================================
// Dashboard Layout
// =============================================================================
// Wraps all dashboard pages with a sidebar navigation and header.
// Fetches the current user server-side to determine which nav items to show.
//
// WHY a route group `(dashboard)` instead of a regular folder?
// Route groups (parentheses) let us apply a layout without adding a URL
// segment. So `/` renders Dashboard, not `/dashboard`.
// =============================================================================

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/sonner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch authenticated user — this runs server-side (RSC)
  const user = await getCurrentUser();

  // WHY redirect here AND in middleware?
  // Defense in depth: middleware handles the initial redirect, but this
  // catches edge cases where middleware might not run (e.g., client-side nav).
  if (!user) {
    redirect("/login");
  }

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        {/* Top bar with sidebar toggle (visible on mobile) */}
        <header className="flex h-14 items-center gap-2 border-b px-4 lg:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-5" />
          <div className="flex-1" />
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </SidebarInset>
      <Toaster position="top-center" richColors />
    </SidebarProvider>
  );
}
