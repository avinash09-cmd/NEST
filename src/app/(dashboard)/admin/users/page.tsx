"use client";
// src/app/(dashboard)/admin/users/page.tsx
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Search, Shield, UserCheck, UserX, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { formatDate, getInitials, cn } from "@/lib/utils";

type UserRow = {
  id: string; name?: string; email: string; role: string;
  isActive: boolean; phone?: string; neighborhood?: string;
  createdAt: string; _count: { complaints: number };
};

const ROLE_STYLES: Record<string, string> = {
  SUPER_ADMIN: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  ADMIN:       "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  RESIDENT:    "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
};

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-slate-200 dark:bg-slate-700 rounded", className)} />;
}

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [users, setUsers]     = useState<UserRow[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (session && session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      router.push("/dashboard");
    }
  }, [session, router]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (search)             params.set("search", search);
    if (roleFilter !== "ALL") params.set("role", roleFilter);
    try {
      const r = await fetch(`/api/admin/users?${params}`);
      const d = await r.json();
      if (d.success) {
        setUsers(d.data);
        setTotal(d.total);
        setTotalPages(d.totalPages);
      }
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { setPage(1); }, [search, roleFilter]);

  const updateUser = async (userId: string, payload: { role?: string; isActive?: boolean }) => {
    setUpdating(userId);
    try {
      const r = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...payload }),
      });
      const d = await r.json();
      if (!d.success) throw new Error(d.error);
      toast({ title: "User updated successfully" });
      fetchUsers();
    } catch (e) {
      toast({ variant: "destructive", title: "Update failed", description: (e as Error).message });
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Manage Users" subtitle={`${total} total user${total !== 1 ? "s" : ""}`} />

      <div className="flex-1 p-4 md:p-6 space-y-5">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All roles</SelectItem>
              <SelectItem value="RESIDENT">Residents</SelectItem>
              <SelectItem value="ADMIN">Admins</SelectItem>
              <SelectItem value="SUPER_ADMIN">Super Admins</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                  {["User", "Role", "Status", "Neighborhood", "Complaints", "Joined", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-4 py-4">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className={cn(
                      "hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors",
                      !u.isActive && "opacity-60"
                    )}>
                      {/* User */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8 shrink-0">
                            <AvatarFallback className={cn(
                              "text-xs font-semibold",
                              u.role === "ADMIN" || u.role === "SUPER_ADMIN"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                                : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                            )}>
                              {u.name ? getInitials(u.name) : u.email[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 dark:text-white truncate max-w-[160px]">
                              {u.name ?? "—"}
                            </p>
                            <p className="text-xs text-slate-400 truncate max-w-[160px]">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3">
                        <Select
                          defaultValue={u.role}
                          disabled={updating === u.id || u.id === session?.user?.id}
                          onValueChange={(role) => updateUser(u.id, { role })}
                        >
                          <SelectTrigger className="h-7 w-32 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="RESIDENT">Resident</SelectItem>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                            <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <Badge className={cn(
                          "text-xs border-0",
                          u.isActive
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        )}>
                          {u.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>

                      {/* Neighborhood */}
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">
                        {u.neighborhood ?? "—"}
                      </td>

                      {/* Complaints count */}
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full text-xs font-semibold">
                          {u._count.complaints}
                        </span>
                      </td>

                      {/* Joined */}
                      <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                        {formatDate(u.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        {u.id !== session?.user?.id && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={updating === u.id}
                            onClick={() => updateUser(u.id, { isActive: !u.isActive })}
                            className={cn(
                              "h-7 text-xs gap-1.5",
                              u.isActive
                                ? "text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/20"
                                : "text-green-600 border-green-200 hover:bg-green-50 dark:border-green-900 dark:hover:bg-green-900/20"
                            )}
                          >
                            {updating === u.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : u.isActive ? (
                              <><UserX className="w-3 h-3" /> Deactivate</>
                            ) : (
                              <><UserCheck className="w-3 h-3" /> Activate</>
                            )}
                          </Button>
                        )}
                        {u.id === session?.user?.id && (
                          <Badge className="text-xs bg-blue-50 text-blue-600 border-0 gap-1">
                            <Shield className="w-3 h-3" /> You
                          </Badge>
                        )}
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
                Page {page} of {totalPages} · {total} users
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline" size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline" size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
