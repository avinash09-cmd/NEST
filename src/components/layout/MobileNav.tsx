"use client";
// src/components/layout/MobileNav.tsx
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard, FileText, MessageSquare, Bell,
  AlertTriangle, Droplets, Users, Shield, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/complaints", label: "Complaints", icon: FileText },
  { href: "/suggestions", label: "Suggestions", icon: MessageSquare },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/emergency", label: "Emergency", icon: AlertTriangle },
  { href: "/water-quality", label: "Water Quality", icon: Droplets },
];

const adminItems = [
  { href: "/admin", label: "Admin Panel", icon: Shield },
  { href: "/admin/users", label: "Manage Users", icon: Users },
];

export function MobileNav({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";

  return (
    <nav className="p-3 space-y-1">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
        return (
          <Link key={href} href={href} onClick={onNavigate}>
            <div className={cn(
              "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all",
              active ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"
            )}>
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </div>
          </Link>
        );
      })}

      {isAdmin && (
        <>
          <div className="my-3 border-t border-slate-700" />
          {adminItems.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link key={href} href={href} onClick={onNavigate}>
                <div className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all",
                  active ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"
                )}>
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </div>
              </Link>
            );
          })}
        </>
      )}

      <div className="mt-4 border-t border-slate-700 pt-4">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 w-full transition-all"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign out
        </button>
      </div>
    </nav>
  );
}
