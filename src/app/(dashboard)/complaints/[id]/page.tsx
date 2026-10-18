"use client";
// src/app/(dashboard)/complaints/[id]/page.tsx
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, MapPin, Calendar, User, Bot, Loader2, Send, Trash2 } from "lucide-react";
import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn, formatDateTime } from "@/lib/utils";
import { PRIORITY_COLORS, STATUS_COLORS } from "@/lib/constants";

type ComplaintDetail = {
  id: string; ticketNumber: string; title: string; description: string;
  category: string; status: string; priority: string; location: string;
  isAnonymous: boolean; createdAt: string; resolvedAt?: string;
  aiCategory?: string; aiCategoryConf?: number; sentimentLabel?: string;
  sentimentScore?: number; riskScore?: number; aiSummary?: string;
  user: { id: string; name?: string; email: string; neighborhood?: string };
  comments: {
    id: string; content: string; isInternal: boolean; createdAt: string;
    user: { id: string; name?: string; email: string; role: string };
  }[];
};

export default function ComplaintDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const { toast } = useToast();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";

  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchComplaint = async () => {
    try {
      const r = await fetch(`/api/complaints/${id}`);
      const d = await r.json();
      if (d.success) setComplaint(d.data);
      else router.push("/complaints");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchComplaint(); }, [id]);

  const updateStatus = async (status: string) => {
    setUpdatingStatus(true);
    try {
      const r = await fetch(`/api/complaints/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const d = await r.json();
      if (d.success) { setComplaint(prev => prev ? { ...prev, status } : prev); toast({ title: "Status updated" }); }
    } finally { setUpdatingStatus(false); }
  };

  const submitComment = async () => {
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      const r = await fetch(`/api/complaints/${id}/comments`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: comment, isInternal }),
      });
      const d = await r.json();
      if (d.success) { setComment(""); await fetchComplaint(); toast({ title: "Comment added" }); }
    } finally { setSubmitting(false); }
  };

  const deleteComplaint = async () => {
    if (!confirm("Are you sure you want to delete this complaint?")) return;
    const r = await fetch(`/api/complaints/${id}`, { method: "DELETE" });
    const d = await r.json();
    if (d.success) { toast({ title: "Complaint deleted" }); router.push("/complaints"); }
  };

  if (loading) return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Loading…" />
      <div className="flex-1 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
    </div>
  );

  if (!complaint) return null;

  return (
    <div className="flex flex-col min-h-full">
      <TopBar title={complaint.ticketNumber} subtitle={complaint.title} />
      <div className="flex-1 p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-5">
          <Link href="/complaints" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to complaints
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-5">
              {/* Complaint card */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{complaint.title}</h2>
                  <div className="flex gap-2 shrink-0">
                    <Badge className={cn("border-0 text-xs", PRIORITY_COLORS[complaint.priority as keyof typeof PRIORITY_COLORS])}>{complaint.priority}</Badge>
                    <Badge className={cn("border-0 text-xs", STATUS_COLORS[complaint.status as keyof typeof STATUS_COLORS])}>{complaint.status.replace("_"," ")}</Badge>
                  </div>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm whitespace-pre-wrap mb-5">{complaint.description}</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span className="truncate">{complaint.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span>{formatDateTime(complaint.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <User className="w-4 h-4 shrink-0" />
                    <span>{complaint.isAnonymous ? "Anonymous" : (complaint.user.name ?? complaint.user.email)}</span>
                  </div>
                  <div className="text-slate-500 dark:text-slate-400">
                    <span className="font-medium text-slate-700 dark:text-slate-300">Category: </span>
                    {complaint.category.replace(/_/g, " ")}
                  </div>
                </div>
              </div>

              {/* AI Insights */}
              {(complaint.aiCategory || complaint.aiSummary || complaint.riskScore != null) && (
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h3 className="font-semibold text-blue-900 dark:text-blue-300 text-sm">AI Analysis</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    {complaint.aiCategory && (
                      <div className="bg-white/60 dark:bg-white/5 rounded-lg p-3">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Category</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{complaint.aiCategory.replace(/_/g," ")}</p>
                        {complaint.aiCategoryConf && <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">{Math.round(complaint.aiCategoryConf * 100)}% confidence</p>}
                      </div>
                    )}
                    {complaint.sentimentLabel && (
                      <div className="bg-white/60 dark:bg-white/5 rounded-lg p-3">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Sentiment</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{complaint.sentimentLabel.replace("_"," ")}</p>
                        {complaint.sentimentScore != null && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Score: {complaint.sentimentScore.toFixed(2)}</p>}
                      </div>
                    )}
                    {complaint.riskScore != null && (
                      <div className="bg-white/60 dark:bg-white/5 rounded-lg p-3">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Risk Score</p>
                        <p className={cn("text-2xl font-bold", complaint.riskScore >= 70 ? "text-red-600" : complaint.riskScore >= 40 ? "text-amber-500" : "text-green-600")}>
                          {Math.round(complaint.riskScore)}
                        </p>
                        <div className="h-1 bg-slate-200 dark:bg-slate-600 rounded-full mt-1.5">
                          <div className={cn("h-1 rounded-full", complaint.riskScore >= 70 ? "bg-red-500" : complaint.riskScore >= 40 ? "bg-amber-500" : "bg-green-500")} style={{ width: `${complaint.riskScore}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                  {complaint.aiSummary && <p className="text-sm text-slate-600 dark:text-slate-300 italic">{complaint.aiSummary}</p>}
                </div>
              )}

              {/* Comments */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                    Comments ({complaint.comments.filter(c => !c.isInternal || isAdmin).length})
                  </h3>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {complaint.comments
                    .filter(c => !c.isInternal || isAdmin)
                    .map(c => (
                      <div key={c.id} className={cn("px-5 py-4", c.isInternal ? "bg-amber-50 dark:bg-amber-900/10" : "")}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300">
                              {(c.user.name ?? c.user.email)[0].toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-slate-900 dark:text-white">{c.user.name ?? c.user.email}</span>
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5 capitalize">{c.user.role.toLowerCase()}</Badge>
                          {c.isInternal && <Badge className="text-[10px] h-4 px-1.5 bg-amber-100 text-amber-700 border-0">Internal</Badge>}
                          <span className="text-xs text-slate-400 ml-auto">{formatDateTime(c.createdAt)}</span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300 pl-8">{c.content}</p>
                      </div>
                    ))}
                </div>
                {/* Add comment */}
                <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 space-y-3">
                  <Textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Add a comment…"
                    rows={3}
                    className="resize-none"
                  />
                  <div className="flex items-center justify-between">
                    {isAdmin && (
                      <div className="flex items-center gap-2">
                        <Switch checked={isInternal} onCheckedChange={setIsInternal} id="internal" />
                        <Label htmlFor="internal" className="text-xs text-slate-500">Internal note</Label>
                      </div>
                    )}
                    <Button
                      onClick={submitComment}
                      disabled={!comment.trim() || submitting}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white ml-auto gap-2"
                    >
                      {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      Post
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Status control */}
              {isAdmin && (
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-3">Update Status</h3>
                  <Select defaultValue={complaint.status} onValueChange={updateStatus} disabled={updatingStatus}>
                    <SelectTrigger>{updatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <SelectValue />}</SelectTrigger>
                    <SelectContent>
                      {["PENDING","UNDER_REVIEW","IN_PROGRESS","RESOLVED","REJECTED","CLOSED"].map(s => (
                        <SelectItem key={s} value={s}>{s.replace("_"," ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Meta info */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-3">
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Details</h3>
                {[
                  { label: "Ticket", value: complaint.ticketNumber },
                  { label: "Filed", value: formatDateTime(complaint.createdAt) },
                  { label: "Category", value: complaint.category.replace(/_/g, " ") },
                  ...(complaint.resolvedAt ? [{ label: "Resolved", value: formatDateTime(complaint.resolvedAt) }] : []),
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">{label}</span>
                    <span className="font-medium text-slate-900 dark:text-white text-right max-w-[55%] truncate">{value}</span>
                  </div>
                ))}
              </div>

              {/* Danger zone */}
              {(isAdmin || complaint.userId === session?.user?.id) && (
                <div className="bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900 rounded-xl p-5">
                  <h3 className="font-semibold text-red-600 dark:text-red-400 text-sm mb-3">Danger Zone</h3>
                  <Button variant="destructive" size="sm" onClick={deleteComplaint} className="w-full gap-2">
                    <Trash2 className="w-3.5 h-3.5" /> Delete complaint
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
