// Browser-only text extraction for tender documents (PDF, XLSX/XLS, DOCX).
// Libraries are dynamically imported so they never load during SSR.

const MAX_CHARS = 60000;

export const extractedTexts = new Map<string, string>();

async function pdfText(buf: ArrayBuffer): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  const out: string[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    out.push(`--- Page ${p} ---\n` + tc.items.map((i) => ("str" in i ? i.str : "")).join(" "));
  }
  return out.join("\n");
}

async function xlsxText(buf: ArrayBuffer): Promise<string> {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(buf, { type: "array" });
  return wb.SheetNames.map((n) => {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[n]!, { header: 1, blankrows: false });
    return `--- Sheet ${n} ---\n` + rows.map((r, i) => `Row ${i + 1}: ${(r as unknown[]).join(" | ")}`).join("\n");
  }).join("\n");
}

async function docxText(buf: ArrayBuffer): Promise<string> {
  const mammoth = await import("mammoth");
  const r = await mammoth.extractRawText({ arrayBuffer: buf });
  return r.value;
}

export async function extractText(file: File): Promise<string> {
  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  const buf = await file.arrayBuffer();
  let text = "";
  if (ext === "pdf") text = await pdfText(buf);
  else if (ext === "xlsx" || ext === "xls") text = await xlsxText(buf);
  else if (ext === "docx") text = await docxText(buf);
  text = text.replace(/[ \t]+/g, " ").trim();
  if (!text) throw new Error("No readable text found (scanned images are not supported yet).");
  return text.slice(0, MAX_CHARS);
}
