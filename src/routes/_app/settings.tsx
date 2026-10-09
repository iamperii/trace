import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/tg/badges";
import { useAudit } from "@/lib/audit-store";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/_app/settings")({
  head: () => pageMeta("Settings", "TRACE live audit preferences and workspace reset."),
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
              <div className="text-sm text-muted-foreground">Lovable AI · Uploaded documents only</div>
            </div>
            <span className="rounded border border-primary/40 bg-accent px-2 py-1 text-xs font-semibold">Live AI</span>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-5">
          <div className="font-semibold">Reset workspace</div>
          <div className="text-sm text-muted-foreground">Clears uploaded files, audit results, history and review decisions.</div>
          <Button variant="outline" className="mt-3" onClick={() => { reset(); toast.success("Workspace reset"); }}>Reset workspace</Button>
        </div>
      </div>
    </>
  );
}
