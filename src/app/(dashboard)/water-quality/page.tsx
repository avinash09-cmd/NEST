"use client";
// src/app/(dashboard)/water-quality/page.tsx
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Droplets, Plus, X, Loader2, AlertTriangle, CheckCircle2, ThumbsUp } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { waterReadingSchema, type WaterReadingInput } from "@/lib/validations";
import { formatDateTime, cn } from "@/lib/utils";
import { WATER_STATUS_COLORS, WATER_THRESHOLDS } from "@/lib/constants";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";

type WaterReading = {
  id: string; location: string; zone: string; status: string;
  ph: number; turbidity: number; chlorine: number; tds: number;
  temperature: number; dissolvedO2?: number; conductivity?: number;
  hardness?: number; nitrates?: number; bacteria: boolean;
  collectedBy?: string; notes?: string; recordedAt: string;
};

const STATUS_ICON: Record<string, typeof CheckCircle2> = {
  SAFE: CheckCircle2, CAUTION: AlertTriangle, UNSAFE: AlertTriangle, CRITICAL: AlertTriangle,
};

export default function WaterQualityPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";

  const [readings, setReadings] = useState<WaterReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<WaterReadingInput>({
    resolver: zodResolver(waterReadingSchema),
    defaultValues: { bacteria: false },
  });

  const fetchReadings = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/water-quality?latest=true");
      const d = await r.json();
      if (d.success) setReadings(d.data);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchReadings(); }, [fetchReadings]);

  const onSubmit = async (data: WaterReadingInput) => {
    setSubmitting(true);
    try {
      const r = await fetch("/api/water-quality", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const d = await r.json();
      if (!d.success) throw new Error(d.error);
      toast({ title: "Reading recorded!", description: `Status: ${d.data.status}` });
      reset(); setShowForm(false); fetchReadings();
    } catch (e) {
      toast({ variant: "destructive", title: "Failed", description: (e as Error).message });
    } finally { setSubmitting(false); }
  };

  const safeCount    = readings.filter(r => r.status === "SAFE").length;
  const cautionCount = readings.filter(r => r.status === "CAUTION").length;
  const unsafeCount  = readings.filter(r => ["UNSAFE","CRITICAL"].includes(r.status)).length;

  // Build radar data from latest reading
  const latest = readings[0];
  const radarData = latest ? [
    { metric: "pH",        value: Math.min(100, Math.abs(latest.ph - 7) < 1 ? 95 : 60) },
    { metric: "Turbidity", value: latest.turbidity <= 1 ? 95 : latest.turbidity <= 4 ? 60 : 20 },
    { metric: "Chlorine",  value: latest.chlorine >= 0.2 && latest.chlorine <= 4 ? 90 : 40 },
    { metric: "TDS",       value: latest.tds <= 300 ? 95 : latest.tds <= 500 ? 70 : 30 },
    { metric: "Temp",      value: latest.temperature <= 25 ? 90 : 60 },
    { metric: "DO₂",       value: latest.dissolvedO2 ? (latest.dissolvedO2 >= 6 ? 90 : 50) : 70 },
  ] : [];

  // Trend data (mock history based on readings)
  const trendData = readings.slice(0, 10).reverse().map((r, i) => ({
    label: `R${i + 1}`, ph: r.ph, turbidity: r.turbidity, chlorine: r.chlorine,
  }));

  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Water Quality Monitoring" subtitle="Real-time zone water safety analysis" />
      <div className="flex-1 p-4 md:p-6 space-y-5">

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3">
            <ThumbsUp className="w-5 h-5 text-green-600 shrink-0" />
            <div><p className="text-2xl font-bold text-green-700 dark:text-green-400">{safeCount}</p><p className="text-xs text-green-600 dark:text-green-500">Safe zones</p></div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div><p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{cautionCount}</p><p className="text-xs text-amber-600 dark:text-amber-500">Caution zones</p></div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <div><p className="text-2xl font-bold text-red-700 dark:text-red-400">{unsafeCount}</p><p className="text-xs text-red-600 dark:text-red-500">Unsafe / Critical</p></div>
          </div>
        </div>

        {/* Charts */}
        {readings.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-4">Quality Radar — Latest Reading</h3>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <Radar name="Quality" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-4">Parameter Trends</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trendData} margin={{ left: -20, right: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#1e293b", border: "none", borderRadius: 8, color: "#f1f5f9", fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="ph" stroke="#3b82f6" strokeWidth={2} dot={false} name="pH" />
                  <Line type="monotone" dataKey="turbidity" stroke="#f59e0b" strokeWidth={2} dot={false} name="Turbidity" />
                  <Line type="monotone" dataKey="chlorine" stroke="#22c55e" strokeWidth={2} dot={false} name="Chlorine" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Readings table */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-slate-900 dark:text-white">Latest Readings</h3>
            {isAdmin && (
              <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 h-8 text-sm">
                <Plus className="w-3.5 h-3.5" /> Add reading
              </Button>
            )}
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                    {["Zone","Location","Status","pH","Turbidity","Chlorine","TDS","Bacteria","Recorded"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {readings.map(r => {
                    const Icon = STATUS_ICON[r.status] ?? CheckCircle2;
                    return (
                      <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white whitespace-nowrap">{r.zone}</td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 max-w-[150px] truncate">{r.location}</td>
                        <td className="px-4 py-3">
                          <Badge className={cn("text-xs border-0 gap-1", WATER_STATUS_COLORS[r.status as keyof typeof WATER_STATUS_COLORS])}>
                            <Icon className="w-3 h-3" />{r.status}
                          </Badge>
                        </td>
                        <td className={cn("px-4 py-3 tabular-nums font-medium", r.ph < WATER_THRESHOLDS.ph.min || r.ph > WATER_THRESHOLDS.ph.max ? "text-red-600" : "text-slate-900 dark:text-white")}>{r.ph.toFixed(1)}</td>
                        <td className={cn("px-4 py-3 tabular-nums font-medium", r.turbidity > WATER_THRESHOLDS.turbidity.max ? "text-red-600" : "text-slate-900 dark:text-white")}>{r.turbidity.toFixed(2)}</td>
                        <td className={cn("px-4 py-3 tabular-nums font-medium", r.chlorine < WATER_THRESHOLDS.chlorine.min || r.chlorine > WATER_THRESHOLDS.chlorine.max ? "text-red-600" : "text-slate-900 dark:text-white")}>{r.chlorine.toFixed(2)}</td>
                        <td className={cn("px-4 py-3 tabular-nums font-medium", r.tds > WATER_THRESHOLDS.tds.max ? "text-red-600" : "text-slate-900 dark:text-white")}>{r.tds}</td>
                        <td className="px-4 py-3">
                          <Badge className={cn("text-xs border-0", r.bacteria ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700")}>{r.bacteria ? "Detected" : "None"}</Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{formatDateTime(r.recordedAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add reading dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Droplets className="w-5 h-5 text-blue-500" />Add Water Reading</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Location <span className="text-red-500">*</span></Label>
                <Input placeholder="e.g. North Reservoir" {...register("location")} />
              </div>
              <div className="space-y-1.5">
                <Label>Zone <span className="text-red-500">*</span></Label>
                <Input placeholder="e.g. Zone A" {...register("zone")} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {([
                ["ph","pH (0–14)", "7.2"],
                ["turbidity","Turbidity (NTU)", "0.5"],
                ["chlorine","Chlorine (mg/L)", "0.8"],
                ["tds","TDS (mg/L)", "200"],
                ["temperature","Temp (°C)", "20"],
                ["nitrates","Nitrates (mg/L)", "5"],
              ] as [keyof WaterReadingInput, string, string][]).map(([field, label, placeholder]) => (
                <div key={field} className="space-y-1.5">
                  <Label className="text-xs">{label}</Label>
                  <Input type="number" step="0.01" placeholder={placeholder}
                    {...register(field, { valueAsNumber: true })}
                    className={errors[field] ? "border-red-400" : ""}
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <Switch checked={watch("bacteria")} onCheckedChange={v => setValue("bacteria", v)} id="bacteria" />
              <Label htmlFor="bacteria" className="text-sm text-red-700 dark:text-red-400 font-medium">Coliform bacteria detected</Label>
            </div>
            <div className="space-y-1.5">
              <Label>Collected by</Label>
              <Input placeholder="Sensor ID or officer name" {...register("collectedBy")} />
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={submitting} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : "Save reading"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}><X className="w-4 h-4" /></Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
