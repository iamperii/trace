import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { UploadCloud, FileText, FileSpreadsheet, CheckCircle2, XCircle, Trash2, Play } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/tg/badges";
import { CATEGORY_LABEL, type DocCategory } from "@/lib/document-types";
import { useAudit, type UploadedFile } from "@/lib/audit-store";
import { pageMeta } from "@/lib/meta";
import { extractText, extractedTexts } from "@/lib/extract";

export const Route = createFileRoute("/_app/new-audit")({
  validateSearch: (s: Record<string, unknown>): { demo?: boolean | undefined } => ({ demo: s["demo"] === true || s["demo"] === "true" ? true : undefined }),
  head: () => pageMeta("Start New Tender Audit", "Upload specifications, BOQs, revisions and supplier price lists to cross-check."),
  component: NewAudit,
});

const ACCEPT = [".pdf", ".xlsx", ".xls", ".docx"];
const SLOTS: { cat: DocCategory; fmt: string }[] = [
  { cat: "SPECIFICATION", fmt: "PDF" }, { cat: "BOQ", fmt: "Excel" }, { cat: "REVISION", fmt: "PDF / DOCX" }, { cat: "SUPPLIER", fmt: "Excel" },
];

function guessCategory(name: string): DocCategory | null {
  const n = name.toLowerCase();
  if (/boq|quantit/.test(n)) return "BOQ";
  if (/revis|rev[ _-]?c|change/.test(n)) return "REVISION";
  if (/supplier|price|quot/.test(n)) return "SUPPLIER";
  if (/spec/.test(n)) return "SPECIFICATION";
  return null;
}

function checkFile(f: File): UploadedFile {
  const ext = "." + (f.name.split(".").pop() ?? "").toLowerCase();
  const base = { name: f.name, type: ext.slice(1).toUpperCase(), sizeKb: Math.max(1, Math.round(f.size / 1024)), category: guessCategory(f.name) };
  if (!ACCEPT.includes(ext)) return { ...base, status: "error", error: "Unsupported file type. Use PDF, XLSX, XLS or DOCX." };
  if (f.size === 0) return { ...base, status: "error", error: "File is empty." };
  return { ...base, status: "ready" };
}

function NewAudit() {
  const { files, setFiles } = useAudit();
  const { demo } = Route.useSearch();
  const nav = useNavigate();
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  useEffect(() => { if (demo || files.some((f) => f.demo)) setFiles(files.filter((f) => !f.demo)); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [busy, setBusy] = useState(false);
  const add = async (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list);
    setBusy(true);
    const checked = await Promise.all(arr.map(async (f) => {
      const c = checkFile(f);
      if (c.status !== "ready") return c;
      try { extractedTexts.set(f.name, await extractText(f)); return c; }
      catch (e) { return { ...c, status: "error" as const, error: e instanceof Error ? e.message : "Could not read file." }; }
    }));
    setBusy(false);
    checked.filter((c) => c.status === "error").forEach((c) => toast.error(`${c.name}: ${c.error}`));
    setFiles([...files.filter((f) => !checked.some((c) => c.name === f.name)), ...checked]);
  };
  const setCat = (i: number, cat: DocCategory) => setFiles(files.map((f, j) => (j === i ? { ...f, category: cat } : f)));
  const ready = files.filter((f) => f.status === "ready" && extractedTexts.has(f.name));
  const missing = SLOTS.filter((s) => !ready.some((f) => f.category === s.cat));

  const run = () => {
    if (ready.length === 0) { toast.error("Add at least one valid document."); return; }
    if (missing.length) toast.warning(`Missing: ${missing.map((m) => CATEGORY_LABEL[m.cat]).join(", ")}. Some checks will be skipped.`);
    nav({ to: "/processing" });
  };

  return (
    <>
      <PageHeader title="Start New Tender Audit" subtitle="Upload the documents you want TRACE to cross-check." />

      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); void add(e.dataTransfer.files); }}
        onClick={() => input.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-card px-6 py-12 text-center transition-colors ${drag ? "border-primary bg-accent" : "hover:border-primary/50"}`}
      >
        <UploadCloud className="h-10 w-10 text-primary" />
        <div className="mt-3 font-medium">Drag & drop tender documents, or click to browse</div>
        <div className="mt-1 text-sm text-muted-foreground">{busy ? "Reading documents…" : "PDF, XLSX, XLS, DOCX · multiple files allowed"}</div>
        <input ref={input} type="file" multiple accept={ACCEPT.join(",")} className="hidden" onChange={(e) => { void add(e.target.files); e.target.value = ""; }} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {SLOTS.map((s) => {
          const has = ready.some((f) => f.category === s.cat);
          return (
            <div key={s.cat} className={`rounded-lg border bg-card p-4 ${has ? "border-success/40" : ""}`}>
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">{CATEGORY_LABEL[s.cat]}</div>
                {has ? <CheckCircle2 className="h-4 w-4 text-success" /> : <span className="text-xs text-muted-foreground">Pending</span>}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{s.fmt}</div>
            </div>
          );
        })}
      </div>

      {files.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-lg border bg-card">
          <div className="flex items-center justify-between border-b px-5 py-3">
            <div className="text-sm font-semibold">{files.length} file(s)</div>
          </div>
          <ul className="divide-y">
            {files.map((f, i) => (
              <li key={f.name} className="flex flex-wrap items-center gap-4 px-5 py-3">
                {f.type.startsWith("XLS") ? <FileSpreadsheet className="h-5 w-5 text-success" /> : <FileText className="h-5 w-5 text-primary" />}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{f.name}</div>
                  <div className="text-xs text-muted-foreground">{f.type} · {f.sizeKb.toLocaleString()} KB</div>
                </div>
                <select value={f.category ?? ""} onChange={(e) => setCat(i, e.target.value as DocCategory)} className="rounded border bg-background px-2 py-1 text-sm" disabled={f.status === "error"}>
                  <option value="" disabled>Select category</option>
                  {SLOTS.map((s) => <option key={s.cat} value={s.cat}>{CATEGORY_LABEL[s.cat]}</option>)}
                </select>
                {f.status === "ready"
                  ? <span className="flex w-36 items-center gap-1 text-xs font-medium text-success"><CheckCircle2 className="h-4 w-4" /> Ready</span>
                  : <span className="flex w-36 items-center gap-1 text-xs font-medium text-critical"><XCircle className="h-4 w-4" /> {f.error}</span>}
                <button aria-label="Remove" onClick={() => setFiles(files.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-critical"><Trash2 className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between rounded-lg border bg-card p-4">
        <p className="text-sm text-muted-foreground">Live AI audit · Human review required</p>
        <Button size="lg" onClick={run} disabled={ready.length === 0 || busy}><Play className="mr-2 h-4 w-4" /> Run AI Audit</Button>
      </div>
    </>
  );
}
