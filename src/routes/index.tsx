import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, FileSearch, GitCompare, Calculator, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/")({
  head: () => pageMeta("Catch inconsistencies before they become construction costs", "TRACE cross-checks tender specifications, BOQs, revisions and supplier prices — with evidence for every finding."),
  component: Landing,
});

const STEPS = [
  { Icon: FileSearch, t: "Extract", d: "Requirements and BOQ items from PDF and Excel" },
  { Icon: GitCompare, t: "Cross-check", d: "Semantic matching across documents and revisions" },
  { Icon: Calculator, t: "Calculate", d: "Deterministic quantity and cost differences" },
  { Icon: UserCheck, t: "Decide", d: "The estimator accepts, investigates or dismisses" },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center gap-2 border-b bg-card px-8 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground"><ShieldCheck className="h-4 w-4" /></div>
        <span className="font-semibold">TRACE</span>
      </header>
      <section className="mx-auto max-w-4xl px-8 pb-12 pt-20">
        <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary">Construction Tender Consistency Auditor</div>
        <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl">Catch inconsistencies before they become construction costs.</h1>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground">Cross-check specifications, Bills of Quantities, revisions and supplier prices. Every finding comes with evidence from the source documents.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button size="lg" asChild><Link to="/new-audit">Start Tender Audit</Link></Button>
        </div>
        <div className="mt-14 grid gap-px overflow-hidden rounded-lg border bg-border md:grid-cols-4">
          {STEPS.map(({ Icon, t, d }) => (
            <div key={t} className="bg-card p-5">
              <Icon className="h-5 w-5 text-primary" />
              <div className="mt-3 text-sm font-semibold">{t}</div>
              <div className="mt-1 text-xs text-muted-foreground">{d}</div>
            </div>
          ))}
        </div>
        <blockquote className="mt-12 border-l-2 border-primary pl-4 text-sm">
          <div className="font-semibold">AI does not replace the estimator.</div>
          <div className="text-muted-foreground">AI checks the documents. The estimator makes the decision.</div>
        </blockquote>
      </section>
    </div>
  );
}
