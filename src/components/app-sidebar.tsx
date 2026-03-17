// =============================================================================
// Dashboard Sidebar Component
// =============================================================================
// Navigation sidebar with role-based menu items.
// OWNER sees all links; STAFF sees only transaction-related links.
// Uses Shadcn Sidebar component with responsive mobile support.
// =============================================================================

"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowRightLeft,
  PlusCircle,
  FolderOpen,
  LogOut,
  Moon,
  Sun,
  ShieldCheck,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Swal from "sweetalert2";
import { logout } from "@/app/login/actions";
import { useTheme } from "next-themes";

type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  ownerOnly?: boolean;
  adminOnly?: boolean;
};

// Navigation menu items — items with `ownerOnly: true` are hidden for STAFF
// Items with `adminOnly: true` are only shown to ADMIN users
const NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Catat Transaksi",
    href: "/transactions/new",
    icon: PlusCircle,
  },
  {
    title: "Riwayat Transaksi",
    href: "/transactions",
    icon: ArrowRightLeft,
  },
  {
    title: "Kategori",
    href: "/categories",
    icon: FolderOpen,
    ownerOnly: true,
  },
  {
    title: "Admin Panel",
    href: "/admin",
    icon: ShieldCheck,
    adminOnly: true,
  },
];

interface AppSidebarProps {
  user: {
    name: string;
    email: string;
    role: "OWNER" | "STAFF" | "ADMIN";
  };
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  // Filter nav items based on user role
  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.adminOnly) return user.role === "ADMIN";
    if (item.ownerOnly) return user.role === "OWNER";
    // ADMIN only sees the Admin Panel link, not the operational dashboard
    if (user.role === "ADMIN") return item.adminOnly;
    return true;
  });

  // Get initials from user name for avatar
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Yakin untuk logout?",
      text: "Anda akan keluar dari sesi saat ini.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Ya, logout!",
      cancelButtonText: "Batal",
    });

    if (result.isConfirmed) {
      await logout();
    }
  };

  return (
    <Sidebar>
      {/* --- Sidebar Header: Brand --- */}
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 p-1.5 bg-pink-50 dark:bg-pink-950/30 border border-pink-100 dark:border-pink-900 rounded-[14px] flex items-center justify-center shadow-sm shrink-0">
            <Image src="/icon.svg" alt="Logo" width={32} height={32} className="object-contain" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">LegitBites</h1>
            <p className="text-xs text-muted-foreground">Cashflow Management</p>
          </div>
        </div>
      </SidebarHeader>

      <Separator />

      {/* --- Sidebar Content: Navigation --- */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : item.href === "/transactions"
                      ? pathname === "/transactions"
                      : pathname.startsWith(item.href);

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={isActive}
                      className="h-12 text-base"
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* --- Sidebar Footer: User Info + Logout --- */}
      <SidebarFooter className="p-4">
        <Separator className="mb-4" />
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-emerald-100 text-emerald-700 font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{user.name}</p>
          <p className="text-xs text-muted-foreground">
              {user.role === "OWNER"
                ? "👑 Pemilik"
                : user.role === "ADMIN"
                  ? "⚙️ Admin"
                  : "👤 Staff"}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            variant="outline"
            className="w-full h-11 text-sm font-medium"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 mr-2" />
            ) : (
              <Moon className="w-4 h-4 mr-2" />
            )}
            Mode
          </Button>
          <Button
            type="button"
            onClick={handleLogout}
            variant="outline"
            className="w-full h-11 text-sm font-medium text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Keluar
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
