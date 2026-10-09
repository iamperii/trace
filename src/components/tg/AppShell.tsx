import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, FilePlus2, History, AlertTriangle, FileText, GitCompare, Table2, FileBarChart, Settings, ShieldCheck } from "lucide-react";
import { useAudit } from "@/lib/audit-store";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/overview", label: "Overview", Icon: LayoutDashboard },
  { to: "/new-audit", label: "New Audit", Icon: FilePlus2 },
  { to: "/history", label: "Audit History", Icon: History },
  { to: "/findings", label: "Findings", Icon: AlertTriangle },
  { to: "/documents", label: "Documents", Icon: FileText },
  { to: "/revisions", label: "Revision Impact", Icon: GitCompare },
  { to: "/boq", label: "BOQ Comparison", Icon: Table2 },
  { to: "/report", label: "Reports", Icon: FileBarChart },
  { to: "/settings", label: "Settings", Icon: Settings },
] as const;

export function AppShell() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { projectName } = useAudit();
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="no-print sticky top-0 flex h-screen w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
        <Link to="/" className="flex items-center gap-2 border-b border-sidebar-border px-5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-sidebar-primary text-sidebar-primary-foreground">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-semibold text-sidebar-accent-foreground">TRACE</div>
            <div className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60">Tender Consistency Auditor</div>
          </div>
        </Link>
        <nav className="flex-1 space-y-0.5 p-3">
          {NAV.map(({ to, label, Icon }) => {
            const active = path.startsWith(to) || (to === "/findings" && path.startsWith("/results"));
            return (
              <Link key={to} to={to} className={cn("flex items-center gap-3 rounded px-3 py-2 text-sm transition-colors", active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground")}>
                <Icon className="h-4 w-4" /> {label}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-3 border-t border-sidebar-border p-4">
          <div className="flex items-center gap-2 rounded border border-sidebar-border px-3 py-2 text-xs">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse-dot" />
            <span className="font-medium text-sidebar-accent-foreground">{"Live AI"}</span>
            <span className="ml-auto text-sidebar-foreground/60">{"connected"}</span>
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-20 flex h-14 items-center gap-4 border-b bg-card px-6">
          <div className="text-sm">
            <span className="text-muted-foreground">Project</span>
            <span className="mx-2 text-border">/</span>
            <span className="font-semibold">{projectName}</span>
          </div>
          <span className="rounded border border-warning/40 bg-warning/15 px-2 py-0.5 text-xs font-medium">Review Required</span>
        </header>
        <main className="mx-auto w-full max-w-[1400px] flex-1 p-6 lg:p-8">
          <Outlet />
        </main>
        <footer className="no-print border-t px-8 py-3 text-xs text-muted-foreground">
          AI checks the documents. The estimator makes the decision.
        </footer>
      </div>
    </div>
  );
}
