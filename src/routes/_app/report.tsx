import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SeverityBadge, StatusBadge, statusLabel } from "@/components/tg/badges";
import { CATEGORY_LABELS, boqFindings, costImpact, fmtAzn, fmtNum, revisionFindings, summarize, type Finding } from "@/lib/audit-engine";
import { AuditComparisonTable } from "@/components/tg/AuditComparisonTable";
import { useAudit } from "@/lib/audit-store";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/_app/report")({
  head: () => pageMeta("Audit Report", "Print-ready tender consistency audit report."),
  component: Report,
});

function H({ n, t }: { n: number; t: string }) {
  return <h2 className="mb-3 mt-8 border-b pb-1 text-base font-semibold">{n}. {t}</h2>;
}

function Report() {
  const { statusOf, findings: DEMO_FINDINGS, passedCount, projectName, live, files } = useAudit();
  const auditedDocs = files.filter((f) => f.status === "ready" && !f.demo);
  const s = summarize(DEMO_FINDINGS, passedCount);
  const bySev = (sev: Finding["severity"]) => DEMO_FINDINGS.filter((f) => f.severity === sev);
  const counts = { NEEDS_REVIEW: 0, CONFIRMED: 0, INVESTIGATE: 0, DISMISSED: 0 };
  DEMO_FINDINGS.forEach((f) => counts[statusOf(f.findingId).status]++);

  const FList = ({ items }: { items: Finding[] }) => (
    <ul className="space-y-3">
      {items.map((f) => (
        <li key={f.findingId} className="rounded border p-3 text-sm">
          <div className="flex items-center gap-2"><SeverityBadge s={f.severity} /><b>{f.findingId} — {f.title}</b><span className="ml-auto"><StatusBadge s={statusOf(f.findingId).status} /></span></div>
          <p className="mt-1.5 text-muted-foreground">{f.summary}</p>
          <p className="mt-1 text-xs">Evidence: {f.documents.map((d) => `${d.name}${d.page ? ` p.${d.page}` : d.row ? ` row ${d.row}` : ""}`).join("; ")} · {CATEGORY_LABELS[f.category]}</p>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <div className="no-print mb-4 flex justify-end gap-2">
        <Button onClick={() => window.print()}><Download className="mr-2 h-4 w-4" /> Download Report (PDF)</Button>
      </div>
      <article className="print-area mx-auto max-w-4xl rounded-lg border bg-card p-10 shadow-sm">
        <div className="flex items-start justify-between border-b pb-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-primary">TRACE · Audit Report</div>
            <h1 className="mt-1 text-2xl font-semibold">{projectName} — Tender Package</h1>
            <div className="text-sm text-muted-foreground">Audit completed {live ? new Date(live.at).toLocaleString() : "—"} · Live AI analysis</div>
          </div>
          <div className="text-right text-sm"><div className="text-muted-foreground">Overall status</div><div className="font-semibold text-high">Review Required</div></div>
        </div>

        <H n={1} t="Executive Summary" />
        <p className="text-sm">TRACE cross-checked {live ? auditedDocs.length : 0} documents across {s.checks} checks. {s.total} potential inconsistencies were detected ({s.critical} critical, {s.high} high, {s.medium} medium) and {s.passed} checks passed. The estimated commercial impact of quantifiable findings is <b>{fmtAzn(s.costImpact)}</b> (requires human verification). This report does not approve the tender or certify compliance; all findings require human review.</p>

        <H n={2} t="Documents Audited" />
        <ul className="text-sm">{(live ? auditedDocs : []).map((d) => <li key={d.name}>• {d.name}</li>)}</ul>
        {!live && <p className="text-sm text-muted-foreground">No audit results yet.</p>}

        <H n={3} t="Critical Findings" /><FList items={bySev("CRITICAL")} />
        <H n={4} t="High-Risk Findings" /><FList items={[...bySev("HIGH"), ...bySev("MEDIUM")]} />

        <H n={5} t="Revision Impact" />
        <AuditComparisonTable findings={revisionFindings(DEMO_FINDINGS)} emptyMessage={live ? "No revision inconsistencies were reported in this audit." : "No audit results yet."} />

        <H n={6} t="BOQ Differences" />
        <AuditComparisonTable findings={boqFindings(DEMO_FINDINGS)} emptyMessage={live ? "No BOQ inconsistencies were reported in this audit." : "No audit results yet."} />

        <H n={7} t="Estimated Commercial Impact" />
        <table className="w-full text-sm"><tbody>
          {DEMO_FINDINGS.map((f) => {
            if (!f.cost) return null;
            return <tr key={f.findingId} className="border-b"><td className="py-1">{f.title}</td><td className="tabular font-mono text-xs">{fmtNum(f.cost.quantity)} {f.cost.unit} × {fmtAzn(f.cost.unitPrice)}</td><td className="tabular text-right font-semibold">{fmtAzn(costImpact(f.cost) ?? 0)}</td></tr>;
          })}
          <tr><td className="py-2 font-semibold">Total (estimate — requires human verification)</td><td /><td className="tabular text-right text-lg font-semibold">{fmtAzn(s.costImpact)}</td></tr>
        </tbody></table>

        <H n={8} t="Human Review Status" />
        <div className="grid grid-cols-4 gap-2 text-sm">
          {(Object.keys(counts) as (keyof typeof counts)[]).map((k) => <div key={k} className="rounded border p-2"><div className="text-xs text-muted-foreground">{statusLabel(k)}</div><div className="tabular text-xl font-semibold">{counts[k]}</div></div>)}
        </div>

        <H n={9} t="Recommended Next Actions" />
        <ol className="list-decimal space-y-1 pl-5 text-sm">{DEMO_FINDINGS.filter((f) => statusOf(f.findingId).status !== "DISMISSED").map((f) => <li key={f.findingId}>{f.recommendedAction}</li>)}</ol>

        <p className="mt-10 border-t pt-3 text-xs text-muted-foreground">AI checks the documents. The estimator makes the decision. Findings are potential inconsistencies identified for review; AI explanations are labelled and confidence values are estimates.</p>
      </article>
    </>
  );
}
