import { createFileRoute } from "@tanstack/react-router";
import { FileText, FileSpreadsheet } from "lucide-react";
import { PageHeader } from "@/components/tg/badges";
import { CATEGORY_LABEL } from "@/lib/document-types";
import { useAudit } from "@/lib/audit-store";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/_app/documents")({
  head: () => pageMeta("Documents", "Tender documents included in the audit and items extracted from each."),
  component: Docs,
});

function Docs() {
  const { files } = useAudit();
  const documents = files.filter((f) => !f.demo);
  return (
    <>
      <PageHeader title="Documents" subtitle="Uploaded tender documents." />
      {documents.length === 0 && <p className="py-10 text-center text-muted-foreground">No documents uploaded yet.</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {documents.map((d) => {
          const Icon = /\.xlsx?$/i.test(d.name) ? FileSpreadsheet : FileText;
          return (
            <div key={d.name} className="flex gap-4 rounded-lg border bg-card p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded bg-accent"><Icon className="h-5 w-5 text-primary" /></div>
              <div className="flex-1">
                <div className="break-all font-semibold">{d.name}</div>
                <div className="font-mono text-xs text-muted-foreground">{d.name}</div>
                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs">
                  <span><span className="text-muted-foreground">Category</span> {d.category ? CATEGORY_LABEL[d.category] : "Uncategorized"}</span>
                  <span><span className="text-muted-foreground">Size</span> {d.sizeKb.toLocaleString()} KB</span>
                  <span><span className="text-muted-foreground">Status</span> {d.status === "ready" ? "Text extracted" : "Extraction failed"}</span>
                  {d.error && <span className="text-critical">{d.error}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
