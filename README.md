# TRACE

**Tender Review & Audit Consistency Engine**

TRACE reads a construction tender package — technical specification, bill of quantities (BOQ), revisions and supplier price lists — and reports the places where the documents disagree with each other. It does not approve a tender or replace the estimator: every finding comes with page/row evidence and is marked as needing human review.

---

## What it does

1. **Upload** — drag in PDF, XLSX, XLS or DOCX files. Each file is categorised (Specification, BOQ, Revision, Supplier Prices), guessed from the filename and changeable by hand.
2. **Read** — text and tables are extracted in the browser. Nothing is sent anywhere at this stage.
3. **Cross-check** — the extracted text goes to an AI model that returns only inconsistencies: specification vs BOQ mismatches, requirements missing from the BOQ, revision changes never applied, unit and quantity errors, commercial gaps.
4. **Review** — findings are grouped by severity (Critical, High, Medium, Low), each with the exact quoted evidence from both sides, a numeric comparison where one applies, an estimated cost impact, and a recommended action. A reviewer confirms, investigates or dismisses each one.
5. **Report** — a print-ready audit report summarising the outcome and the reviewer's decisions.

Every audit is added to the History page with its project name, date, document count, finding count and critical count.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | TanStack Start v1 (React 19, SSR/SSG, Vite 8) |
| Routing | TanStack Router, file-based (`src/routes`) |
| Data fetching | TanStack Query |
| Styling | Tailwind CSS v4 (theme tokens in `src/styles.css`) + shadcn/ui primitives |
| Validation | Zod |
| Document parsing | pdfjs-dist (PDF), SheetJS `xlsx` (Excel), mammoth (DOCX) |
| AI | Lovable AI Gateway — Responses API with a strict `json_schema` output format |
| Tests | Vitest + Testing Library |

---

## Getting started

```sh
npm install
npm run dev
```

Vite prints the local URL when it starts (by default `http://localhost:5173`). Open **New Audit**, add at least one readable document, and press **Run AI Audit**.

### Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run the test suite once |
| `npm run test:watch` | Tests in watch mode |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

Typecheck with `npx tsc --noEmit`.

---

## How the AI audit works

The pipeline is split so that no API key ever reaches the browser and no arithmetic is ever done by the model.

```
browser                          server
───────                          ──────
file  ──► extract.ts             analyze.functions.ts
          pdfjs / xlsx / mammoth   createServerFn("POST")
          text per document          │
          (max 60 000 chars)         ├─► reads LOVABLE_API_KEY from process.env
                │                    ├─► POST https://ai.gateway.lovable.dev/v1/responses
                └── docs[] ─────────►│     model: openai/gpt-6-astra, stream: true
                                     │     text.format: json_schema (strict)
                                     │
                                     ├─► maps raw output to the Finding shape
                                     └─► validateFindings() → findings, rejected, passed
```

**Guarantees this gives:**

- **Keys stay server-side.** `LOVABLE_API_KEY` is read from `process.env` inside the server function only; the browser never sees it.
- **AI output is untrusted.** The response must satisfy a strict JSON schema, and every finding is re-parsed with `FindingSchema` before it is displayed. Anything malformed is dropped and counted as `rejected` (surfaced as a toast, never silently).
- **Forbidden claims are filtered.** `BANNED` regexes in `src/lib/audit-engine.ts` reject findings that state the tender is approved, compliant, legally valid or should be selected.
- **Math is deterministic.** Differences, percentages and cost impacts are computed by plain TypeScript (`numericDifference`, `costImpact`, `totalCostImpact`, `boqRowDiff`), never asked of the model.
- **Human decides.** Every finding carries `requiresHumanReview: true`, a `confidence` estimate (0–1), and a recommended action.

The system prompt is in `src/lib/analyze.functions.ts` (`SYSTEM`). It requires exact quoted evidence, real page (PDF) or row (Excel) numbers, the `docId` values exactly as given, and forbids inventing data that is not in the documents.

---

## Project layout

```
src/
├─ routes/
│  ├─ __root.tsx            app shell, toaster, document head
│  ├─ index.tsx             landing page
│  ├─ _app.tsx              authenticated-style layout (sidebar shell)
│  └─ _app/
│     ├─ new-audit.tsx      upload, categorise, run
│     ├─ processing.tsx     8-step progress + the live AI call
│     ├─ overview.tsx       dashboard summary
│     ├─ results.tsx        findings summary and list
│     ├─ findings.tsx       review workspace
│     ├─ revisions.tsx      revision impact table
│     ├─ boq.tsx            BOQ comparison table
│     ├─ documents.tsx      document register
│     ├─ report.tsx         print-ready report
│     ├─ history.tsx        past audits
│     └─ settings.tsx       analysis mode, reset
├─ components/tg/           AppShell, badges, FindingsWorkspace, FindingDrawer
└─ lib/
   ├─ extract.ts            browser-only PDF/Excel/Word text extraction
   ├─ analyze.functions.ts  server function: AI Gateway call + output mapping
   ├─ audit-engine.ts       Finding schema, validation, deterministic math
   ├─ audit-store.tsx       React context + localStorage persistence
   ├─ demo-data.ts          synthetic dataset, labels, sample rows
   └─ meta.ts               per-route <head> metadata
```

`src/routeTree.gen.ts` is generated by the router plugin — never edit it by hand.

---

## Configuration & secrets

**`LOVABLE_API_KEY`** is a managed project secret, stored encrypted in Lovable's secret store and visible as *configured* under Project Settings → **Secrets**. It cannot be read from the code or the browser, and it is billed against the workspace's existing AI credits (the first credits each month are included in the plan). Per-request usage is visible in the project's **AI** tab.

Deploying outside Lovable (for example to Vercel) means the managed key is not available there — you would create your own provider key, add it as an environment variable on that host, and point `callGateway()` in `src/lib/analyze.functions.ts` at that provider.

There is no database in this project. Uploaded files, review decisions and audit history persist in the browser under the localStorage key `tenderguard-state-v2`, so clearing site data resets the workspace.

---

## Current limitations

- **Scanned PDFs are not supported.** Image-only pages contain no text layer, so extraction fails with a clear message rather than guessing.
- **Document size** is capped at 60 000 characters per file, and at most 8 documents per audit.
- **Revision Impact and BOQ Comparison** still show synthetic sample rows from `src/lib/demo-data.ts`; the live AI pass does not produce that structured table data yet.
- **History and review decisions are per-browser.** No server-side storage, so nothing carries across devices.
- File categories are guessed from filenames; check the category dropdown before running.

---

## Testing

```sh
npm test
```

- `src/test/audit-engine.test.ts` — schema validation, the banned-claim filter, and the deterministic arithmetic (differences, percentages, cost impact, BOQ row risk).
- `src/test/app-routing.test.tsx` — route tree and page rendering.

Add a test next to these whenever you change a rule the reviewer depends on — severity thresholds, cost basis, or what the AI is allowed to claim.
# TRACE

**Tender Review & Audit Consistency Engine**

TRACE reads a construction tender package — technical specification, bill of quantities (BOQ), revisions and supplier price lists — and reports the places where the documents disagree with each other. It does not approve a tender or replace the estimator: every finding comes with page/row evidence and is marked as needing human review.

---

## What it does

1. **Upload** — drag in PDF, XLSX, XLS or DOCX files. Each file is categorised (Specification, BOQ, Revision, Supplier Prices), guessed from the filename and changeable by hand.
2. **Read** — text and tables are extracted in the browser. Nothing is sent anywhere at this stage.
3. **Cross-check** — the extracted text goes to an AI model that returns only inconsistencies: specification vs BOQ mismatches, requirements missing from the BOQ, revision changes never applied, unit and quantity errors, commercial gaps.
4. **Review** — findings are grouped by severity (Critical, High, Medium, Low), each with the exact quoted evidence from both sides, a numeric comparison where one applies, an estimated cost impact, and a recommended action. A reviewer confirms, investigates or dismisses each one.
5. **Report** — a print-ready audit report summarising the outcome and the reviewer's decisions.

Every audit is added to the History page with its project name, date, document count, finding count and critical count.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | TanStack Start v1 (React 19, SSR/SSG, Vite 8) |
| Routing | TanStack Router, file-based (`src/routes`) |
| Data fetching | TanStack Query |
| Styling | Tailwind CSS v4 (theme tokens in `src/styles.css`) + shadcn/ui primitives |
| Validation | Zod |
| Document parsing | pdfjs-dist (PDF), SheetJS `xlsx` (Excel), mammoth (DOCX) |
| AI | Lovable AI Gateway — Responses API with a strict `json_schema` output format |
| Tests | Vitest + Testing Library |

---

## Getting started

```sh
npm install
npm run dev
```

Vite prints the local URL when it starts (by default `http://localhost:5173`). Open **New Audit**, add at least one readable document, and press **Run AI Audit**.

### Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run the test suite once |
| `npm run test:watch` | Tests in watch mode |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

Typecheck with `npx tsc --noEmit`.

---

## How the AI audit works

The pipeline is split so that no API key ever reaches the browser and no arithmetic is ever done by the model.

```
browser                          server
───────                          ──────
file  ──► extract.ts             analyze.functions.ts
          pdfjs / xlsx / mammoth   createServerFn("POST")
          text per document          │
          (max 60 000 chars)         ├─► reads LOVABLE_API_KEY from process.env
                │                    ├─► POST https://ai.gateway.lovable.dev/v1/responses
                └── docs[] ─────────►│     model: openai/gpt-6-astra, stream: true
                                     │     text.format: json_schema (strict)
                                     │
                                     ├─► maps raw output to the Finding shape
                                     └─► validateFindings() → findings, rejected, passed
```

**Guarantees this gives:**

- **Keys stay server-side.** `LOVABLE_API_KEY` is read from `process.env` inside the server function only; the browser never sees it.
- **AI output is untrusted.** The response must satisfy a strict JSON schema, and every finding is re-parsed with `FindingSchema` before it is displayed. Anything malformed is dropped and counted as `rejected` (surfaced as a toast, never silently).
- **Forbidden claims are filtered.** `BANNED` regexes in `src/lib/audit-engine.ts` reject findings that state the tender is approved, compliant, legally valid or should be selected.
- **Math is deterministic.** Differences, percentages and cost impacts are computed by plain TypeScript (`numericDifference`, `costImpact`, `totalCostImpact`, `boqRowDiff`), never asked of the model.
- **Human decides.** Every finding carries `requiresHumanReview: true`, a `confidence` estimate (0–1), and a recommended action.

The system prompt is in `src/lib/analyze.functions.ts` (`SYSTEM`). It requires exact quoted evidence, real page (PDF) or row (Excel) numbers, the `docId` values exactly as given, and forbids inventing data that is not in the documents.

---

## Project layout

```
src/
├─ routes/
│  ├─ __root.tsx            app shell, toaster, document head
│  ├─ index.tsx             landing page
│  ├─ _app.tsx              authenticated-style layout (sidebar shell)
│  └─ _app/
│     ├─ new-audit.tsx      upload, categorise, run
│     ├─ processing.tsx     8-step progress + the live AI call
│     ├─ overview.tsx       dashboard summary
│     ├─ results.tsx        findings summary and list
│     ├─ findings.tsx       review workspace
│     ├─ revisions.tsx      revision impact table
│     ├─ boq.tsx            BOQ comparison table
│     ├─ documents.tsx      document register
│     ├─ report.tsx         print-ready report
│     ├─ history.tsx        past audits
│     └─ settings.tsx       analysis mode, reset
├─ components/tg/           AppShell, badges, FindingsWorkspace, FindingDrawer
└─ lib/
   ├─ extract.ts            browser-only PDF/Excel/Word text extraction
   ├─ analyze.functions.ts  server function: AI Gateway call + output mapping
   ├─ audit-engine.ts       Finding schema, validation, deterministic math
   ├─ audit-store.tsx       React context + localStorage persistence
   ├─ demo-data.ts          synthetic dataset, labels, sample rows
   └─ meta.ts               per-route <head> metadata
```

`src/routeTree.gen.ts` is generated by the router plugin — never edit it by hand.

---

## Configuration & secrets

**`LOVABLE_API_KEY`** is a managed project secret, stored encrypted in Lovable's secret store and visible as *configured* under Project Settings → **Secrets**. It cannot be read from the code or the browser, and it is billed against the workspace's existing AI credits (the first credits each month are included in the plan). Per-request usage is visible in the project's **AI** tab.

Deploying outside Lovable (for example to Vercel) means the managed key is not available there — you would create your own provider key, add it as an environment variable on that host, and point `callGateway()` in `src/lib/analyze.functions.ts` at that provider.

There is no database in this project. Uploaded files, review decisions and audit history persist in the browser under the localStorage key `tenderguard-state-v2`, so clearing site data resets the workspace.

---

## Current limitations

- **Scanned PDFs are not supported.** Image-only pages contain no text layer, so extraction fails with a clear message rather than guessing.
- **Document size** is capped at 60 000 characters per file, and at most 8 documents per audit.
- **Revision Impact and BOQ Comparison** still show synthetic sample rows from `src/lib/demo-data.ts`; the live AI pass does not produce that structured table data yet.
- **History and review decisions are per-browser.** No server-side storage, so nothing carries across devices.
- File categories are guessed from filenames; check the category dropdown before running.

---

## Testing

```sh
npm test
```

- `src/test/audit-engine.test.ts` — schema validation, the banned-claim filter, and the deterministic arithmetic (differences, percentages, cost impact, BOQ row risk).
- `src/test/app-routing.test.tsx` — route tree and page rendering.

Add a test next to these whenever you change a rule the reviewer depends on — severity thresholds, cost basis, or what the AI is allowed to claim.
