"use client";
// src/components/layout/TopBar.tsx
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Bell, Menu, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MobileNav } from "./MobileNav";
import Link from "next/link";

interface TopBarProps {
  title: string;
  subtitle?: string;
}

export function TopBar({ title, subtitle }: TopBarProps) {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch("/api/notifications/unread-count")
      .then((r) => r.json())
      .then((d) => d.success && setUnread(d.data ?? 0))
      .catch(() => {});
  }, [session?.user?.id]);

  return (
    <>
      <header className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 px-4 md:px-6 h-16 flex items-center justify-between gap-4">
        {/* Mobile menu toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-slate-600 dark:text-slate-300"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Page title */}
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white truncate">{title}</h1>
          {subtitle && (
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate hidden sm:block">{subtitle}</p>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Search placeholder */}
          <Button variant="ghost" size="icon" className="hidden sm:flex text-slate-500 hover:text-slate-900 dark:hover:text-white">
            <Search className="w-4 h-4" />
          </Button>

          {/* Notifications */}
          <Link href="/alerts">
            <Button variant="ghost" size="icon" className="relative text-slate-500 hover:text-slate-900 dark:hover:text-white">
              <Bell className="w-4 h-4" />
              {unread > 0 && (
                <Badge className="absolute -top-1 -right-1 w-4 h-4 p-0 flex items-center justify-center text-[10px] bg-red-500 hover:bg-red-500 border-0 text-white">
                  {unread > 9 ? "9+" : unread}
                </Badge>
              )}
            </Button>
          </Link>

          {/* Status dot */}
          <div className="hidden sm:flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-full px-2.5 py-1">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[11px] font-medium text-green-700 dark:text-green-400">System online</span>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <span className="text-white font-bold">N.E.S.T.</span>
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </Button>
            </div>
            <MobileNav onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
