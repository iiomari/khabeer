import * as Icons from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "primary",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: keyof typeof Icons;
  tone?: "primary" | "accent" | "success" | "muted";
}) {
  const Icon = Icons[icon] as React.ComponentType<{ className?: string }>;

  const tones = {
    primary: "bg-brand-soft text-primary",
    accent: "bg-accent/15 text-accent",
    success: "bg-success/12 text-success",
    muted: "bg-muted text-muted-foreground",
  };

  return (
    <Card className="flex-row items-center gap-4 p-5">
      <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", tones[tone])}>
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm text-muted-foreground">{label}</p>
        <p className="text-xl font-bold">{value}</p>
        {hint ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</p> : null}
      </div>
    </Card>
  );
}
