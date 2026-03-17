// =============================================================================
// Admin Sidebar Component
// =============================================================================
// Navigation sidebar specific to the Admin Panel.
// Separate from the dashboard sidebar — ADMIN has a completely different
// navigation structure focused on system management.
// =============================================================================

"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Users,
  FolderCog,
  ClipboardList,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import Swal from "sweetalert2";
import { logout } from "@/app/login/actions";

const ADMIN_NAV = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
  { title: "User Management", href: "/admin/users", icon: Users },
  { title: "Manajemen Kategori", href: "/admin/categories", icon: FolderCog },
  { title: "Audit Trail", href: "/admin/logs", icon: ClipboardList },
];

interface AdminSidebarProps {
  user: { name: string; email: string };
}

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Yakin untuk logout?",
      text: "Anda akan keluar dari sesi admin.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Ya, logout!",
      cancelButtonText: "Batal",
    });
    if (result.isConfirmed) await logout();
  };

  return (
    <aside className="w-64 border-r flex flex-col shrink-0 bg-background">
      {/* Brand */}
      <div className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 p-1 bg-pink-50 dark:bg-pink-950/30 border border-pink-100 dark:border-pink-900 rounded-xl flex items-center justify-center shadow-sm shrink-0">
          <Image src="/icon.svg" alt="Logo" width={24} height={24} />
        </div>
        <div>
          <h1 className="font-bold text-sm leading-tight">LegitBites</h1>
          <p className="text-xs text-muted-foreground">Admin Panel</p>
        </div>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 mb-2">
          Menu
        </p>
        {ADMIN_NAV.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4">
        <Separator className="mb-4" />
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-violet-100 text-violet-700 font-semibold text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground">⚙️ Admin</p>
          </div>
        </div>
        <Button
          type="button"
          onClick={handleLogout}
          variant="outline"
          className="w-full h-10 text-sm font-medium text-destructive hover:bg-destructive hover:text-destructive-foreground"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Keluar
        </Button>
      </div>
    </aside>
  );
}
