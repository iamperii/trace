import { describe, it, expect } from "vitest";
import { summarize, costImpact, numericDifference, revisionSummary, validateFindings, boqFindings, revisionFindings } from "@/lib/audit-engine";
import { RAW_AI_FINDINGS, REVISION_CHANGES } from "@/lib/demo-data";

const DEMO_FINDINGS = validateFindings(RAW_AI_FINDINGS).findings;

describe("audit engine", () => {
  it("validates all 7 demo findings", () => {
    expect(DEMO_FINDINGS).toHaveLength(7);
  });
  it("severity counts are 2 critical, 2 high, 3 medium, 18 passed", () => {
    const s = summarize(DEMO_FINDINGS, 18);
    expect([s.critical, s.high, s.medium, s.passed]).toEqual([2, 2, 3, 18]);
  });
  it("flooring impact is 400 m² × ₼21 = ₼8,400", () => {
    const f = DEMO_FINDINGS.find((x) => x.findingId === "F-003");
    expect(costImpact(f?.cost ?? null)).toBe(8400);
  });
  it("total estimated cost impact is ₼18,450", () => {
    expect(summarize(DEMO_FINDINGS).costImpact).toBe(18450);
  });
  it("insulation difference is 50 mm", () => {
    expect(numericDifference(150, 100).absDiff).toBe(50);
  });
  it("revision B→C: 3 added, 5 changed, 1 removed, 8 BOQ items affected", () => {
    const r = revisionSummary(REVISION_CHANGES);
    expect([r.added, r.changed, r.removed, r.boqAffected]).toEqual([3, 5, 1, 8]);
  });
  it("rejects invalid or overreaching AI output", () => {
    const bad = { ...DEMO_FINDINGS[0], summary: "The project is compliant." };
    expect(validateFindings([{ foo: 1 }, bad]).rejected).toBe(2);
  });
  it("never supplies sample counts or comparison rows for an empty live audit", () => {
    expect(summarize([])).toMatchObject({ passed: 0, total: 0, checks: 0, costImpact: 0 });
    expect(boqFindings([])).toEqual([]);
    expect(revisionFindings([])).toEqual([]);
  });
  it("uses only the supplied AI revision findings", () => {
    const base = DEMO_FINDINGS[0];
    if (!base) throw new Error("Missing test fixture");
    const live = { ...base, findingId: "AI-LIVE-REV", category: "REVISION_DIFFERENCE" as const };
    expect(revisionFindings([live])).toEqual([live]);
    expect(revisionFindings(DEMO_FINDINGS.filter((f) => f.category !== "REVISION_DIFFERENCE"))).toEqual([]);
  });
  it("uses supplied BOQ findings and excludes unrelated semantic matches", () => {
    const base = DEMO_FINDINGS[0];
    if (!base) throw new Error("Missing test fixture");
    const live = { ...base, findingId: "AI-LIVE-BOQ", category: "QUANTITY_UNIT" as const };
    const unrelated = { ...live, findingId: "AI-SEMANTIC", category: "SEMANTIC_MATCH" as const };
    expect(boqFindings([live, unrelated])).toEqual([live]);
  });
});
