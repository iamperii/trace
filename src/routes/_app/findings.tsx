import { createFileRoute } from "@tanstack/react-router";
import { FindingsWorkspace } from "@/components/tg/FindingsWorkspace";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/_app/findings")({
  validateSearch: (s: Record<string, unknown>): { f?: string | undefined } => ({ f: typeof s["f"] === "string" ? s["f"] : undefined }),
  head: () => pageMeta("Findings", "All detected tender inconsistencies with human review status."),
  component: () => <FindingsWorkspace basePath="/findings" selected={Route.useSearch().f} />,
});
