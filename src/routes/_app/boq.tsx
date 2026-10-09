import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/tg/badges";
import { AuditComparisonTable } from "@/components/tg/AuditComparisonTable";
import { boqFindings } from "@/lib/audit-engine";
import { useAudit } from "@/lib/audit-store";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/_app/boq")({
  head: () => pageMeta("BOQ Comparison", "Evidence-backed BOQ inconsistencies from your live TRACE audit."),
  component: Boq,
});

function Boq() {
  const { findings, live, projectName } = useAudit();
  return <>
    <PageHeader title="BOQ Comparison" subtitle={projectName} />
    <AuditComparisonTable findings={boqFindings(findings)} emptyMessage={live ? "No BOQ inconsistencies were reported in this audit." : "No audit results yet."} />
  </>;
}