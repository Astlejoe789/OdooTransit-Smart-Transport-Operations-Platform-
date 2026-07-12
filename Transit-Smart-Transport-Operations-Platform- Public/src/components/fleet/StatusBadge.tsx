import { cn } from "@/lib/utils";

const toneClass: Record<string, string> = {
  success: "bg-success/15 text-success",
  accent: "bg-accent/15 text-accent",
  warning: "bg-warning/15 text-warning",
  primary: "bg-primary/12 text-primary",
  muted: "bg-muted text-muted-foreground",
};

export function StatusBadge({ label, tone }: { label: string; tone: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        toneClass[tone] ?? toneClass.muted,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {label}
    </span>
  );
}
