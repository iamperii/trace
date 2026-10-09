import { createFileRoute } from "@tanstack/react-router";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, SeverityBadge, SyntheticTag } from "@/components/tg/badges";
import { BOQ_ROWS } from "@/lib/demo-data";
import { boqRowDiff, fmtAzn, fmtNum } from "@/lib/audit-engine";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/_app/boq")({
  head: () => pageMeta("BOQ Comparison", "Required quantities versus Bill of Quantities, with deterministic differences and risk."),
  component: Boq,
});

function Boq() {
  return (
    <>
      <PageHeader title="BOQ Comparison" subtitle="Required quantities (Spec Rev. B + Revision C) versus BOQ Rev. A. Differences are calculated deterministically." actions={<SyntheticTag />} />
      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/60">
              <TableHead>Item</TableHead><TableHead>Description</TableHead><TableHead>Specification</TableHead>
              <TableHead className="text-right">Required Qty</TableHead><TableHead className="text-right">BOQ Qty</TableHead>
              <TableHead>Unit</TableHead><TableHead className="text-right">Unit Price</TableHead>
              <TableHead className="text-right">Difference</TableHead><TableHead>Risk</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {BOQ_ROWS.map((r) => {
              const d = boqRowDiff(r);
              const unitBad = r.boqUnit && r.boqUnit !== r.unit;
              return (
                <TableRow key={r.item}>
                  <TableCell className="font-mono text-xs">{r.item}</TableCell>
                  <TableCell className="font-medium">{r.description}</TableCell>
                  <TableCell className={`text-xs ${r.specMismatch ? "font-semibold text-high" : "text-muted-foreground"}`}>{r.specification}</TableCell>
                  <TableCell className="tabular text-right">{r.required === null ? "Required" : fmtNum(r.required)}</TableCell>
                  <TableCell className={`tabular text-right ${r.boq === null ? "font-semibold text-critical" : ""}`}>{r.boq === null ? "Missing" : fmtNum(r.boq)}</TableCell>
                  <TableCell className={unitBad ? "font-semibold text-high" : ""}>{unitBad ? `${r.unit} ≠ ${r.boqUnit}` : r.unit}</TableCell>
                  <TableCell className="tabular text-right">{r.unitPrice === null ? "—" : fmtAzn(r.unitPrice)}</TableCell>
                  <TableCell className={`tabular text-right font-medium ${d.diff ? "text-critical" : ""}`}>{d.diff === null ? "—" : d.diff === 0 ? "0" : fmtNum(d.diff)}</TableCell>
                  <TableCell><SeverityBadge s={d.risk} /></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
