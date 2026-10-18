"use client";
// src/app/(dashboard)/alerts/page.tsx
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Bell, Plus, X, AlertTriangle, Info, Zap, Loader2 } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { alertSchema, type AlertInput } from "@/lib/validations";
import { formatDateTime, cn } from "@/lib/utils";
import { PRIORITY_COLORS } from "@/lib/constants";

const ALERT_TYPE_ICONS: Record<string, typeof Bell> = {
  WEATHER: AlertTriangle, POWER_OUTAGE: Zap, GENERAL: Bell,
  PUBLIC_HEALTH: Info, SECURITY: AlertTriangle, FLOOD: AlertTriangle,
  FIRE: AlertTriangle, ROAD_CLOSURE: Info, EVACUATION: AlertTriangle,
  EARTHQUAKE: AlertTriangle, WATER_SUPPLY: Info,
};

const ALERT_TYPES = ["WEATHER","POWER_OUTAGE","ROAD_CLOSURE","PUBLIC_HEALTH","SECURITY","EVACUATION","FLOOD","FIRE","EARTHQUAKE","GENERAL","WATER_SUPPLY"];

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  DRAFT:  "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400",
  EXPIRED:"bg-slate-100 text-slate-500",
  CANCELLED: "bg-red-100 text-red-700",
};

type AlertItem = {
  id: string; title: string; message: string; type: string;
  status: string; priority: string; neighborhood?: string;
  expiresAt?: string; createdAt: string;
  createdBy: { name?: string; email: string };
};

export default function AlertsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";

  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<AlertInput>({
    resolver: zodResolver(alertSchema),
    defaultValues: { priority: "MEDIUM", type: "GENERAL" },
  });

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    try {
      const r = await fetch(`/api/alerts?${params}`);
      const d = await r.json();
      if (d.success) setAlerts(d.data);
    } finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const onSubmit = async (data: AlertInput) => {
    setSubmitting(true);
    try {
      const r = await fetch("/api/alerts", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const d = await r.json();
      if (!d.success) throw new Error(d.error);
      toast({ title: "Alert published!", description: "All residents have been notified." });
      reset(); setShowForm(false); fetchAlerts();
    } catch (e) {
      toast({ variant: "destructive", title: "Failed", description: (e as Error).message });
    } finally { setSubmitting(false); }
  };

  const updateStatus = async (id: string, status: string) => {
    const r = await fetch("/api/alerts", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const d = await r.json();
    if (d.success) { fetchAlerts(); toast({ title: `Alert ${status.toLowerCase()}` }); }
  };

  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Alerts & Notifications" subtitle="Neighborhood-wide announcements" />
      <div className="flex-1 p-4 md:p-6 space-y-5">

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-2 flex-wrap">
            {["ALL","ACTIVE","DRAFT","EXPIRED","CANCELLED"].map(s => (
              <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"}
                className={cn("h-8 text-xs", statusFilter === s ? "bg-blue-600 hover:bg-blue-700 text-white" : "")}
                onClick={() => setStatusFilter(s)}>{s}</Button>
            ))}
          </div>
          {isAdmin && (
            <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shrink-0">
              <Plus className="w-4 h-4" /> New alert
            </Button>
          )}
        </div>

        {/* Alerts list */}
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
        ) : alerts.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-16 text-center">
            <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400">No alerts found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map(alert => {
              const Icon = ALERT_TYPE_ICONS[alert.type] ?? Bell;
              const isActive = alert.status === "ACTIVE";
              return (
                <div key={alert.id} className={cn(
                  "bg-white dark:bg-slate-800 border rounded-xl p-5 shadow-sm",
                  isActive ? "border-orange-200 dark:border-orange-900" : "border-slate-200 dark:border-slate-700"
                )}>
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                      isActive ? "bg-orange-100 dark:bg-orange-900/30" : "bg-slate-100 dark:bg-slate-700"
                    )}>
                      <Icon className={cn("w-5 h-5", isActive ? "text-orange-600 dark:text-orange-400" : "text-slate-500")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-slate-900 dark:text-white">{alert.title}</h3>
                        <Badge className={cn("text-xs border-0", STATUS_STYLES[alert.status])}>{alert.status}</Badge>
                        <Badge className={cn("text-xs border-0", PRIORITY_COLORS[alert.priority as keyof typeof PRIORITY_COLORS])}>{alert.priority}</Badge>
                        <Badge variant="outline" className="text-xs">{alert.type.replace("_"," ")}</Badge>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">{alert.message}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                        <span>By {alert.createdBy.name ?? alert.createdBy.email}</span>
                        <span>{formatDateTime(alert.createdAt)}</span>
                        {alert.neighborhood && <span>Zone: {alert.neighborhood}</span>}
                        {alert.expiresAt && <span>Expires: {formatDateTime(alert.expiresAt)}</span>}
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-2 shrink-0">
                        {isActive && (
                          <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => updateStatus(alert.id, "CANCELLED")}>
                            Cancel
                          </Button>
                        )}
                        {alert.status === "DRAFT" && (
                          <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => updateStatus(alert.id, "ACTIVE")}>
                            Publish
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create alert dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Publish new alert</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Title <span className="text-red-500">*</span></Label>
              <Input placeholder="Alert title" {...register("title")} className={errors.title ? "border-red-400" : ""} />
              {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select defaultValue="GENERAL" onValueChange={v => setValue("type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ALERT_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace("_"," ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select defaultValue="MEDIUM" onValueChange={v => setValue("priority", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["LOW","MEDIUM","HIGH","CRITICAL"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Message <span className="text-red-500">*</span></Label>
              <Textarea rows={4} placeholder="Detailed alert message for residents…" {...register("message")} className={errors.message ? "border-red-400" : ""} />
              {errors.message && <p className="text-xs text-red-500">{errors.message.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Neighborhood <span className="text-slate-400 font-normal text-xs">(optional)</span></Label>
                <Input placeholder="All neighborhoods" {...register("neighborhood")} />
              </div>
              <div className="space-y-1.5">
                <Label>Expires at <span className="text-slate-400 font-normal text-xs">(optional)</span></Label>
                <Input type="datetime-local" {...register("expiresAt")} />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={submitting} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Publishing…</> : "Publish alert"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
