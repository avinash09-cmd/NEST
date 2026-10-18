"use client";
// src/app/(dashboard)/admin/page.tsx
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Shield, Users, FileText, Bell, AlertTriangle,
  Droplets, TrendingUp, Activity, Bot, CheckCircle2,
} from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { StatsCard } from "@/components/dashboard/StatsCard";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Stats = {
  totalComplaints: number;
  pendingComplaints: number;
  resolvedComplaints: number;
  activeAlerts: number;
  activeEmergencies: number;
  waterSafeZones: number;
  waterUnsafeZones: number;
};

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-slate-200 dark:bg-slate-700 rounded-xl", className)} />;
}

const adminActions = [
  { label: "Manage Users",      href: "/admin/users",   icon: Users,         desc: "View, promote, or deactivate resident accounts",    color: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300" },
  { label: "Review Complaints", href: "/complaints",    icon: FileText,      desc: "Triage, assign, and resolve open complaints",       color: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300" },
  { label: "Publish Alert",     href: "/alerts",        icon: Bell,          desc: "Send neighbourhood-wide alerts and notifications",  color: "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300" },
  { label: "Emergency Board",   href: "/emergency",     icon: AlertTriangle, desc: "Monitor and respond to live emergencies",           color: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300" },
  { label: "Water Quality",     href: "/water-quality", icon: Droplets,      desc: "Log water readings and monitor zone safety",        color: "bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-300" },
  { label: "Suggestions",       href: "/suggestions",   icon: TrendingUp,    desc: "Review anonymous community improvement ideas",      color: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300" },
];

const AI_PIPELINES = [
  { label: "Complaint Classifier", model: "claude-sonnet-4-6" },
  { label: "Sentiment Analysis",   model: "claude-sonnet-4-6" },
  { label: "Risk Scoring",         model: "claude-sonnet-4-6" },
  { label: "Chat Assistant",       model: "claude-sonnet-4-6" },
];

export default function AdminPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stats, setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session && session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      router.push("/dashboard");
      return;
    }
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((d) => d.success && setStats(d.data))
      .finally(() => setLoading(false));
  }, [session, router]);

  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Admin Panel" subtitle="System management and oversight" />

      <div className="flex-1 p-4 md:p-6 space-y-6">
        {/* Identity banner */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/20 border border-blue-500/30 rounded-xl flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6 text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold">Administration Console</p>
            <p className="text-slate-400 text-sm truncate">
              Signed in as {session?.user?.name} · {session?.user?.role}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400 text-xs font-medium">All systems operational</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)
          ) : (
            <>
              <StatsCard title="Total"      value={stats?.totalComplaints    ?? 0} icon={FileText}      variant="blue"    className="col-span-1" />
              <StatsCard title="Pending"    value={stats?.pendingComplaints  ?? 0} icon={Activity}      variant="amber"   className="col-span-1" />
              <StatsCard title="Resolved"   value={stats?.resolvedComplaints ?? 0} icon={CheckCircle2}  variant="green"   className="col-span-1" />
              <StatsCard title="Alerts"     value={stats?.activeAlerts       ?? 0} icon={Bell}          variant={stats?.activeAlerts       ? "red" : "default"} className="col-span-1" />
              <StatsCard title="Emergencies"value={stats?.activeEmergencies  ?? 0} icon={AlertTriangle} variant={stats?.activeEmergencies  ? "red" : "default"} className="col-span-1" />
              <StatsCard title="Unsafe H₂O" value={stats?.waterUnsafeZones  ?? 0} icon={Droplets}      variant={stats?.waterUnsafeZones   ? "red" : "green"}   className="col-span-1" />
            </>
          )}
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 uppercase tracking-wide">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {adminActions.map(({ label, href, icon: Icon, desc, color }) => (
              <Link key={href} href={href}>
                <div className={cn("border rounded-xl p-4 hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer", color)}>
                  <div className="flex items-start gap-3">
                    <Icon className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">{label}</p>
                      <p className="text-xs opacity-70 mt-0.5 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* AI Pipeline Status */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="font-semibold text-slate-900 dark:text-white text-sm">AI Pipeline Status</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {AI_PIPELINES.map(({ label, model }) => (
              <div key={label} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs font-medium text-green-700 dark:text-green-400">Active</span>
                </div>
                <p className="text-sm font-medium text-slate-900 dark:text-white leading-tight">{label}</p>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">{model}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
