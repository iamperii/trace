import { describe, it, expect } from "vitest";
import { DEMO_FINDINGS, summarize, costImpact, numericDifference, revisionSummary, validateFindings } from "@/lib/audit-engine";

describe("audit engine", () => {
  it("validates all 7 demo findings", () => {
    expect(DEMO_FINDINGS).toHaveLength(7);
  });
  it("severity counts are 2 critical, 2 high, 3 medium, 18 passed", () => {
    const s = summarize(DEMO_FINDINGS);
    expect([s.critical, s.high, s.medium, s.passed]).toEqual([2, 2, 3, 18]);
  });
  it("flooring impact is 400 m² × ₼21 = ₼8,400", () => {
    const f = DEMO_FINDINGS.find((x) => x.findingId === "F-003")!;
    expect(costImpact(f.cost)).toBe(8400);
  });
  it("total estimated cost impact is ₼18,450", () => {
    expect(summarize(DEMO_FINDINGS).costImpact).toBe(18450);
  });
  it("insulation difference is 50 mm", () => {
    expect(numericDifference(150, 100).absDiff).toBe(50);
  });
  it("revision B→C: 3 added, 5 changed, 1 removed, 8 BOQ items affected", () => {
    const r = revisionSummary();
    expect([r.added, r.changed, r.removed, r.boqAffected]).toEqual([3, 5, 1, 8]);
  });
  it("rejects invalid or overreaching AI output", () => {
    const bad = { ...DEMO_FINDINGS[0], summary: "The project is compliant." };
    expect(validateFindings([{ foo: 1 }, bad]).rejected).toBe(2);
  });
});
