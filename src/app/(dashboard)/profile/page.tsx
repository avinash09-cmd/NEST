"use client";
// src/app/(dashboard)/profile/page.tsx
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Mail, Phone, MapPin, Home, Loader2, CheckCircle2 } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getInitials, cn } from "@/lib/utils";

const profileSchema = z.object({
  name:         z.string().min(2, "Name must be at least 2 characters"),
  phone:        z.string().optional(),
  address:      z.string().optional(),
  neighborhood: z.string().optional(),
});

type ProfileInput = z.infer<typeof profileSchema>;

const ROLE_STYLES: Record<string, string> = {
  SUPER_ADMIN: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  ADMIN:       "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  RESIDENT:    "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
};

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name:         session?.user?.name ?? "",
      phone:        "",
      address:      "",
      neighborhood: "",
    },
  });

  const onSubmit = async (data: ProfileInput) => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error);
      await update({ name: data.name });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast({ title: "Profile updated successfully" });
    } catch (e) {
      toast({ variant: "destructive", title: "Update failed", description: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const user = session?.user;

  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="My Profile" subtitle="Manage your account information" />
      <div className="flex-1 p-4 md:p-6 max-w-2xl mx-auto w-full space-y-6">

        {/* Avatar card */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-5">
            <Avatar className="w-16 h-16 shrink-0">
              <AvatarFallback className="text-xl font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400">
                {user?.name ? getInitials(user.name) : "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {user?.name ?? "No name set"}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3.5 h-3.5" />
                {user?.email}
              </p>
              <div className="mt-2">
                <Badge className={cn("text-xs border-0 capitalize", ROLE_STYLES[user?.role ?? "RESIDENT"])}>
                  {user?.role?.toLowerCase().replace("_", " ")}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Edit form */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
            <User className="w-4 h-4 text-slate-500" />
            Personal information
          </h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                placeholder="Jane Smith"
                className={errors.name ? "border-red-400" : ""}
                {...register("name")}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                value={user?.email ?? ""}
                disabled
                className="bg-slate-50 dark:bg-slate-700/50 text-slate-400 cursor-not-allowed"
              />
              <p className="text-xs text-slate-400">Email cannot be changed</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  Phone
                </Label>
                <Input id="phone" placeholder="+1-555-0100" {...register("phone")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="neighborhood" className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  Neighborhood
                </Label>
                <Input id="neighborhood" placeholder="North Side" {...register("neighborhood")} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address" className="flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5 text-slate-400" />
                Home address
              </Label>
              <Input id="address" placeholder="42 Maple Street" {...register("address")} />
            </div>

            <Button
              type="submit"
              disabled={saving}
              className={cn(
                "w-full h-11 transition-all",
                saved
                  ? "bg-green-600 hover:bg-green-600 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              )}
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</>
              ) : saved ? (
                <><CheckCircle2 className="w-4 h-4 mr-2" />Saved!</>
              ) : (
                "Save changes"
              )}
            </Button>
          </form>
        </div>

        {/* Security card */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Security</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Password management and account security settings.
          </p>
          <Button variant="outline" className="w-full" disabled>
            Change password (coming soon)
          </Button>
        </div>
      </div>
    </div>
  );
}
