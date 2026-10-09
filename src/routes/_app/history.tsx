import { createFileRoute, Link } from "@tanstack/react-router";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/tg/badges";
import { Button } from "@/components/ui/button";
import { useAudit } from "@/lib/audit-store";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/_app/history")({
  head: () => pageMeta("Audit History", "Previous tender audits and their outcomes."),
  component: History,
});

function History() {
  const { history } = useAudit();
  return (
    <>
      <PageHeader title="Audit History" />
      {history.length === 0 ? (
        <div className="flex flex-col items-center rounded-lg border bg-card px-6 py-16 text-center">
          <div className="font-medium">No audits yet</div>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">Every audit you run on your own uploaded documents will appear here with its findings and status.</p>
          <Button asChild className="mt-4"><Link to="/new-audit">Start your first audit</Link></Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <Table>
            <TableHeader><TableRow className="bg-muted/60"><TableHead>Audit</TableHead><TableHead>Project</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Docs</TableHead><TableHead className="text-right">Findings</TableHead><TableHead className="text-right">Critical</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {history.map((a, i) => (
                <TableRow key={a.id}>
                  <TableCell className="font-mono text-xs">{a.id}</TableCell>
                  <TableCell className="font-medium">{i === 0 ? <Link to="/results" className="text-primary hover:underline">{a.project}</Link> : a.project}</TableCell>
                  <TableCell>{a.date}</TableCell>
                  <TableCell className="tabular text-right">{a.docs}</TableCell>
                  <TableCell className="tabular text-right">{a.findings}</TableCell>
                  <TableCell className="tabular text-right">{a.critical}</TableCell>
                  <TableCell className="text-sm">{a.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
