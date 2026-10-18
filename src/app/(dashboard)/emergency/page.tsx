"use client";
// src/app/(dashboard)/emergency/page.tsx
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, MapPin, Phone, Plus, X, Loader2, CheckCircle2, Radio } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { emergencySchema, type EmergencyInput } from "@/lib/validations";
import { formatDateTime, cn } from "@/lib/utils";

const EMERGENCY_TYPES = ["MEDICAL","FIRE","FLOOD","EARTHQUAKE","CRIME","INFRASTRUCTURE","OTHER"];
const SEVERITIES      = ["LOW","MEDIUM","HIGH","CRITICAL"];

const STATUS_STYLES: Record<string, string> = {
  REPORTED:   "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  DISPATCHED: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  ACTIVE:     "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  CONTAINED:  "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  RESOLVED:   "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

const SEV_STYLES: Record<string, string> = {
  LOW:"bg-green-100 text-green-700", MEDIUM:"bg-yellow-100 text-yellow-700",
  HIGH:"bg-orange-100 text-orange-700", CRITICAL:"bg-red-100 text-red-800 font-bold",
};

type Emergency = {
  id: string; title: string; description: string; type: string;
  status: string; severity: string; location: string;
  affectedArea?: string; contactName?: string; contactPhone?: string;
  createdAt: string; resolvedAt?: string;
  reportedBy: { name?: string; email: string };
};

export default function EmergencyPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";

  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<EmergencyInput>({
    resolver: zodResolver(emergencySchema),
    defaultValues: { severity: "HIGH", type: "OTHER" },
  });

  const fetchEmergencies = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    try {
      const r = await fetch(`/api/emergency?${params}`);
      const d = await r.json();
      if (d.success) setEmergencies(d.data);
    } finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetchEmergencies(); }, [fetchEmergencies]);

  const onSubmit = async (data: EmergencyInput) => {
    setSubmitting(true);
    try {
      const r = await fetch("/api/emergency", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const d = await r.json();
      if (!d.success) throw new Error(d.error);
      toast({ title: "Emergency reported!", description: "Authorities have been notified." });
      reset(); setShowForm(false); fetchEmergencies();
    } catch (e) {
      toast({ variant: "destructive", title: "Failed", description: (e as Error).message });
    } finally { setSubmitting(false); }
  };

  const updateStatus = async (id: string, status: string) => {
    const r = await fetch("/api/emergency", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const d = await r.json();
    if (d.success) { fetchEmergencies(); toast({ title: `Status → ${status}` }); }
  };

  const active = emergencies.filter(e => !["RESOLVED","CONTAINED"].includes(e.status));
  const past   = emergencies.filter(e =>  ["RESOLVED","CONTAINED"].includes(e.status));

  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Emergency Management" subtitle="Live incident tracking and response" />
      <div className="flex-1 p-4 md:p-6 space-y-5">

        {/* Emergency banner */}
        {active.length > 0 && (
          <div className="bg-red-600 text-white rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-red-500 rounded-lg flex items-center justify-center shrink-0 animate-pulse">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold">{active.length} Active Emergency{active.length > 1 ? " Incidents" : ""}</p>
              <p className="text-red-100 text-sm">Emergency response teams have been alerted.</p>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-2 flex-wrap">
            {["ALL","REPORTED","DISPATCHED","ACTIVE","CONTAINED","RESOLVED"].map(s => (
              <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"}
                className={cn("h-8 text-xs", statusFilter === s ? "bg-blue-600 hover:bg-blue-700 text-white" : "")}
                onClick={() => setStatusFilter(s)}>{s}</Button>
            ))}
          </div>
          <Button onClick={() => setShowForm(true)} className="bg-red-600 hover:bg-red-700 text-white gap-2 shrink-0">
            <Plus className="w-4 h-4" /> Report emergency
          </Button>
        </div>

        {/* Incidents */}
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
        ) : emergencies.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-16 text-center">
            <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">No active emergencies</p>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Your neighborhood is safe</p>
          </div>
        ) : (
          <div className="space-y-3">
            {emergencies.map(em => (
              <div key={em.id} className={cn(
                "bg-white dark:bg-slate-800 border rounded-xl p-5 shadow-sm",
                ["REPORTED","ACTIVE"].includes(em.status)
                  ? "border-red-200 dark:border-red-900"
                  : "border-slate-200 dark:border-slate-700"
              )}>
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                    ["REPORTED","ACTIVE"].includes(em.status)
                      ? "bg-red-100 dark:bg-red-900/30"
                      : "bg-slate-100 dark:bg-slate-700"
                  )}>
                    <AlertTriangle className={cn("w-5 h-5",
                      ["REPORTED","ACTIVE"].includes(em.status) ? "text-red-600 dark:text-red-400" : "text-slate-500"
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-slate-900 dark:text-white">{em.title}</h3>
                      <Badge className={cn("text-xs border-0", STATUS_STYLES[em.status])}>{em.status}</Badge>
                      <Badge className={cn("text-xs border-0", SEV_STYLES[em.severity])}>{em.severity}</Badge>
                      <Badge variant="outline" className="text-xs">{em.type}</Badge>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">{em.description}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{em.location}</span>
                      {em.contactPhone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{em.contactPhone}</span>}
                      <span>{formatDateTime(em.createdAt)}</span>
                      <span>Reported by {em.reportedBy.name ?? em.reportedBy.email}</span>
                    </div>
                  </div>
                  {isAdmin && !["RESOLVED","CONTAINED"].includes(em.status) && (
                    <div className="flex flex-col gap-2 shrink-0">
                      {em.status === "REPORTED" && (
                        <Button size="sm" className="h-7 text-xs bg-orange-500 hover:bg-orange-600 text-white"
                          onClick={() => updateStatus(em.id, "DISPATCHED")}>Dispatch</Button>
                      )}
                      {em.status === "DISPATCHED" && (
                        <Button size="sm" className="h-7 text-xs bg-amber-500 hover:bg-amber-600 text-white"
                          onClick={() => updateStatus(em.id, "ACTIVE")}>Mark Active</Button>
                      )}
                      {em.status === "ACTIVE" && (
                        <Button size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => updateStatus(em.id, "CONTAINED")}>Contain</Button>
                      )}
                      <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => updateStatus(em.id, "RESOLVED")}>Resolve</Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Report dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" /> Report Emergency
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Title <span className="text-red-500">*</span></Label>
              <Input placeholder="Brief emergency description" {...register("title")} className={errors.title ? "border-red-400" : ""} />
              {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select defaultValue="OTHER" onValueChange={v => setValue("type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{EMERGENCY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Severity</Label>
                <Select defaultValue="HIGH" onValueChange={v => setValue("severity", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SEVERITIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description <span className="text-red-500">*</span></Label>
              <Textarea rows={3} placeholder="What is happening? Include all relevant details…" {...register("description")} className={errors.description ? "border-red-400" : ""} />
            </div>
            <div className="space-y-1.5">
              <Label>Location <span className="text-red-500">*</span></Label>
              <Input placeholder="Exact location / street address" {...register("location")} className={errors.location ? "border-red-400" : ""} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Contact name</Label>
                <Input placeholder="On-site contact" {...register("contactName")} />
              </div>
              <div className="space-y-1.5">
                <Label>Contact phone</Label>
                <Input placeholder="+1-555-0100" {...register("contactPhone")} />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={submitting} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Reporting…</> : "Report emergency"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}><X className="w-4 h-4" /></Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
