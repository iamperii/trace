import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Loader2, Circle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/tg/badges";
import { analyzeTender } from "@/lib/analyze.functions";
import { extractedTexts } from "@/lib/extract";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAudit } from "@/lib/audit-store";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/_app/processing")({
  head: () => pageMeta("Running Audit", "TRACE is cross-checking your tender documents."),
  component: Processing,
});

const STEPS = [
  "Documents uploaded", "Text and tables extracted", "Requirements identified", "BOQ items normalized",
  "Cross-document comparison", "Revision analysis", "Risk assessment", "Audit report generation",
];

function Processing() {
  const { completeAudit, files, projectName } = useAudit();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [live] = useState(() => files.filter((f) => f.status === "ready" && !f.demo && extractedTexts.has(f.name)));
  const [started, setStarted] = useState(false);
    const nav = useNavigate();
  const docs = live.length;

  useEffect(() => {
    if (live.length > 0) {
      if (step < STEPS.length - 1) {
        const t = setTimeout(() => setStep((s) => s + 1), step >= 3 ? 2500 : 700);
        return () => clearTimeout(t);
      }
      if (started) return undefined;
      setStarted(true);
      analyzeTender({ data: { docs: live.map((f, i) => ({ id: `DOC-${i + 1}`, name: f.name, category: f.category ?? "UNKNOWN", text: extractedTexts.get(f.name) ?? "" })) } })
        .then((r) => {
          setStep(STEPS.length);
          completeAudit({ findings: r.findings, passed: r.passed, rejected: r.rejected, at: new Date().toISOString() });
          if (r.rejected) toast.warning(`${r.rejected} AI finding(s) failed validation and were hidden.`);
          setTimeout(() => nav({ to: "/results" }), 700);
        })
        .catch((e: unknown) => setError(e instanceof Error ? e.message : "AI analysis failed."));
      return undefined;
    }
    nav({ to: "/new-audit" });
    return undefined;
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  const msg = step >= STEPS.length ? "Audit completed"
    : step >= 5 ? "Checking specification-to-BOQ relationships..."
    : step >= 3 ? "Finding relationships between extracted items..."
    : `Analyzing ${docs} documents...`;

  return (
    <>
      <PageHeader title="Running AI Audit" subtitle={projectName} />
      <div className="mx-auto max-w-2xl rounded-lg border bg-card p-8">
        <div className="text-lg font-semibold">{error ? "Analysis failed" : live.length && step === STEPS.length - 1 ? "AI is cross-checking your documents… (can take a minute)" : msg}</div>
        {error && <div className="mt-3 rounded border border-critical/40 p-3 text-sm text-critical">{error} <Button size="sm" variant="outline" className="ml-2" onClick={() => nav({ to: "/new-audit" })}>Back</Button></div>}
        <Progress value={(step / STEPS.length) * 100} className="mt-4 h-1.5" />
        <ol className="mt-8 space-y-4">
          {STEPS.map((s, i) => {
            const done = i < step, active = i === step;
            return (
              <li key={s} className="flex items-center gap-3 text-sm">
                <span className={`flex h-6 w-6 items-center justify-center rounded-full border ${done ? "border-success bg-success text-primary-foreground" : active ? "border-primary text-primary" : "text-muted-foreground"}`}>
                  {done ? <Check className="h-3.5 w-3.5" /> : active ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Circle className="h-2 w-2" />}
                </span>
                <span className={done ? "text-foreground" : active ? "font-medium text-primary" : "text-muted-foreground"}>{i + 1}. {s}</span>
              </li>
            );
          })}
        </ol>
        <p className="mt-8 text-xs text-muted-foreground">Quantities, differences and costs are computed deterministically. AI is used for semantic matching and explanations.</p>
      </div>
    </>
  );
}
