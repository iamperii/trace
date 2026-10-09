<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Live AI audit: browser extracts text (pdfjs/xlsx/mammoth), server fn src/lib/analyze.functions.ts calls Lovable AI Gateway Responses with strict json_schema; output is re-validated by validateFindings — keeps keys server-side and AI output untrusted.
- Revision and BOQ views and report sections share category-filtered validated findings and the AuditComparisonTable; this keeps all displayed comparisons tied to the same live response without inventing full schedules or revision classifications.
- Production document category labels live in document-types.ts independently of synthetic test fixtures so UI imports never load the sample dataset.
