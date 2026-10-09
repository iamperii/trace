import { cn } from "@/lib/utils";
import type { Severity } from "@/lib/audit-engine";
import type { ReviewStatus } from "@/lib/audit-store";
import { CheckCircle2, Search, XCircle, Clock } from "lucide-react";

const SEV: Record<Severity | "OK", string> = {
  CRITICAL: "bg-critical/10 text-critical border-critical/30",
  HIGH: "bg-high/10 text-high border-high/30",
  MEDIUM: "bg-warning/15 text-foreground border-warning/40",
  LOW: "bg-muted text-muted-foreground border-border",
  OK: "bg-success/10 text-success border-success/30",
};
const DOT: Record<Severity | "OK", string> = {
  CRITICAL: "bg-critical", HIGH: "bg-high", MEDIUM: "bg-warning", LOW: "bg-muted-foreground", OK: "bg-success",
};

export function SeverityBadge({ s, className }: { s: Severity | "OK"; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] font-semibold tracking-wide", SEV[s], className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", DOT[s])} />
      {s === "OK" ? "PASS" : s}
    </span>
  );
}

const ST: Record<ReviewStatus, { label: string; cls: string; Icon: typeof Clock }> = {
  NEEDS_REVIEW: { label: "Needs Review", cls: "text-muted-foreground bg-muted border-border", Icon: Clock },
  CONFIRMED: { label: "Confirmed", cls: "text-success bg-success/10 border-success/30", Icon: CheckCircle2 },
  INVESTIGATE: { label: "Investigation Required", cls: "text-foreground bg-warning/15 border-warning/40", Icon: Search },
  DISMISSED: { label: "Dismissed", cls: "text-muted-foreground bg-background border-border line-through decoration-muted-foreground/50", Icon: XCircle },
};

export function StatusBadge({ s }: { s: ReviewStatus }) {
  const { label, cls, Icon } = ST[s];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-medium whitespace-nowrap", cls)}>
      <Icon className="h-3 w-3" /> {label}
    </span>
  );
}

export function statusLabel(s: ReviewStatus) { return ST[s].label; }

export function Highlight({ text, mark }: { text: string; mark?: string | undefined }) {
  if (!mark || !text.includes(mark)) return <>{text}</>;
  const i = text.indexOf(mark);
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded-sm bg-highlight px-0.5 font-semibold text-foreground">{mark}</mark>
      {text.slice(i + mark.length)}
    </>
  );
}

export function SyntheticTag() {
  return <span className="rounded border border-dashed border-primary/40 bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground">Synthetic Demo Data</span>;
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
