import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SeverityBadge } from "./badges";
import { fmtAzn, fmtNum, numericDifference, type Finding } from "@/lib/audit-engine";

export function AuditComparisonTable({ findings, emptyMessage }: { findings: Finding[]; emptyMessage: string }) {
  return <div className="overflow-hidden rounded-lg border bg-card"><Table>
    <TableHeader><TableRow className="bg-muted/60">
      <TableHead>Finding</TableHead><TableHead>Comparison</TableHead><TableHead>Required / Revised</TableHead>
      <TableHead>Current / BOQ</TableHead><TableHead>Difference</TableHead><TableHead>Unit Price</TableHead><TableHead>Evidence</TableHead><TableHead>Risk</TableHead>
    </TableRow></TableHeader>
    <TableBody>{findings.length === 0 ? <TableRow><TableCell colSpan={8} className="py-10 text-center text-muted-foreground">{emptyMessage}</TableCell></TableRow> : findings.map((f) => {
      const c = f.comparison;
      return <TableRow key={f.findingId}>
        <TableCell className="min-w-48"><div className="font-medium">{f.title}</div><div className="text-xs text-muted-foreground">{f.findingId}</div></TableCell>
        <TableCell>{c.label}</TableCell>
        <TableCell>{c.kind === "numeric" ? `${fmtNum(c.required)} ${c.unit}` : c.required}</TableCell>
        <TableCell>{c.kind === "numeric" ? `${fmtNum(c.actual)} ${c.unit}` : c.actual}</TableCell>
        <TableCell className="tabular">{c.kind === "numeric" ? `${fmtNum(numericDifference(c.required, c.actual).diff)} ${c.unit}` : "—"}</TableCell>
        <TableCell>{f.cost ? `${fmtAzn(f.cost.unitPrice)}/${f.cost.unit}` : "—"}</TableCell>
        <TableCell className="min-w-56 text-xs">{f.documents.map((d, i) => <div key={`${d.docId}-${i}`} className="mb-2"><div className="font-medium">{d.name}{d.page != null ? ` · Page ${d.page}` : d.row != null ? ` · Row ${d.row}` : ""}</div><blockquote className="text-muted-foreground">{d.evidence}</blockquote></div>)}</TableCell>
        <TableCell><SeverityBadge s={f.severity} /></TableCell>
      </TableRow>;
    })}</TableBody>
  </Table></div>;
}