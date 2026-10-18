"use client";
// src/app/(dashboard)/suggestions/page.tsx
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lightbulb, CheckCircle2, Clock, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { suggestionSchema, type SuggestionInput } from "@/lib/validations";
import { formatDate, cn } from "@/lib/utils";

const SUGGESTION_CATEGORIES = [
  "Park Improvement", "Road Safety", "Lighting", "Environment",
  "Public Transport", "Waste Management", "Community Events",
  "Water & Sanitation", "Security", "Other",
];

type Suggestion = {
  id: string; title: string; content: string; category: string;
  isReviewed: boolean; adminNotes?: string; createdAt: string;
  sentimentLabel?: string; sentimentScore?: number;
};

export default function SuggestionsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState("ALL");
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<SuggestionInput>({
    resolver: zodResolver(suggestionSchema),
  });

  const onSubmit = async (data: SuggestionInput) => {
    setSubmitting(true);
    try {
      const r = await fetch("/api/suggestions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const d = await r.json();
      if (!d.success) throw new Error(d.error);
      setSubmitted(true);
      reset();
      toast({ title: "Suggestion submitted!", description: "Thank you for helping improve the neighborhood." });
    } catch (e) {
      toast({ variant: "destructive", title: "Failed", description: (e as Error).message });
    } finally { setSubmitting(false); }
  };

  const fetchSuggestions = async () => {
    if (!isAdmin) return;
    setLoadingList(true);
    const params = new URLSearchParams({ page: "1" });
    if (filter !== "ALL") params.set("reviewed", filter === "REVIEWED" ? "true" : "false");
    try {
      const r = await fetch(`/api/suggestions?${params}`);
      const d = await r.json();
      if (d.success) setSuggestions(d.data);
    } finally { setLoadingList(false); }
  };

  useEffect(() => { fetchSuggestions(); }, [isAdmin, filter]);

  const markReviewed = async (id: string, isReviewed: boolean) => {
    setReviewingId(id);
    try {
      const r = await fetch("/api/suggestions", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isReviewed }),
      });
      const d = await r.json();
      if (d.success) {
        setSuggestions(prev => prev.map(s => s.id === id ? { ...s, isReviewed } : s));
        toast({ title: isReviewed ? "Marked as reviewed" : "Marked as pending" });
      }
    } finally { setReviewingId(null); }
  };

  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Suggestion Box" subtitle="Anonymous community improvement ideas" />
      <div className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full space-y-6">

        {/* Submit form — always visible */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">Submit a suggestion</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Fully anonymous — no account info is attached</p>
            </div>
          </div>

          {submitted ? (
            <div className="text-center py-6">
              <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
              <p className="font-medium text-slate-900 dark:text-white mb-1">Thank you!</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Your suggestion has been submitted anonymously.</p>
              <Button variant="outline" size="sm" onClick={() => setSubmitted(false)}>Submit another</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="stitle">Title <span className="text-red-500">*</span></Label>
                <Input id="stitle" placeholder="Brief title for your idea" {...register("title")} className={errors.title ? "border-red-400" : ""} />
                {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Category <span className="text-red-500">*</span></Label>
                <Select onValueChange={v => setValue("category", v)}>
                  <SelectTrigger className={errors.category ? "border-red-400" : ""}><SelectValue placeholder="Select a category" /></SelectTrigger>
                  <SelectContent>{SUGGESTION_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
                {errors.category && <p className="text-xs text-red-500">{errors.category.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="scontent">Your suggestion <span className="text-red-500">*</span></Label>
                <Textarea id="scontent" rows={4} placeholder="Describe your suggestion in detail. How would it improve the neighborhood?" {...register("content")} className={errors.content ? "border-red-400" : ""} />
                {errors.content && <p className="text-xs text-red-500">{errors.content.message}</p>}
              </div>
              <Button type="submit" disabled={submitting} className="w-full bg-amber-500 hover:bg-amber-600 text-white">
                {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting…</> : "Submit anonymously"}
              </Button>
            </form>
          )}
        </div>

        {/* Admin view */}
        {isAdmin && (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white">All suggestions</h3>
              <div className="flex gap-2">
                {["ALL", "PENDING", "REVIEWED"].map(f => (
                  <Button key={f} size="sm" variant={filter === f ? "default" : "outline"}
                    className={filter === f ? "bg-blue-600 hover:bg-blue-700 text-white h-7 text-xs" : "h-7 text-xs"}
                    onClick={() => setFilter(f)}>
                    {f}
                  </Button>
                ))}
              </div>
            </div>

            {loadingList ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
            ) : suggestions.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">No suggestions found</div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {suggestions.map(s => (
                  <div key={s.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">{s.category}</Badge>
                          {s.isReviewed
                            ? <Badge className="text-xs bg-green-100 text-green-700 border-0 gap-1"><CheckCircle2 className="w-3 h-3" />Reviewed</Badge>
                            : <Badge className="text-xs bg-amber-100 text-amber-700 border-0 gap-1"><Clock className="w-3 h-3" />Pending</Badge>
                          }
                          {s.sentimentLabel && (
                            <Badge className={cn("text-xs border-0",
                              s.sentimentLabel === "POSITIVE" ? "bg-green-100 text-green-700" :
                              s.sentimentLabel === "NEGATIVE" || s.sentimentLabel === "VERY_NEGATIVE" ? "bg-red-100 text-red-700" :
                              "bg-slate-100 text-slate-600"
                            )}>{s.sentimentLabel.replace("_"," ")}</Badge>
                          )}
                        </div>
                        <p className="font-medium text-slate-900 dark:text-white text-sm">{s.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{formatDate(s.createdAt)}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" variant="outline" className="h-7 text-xs"
                          onClick={() => markReviewed(s.id, !s.isReviewed)}
                          disabled={reviewingId === s.id}>
                          {reviewingId === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : (s.isReviewed ? "Unmark" : "Mark reviewed")}
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                          onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}>
                          {expandedId === s.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    {expandedId === s.id && (
                      <div className="mt-3 pl-1">
                        <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{s.content}</p>
                        {s.adminNotes && (
                          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Admin notes</p>
                            <p className="text-xs text-slate-600 dark:text-slate-300">{s.adminNotes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
