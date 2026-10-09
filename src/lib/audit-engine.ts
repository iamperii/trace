import { z } from "zod";
import type { BoqRow, RevisionChange } from "./demo-data";

/* ---------- Structured AI output schema (validated before display) ---------- */

export const SeveritySchema = z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]);
export type Severity = z.infer<typeof SeveritySchema>;

const DocRefSchema = z.object({
  docId: z.string(),
  name: z.string(),
  page: z.number().optional(),
  row: z.number().optional(),
  evidence: z.string(),
  highlight: z.string().optional(),
});

const ComparisonSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("numeric"), label: z.string(), required: z.number(), actual: z.number(), unit: z.string() }),
  z.object({ kind: z.literal("text"), label: z.string(), required: z.string(), actual: z.string() }),
  z.object({ kind: z.literal("presence"), label: z.string(), required: z.string(), actual: z.string() }),
]);

export const FindingSchema = z.object({
  findingId: z.string(),
  severity: SeveritySchema,
  category: z.enum(["SPECIFICATION_BOQ_MISMATCH", "MISSING_REQUIREMENT", "REVISION_DIFFERENCE", "COMMERCIAL", "QUANTITY_UNIT", "SEMANTIC_MATCH"]),
  title: z.string(),
  summary: z.string(),
  whyItMatters: z.string(),
  documents: z.array(DocRefSchema).min(1),
  comparison: ComparisonSchema,
  impactLabel: z.string(),
  cost: z.object({ quantity: z.number(), unit: z.string(), unitPrice: z.number(), basis: z.string() }).nullable(),
  recommendedAction: z.string(),
  confidence: z.number().min(0).max(1),
  requiresHumanReview: z.boolean(),
});
export type Finding = z.infer<typeof FindingSchema>;

export const CATEGORY_LABELS: Record<Finding["category"], string> = {
  SPECIFICATION_BOQ_MISMATCH: "Specification vs BOQ",
  MISSING_REQUIREMENT: "Missing Requirement",
  REVISION_DIFFERENCE: "Revision Difference",
  COMMERCIAL: "Commercial",
  QUANTITY_UNIT: "Quantity / Unit",
  SEMANTIC_MATCH: "Semantic Match",
};

const BANNED = [/tender is approved/i, /project is compliant/i, /legally valid/i, /should be selected/i];

export function validateFindings(raw: unknown[]): { findings: Finding[]; rejected: number } {
  const findings: Finding[] = [];
  let rejected = 0;
  for (const r of raw) {
    const p = FindingSchema.safeParse(r);
    if (!p.success) { rejected++; continue; }
    const text = `${p.data.summary} ${p.data.whyItMatters}`;
    if (BANNED.some((b) => b.test(text))) { rejected++; continue; }
    findings.push(p.data);
  }
  return { findings, rejected };
}

/* ---------- Deterministic arithmetic (never delegated to the LLM) ---------- */

export const round2 = (n: number) => Math.round(n * 100) / 100;

export function numericDifference(required: number, actual: number) {
  const diff = actual - required;
  const pct = required === 0 ? 0 : round2((diff / required) * 100);
  return { diff, absDiff: Math.abs(diff), pct };
}

export function costImpact(cost: Finding["cost"]): number | null {
  if (!cost) return null;
  return round2(cost.quantity * cost.unitPrice);
}

export function totalCostImpact(findings: Finding[]): number {
  return round2(findings.reduce((s, f) => s + (costImpact(f.cost) ?? 0), 0));
}

export function boqRowDiff(row: BoqRow) {
  if (row.boq === null) return { diff: null as number | null, risk: "CRITICAL" as "CRITICAL" | "HIGH" | "MEDIUM" | "OK", value: null as number | null };
  const diff = row.required === null ? 0 : row.boq - row.required;
  const unitMismatch = row.boqUnit !== undefined && row.boqUnit !== row.unit;
  const risk: "CRITICAL" | "HIGH" | "MEDIUM" | "OK" = diff !== 0 ? "CRITICAL" : row.specMismatch ? "HIGH" : unitMismatch ? "MEDIUM" : "OK";
  return { diff, risk, value: row.unitPrice === null ? null : round2(row.boq * row.unitPrice) };
}

export function revisionSummary(changes: RevisionChange[]) {
  return {
    added: changes.filter((c) => c.type === "ADDED").length,
    changed: changes.filter((c) => c.type === "CHANGED").length,
    removed: changes.filter((c) => c.type === "REMOVED").length,
    boqAffected: changes.filter((c) => c.affectsBoq).length,
    notUpdated: changes.filter((c) => !c.boqUpdated).length,
  };
}

export function revisionFindings(findings: Finding[]) {
  return findings.filter((f) => f.category === "REVISION_DIFFERENCE");
}

export function boqFindings(findings: Finding[]) {
  return findings.filter((f) => ["SPECIFICATION_BOQ_MISMATCH", "MISSING_REQUIREMENT", "QUANTITY_UNIT", "COMMERCIAL", "REVISION_DIFFERENCE"].includes(f.category));
}

export function summarize(findings: Finding[], passed = 0) {
  const count = (s: Severity) => findings.filter((f) => f.severity === s).length;
  return {
    total: findings.length,
    critical: count("CRITICAL"),
    high: count("HIGH"),
    medium: count("MEDIUM"),
    passed,
    checks: findings.length + passed,
    costImpact: totalCostImpact(findings),
  };
}

export const fmtNum = (n: number, d = 0) => n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: 2 });
export const fmtAzn = (n: number) => `₼${n.toLocaleString("en-US", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;

