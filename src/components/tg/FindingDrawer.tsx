import { useState } from "react";
import { FileText, FileSpreadsheet, Sparkles, CheckCircle2, Search, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Highlight, SeverityBadge, StatusBadge } from "./badges";
import { CATEGORY_LABELS, costImpact, fmtAzn, fmtNum, numericDifference, type Finding } from "@/lib/audit-engine";
import { DOCUMENTS } from "@/lib/demo-data";
import { useAudit } from "@/lib/audit-store";

export function FindingDrawer({ finding, onClose }: { finding: Finding | null; onClose: () => void }) {
  return (
    <Sheet open={!!finding} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        {finding && <Detail f={finding} key={finding.findingId} />}
      </SheetContent>
    </Sheet>
  );
}

function Detail({ f }: { f: Finding }) {
  const { statusOf, setReview } = useAudit();
  const review = statusOf(f.findingId);
  const [dismissing, setDismissing] = useState(false);
  const [reason, setReason] = useState("");
  const impact = costImpact(f.cost);
  const c = f.comparison;

  return (
    <div className="space-y-6 pb-6">
      <SheetHeader className="space-y-2 text-left">
        <div className="flex items-center gap-2"><SeverityBadge s={f.severity} /><span className="text-xs text-muted-foreground">{f.findingId} · {CATEGORY_LABELS[f.category]}</span></div>
        <SheetTitle className="text-xl">{f.title}</SheetTitle>
        <SheetDescription className="flex items-center gap-2"><StatusBadge s={review.status} /> <span className="text-xs">AI confidence estimate: <b className="text-foreground">{Math.round(f.confidence * 100)}%</b> (for review prioritization, not statistically validated)</span></SheetDescription>
      </SheetHeader>

      <section className="rounded-lg border bg-accent/50 p-4">
        <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent-foreground"><Sparkles className="h-3.5 w-3.5" /> AI Finding</div>
        <p className="text-sm">Potential inconsistency detected. {f.summary}</p>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold">Evidence</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {f.documents.map((d, i) => {
            const doc = DOCUMENTS.find((x) => x.id === d.docId);
            const Icon = doc?.type === "XLSX" ? FileSpreadsheet : FileText;
            return (
              <div key={i} className="rounded-lg border bg-card">
                <div className="flex items-center gap-2 border-b px-3 py-2">
                  <Icon className="h-4 w-4 text-primary" />
                  <div className="min-w-0 flex-1 truncate text-xs font-semibold">{doc?.label ?? d.name}</div>
                  <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">{d.page ? `Page ${d.page}` : d.row ? `Row ${d.row}` : "—"}</span>
                </div>
                <blockquote className="p-3 font-mono text-xs leading-relaxed"><Highlight text={d.evidence} mark={d.highlight} /></blockquote>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border bg-card">
        <h3 className="border-b px-4 py-2.5 text-sm font-semibold">Difference — {c.label}</h3>
        <div className="grid grid-cols-3 divide-x text-center">
          <Cell label="Required" value={c.kind === "numeric" ? `${fmtNum(c.required)} ${c.unit}` : c.required} />
          <Cell label="Current / BOQ" value={c.kind === "numeric" ? `${fmtNum(c.actual)} ${c.unit}` : c.actual} tone="text-critical" />
          <Cell label="Difference" value={c.kind === "numeric" ? (() => { const d = numericDifference(c.required, c.actual); return `${d.diff > 0 ? "+" : ""}${fmtNum(d.diff)} ${c.unit} (${d.pct}%)`; })() : "Mismatch"} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3 text-sm">
          <span>Potential impact: <b>{f.impactLabel}</b></span>
          {f.cost && impact !== null && (
            <span className="tabular font-mono text-xs">{fmtNum(f.cost.quantity)} {f.cost.unit} × {fmtAzn(f.cost.unitPrice)}/{f.cost.unit} = <b className="text-sm">{fmtAzn(impact)}</b></span>
          )}
        </div>
        {f.cost && <div className="border-t px-4 py-2 text-xs text-muted-foreground">Estimated impact — requires human verification. Calculated deterministically ({f.cost.basis.toLowerCase()}).</div>}
      </section>

      <section>
        <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold">Why this matters <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-medium text-accent-foreground">AI-generated explanation</span></h3>
        <p className="text-sm text-muted-foreground">{f.whyItMatters}</p>
        <p className="mt-2 text-sm"><span className="font-medium">Recommended for investigation:</span> {f.recommendedAction}</p>
      </section>

      <section className="rounded-lg border-2 border-navy/20 bg-muted/50 p-4">
        <h3 className="text-sm font-semibold">Human Review</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">AI checks the documents. The estimator makes the decision.</p>
        {review.reason && <p className="mt-2 text-xs">Dismissal reason: <i>{review.reason}</i></p>}
        {dismissing ? (
          <div className="mt-3 space-y-2">
            <Textarea autoFocus placeholder="Short reason for dismissing (required)" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} />
            <div className="flex gap-2">
              <Button size="sm" variant="destructive" disabled={reason.trim().length < 3} onClick={() => { setReview(f.findingId, { status: "DISMISSED", reason: reason.trim() }); setDismissing(false); toast("Finding dismissed"); }}>Confirm dismissal</Button>
              <Button size="sm" variant="ghost" onClick={() => setDismissing(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => { setReview(f.findingId, { status: "CONFIRMED" }); toast.success("Finding confirmed"); }}><CheckCircle2 className="mr-1.5 h-4 w-4" /> Accept Finding</Button>
            <Button size="sm" variant="outline" onClick={() => { setReview(f.findingId, { status: "INVESTIGATE" }); toast("Marked for investigation"); }}><Search className="mr-1.5 h-4 w-4" /> Investigate</Button>
            <Button size="sm" variant="ghost" onClick={() => setDismissing(true)}><XCircle className="mr-1.5 h-4 w-4" /> Dismiss</Button>
            {review.status !== "NEEDS_REVIEW" && <Button size="sm" variant="link" onClick={() => setReview(f.findingId, { status: "NEEDS_REVIEW" })}>Reset</Button>}
          </div>
        )}
      </section>
    </div>
  );
}

function Cell({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="px-3 py-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`tabular mt-1 text-lg font-semibold ${tone ?? ""}`}>{value}</div>
    </div>
  );
}
