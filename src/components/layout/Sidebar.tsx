"use client";
// src/components/layout/Sidebar.tsx
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard, FileText, MessageSquare, Bell,
  AlertTriangle, Droplets, Users, Shield, LogOut,
  ChevronRight, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["RESIDENT", "ADMIN", "SUPER_ADMIN"] },
  { href: "/complaints", label: "Complaints", icon: FileText, roles: ["RESIDENT", "ADMIN", "SUPER_ADMIN"] },
  { href: "/suggestions", label: "Suggestions", icon: MessageSquare, roles: ["RESIDENT", "ADMIN", "SUPER_ADMIN"] },
  { href: "/alerts", label: "Alerts", icon: Bell, roles: ["RESIDENT", "ADMIN", "SUPER_ADMIN"] },
  { href: "/emergency", label: "Emergency", icon: AlertTriangle, roles: ["RESIDENT", "ADMIN", "SUPER_ADMIN"] },
  { href: "/water-quality", label: "Water Quality", icon: Droplets, roles: ["RESIDENT", "ADMIN", "SUPER_ADMIN"] },
];

const adminItems = [
  { href: "/admin", label: "Admin Panel", icon: Shield, roles: ["ADMIN", "SUPER_ADMIN"] },
  { href: "/admin/users", label: "Manage Users", icon: Users, roles: ["ADMIN", "SUPER_ADMIN"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white h-screen sticky top-0 z-30 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-700/60">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shrink-0">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="font-bold text-sm tracking-wide text-white">N.E.S.T.</p>
          <p className="text-slate-400 text-[10px] leading-tight">Neighborhood Safety Tool</p>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        {/* Main nav */}
        <div className="space-y-0.5">
          <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-widest px-3 mb-2">
            Main Menu
          </p>
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link key={href} href={href}>
                <div className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                  active
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                )}>
                  <Icon className={cn("w-4 h-4 shrink-0", active ? "text-white" : "text-slate-500 group-hover:text-slate-300")} />
                  <span className="flex-1">{label}</span>
                  {active && <ChevronRight className="w-3 h-3 opacity-60" />}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Admin nav */}
        {isAdmin && (
          <div className="mt-6 space-y-0.5">
            <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-widest px-3 mb-2">
              Administration
            </p>
            {adminItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href);
              return (
                <Link key={href} href={href}>
                  <div className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                    active
                      ? "bg-purple-600 text-white shadow-md"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  )}>
                    <Icon className={cn("w-4 h-4 shrink-0", active ? "text-white" : "text-slate-500 group-hover:text-slate-300")} />
                    <span className="flex-1">{label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* AI badge */}
        <div className="mt-6 mx-1 p-3 bg-gradient-to-br from-blue-900/50 to-purple-900/40 border border-blue-700/30 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs font-semibold text-blue-300">AI-Powered</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Auto-classification, sentiment analysis &amp; risk scoring active.
          </p>
        </div>
      </ScrollArea>

      {/* User profile + sign out */}
      <div className="border-t border-slate-700/60 p-3">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-800 transition-colors">
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarFallback className="bg-blue-700 text-white text-xs font-semibold">
              {user?.name ? getInitials(user.name) : "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name ?? "User"}</p>
            <p className="text-slate-400 text-[11px] capitalize truncate">
              {user?.role?.toLowerCase().replace("_", " ")}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-7 h-7 text-slate-400 hover:text-white hover:bg-slate-700 shrink-0"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
