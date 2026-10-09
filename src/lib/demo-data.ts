// Synthetic Demo Data — Baku Commercial Center. Not real company data.

export type DocCategory = "SPECIFICATION" | "BOQ" | "REVISION" | "SUPPLIER";

export interface TenderDocument {
  id: string;
  name: string;
  label: string;
  category: DocCategory;
  type: "PDF" | "XLSX" | "DOCX";
  sizeKb: number;
  pages?: number;
  rows?: number;
  extractedItems: number;
}

export const PROJECT = {
  name: "Baku Commercial Center",
  packageName: "Baku Commercial Center — Tender Package",
  auditDurationSec: 47,
  extractedItems: 184,
  relationshipsChecked: 63,
  completedAt: "2026-10-08 14:32",
};

export const DOCUMENTS: TenderDocument[] = [
  { id: "spec", name: "Technical_Specification_RevB.pdf", label: "Technical Specification Rev. B", category: "SPECIFICATION", type: "PDF", sizeKb: 4820, pages: 68, extractedItems: 71 },
  { id: "boq", name: "BOQ_RevA.xlsx", label: "BOQ Rev. A", category: "BOQ", type: "XLSX", sizeKb: 312, rows: 214, extractedItems: 58 },
  { id: "rev", name: "Project_Revision_RevC.pdf", label: "Project Revision Rev. C", category: "REVISION", type: "PDF", sizeKb: 1290, pages: 14, extractedItems: 23 },
  { id: "sup", name: "Supplier_Prices.xlsx", label: "Supplier Price List", category: "SUPPLIER", type: "XLSX", sizeKb: 96, rows: 48, extractedItems: 32 },
];

export const CATEGORY_LABEL: Record<DocCategory, string> = {
  SPECIFICATION: "Technical Specification",
  BOQ: "Bill of Quantities",
  REVISION: "Project Revision",
  SUPPLIER: "Supplier Price List",
};

/** Supplier unit prices (₼, AZN) */
export const SUPPLIER_PRICES = {
  flooring: { item: "Porcelain floor tile 600×600, R10", unit: "m²", price: 21 },
  insulation: { item: "Mineral wool slab 100 mm", unit: "m²", price: 7.2 },
  cable: { item: "Fire-rated cable FE180 3×2.5 mm²", unit: "m", price: 7 },
  pipe: { item: "HDPE pipe PE100 DN110 SDR17", unit: "m", price: 20 },
};

/** Raw (pre-validation) AI output, shaped per the structured schema. Arithmetic is filled by the engine. */
export const RAW_AI_FINDINGS: unknown[] = [
  {
    findingId: "F-001", severity: "CRITICAL", category: "SPECIFICATION_BOQ_MISMATCH",
    title: "Insulation thickness mismatch",
    summary: "The technical specification requires 150 mm mineral wool insulation, while the current BOQ specifies 100 mm.",
    whyItMatters: "Submitting the current BOQ without resolving this discrepancy may result in underpricing, specification non-compliance or a variation during project execution.",
    documents: [
      { docId: "spec", name: "Technical_Specification_RevB.pdf", page: 24, evidence: "Section 07 21 00 — Mineral wool thermal insulation to external walls, density ≥ 100 kg/m³, thickness: 150 mm.", highlight: "thickness: 150 mm" },
      { docId: "boq", name: "BOQ_RevA.xlsx", row: 42, evidence: "4.12 | Mineral wool insulation — thickness: 100 mm | 4,500 | m² | 7.20", highlight: "thickness: 100 mm" },
    ],
    comparison: { kind: "numeric", label: "Insulation thickness", required: 150, actual: 100, unit: "mm" },
    impactLabel: "Specification compliance risk",
    cost: null,
    recommendedAction: "Review BOQ item 4.12 (row 42) and re-price for 150 mm thickness.",
    confidence: 0.94, requiresHumanReview: true,
  },
  {
    findingId: "F-002", severity: "CRITICAL", category: "MISSING_REQUIREMENT",
    title: "Fire-rated cable requirement missing from BOQ",
    summary: "The specification requires FE180 fire-rated cable for emergency lighting and fire alarm circuits. No corresponding item was found in the BOQ.",
    whyItMatters: "Life-safety cabling is mandatory for fire-code compliance. An omitted item will likely be raised as a variation or lead to a non-compliant installation.",
    documents: [
      { docId: "spec", name: "Technical_Specification_RevB.pdf", page: 31, evidence: "Section 26 05 13 — Emergency lighting and fire alarm circuits shall use fire-rated cable FE180/PH120, 3×2.5 mm², approx. 550 m.", highlight: "fire-rated cable FE180/PH120" },
      { docId: "boq", name: "BOQ_RevA.xlsx", evidence: "No matching item in Section 6 — Electrical (rows 120–168). Closest item: 6.04 'LSZH cable 3×2.5 mm²' (general power).", highlight: "No matching item" },
    ],
    comparison: { kind: "presence", label: "Fire-rated cable", required: "Required (550 m)", actual: "Missing" },
    impactLabel: "Omitted life-safety item",
    cost: { quantity: 550, unit: "m", unitPrice: SUPPLIER_PRICES.cable.price, basis: "Missing quantity × supplier unit price" },
    recommendedAction: "Add FE180 fire-rated cable line item to BOQ Section 6.",
    confidence: 0.91, requiresHumanReview: true,
  },
  {
    findingId: "F-003", severity: "HIGH", category: "REVISION_DIFFERENCE",
    title: "Flooring quantity changed in Revision C",
    summary: "Revision C increases porcelain flooring from 4,700 m² to 5,100 m². The BOQ still lists 4,700 m².",
    whyItMatters: "The estimate will under-represent the revised scope, leading to a direct cost shortfall if the bid is submitted as-is.",
    documents: [
      { docId: "rev", name: "Project_Revision_RevC.pdf", page: 6, evidence: "Change C-07: Floor finish FF-02 extended to Level 3 retail mall. Revised total area: 5,100 m² (previously 4,700 m²).", highlight: "5,100 m²" },
      { docId: "boq", name: "BOQ_RevA.xlsx", row: 88, evidence: "5.03 | Porcelain floor tiles 600×600, R10 | 4,700 | m² | 21.00", highlight: "4,700" },
    ],
    comparison: { kind: "numeric", label: "Flooring area", required: 5100, actual: 4700, unit: "m²" },
    impactLabel: "Under-priced scope",
    cost: { quantity: 400, unit: "m²", unitPrice: SUPPLIER_PRICES.flooring.price, basis: "Quantity difference × supplier unit price" },
    recommendedAction: "Update BOQ item 5.03 to 5,100 m².",
    confidence: 0.97, requiresHumanReview: true,
  },
  {
    findingId: "F-004", severity: "HIGH", category: "COMMERCIAL",
    title: "Supplier price corresponds to outdated quantity",
    summary: "The supplier quotation for HDPE DN110 drainage pipe is based on 1,240 m, but the current requirement is 1,550 m.",
    whyItMatters: "The quoted package value does not cover the full quantity; volume pricing and the commercial total may both be incorrect.",
    documents: [
      { docId: "sup", name: "Supplier_Prices.xlsx", row: 17, evidence: "HDPE pipe PE100 DN110 SDR17 | qty basis 1,240 m | 20.00 AZN/m | valid to 30.11.2026", highlight: "qty basis 1,240 m" },
      { docId: "boq", name: "BOQ_RevA.xlsx", row: 151, evidence: "7.08 | Underground drainage pipe, polyethylene, Ø110 | 1,550 | m", highlight: "1,550" },
    ],
    comparison: { kind: "numeric", label: "Pipe quantity", required: 1550, actual: 1240, unit: "m" },
    impactLabel: "Quotation shortfall",
    cost: { quantity: 310, unit: "m", unitPrice: SUPPLIER_PRICES.pipe.price, basis: "Unquoted quantity × supplier unit price" },
    recommendedAction: "Request updated supplier quotation for 1,550 m.",
    confidence: 0.88, requiresHumanReview: true,
  },
  {
    findingId: "F-005", severity: "MEDIUM", category: "QUANTITY_UNIT",
    title: "Unit inconsistency — waterproofing membrane",
    summary: "The specification measures roof waterproofing in m² (1,850 m²), but the BOQ lists the same quantity in linear metres (m).",
    whyItMatters: "Pricing by linear metre against an area requirement can distort the item value significantly depending on roll width.",
    documents: [
      { docId: "spec", name: "Technical_Specification_RevB.pdf", page: 19, evidence: "Section 07 52 00 — SBS modified bitumen membrane, 2 layers, roof area 1,850 m².", highlight: "1,850 m²" },
      { docId: "boq", name: "BOQ_RevA.xlsx", row: 37, evidence: "3.09 | Bituminous waterproofing membrane, 2-ply | 1,850 | m", highlight: "| m" },
    ],
    comparison: { kind: "text", label: "Unit of measure", required: "m²", actual: "m" },
    impactLabel: "Pricing basis risk",
    cost: null,
    recommendedAction: "Confirm unit of measure for BOQ item 3.09.",
    confidence: 0.9, requiresHumanReview: true,
  },
  {
    findingId: "F-006", severity: "MEDIUM", category: "SEMANTIC_MATCH",
    title: "Concrete class differs under equivalent description",
    summary: "\"Ready-mix concrete C30/37\" (spec) and \"Structural concrete grade B30\" (BOQ) refer to the same item. B30 corresponds approximately to C25/30, below the specified class.",
    whyItMatters: "The items were written differently but describe the same structural concrete; the BOQ grade appears to be lower than required.",
    documents: [
      { docId: "spec", name: "Technical_Specification_RevB.pdf", page: 12, evidence: "Section 03 30 00 — Ready-mix concrete for slabs and columns, strength class C30/37, 860 m³.", highlight: "C30/37" },
      { docId: "boq", name: "BOQ_RevA.xlsx", row: 14, evidence: "2.02 | Structural concrete grade B30, slabs & columns | 860 | m³", highlight: "grade B30" },
    ],
    comparison: { kind: "text", label: "Concrete strength class", required: "C30/37", actual: "B30 (≈ C25/30)" },
    impactLabel: "Structural specification risk",
    cost: null,
    recommendedAction: "Verify concrete class with structural engineer.",
    confidence: 0.82, requiresHumanReview: true,
  },
  {
    findingId: "F-007", severity: "MEDIUM", category: "SPECIFICATION_BOQ_MISMATCH",
    title: "Structural steel grade mismatch",
    summary: "The specification requires steel grade S355 for secondary framing; the BOQ describes S275.",
    whyItMatters: "Lower grade steel is cheaper, so the estimate may be underpriced and the design intent not met.",
    documents: [
      { docId: "spec", name: "Technical_Specification_RevB.pdf", page: 15, evidence: "Section 05 12 00 — Secondary steel framing, hot-rolled sections, grade S355JR, 38 t.", highlight: "S355JR" },
      { docId: "boq", name: "BOQ_RevA.xlsx", row: 22, evidence: "2.11 | Secondary steelwork, hot-rolled, S275 | 38 | t", highlight: "S275" },
    ],
    comparison: { kind: "text", label: "Steel grade", required: "S355", actual: "S275" },
    impactLabel: "Material grade risk",
    cost: null,
    recommendedAction: "Confirm steel grade for BOQ item 2.11.",
    confidence: 0.86, requiresHumanReview: true,
  },
];

export interface PassedCheck {
  id: string;
  item: string;
  detail: string;
  semantic?: { a: string; b: string };
}

export const PASSED_CHECKS: PassedCheck[] = [
  { id: "P-01", item: "Insulation area", detail: "4,500 m² in spec and BOQ" },
  { id: "P-02", item: "Plasterboard partitions", detail: "Equivalent items matched — 12.5 mm, 3,200 m²", semantic: { a: "Gypsum plasterboard 12.5 mm (spec p.27)", b: "GKB drywall board, t=12.5mm (BOQ row 71)" } },
  { id: "P-03", item: "Concrete volume", detail: "860 m³ in spec and BOQ" },
  { id: "P-04", item: "Rebar quantity", detail: "142 t ↔ 142,000 kg — normalized, equal" },
  { id: "P-05", item: "Steel tonnage", detail: "38 t in spec and BOQ" },
  { id: "P-06", item: "Waterproofing quantity", detail: "1,850 in both (unit checked separately)" },
  { id: "P-07", item: "Drainage pipe diameter", detail: "DN110 ↔ Ø110 mm — equivalent" },
  { id: "P-08", item: "Window glazing U-value", detail: "≤ 1.1 W/m²K in spec and BOQ" },
  { id: "P-09", item: "Facade cladding area", detail: "6,320 m² in spec and BOQ" },
  { id: "P-10", item: "Suspended ceiling", detail: "Mineral fibre tile 600×600, 4,980 m²" },
  { id: "P-11", item: "Sanitary fixtures", detail: "126 nr in spec and BOQ" },
  { id: "P-12", item: "Fire doors EI60", detail: "48 nr — rating and count match" },
  { id: "P-13", item: "Paint system", detail: "2 coats emulsion, 11,400 m²" },
  { id: "P-14", item: "Copper water pipe", detail: "DN22 ↔ 22 mm Cu — equivalent, 940 m" },
  { id: "P-15", item: "LSZH power cable", detail: "3×2.5 mm², 2,600 m" },
  { id: "P-16", item: "Screed thickness", detail: "65 mm in spec and BOQ" },
  { id: "P-17", item: "Supplier tile price", detail: "Item matched to BOQ 5.03 — ₼21/m²" },
  { id: "P-18", item: "Supplier insulation price", detail: "Item matched to BOQ 4.12 — ₼7.20/m²" },
];

export type RevisionChangeType = "ADDED" | "CHANGED" | "REMOVED";
export interface RevisionChange {
  id: string;
  requirement: string;
  type: RevisionChangeType;
  previous: string;
  next: string;
  boq: string;
  boqUpdated: boolean;
  affectsBoq: boolean;
}

export const REVISION_CHANGES: RevisionChange[] = [
  { id: "C-07", requirement: "Porcelain flooring FF-02", type: "CHANGED", previous: "4,700 m²", next: "5,100 m²", boq: "4,700 m²", boqUpdated: false, affectsBoq: true },
  { id: "C-02", requirement: "Drainage pipe DN110", type: "CHANGED", previous: "1,240 m", next: "1,550 m", boq: "1,550 m", boqUpdated: true, affectsBoq: true },
  { id: "C-03", requirement: "Facade cladding panels", type: "CHANGED", previous: "6,100 m²", next: "6,320 m²", boq: "6,320 m²", boqUpdated: true, affectsBoq: true },
  { id: "C-05", requirement: "Fire doors EI60", type: "CHANGED", previous: "44 nr", next: "48 nr", boq: "48 nr", boqUpdated: true, affectsBoq: true },
  { id: "C-09", requirement: "Paint system — Level 3", type: "CHANGED", previous: "10,800 m²", next: "11,400 m²", boq: "11,400 m²", boqUpdated: true, affectsBoq: true },
  { id: "C-11", requirement: "EV charging points", type: "ADDED", previous: "—", next: "12 nr", boq: "12 nr", boqUpdated: true, affectsBoq: true },
  { id: "C-12", requirement: "Rooftop PV mounting rails", type: "ADDED", previous: "—", next: "420 m", boq: "420 m", boqUpdated: true, affectsBoq: true },
  { id: "C-14", requirement: "Signage lighting circuit", type: "ADDED", previous: "—", next: "1 lot", boq: "1 lot", boqUpdated: true, affectsBoq: true },
  { id: "C-15", requirement: "Decorative water feature", type: "REMOVED", previous: "1 lot", next: "—", boq: "—", boqUpdated: true, affectsBoq: false },
];

export interface BoqRow {
  item: string;
  description: string;
  specification: string;
  required: number | null; // null = required but quantity n/a
  boq: number | null; // null = missing
  unit: string;
  boqUnit?: string;
  unitPrice: number | null;
  specMismatch?: boolean;
}

export const BOQ_ROWS: BoqRow[] = [
  { item: "2.02", description: "Structural concrete", specification: "C30/37 (BOQ: B30)", required: 860, boq: 860, unit: "m³", unitPrice: 118, specMismatch: true },
  { item: "2.08", description: "Reinforcement B500C", specification: "B500C", required: 142, boq: 142, unit: "t", unitPrice: 1180 },
  { item: "2.11", description: "Secondary steelwork", specification: "S355 (BOQ: S275)", required: 38, boq: 38, unit: "t", unitPrice: 2150, specMismatch: true },
  { item: "3.09", description: "Waterproofing membrane", specification: "SBS 2-ply", required: 1850, boq: 1850, unit: "m²", boqUnit: "m", unitPrice: 14.5 },
  { item: "4.12", description: "Mineral wool insulation", specification: "150 mm (BOQ: 100 mm)", required: 4500, boq: 4500, unit: "m²", unitPrice: 7.2, specMismatch: true },
  { item: "4.20", description: "Plasterboard partitions", specification: "12.5 mm GKB", required: 3200, boq: 3200, unit: "m²", unitPrice: 16 },
  { item: "5.03", description: "Porcelain flooring", specification: "600×600 R10", required: 5100, boq: 4700, unit: "m²", unitPrice: 21 },
  { item: "5.10", description: "Suspended ceiling", specification: "Mineral fibre 600×600", required: 4980, boq: 4980, unit: "m²", unitPrice: 12.4 },
  { item: "6.04", description: "LSZH power cable", specification: "3×2.5 mm²", required: 2600, boq: 2600, unit: "m", unitPrice: 3.1 },
  { item: "6.—", description: "Fire-rated cable FE180", specification: "PH120, 3×2.5 mm²", required: 550, boq: null, unit: "m", unitPrice: 7 },
  { item: "7.08", description: "HDPE drainage pipe", specification: "DN110 SDR17", required: 1550, boq: 1550, unit: "m", unitPrice: 20 },
  { item: "8.01", description: "Fire doors EI60", specification: "EI60, 1000×2100", required: 48, boq: 48, unit: "nr", unitPrice: 640 },
];

export const AUDIT_HISTORY = [
  { id: "A-0142", project: "Baku Commercial Center", date: "2026-10-08", docs: 4, findings: 7, critical: 2, status: "Review Required" },
  { id: "A-0139", project: "Sumgait Logistics Hub", date: "2026-09-29", docs: 3, findings: 4, critical: 0, status: "Completed" },
  { id: "A-0131", project: "Ganja Residential Block C", date: "2026-09-14", docs: 5, findings: 11, critical: 3, status: "Completed" },
];
