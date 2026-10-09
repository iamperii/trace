import { createFileRoute } from "@tanstack/react-router";
import { FindingsWorkspace } from "@/components/tg/FindingsWorkspace";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/_app/results")({
  validateSearch: (s: Record<string, unknown>): { f?: string | undefined } => ({ f: typeof s["f"] === "string" ? s["f"] : undefined }),
  head: () => pageMeta("Audit Results", "Findings, evidence and estimated commercial impact for the tender package."),
  component: () => <FindingsWorkspace basePath="/results" selected={Route.useSearch().f} />,
});
