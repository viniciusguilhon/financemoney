import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
  variant?: "default" | "primary" | "success" | "destructive" | "warning";
}

const StatCard = ({ title, value, icon, trend, trendUp, variant = "default" }: StatCardProps) => {
  return (
    <div className={cn(
      "rounded-xl p-5 shadow-card transition-all duration-200 hover:shadow-elevated animate-fade-in",
      variant === "primary" && "gradient-primary text-primary-foreground",
      variant === "success" && "bg-card border border-success/20",
      variant === "destructive" && "bg-card border border-destructive/20",
      variant === "warning" && "bg-card border border-warning/20",
      variant === "default" && "bg-card",
    )}>
      <div className="flex items-center justify-between mb-3">
        <span className={cn(
          "text-sm font-medium",
          variant === "primary" ? "text-primary-foreground/80" : "text-muted-foreground"
        )}>
          {title}
        </span>
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center",
          variant === "primary" ? "bg-primary-foreground/20" : "bg-accent"
        )}>
          {icon}
        </div>
      </div>
      <p className={cn(
        "text-2xl font-display font-bold",
        variant === "primary" ? "text-primary-foreground" : "text-foreground"
      )}>
        {value}
      </p>
      {trend && (
        <p className={cn(
          "text-xs mt-2 font-medium",
          variant === "primary"
            ? "text-primary-foreground/70"
            : trendUp ? "text-success" : "text-destructive"
        )}>
          {trendUp ? "↑" : "↓"} {trend}
        </p>
      )}
    </div>
  );
};

export default StatCard;
