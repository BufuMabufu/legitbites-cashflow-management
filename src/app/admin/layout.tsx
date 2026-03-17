// =============================================================================
// Admin Layout
// =============================================================================
// Wraps all /admin/* pages. Verifies the current user is an ADMIN;
// if not, redirects to root. Provides an admin-specific sidebar navigation.
// =============================================================================

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";
import { AdminSidebar } from "./admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  // Double-check ADMIN role (middleware is the first line of defence)
  if (!user || user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="min-h-screen flex bg-background">
      <AdminSidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="h-14 border-b flex items-center px-6 gap-3 shrink-0">
          <div className="flex-1" />
          <span className="text-xs text-muted-foreground">⚙️ Admin Panel</span>
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
      <Toaster position="top-center" richColors />
    </div>
  );
}
