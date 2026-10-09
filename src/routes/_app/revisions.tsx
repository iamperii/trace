import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/tg/badges";
import { AuditComparisonTable } from "@/components/tg/AuditComparisonTable";
import { revisionFindings } from "@/lib/audit-engine";
import { useAudit } from "@/lib/audit-store";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/_app/revisions")({
  head: () => pageMeta("Revision Impact", "Revision inconsistencies and source evidence from your live TRACE audit."),
  component: Revisions,
});

function Revisions() {
  const { findings, live, projectName } = useAudit();
  return <>
    <PageHeader title="Revision Impact" subtitle={projectName} />
    <AuditComparisonTable findings={revisionFindings(findings)} emptyMessage={live ? "No revision inconsistencies were reported in this audit." : "No audit results yet."} />
  </>;
}