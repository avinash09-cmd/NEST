"use client";
// src/app/(dashboard)/dashboard/page.tsx
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  FileText, Bell, AlertTriangle, Droplets,
  CheckCircle2, Clock, TrendingUp, Zap,
} from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { TopBar } from "@/components/layout/TopBar";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, cn } from "@/lib/utils";
import { PRIORITY_COLORS, STATUS_COLORS } from "@/lib/constants";
import Link from "next/link";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Legend,
} from "recharts";

// Skeleton loader
function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-slate-200 dark:bg-slate-700 rounded", className)} />;
}

const CHART_DATA = [
  { month: "Jan", complaints: 18, resolved: 12 },
  { month: "Feb", complaints: 24, resolved: 20 },
  { month: "Mar", complaints: 31, resolved: 25 },
  { month: "Apr", complaints: 22, resolved: 18 },
  { month: "May", complaints: 29, resolved: 24 },
  { month: "Jun", complaints: 35, resolved: 30 },
  { month: "Jul", complaints: 28, resolved: 22 },
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Record<string, number | unknown[]> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((d) => d.success && setStats(d.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";
  type Complaint = {
    id: string; ticketNumber: string; title: string;
    status: string; priority: string; category: string;
    createdAt: string; user?: { name?: string };
  };
  const recentComplaints = (stats?.recentComplaints as Complaint[]) ?? [];

  return (
    <div className="flex flex-col min-h-full">
      <TopBar
        title={`Good ${getGreeting()}, ${session?.user?.name?.split(" ")[0] ?? "there"} 👋`}
        subtitle="Here's what's happening in your neighborhood today"
      />

      <div className="flex-1 p-4 md:p-6 space-y-6">
        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))
          ) : (
            <>
              <StatsCard title="Total Complaints" value={stats?.totalComplaints as number ?? 0} icon={FileText} variant="blue" subtitle={isAdmin ? "All residents" : "My reports"} />
              <StatsCard title="Pending Review" value={stats?.pendingComplaints as number ?? 0} icon={Clock} variant="amber" subtitle="Awaiting action" />
              <StatsCard title="Resolved" value={stats?.resolvedComplaints as number ?? 0} icon={CheckCircle2} variant="green" subtitle="Successfully closed" />
              <StatsCard title="Active Alerts" value={stats?.activeAlerts as number ?? 0} icon={Bell} variant={((stats?.activeAlerts as number) ?? 0) > 0 ? "red" : "default"} subtitle="Neighborhood-wide" />
              <StatsCard title="Emergencies" value={stats?.activeEmergencies as number ?? 0} icon={AlertTriangle} variant={((stats?.activeEmergencies as number) ?? 0) > 0 ? "red" : "default"} subtitle="Active incidents" />
              <StatsCard title="Safe Water Zones" value={stats?.waterSafeZones as number ?? 0} icon={Droplets} variant="green" subtitle="Passing quality checks" />
              <StatsCard title="Unsafe Zones" value={stats?.waterUnsafeZones as number ?? 0} icon={Droplets} variant={((stats?.waterUnsafeZones as number) ?? 0) > 0 ? "red" : "default"} subtitle="Require attention" />
              <StatsCard title="AI Analysis" value="Active" icon={Zap} variant="purple" subtitle="Classification + sentiment" />
            </>
          )}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Complaints trend */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Complaint Trends</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Filed vs resolved — last 7 months</p>
              </div>
              <TrendingUp className="w-4 h-4 text-slate-400" />
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={CHART_DATA} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="cFiled" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="cResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#1e293b", border: "none", borderRadius: 8, color: "#f1f5f9", fontSize: 12 }} />
                <Area type="monotone" dataKey="complaints" name="Filed" stroke="#3b82f6" strokeWidth={2} fill="url(#cFiled)" />
                <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#22c55e" strokeWidth={2} fill="url(#cResolved)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly bar chart */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Monthly Overview</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Filed and resolved per month</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={CHART_DATA} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#1e293b", border: "none", borderRadius: 8, color: "#f1f5f9", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                <Bar dataKey="complaints" name="Filed" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="resolved" name="Resolved" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent complaints table */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-slate-900 dark:text-white">Recent Complaints</h3>
            <Link href="/complaints" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View all →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Ticket</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Title</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide hidden sm:table-cell">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide hidden md:table-cell">Priority</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide hidden lg:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-5 py-4"><Skeleton className="h-4 w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : recentComplaints.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-400 dark:text-slate-500 text-sm">
                      No complaints yet.{" "}
                      <Link href="/complaints/new" className="text-blue-600 hover:underline">File one now →</Link>
                    </td>
                  </tr>
                ) : (
                  recentComplaints.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                      <td className="px-5 py-4 font-mono text-xs text-blue-600 dark:text-blue-400">
                        <Link href={`/complaints/${c.id}`}>{c.ticketNumber}</Link>
                      </td>
                      <td className="px-5 py-4 text-slate-900 dark:text-white font-medium max-w-xs truncate">
                        <Link href={`/complaints/${c.id}`} className="hover:text-blue-600 dark:hover:text-blue-400">
                          {c.title}
                        </Link>
                      </td>
                      <td className="px-5 py-4 hidden sm:table-cell">
                        <Badge className={cn("text-xs font-medium border-0", STATUS_COLORS[c.status as keyof typeof STATUS_COLORS])}>
                          {c.status.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <Badge className={cn("text-xs font-medium border-0", PRIORITY_COLORS[c.priority as keyof typeof PRIORITY_COLORS])}>
                          {c.priority}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 hidden lg:table-cell text-slate-500 dark:text-slate-400 text-xs">
                        {formatDateTime(c.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
