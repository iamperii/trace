export type DocCategory = "SPECIFICATION" | "BOQ" | "REVISION" | "SUPPLIER";

export const CATEGORY_LABEL: Record<DocCategory, string> = {
  SPECIFICATION: "Technical Specification",
  BOQ: "Bill of Quantities",
  REVISION: "Project Revision",
  SUPPLIER: "Supplier Price List",
};