import * as React from "react";
import { Card, CardContent } from "./Card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatTileProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: string;
    positive?: boolean;
  };
  className?: string;
}

export function StatTile({
  title,
  value,
  icon: Icon,
  description,
  trend,
  className,
}: StatTileProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-text-muted font-manrope">{title}</p>
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-2xl font-bold font-manrope">{value}</div>
            {description && (
              <p className="text-xs text-text-muted mt-1">{description}</p>
            )}
          </div>
          {trend && (
            <div
              className={cn(
                "flex items-center text-xs font-medium",
                trend.positive ? "text-success" : "text-danger"
              )}
            >
              {trend.value}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
