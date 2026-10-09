import { createFileRoute } from "@tanstack/react-router";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, SyntheticTag } from "@/components/tg/badges";
import { REVISION_CHANGES } from "@/lib/demo-data";
import { revisionSummary } from "@/lib/audit-engine";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/_app/revisions")({
  head: () => pageMeta("Revision Impact", "Requirement changes from Revision B to Revision C and whether the BOQ reflects them."),
  component: Revisions,
});

const TYPE_CLS = { ADDED: "text-success", CHANGED: "text-primary", REMOVED: "text-muted-foreground" };

function Revisions() {
  const r = revisionSummary();
  return (
    <>
      <PageHeader title="Revision Impact" subtitle="Revision B → Revision C · Project Revision Rev. C compared against Technical Specification Rev. B and BOQ Rev. A" actions={<SyntheticTag />} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[["Added requirements", r.added], ["Changed requirements", r.changed], ["Removed requirements", r.removed], ["BOQ items affected", r.boqAffected]].map(([l, v]) => (
          <div key={l} className="rounded-lg border bg-card p-4">
            <div className="text-xs font-medium text-muted-foreground">{l}</div>
            <div className="tabular mt-1 text-2xl font-semibold">{v}</div>
          </div>
        ))}
      </div>
      <div className="mt-6 overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/60">
              <TableHead>Change</TableHead><TableHead>Requirement</TableHead><TableHead>Type</TableHead>
              <TableHead className="text-right">Previous (Rev. B)</TableHead><TableHead className="text-right">New (Rev. C)</TableHead>
              <TableHead className="text-right">BOQ</TableHead><TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {REVISION_CHANGES.map((c) => (
              <TableRow key={c.id} className={!c.boqUpdated ? "bg-critical/5" : ""}>
                <TableCell className="font-mono text-xs">{c.id}</TableCell>
                <TableCell className="font-medium">{c.requirement}</TableCell>
                <TableCell className={`text-xs font-semibold ${TYPE_CLS[c.type]}`}>{c.type}</TableCell>
                <TableCell className="tabular text-right">{c.previous}</TableCell>
                <TableCell className="tabular text-right font-medium">{c.next}</TableCell>
                <TableCell className={`tabular text-right ${!c.boqUpdated ? "font-semibold text-critical" : ""}`}>{c.boq}</TableCell>
                <TableCell>
                  {!c.boqUpdated
                    ? <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-critical"><span className="h-2 w-2 rounded-full bg-critical" />BOQ not updated</span>
                    : <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success"><span className="h-2 w-2 rounded-full bg-success" />Reflected in BOQ</span>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
