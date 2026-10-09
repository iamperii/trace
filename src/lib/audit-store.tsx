import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { DocCategory } from "./demo-data";
import { type Finding } from "./audit-engine";

export interface LiveResult { findings: Finding[]; passed: number; rejected: number; at: string }

export interface AuditHistoryEntry {
  id: string;
  project: string;
  date: string;
  docs: number;
  findings: number;
  critical: number;
  status: string;
}

export function projectNameFrom(files: UploadedFile[]): string {
  const spec = files.find((f) => f.category === "SPECIFICATION" && f.status === "ready")
    ?? files.find((f) => f.status === "ready");
  if (!spec) return "No project loaded";
  return spec.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ");
}

export type ReviewStatus = "NEEDS_REVIEW" | "CONFIRMED" | "INVESTIGATE" | "DISMISSED";
export interface Review { status: ReviewStatus; reason?: string; at?: string }

export interface UploadedFile {
  name: string;
  type: string;
  sizeKb: number;
  category: DocCategory | null;
  status: "ready" | "error";
  error?: string;
  demo?: boolean;
}

interface State {
  reviews: Record<string, Review>;
  files: UploadedFile[];
  auditCompleted: boolean;
  live: LiveResult | null;
  history: AuditHistoryEntry[];
}

interface Ctx extends State {
  setReview: (id: string, r: Review) => void;
  setFiles: (f: UploadedFile[]) => void;
  completeAudit: (live?: LiveResult | null) => void;
  findings: Finding[];
  passedCount: number;
  isLive: boolean;
  projectName: string;
  reset: () => void;
  statusOf: (id: string) => Review;
}

const KEY = "tenderguard-state-v2";
const initial: State = { reviews: {}, files: [], auditCompleted: true, live: null, history: [] };
const AuditCtx = createContext<Ctx | null>(null);

export function AuditProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState({ ...initial, ...JSON.parse(raw) });
    } catch { /* ignore */ }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) localStorage.setItem(KEY, JSON.stringify(state));
  }, [state, loaded]);

  const value: Ctx = {
    ...state,
    setReview: (id, r) => setState((s) => ({ ...s, reviews: { ...s.reviews, [id]: { ...r, at: new Date().toISOString() } } })),
    setFiles: (files) => setState((s) => ({ ...s, files })),
    completeAudit: (live = null) => setState((s) => {
      const findings = live?.findings ?? [];
      const entry: AuditHistoryEntry = {
        id: `A-${String(s.history.length + 1).padStart(4, "0")}`,
        project: projectNameFrom(s.files),
        date: new Date().toISOString().slice(0, 10),
        docs: s.files.filter((f) => f.status === "ready").length,
        findings: findings.length,
        critical: findings.filter((f) => f.severity === "CRITICAL").length,
        status: "Review Required",
      };
      return { ...s, auditCompleted: true, reviews: {}, live, history: [entry, ...s.history] };
    }),
    findings: state.live?.findings ?? [],
    passedCount: state.live?.passed ?? 0,
    isLive: true,
    projectName: projectNameFrom(state.files),
    reset: () => setState(initial),
    statusOf: (id) => state.reviews[id] ?? { status: "NEEDS_REVIEW" },
  };
  return <AuditCtx.Provider value={value}>{children}</AuditCtx.Provider>;
}

export function useAudit() {
  const c = useContext(AuditCtx);
  if (!c) throw new Error("useAudit outside provider");
  return c;
}
