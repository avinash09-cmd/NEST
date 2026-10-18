"use client";
// src/app/(dashboard)/complaints/new/page.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, MapPin, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { complaintSchema, type ComplaintInput } from "@/lib/validations";
import { COMPLAINT_CATEGORIES } from "@/lib/constants";

export default function NewComplaintPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ComplaintInput>({
    resolver: zodResolver(complaintSchema),
    defaultValues: { isAnonymous: false },
  });

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue("latitude", pos.coords.latitude);
        setValue("longitude", pos.coords.longitude);
        if (!watch("location")) setValue("location", `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
        toast({ title: "Location captured", description: "GPS coordinates attached to your complaint." });
      },
      () => toast({ variant: "destructive", title: "Location unavailable", description: "Please enter location manually." })
    );
  };

  const onSubmit = async (data: ComplaintInput) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, isAnonymous }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      toast({ title: "Complaint filed!", description: `Ticket ${result.data.ticketNumber} created successfully.` });
      router.push(`/complaints/${result.data.id}`);
    } catch (e) {
      toast({ variant: "destructive", title: "Failed to file complaint", description: (e as Error).message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="File a Complaint" subtitle="Report an issue in your neighborhood" />
      <div className="flex-1 p-4 md:p-6 max-w-2xl mx-auto w-full">
        <Link href="/complaints" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to complaints
        </Link>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Complaint details</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
              <Input id="title" placeholder="Brief description of the issue" className={errors.title ? "border-red-400" : ""} {...register("title")} />
              {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label>Category <span className="text-red-500">*</span></Label>
              <Select onValueChange={(v) => setValue("category", v)}>
                <SelectTrigger className={errors.category ? "border-red-400" : ""}><SelectValue placeholder="Select a category" /></SelectTrigger>
                <SelectContent>
                  {COMPLAINT_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-xs text-red-500">{errors.category.message}</p>}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
              <Textarea
                id="description"
                rows={5}
                placeholder="Please provide as much detail as possible about the issue, including when it started and how it affects residents…"
                className={errors.description ? "border-red-400" : ""}
                {...register("description")}
              />
              {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <Label htmlFor="location">Location <span className="text-red-500">*</span></Label>
              <div className="flex gap-2">
                <Input
                  id="location"
                  placeholder="Street address or landmark"
                  className={cn("flex-1", errors.location ? "border-red-400" : "")}
                  {...register("location")}
                />
                <Button type="button" variant="outline" onClick={detectLocation} title="Use my GPS location">
                  <MapPin className="w-4 h-4" />
                </Button>
              </div>
              {errors.location && <p className="text-xs text-red-500">{errors.location.message}</p>}
            </div>

            {/* Anonymous toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/40 rounded-lg border border-slate-200 dark:border-slate-600">
              <div className="flex items-center gap-3">
                {isAnonymous ? <EyeOff className="w-4 h-4 text-slate-500" /> : <Eye className="w-4 h-4 text-slate-500" />}
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Submit anonymously</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Your name will not be attached to this complaint</p>
                </div>
              </div>
              <Switch
                checked={isAnonymous}
                onCheckedChange={(v) => { setIsAnonymous(v); setValue("isAnonymous", v); }}
              />
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isLoading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-11">
                {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting…</> : "Submit complaint"}
              </Button>
              <Link href="/complaints">
                <Button type="button" variant="outline" className="h-11">Cancel</Button>
              </Link>
            </div>
          </form>
        </div>

        {/* AI notice */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            <strong>AI-powered:</strong> Your complaint will be automatically classified, sentiment-analyzed, and risk-scored to help prioritize faster resolution.
          </p>
        </div>
      </div>
    </div>
  );
}

function cn(...cls: (string | undefined | false)[]) { return cls.filter(Boolean).join(" "); }
