import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, AlertTriangle, ShieldAlert, Clock, CheckCircle2, Coins, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, SeverityBadge, StatusBadge } from "@/components/tg/badges";
import { summarize, fmtAzn } from "@/lib/audit-engine";
import { useAudit } from "@/lib/audit-store";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/_app/overview")({
  head: () => pageMeta("Overview", "Tender package audit overview: documents, findings and estimated cost impact."),
  component: Overview,
});

function Overview() {
  const { statusOf, findings: DEMO_FINDINGS, passedCount, files, projectName, live } = useAudit();
  const DOCUMENTS = files.filter((f) => f.status === "ready").map((f) => ({ id: f.name, label: f.name }));
  const s = summarize(DEMO_FINDINGS, passedCount);
  const reviewRequired = DEMO_FINDINGS.filter((f) => statusOf(f.findingId).status === "NEEDS_REVIEW").length;
  const cards = [
    { label: "Documents", value: DOCUMENTS.length, Icon: FileText, tone: "text-primary" },
    { label: "Findings", value: s.total, Icon: AlertTriangle, tone: "text-high" },
    { label: "Critical", value: s.critical, Icon: ShieldAlert, tone: "text-critical" },
    { label: "Review Required", value: reviewRequired, Icon: Clock, tone: "text-warning" },
    { label: "Passed Checks", value: s.passed, Icon: CheckCircle2, tone: "text-success" },
    { label: "Estimated Cost Impact", value: fmtAzn(s.costImpact), Icon: Coins, tone: "text-foreground" },
  ];
  return (
    <>
      <PageHeader title="Tender Package Audit" subtitle="Detect specification, quantity and revision inconsistencies before they become costly bidding errors." />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {cards.map(({ label, value, Icon, tone }) => (
          <div key={label} className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">{label}<Icon className={`h-4 w-4 ${tone}`} /></div>
            <div className="tabular mt-2 text-2xl font-semibold">{value}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-lg border bg-card lg:col-span-2">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Latest Audit</div>
              <div className="mt-1 font-semibold">{projectName} — Tender Package</div>
            </div>
            <span className="rounded border border-warning/40 bg-warning/15 px-2 py-1 text-xs font-semibold">Review Required</span>
          </div>
          <div className="grid gap-6 p-5 md:grid-cols-2">
            <div>
              <div className="mb-2 text-xs font-medium text-muted-foreground">Documents</div>
              <ul className="space-y-1.5 text-sm">
                {DOCUMENTS.map((d) => <li key={d.id} className="flex items-center gap-2"><FileText className="h-3.5 w-3.5 text-muted-foreground" />{d.label}</li>)}
              </ul>
            </div>
            <div className="space-y-3 text-sm">
              <div><div className="text-xs text-muted-foreground">Audit completed</div><div className="font-semibold">{live ? new Date(live.at).toLocaleString() : "—"}</div></div>
              <div><div className="text-xs text-muted-foreground">Result</div><div className="font-semibold">{s.total} findings detected · {s.passed} checks passed</div></div>
              <Button asChild size="sm"><Link to="/results">Open audit results <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-card">
          <div className="border-b px-5 py-4 text-sm font-semibold">Priority findings</div>
          <ul className="divide-y">
            {DEMO_FINDINGS.slice(0, 4).map((f) => (
              <li key={f.findingId}>
                <Link to="/results" search={{ f: f.findingId }} className="block px-5 py-3 hover:bg-muted">
                  <div className="flex items-center justify-between gap-2"><SeverityBadge s={f.severity} /><StatusBadge s={statusOf(f.findingId).status} /></div>
                  <div className="mt-1.5 text-sm font-medium">{f.title}</div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
