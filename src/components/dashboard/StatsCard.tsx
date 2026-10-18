// src/components/dashboard/StatsCard.tsx
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  variant?: "default" | "blue" | "green" | "amber" | "red" | "purple";
  className?: string;
}

const variantStyles = {
  default: { card: "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700", icon: "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300", value: "text-slate-900 dark:text-white" },
  blue:    { card: "bg-blue-600 border-blue-600", icon: "bg-blue-500 text-white", value: "text-white" },
  green:   { card: "bg-green-600 border-green-600", icon: "bg-green-500 text-white", value: "text-white" },
  amber:   { card: "bg-amber-500 border-amber-500", icon: "bg-amber-400 text-white", value: "text-white" },
  red:     { card: "bg-red-600 border-red-600", icon: "bg-red-500 text-white", value: "text-white" },
  purple:  { card: "bg-purple-600 border-purple-600", icon: "bg-purple-500 text-white", value: "text-white" },
};

export function StatsCard({
  title, value, subtitle, icon: Icon, trend, variant = "default", className,
}: StatsCardProps) {
  const s = variantStyles[variant];
  const isColored = variant !== "default";

  return (
    <div className={cn("rounded-xl border p-5 shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md", s.card, className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-medium truncate", isColored ? "text-white/80" : "text-slate-500 dark:text-slate-400")}>
            {title}
          </p>
          <p className={cn("text-3xl font-bold mt-1 tabular-nums", s.value)}>{value}</p>
          {subtitle && (
            <p className={cn("text-xs mt-1 truncate", isColored ? "text-white/60" : "text-slate-400 dark:text-slate-500")}>
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span className={cn("text-xs font-medium",
                trend.value > 0
                  ? (isColored ? "text-white/90" : "text-green-600 dark:text-green-400")
                  : (isColored ? "text-white/90" : "text-red-600 dark:text-red-400")
              )}>
                {trend.value > 0 ? "+" : ""}{trend.value}%
              </span>
              <span className={cn("text-xs", isColored ? "text-white/60" : "text-slate-400")}>{trend.label}</span>
            </div>
          )}
        </div>
        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ml-3", s.icon)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
