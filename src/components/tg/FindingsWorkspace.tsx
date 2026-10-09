import { Link, useNavigate } from "@tanstack/react-router";
import { FileBarChart, GitCompare, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, SeverityBadge, StatusBadge } from "./badges";
import { FindingDrawer } from "./FindingDrawer";
import { CATEGORY_LABELS, costImpact, fmtAzn, fmtNum, summarize } from "@/lib/audit-engine";
import { useAudit } from "@/lib/audit-store";

export function FindingsWorkspace({ selected, basePath }: { selected?: string | undefined; basePath: "/results" | "/findings" }) {
  const nav = useNavigate();
  const { statusOf, findings: DEMO_FINDINGS, passedCount, isLive, projectName } = useAudit();
  const s = summarize(DEMO_FINDINGS, passedCount);
  const open = DEMO_FINDINGS.find((f) => f.findingId === selected) ?? null;
  const costed = DEMO_FINDINGS.filter((f) => f.cost);

  return (
    <>
      <PageHeader title="Audit Results" subtitle={`Project: ${projectName}`} actions={<>
        {isLive ? <span className="rounded border border-primary/40 bg-accent px-2 py-1 text-xs font-semibold">Live AI analysis</span> : null}
        <Button variant="outline" size="sm" asChild><Link to="/revisions"><GitCompare className="mr-1.5 h-4 w-4" />Revision Impact</Link></Button>
        <Button variant="outline" size="sm" asChild><Link to="/boq"><Table2 className="mr-1.5 h-4 w-4" />BOQ Comparison</Link></Button>
        <Button size="sm" asChild><Link to="/report"><FileBarChart className="mr-1.5 h-4 w-4" />Generate Audit Report</Link></Button>
      </>} />

      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <div className="flex flex-wrap items-center gap-6 rounded-lg border bg-card p-5">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Overall status</div>
            <div className="mt-1 text-2xl font-semibold text-high">Review Required</div>
            <div className="text-sm text-muted-foreground">{s.total} inconsistencies detected across {s.checks} checks</div>
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            {[["Critical", s.critical, "CRITICAL"], ["High", s.high, "HIGH"], ["Medium", s.medium, "MEDIUM"], ["Checks Passed", s.passed, "OK"]].map(([l, n, k]) => (
              <div key={l as string} className="min-w-24 rounded border px-3 py-2">
                <SeverityBadge s={k as "OK"} />
                <div className="tabular mt-1 text-xl font-semibold">{n} <span className="text-xs font-normal text-muted-foreground">{l}</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/60">
              <TableHead className="w-28">Severity</TableHead>
              <TableHead>Finding</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Documents</TableHead>
              <TableHead className="text-right">Impact</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {DEMO_FINDINGS.map((f) => {
              const imp = costImpact(f.cost);
              return (
                <TableRow key={f.findingId} className="cursor-pointer" onClick={() => nav({ to: basePath, search: { f: f.findingId } })}>
                  <TableCell><SeverityBadge s={f.severity} /></TableCell>
                  <TableCell>
                    <div className="font-medium">{f.title}</div>
                    <div className="text-xs text-muted-foreground">{f.findingId} · confidence {Math.round(f.confidence * 100)}%</div>
                  </TableCell>
                  <TableCell className="text-sm">{CATEGORY_LABELS[f.category]}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{[...new Set(f.documents.map((d) => d.name))].join(" ↔ ")}</TableCell>
                  <TableCell className="tabular text-right text-sm">{imp !== null ? <b>{fmtAzn(imp)}</b> : f.severity === "CRITICAL" ? "High" : "—"}</TableCell>
                  <TableCell><StatusBadge s={statusOf(f.findingId).status} /></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-card">
          <div className="border-b px-5 py-3">
            <div className="text-sm font-semibold">Potential Commercial Impact</div>
            <div className="text-xs text-muted-foreground">Estimated impact — requires human verification</div>
          </div>
          <ul className="divide-y">
            {costed.map((f) => {
              if (!f.cost) return null;
              return (
              <li key={f.findingId} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <div>
                  <div className="font-medium">{f.title}</div>
                  <div className="tabular font-mono text-xs text-muted-foreground">{fmtNum(f.cost.quantity)} {f.cost.unit} × {fmtAzn(f.cost.unitPrice)}/{f.cost.unit}</div>
                </div>
                <div className="tabular font-semibold">{fmtAzn(costImpact(f.cost) ?? 0)}</div>
              </li>
            ); })}
          </ul>
          <div className="flex items-center justify-between border-t bg-muted/50 px-5 py-4">
            <span className="text-sm font-semibold">Total</span>
            <span className="tabular text-2xl font-semibold">{fmtAzn(s.costImpact)}</span>
          </div>
        </div>
        <div className="rounded-lg border bg-card">
          <div className="border-b px-5 py-3 text-sm font-semibold">Passed checks ({passedCount})</div>
          <p className="px-5 py-3 text-sm text-muted-foreground">{passedCount} consistent checks reported by AI. Individual passed-check details were not returned.</p>
        </div>
      </div>

      <FindingDrawer finding={open} onClose={() => nav({ to: basePath, search: {} })} />
    </>
  );
}
