import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/tg/badges";
import { useAudit } from "@/lib/audit-store";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/_app/settings")({
  head: () => pageMeta("Settings", "Analysis mode and demo data settings."),
  component: Settings,
});

function Settings() {
  const { reset } = useAudit();
  return (
    <>
      <PageHeader title="Settings" />
      <div className="max-w-2xl space-y-4">
        <div className="rounded-lg border bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">Analysis mode</div>
              <div className="text-sm text-muted-foreground">Demo Mode runs fully offline using the synthetic Baku Commercial Center dataset.</div>
            </div>
            <span className="rounded border border-warning/40 bg-warning/15 px-2 py-1 text-xs font-semibold">Demo Mode</span>
          </div>
          <div className="mt-4 rounded border border-dashed p-3 text-sm text-muted-foreground">Live AI analysis: connected. Uploading your own documents runs a real AI cross-check; the demo package uses synthetic data. All AI output is validated against a strict schema before it is displayed; arithmetic is always computed deterministically.</div>
        </div>
        <div className="rounded-lg border bg-card p-5">
          <div className="font-semibold">Reset demo</div>
          <div className="text-sm text-muted-foreground">Clears uploaded files and all human review decisions.</div>
          <Button variant="outline" className="mt-3" onClick={() => { reset(); toast.success("Demo reset"); }}>Reset demo state</Button>
        </div>
      </div>
    </>
  );
}
