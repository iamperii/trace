import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { validateFindings, type Finding } from "./audit-engine";

const InputSchema = z.object({
  docs: z.array(z.object({ id: z.string(), name: z.string(), category: z.string(), text: z.string().max(80000) })).min(1).max(8),
});

const nullable = (t: object) => ({ anyOf: [t, { type: "null" }] });
const S = { type: "string" };
const N = { type: "number" };

const OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["findings", "passedChecks"],
  properties: {
    passedChecks: { type: "integer" },
    findings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["severity", "category", "title", "summary", "whyItMatters", "documents", "comparison", "impactLabel", "cost", "recommendedAction", "confidence"],
        properties: {
          severity: { type: "string", enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW"] },
          category: { type: "string", enum: ["SPECIFICATION_BOQ_MISMATCH", "MISSING_REQUIREMENT", "REVISION_DIFFERENCE", "COMMERCIAL", "QUANTITY_UNIT", "SEMANTIC_MATCH"] },
          title: S, summary: S, whyItMatters: S, impactLabel: S, recommendedAction: S,
          confidence: N,
          documents: {
            type: "array",
            items: {
              type: "object", additionalProperties: false,
              required: ["docId", "page", "row", "evidence", "highlight"],
              properties: { docId: S, page: nullable({ type: "integer" }), row: nullable({ type: "integer" }), evidence: S, highlight: nullable(S) },
            },
          },
          comparison: {
            type: "object", additionalProperties: false,
            required: ["kind", "label", "required", "actual", "requiredNumber", "actualNumber", "unit"],
            properties: { kind: { type: "string", enum: ["numeric", "text", "presence"] }, label: S, required: S, actual: S, requiredNumber: nullable(N), actualNumber: nullable(N), unit: nullable(S) },
          },
          cost: nullable({
            type: "object", additionalProperties: false,
            required: ["quantity", "unit", "unitPrice", "basis"],
            properties: { quantity: N, unit: S, unitPrice: N, basis: S },
          }),
        },
      },
    },
  },
};

const SYSTEM = `You are a construction tender auditor assistant. Cross-check the provided tender documents (technical specification, bill of quantities, revisions, supplier price lists) and report INCONSISTENCIES only:
- specification requirements vs BOQ items (material grade, thickness, class, quantity, unit)
- requirements missing from the BOQ
- revision changes not reflected in the BOQ
- unit mismatches, commercial gaps (use supplier unit prices for cost when available; cost.quantity = the quantity difference)
Rules: quote exact evidence text from each document, give page (PDF) or row (Excel) numbers when visible. Use docId values exactly as given. Never state that the tender is approved, compliant, legally valid or should be selected — the human estimator decides. Do not invent data not present in the documents. confidence is 0..1. passedChecks = number of items you verified as consistent. Write in English.`;

async function callGateway(apiKey: string, input: unknown[]): Promise<string> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      input,
      stream: true,
      store: false,
      reasoning: { effort: "medium", summary: "auto" },
      include: ["reasoning.encrypted_content"],
      text: { format: { type: "json_schema", name: "tender_audit", strict: true, schema: OUTPUT_SCHEMA } },
    }),
  });
  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => "");
    let msg = body;
    try { msg = JSON.parse(body)?.error?.message ?? JSON.parse(body)?.message ?? body; } catch { /* raw */ }
    if (res.status === 402) throw new Error("AI credits exhausted. Add credits in Settings → Plans & credits.");
    if (res.status === 429) throw new Error("AI is rate limited. Please wait a moment and try again.");
    throw new Error(`AI request failed (${res.status}): ${String(msg).slice(0, 300)}`);
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "", text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const ev = JSON.parse(data);
        if (ev.type === "response.output_text.delta") text += ev.delta;
        else if (ev.type === "response.failed" || ev.type === "error") throw new Error(ev.response?.error?.message ?? ev.message ?? "AI analysis failed");
      } catch (e) { if (e instanceof Error && !(e instanceof SyntaxError)) throw e; }
    }
  }
  if (!text) throw new Error("The AI returned no analysis (it may have declined the request).");
  return text;
}

type RawOut = {
  passedChecks: number;
  findings: Array<{
    severity: string; category: string; title: string; summary: string; whyItMatters: string; impactLabel: string; recommendedAction: string; confidence: number;
    documents: Array<{ docId: string; page: number | null; row: number | null; evidence: string; highlight: string | null }>;
    comparison: { kind: string; label: string; required: string; actual: string; requiredNumber: number | null; actualNumber: number | null; unit: string | null };
    cost: { quantity: number; unit: string; unitPrice: number; basis: string } | null;
  }>;
};

export const analyzeTender = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }): Promise<{ findings: Finding[]; rejected: number; passed: number }> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI is not configured (missing key).");
    const docsText = data.docs.map((d) => `=== DOCUMENT docId="${d.id}" name="${d.name}" type=${d.category} ===\n${d.text}`).join("\n\n");
    const raw = await callGateway(apiKey, [
      { role: "system", content: SYSTEM },
      { role: "user", content: docsText },
    ]);
    const out = JSON.parse(raw) as RawOut;
    const names = new Map(data.docs.map((d) => [d.id, d.name]));
    const mapped = out.findings.map((f, i) => ({
      findingId: `AI-${String(i + 1).padStart(3, "0")}`,
      severity: f.severity, category: f.category, title: f.title, summary: f.summary, whyItMatters: f.whyItMatters,
      impactLabel: f.impactLabel, recommendedAction: f.recommendedAction,
      confidence: Math.min(1, Math.max(0, f.confidence)),
      requiresHumanReview: true,
      documents: f.documents.map((d) => ({
        docId: d.docId, name: names.get(d.docId) ?? d.docId, evidence: d.evidence,
        ...(d.page != null ? { page: d.page } : {}), ...(d.row != null ? { row: d.row } : {}), ...(d.highlight ? { highlight: d.highlight } : {}),
      })),
      comparison: f.comparison.kind === "numeric" && f.comparison.requiredNumber != null && f.comparison.actualNumber != null
        ? { kind: "numeric", label: f.comparison.label, required: f.comparison.requiredNumber, actual: f.comparison.actualNumber, unit: f.comparison.unit ?? "" }
        : { kind: f.comparison.kind === "presence" ? "presence" : "text", label: f.comparison.label, required: f.comparison.required, actual: f.comparison.actual },
      cost: f.cost,
    }));
    const v = validateFindings(mapped);
    return { ...v, passed: Math.max(0, out.passedChecks | 0) };
  });
