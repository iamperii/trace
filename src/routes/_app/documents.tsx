import { createFileRoute } from "@tanstack/react-router";
import { FileText, FileSpreadsheet } from "lucide-react";
import { PageHeader, SyntheticTag } from "@/components/tg/badges";
import { CATEGORY_LABEL, DOCUMENTS } from "@/lib/demo-data";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/_app/documents")({
  head: () => pageMeta("Documents", "Tender documents included in the audit and items extracted from each."),
  component: Docs,
});

function Docs() {
  return (
    <>
      <PageHeader title="Documents" subtitle="Tender package documents and extraction results." actions={<SyntheticTag />} />
      <div className="grid gap-4 md:grid-cols-2">
        {DOCUMENTS.map((d) => {
          const Icon = d.type === "XLSX" ? FileSpreadsheet : FileText;
          return (
            <div key={d.id} className="flex gap-4 rounded-lg border bg-card p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded bg-accent"><Icon className="h-5 w-5 text-primary" /></div>
              <div className="flex-1">
                <div className="font-semibold">{d.label}</div>
                <div className="font-mono text-xs text-muted-foreground">{d.name}</div>
                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs">
                  <span><span className="text-muted-foreground">Category</span> {CATEGORY_LABEL[d.category]}</span>
                  <span><span className="text-muted-foreground">Size</span> {d.sizeKb.toLocaleString()} KB</span>
                  <span><span className="text-muted-foreground">{d.pages ? "Pages" : "Rows"}</span> {d.pages ?? d.rows}</span>
                  <span><span className="text-muted-foreground">Extracted items</span> <b>{d.extractedItems}</b></span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
