"use client";
// src/app/(dashboard)/complaints/page.tsx
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Plus, Search, Filter, RefreshCw } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn, formatDate } from "@/lib/utils";
import { PRIORITY_COLORS, STATUS_COLORS, COMPLAINT_CATEGORIES } from "@/lib/constants";

type Complaint = {
  id: string; ticketNumber: string; title: string; status: string;
  priority: string; category: string; location: string;
  createdAt: string; riskScore?: number; sentimentLabel?: string;
  user: { name?: string; email: string };
  _count: { comments: number };
};

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-slate-200 dark:bg-slate-700 rounded", className)} />;
}

export default function ComplaintsPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [priority, setPriority] = useState("ALL");
  const [category, setCategory] = useState("ALL");

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "10" });
    if (search)             params.set("search",   search);
    if (status   !== "ALL") params.set("status",   status);
    if (priority !== "ALL") params.set("priority", priority);
    if (category !== "ALL") params.set("category", category);

    try {
      const r = await fetch(`/api/complaints?${params}`);
      const d = await r.json();
      if (d.success) { setComplaints(d.data); setTotal(d.total); setTotalPages(d.totalPages); }
    } finally { setLoading(false); }
  }, [page, search, status, priority, category]);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  // Reset to page 1 on filter change
  useEffect(() => { setPage(1); }, [search, status, priority, category]);

  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Complaints" subtitle={`${total} total complaint${total !== 1 ? "s" : ""}`} />

      <div className="flex-1 p-4 md:p-6 space-y-5">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by title, description or ticket…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-36"><Filter className="w-3.5 h-3.5 mr-1.5 text-slate-400" /><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                {["PENDING","UNDER_REVIEW","IN_PROGRESS","RESOLVED","REJECTED","CLOSED"].map(s => (
                  <SelectItem key={s} value={s}>{s.replace("_"," ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All priorities</SelectItem>
                {["LOW","MEDIUM","HIGH","CRITICAL"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All categories</SelectItem>
                {COMPLAINT_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchComplaints} title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Link href="/complaints/new">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New complaint</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Table card */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Ticket</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Priority</th>
                  {isAdmin && <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Risk</th>}
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Filed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: isAdmin ? 7 : 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-4"><Skeleton className="h-4 w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : complaints.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 6} className="px-4 py-12 text-center">
                      <p className="text-slate-500 dark:text-slate-400 mb-2">No complaints found</p>
                      <Link href="/complaints/new">
                        <Button size="sm" variant="outline">File a complaint</Button>
                      </Link>
                    </td>
                  </tr>
                ) : (
                  complaints.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-blue-600 dark:text-blue-400 whitespace-nowrap">
                        <Link href={`/complaints/${c.id}`}>{c.ticketNumber}</Link>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <Link href={`/complaints/${c.id}`} className="font-medium text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 line-clamp-1">
                          {c.title}
                        </Link>
                        {isAdmin && <p className="text-xs text-slate-400 mt-0.5 truncate">{c.user.name ?? c.user.email}</p>}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">
                        {c.category.replace(/_/g, " ")}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={cn("text-xs font-medium border-0 whitespace-nowrap", STATUS_COLORS[c.status as keyof typeof STATUS_COLORS])}>
                          {c.status.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <Badge className={cn("text-xs font-medium border-0", PRIORITY_COLORS[c.priority as keyof typeof PRIORITY_COLORS])}>
                          {c.priority}
                        </Badge>
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3 hidden lg:table-cell">
                          {c.riskScore != null ? (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full w-16">
                                <div
                                  className={cn("h-1.5 rounded-full", c.riskScore >= 70 ? "bg-red-500" : c.riskScore >= 40 ? "bg-amber-500" : "bg-green-500")}
                                  style={{ width: `${c.riskScore}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-500">{Math.round(c.riskScore)}</span>
                            </div>
                          ) : <span className="text-xs text-slate-400">—</span>}
                        </td>
                      )}
                      <td className="px-4 py-3 hidden lg:table-cell text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(c.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Page {page} of {totalPages} · {total} results
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
