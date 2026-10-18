import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import type { VerdictStatus } from "@/lib/enums";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type Tone = "success" | "warning" | "destructive" | "info" | "muted";

const dotTone: Record<Tone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
  info: "bg-info",
  muted: "bg-muted-foreground/40",
};

export const statusTone: Record<VerdictStatus, Tone> = {
  cleared: "success",
  fix_required: "warning",
  refused: "destructive",
  abstained: "info",
};

/** A small status dot with an optional label. The colour carries the state; the label says it. */
export function Dot({
  tone,
  children,
  className,
}: {
  tone: Tone;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span
        aria-hidden="true"
        className={cn("size-2 shrink-0 rounded-full", dotTone[tone])}
      />
      {children}
    </span>
  );
}

export function StatusBadge({
  status,
  className,
}: {
  status: VerdictStatus;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn("gap-1.5", className)}>
      <span
        aria-hidden="true"
        className={cn("size-1.5 rounded-full", dotTone[statusTone[status]])}
      />
      {t(`verdict.status.${status}`)}
    </Badge>
  );
}

/** One key/value line. Values are numbers more often than not, so they sit in mono and align right. */
export function Stat({
  label,
  value,
  muted,
}: {
  label: ReactNode;
  value: ReactNode;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-3 text-sm",
        muted && "text-muted-foreground",
      )}
    >
      <span>{label}</span>
      <span className="text-right font-mono tabular-nums">{value}</span>
    </div>
  );
}
