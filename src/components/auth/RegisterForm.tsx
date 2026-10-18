"use client";
// src/components/auth/RegisterForm.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Eye, EyeOff, Shield, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { registerSchema, type RegisterInput } from "@/lib/validations";

export function RegisterForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const password = watch("password", "");

  const passwordChecks = [
    { label: "At least 8 characters", valid: password.length >= 8 },
    { label: "One uppercase letter", valid: /[A-Z]/.test(password) },
    { label: "One number", valid: /[0-9]/.test(password) },
  ];

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Registration failed",
          description: result.error || "Please check your details and try again.",
        });
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Account created!
          </h2>
          <p className="text-slate-500 dark:text-slate-400">Redirecting you to sign in…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create your account</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Join N.E.S.T. as a neighborhood resident
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Full name
              </Label>
              <Input
                id="name"
                placeholder="Jane Smith"
                disabled={isLoading}
                className={errors.name ? "border-red-400" : ""}
                {...register("name")}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                disabled={isLoading}
                className={errors.email ? "border-red-400" : ""}
                {...register("email")}
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  disabled={isLoading}
                  className={`pr-10 ${errors.password ? "border-red-400" : ""}`}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Password strength indicators */}
              {password && (
                <div className="space-y-1 mt-2">
                  {passwordChecks.map(({ label, valid }) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${valid ? "bg-green-500" : "bg-slate-300 dark:bg-slate-600"}`} />
                      <span className={`text-xs ${valid ? "text-green-600 dark:text-green-400" : "text-slate-400"}`}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>

            {/* Optional fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Phone <span className="text-slate-400 font-normal">(optional)</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1-555-0100"
                  disabled={isLoading}
                  {...register("phone")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="neighborhood" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Neighborhood <span className="text-slate-400 font-normal">(optional)</span>
                </Label>
                <Input
                  id="neighborhood"
                  placeholder="North Side"
                  disabled={isLoading}
                  {...register("neighborhood")}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Home address <span className="text-slate-400 font-normal">(optional)</span>
              </Label>
              <Input
                id="address"
                placeholder="42 Maple Street"
                disabled={isLoading}
                {...register("address")}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating account…
                </>
              ) : (
                "Create account"
              )}
            </Button>
          </form>
        </div>

        <p className="text-center mt-6 text-sm text-slate-600 dark:text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
