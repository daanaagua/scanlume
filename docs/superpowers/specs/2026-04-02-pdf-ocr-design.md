# PDF OCR Expansion Design

## Goal

Expand Scanlume from an image-only OCR product into a mixed image + PDF OCR product. Users should be able to upload image-based PDFs and mixed-content PDFs, extract text with layout-aware output, and download the result as searchable PDF, reflowed PDF, HTML, or Markdown while preserving the existing image OCR flow.

## Product Scope

### User-facing scope

- Keep one shared upload entry in the main OCR workspace.
- Route image files and PDF files through different backend pipelines.
- Add a dedicated PDF landing page similar to the existing intent pages such as `jpg-para-texto`.
- Support a single PDF per run in v1.
- Support mixed-content PDFs through a `text-layer first, OCR fallback` strategy.
- Export one complete HTML file and one complete Markdown file per PDF.
- Export two PDF variants:
  - searchable PDF with the original page visuals plus an OCR text layer
  - reflowed PDF generated from the recovered reading order

### Access and monetization scope

- Anonymous users can upload PDF files but only process and export the first 5 pages.
- Logged-in users can process up to 20 PDF pages for free per day.
- The logged-in free quota is cumulative across uploads, but v1 still processes one PDF per run.
- If a PDF exceeds the available page allowance, process only the allowed pages and return a monetization prompt for the locked remainder.
- Do not build the real recharge flow yet.
- Reserve a visible upgrade CTA and API fields that later billing work can attach to.

### Quota contract

- Anonymous users are request-scoped for PDF in v1: each request may process at most 5 pages, with no cross-request carry-over.
- Logged-in users are session-authenticated using the same cookie-backed viewer resolution that already powers the account and image OCR flows.
- Logged-in PDF usage resets by `todayKey()` in UTC, matching the current worker-side daily usage model.
- Logged-in PDF usage should be stored separately from image counts, either by extending `daily_user_usage` with `used_pdf_pages` or by adding a dedicated daily PDF usage table keyed by `user_id + date`.
- Preflight should compute `remainingPdfPagesToday` before work starts, but page debit should happen after processing finishes.
- To avoid concurrent overspend in v1, the worker should acquire a short-lived per-user PDF processing lock before starting a logged-in PDF job.
- If another PDF job is already active for the same logged-in user, the API should reject with `409` and code `pdf_job_in_progress`.
- A processed page counts against quota only when that page reaches `success` or `partial` status in the final response.
- Pages that fail before producing a usable page result do not consume PDF quota.
- Every successful PDF response should return `remainingPdfPagesToday`.
- For logged-in users, `remainingPdfPagesToday` means the actual daily pages left after this request finishes.
- For anonymous users, `remainingPdfPagesToday` must still be present for contract stability and should be interpreted as the remaining pages inside the fixed 5-page request allowance after this response. The frontend must treat it as request-local only and must not present it as a cross-request daily balance.

### Explicit non-goals for v1

- Multiple PDFs in a single processing run
- Real payments, credits purchase, invoicing, or entitlement mutations
- Async jobs, queues, or object storage-backed exports
- Pixel-perfect recovery for complex magazines, tables, floating annotations, or academic layouts
- Full document editor behavior inside the web UI

## Current State Summary

### Frontend

- `apps/web/components/ocr-workspace.tsx` only accepts `image/*` uploads.
- The workspace batches images, sends one `/v1/ocr` request per image, and previews `txt`, `md`, or `html` depending on mode.
- `apps/web/components/tool-landing.tsx` renders the shared OCR workspace across multiple SEO pages.

### Backend

- `apps/api/src/index.ts` exposes `POST /v1/ocr`.
- The current request schema in `apps/api/src/lib/schema.ts` accepts only image payloads.
- `runSimpleOcr()` and `runFormattedOcr()` work on one image data URL.
- Export shaping is currently limited to image OCR text and formatted block rendering via `apps/api/src/lib/formatters.ts`.

## Proposed Architecture

### High-level design

Keep one shared product workspace in the frontend, but split processing in the backend:

1. Frontend accepts both images and PDFs in one upload area.
2. Frontend detects document kind from the selected file MIME type.
3. Image uploads continue to use the existing image OCR API.
4. PDF uploads use a new dedicated PDF OCR API and PDF processing modules.
5. Both flows render inside the same workspace shell, but with file-type-specific controls and results.

This keeps the main product experience simple while preserving clean service boundaries.

### New backend pipeline

Add a dedicated PDF OCR route, such as `POST /v1/pdf/ocr`, plus PDF-specific helpers under `apps/api/src/lib/`.

Transport contract for v1:

- Upload should use `multipart/form-data`, not JSON base64, to avoid request bloat.
- The form should include the raw PDF file plus lightweight fields defined by the frozen upload contract below.
- PDF preflight limits for v1 should be explicit:
  - max file size: 15 MB
  - max pages accepted per document: 50
  - max pages actually processable in one run: 20
  - target synchronous processing budget: 30 seconds
- If the source PDF exceeds the accepted hard limits, reject it before OCR starts.
- `POST /v1/pdf/ocr` should return preview-ready document metadata plus text exports inline (`txt`, `md`, `html`), but it should not inline full PDF binaries.
- Downloading `searchable PDF` or `reflowed PDF` should use dedicated export endpoints that stream the generated file on demand from the original client-held PDF plus the normalized OCR result.
- `POST /v1/pdf/ocr` must also return a short-lived signed `exportToken` that binds the source PDF hash, allowed page range, page status summary, and normalized result hash.

Recommended download endpoints:

- `POST /v1/pdf/export/searchable`
- `POST /v1/pdf/export/reflowed`

The frontend should keep the original PDF `File` in memory after OCR completes so those export endpoints can be called without object storage or async job infrastructure.
The export endpoints should accept:

- the original PDF file
- an `exportManifest` payload needed for rendering
- the signed `exportToken`

The worker must verify that:

- the uploaded PDF hash matches the token
- the `exportManifest` hash matches the token
- only the allowed processed pages are rendered
- locked or tampered pages are rejected server-side

`exportManifest` contract for v1:

- It must use fixed field names and stable key order for hashing.
- It should contain only the fields needed for export generation:
  - `documentId`
  - `totalPages`
  - `processedPageNumbers`
  - `failedPageNumbers`
  - `pageLayouts` with page number, source, width, height, and ordered export blocks
  - `billingUpsell` summary when truncation occurred
- The hash should be calculated from a canonical JSON serialization with lexicographically sorted object keys and original array order preserved.
- The OCR response may still include richer UI fields, but the export endpoints should trust only the signed token plus canonical `exportManifest`.

Frozen PDF export multipart contract:

- multipart field `file`: the original PDF binary
- multipart field `exportToken`: plain text token string
- multipart field `exportManifest`: UTF-8 JSON string with `Content-Type: application/json`
- the worker should parse `exportManifest` JSON, canonicalize it with the frozen key-order rules, and verify the canonicalized hash against the token
- the worker must not trust raw client field ordering or whitespace; canonicalization happens server-side after parsing

Frozen PDF OCR upload request contract:

```ts
type PdfOcrUploadFields = {
  file: File; // multipart field name: file
  browserId: string; // multipart field name: browserId
  sourcePath?: string; // multipart field name: sourcePath
};
```

Rules:

- `file` is required and must be the exact multipart field name.
- `browserId` is required for both anonymous and logged-in viewers so the PDF flow stays aligned with the existing workspace identity contract.
- `sourcePath` is optional and carries the current page path, such as `/imagem-para-texto` or `/pdf-para-texto`, for analytics and future billing attribution.
- No extra mode field is needed because PDF uploads always follow the PDF pipeline.

Recommended module split:

- `pdf-schema.ts` or an expanded `schema.ts`
  - request and response schemas for PDF OCR
- `pdf-limits.ts`
  - page allowance rules for anonymous and logged-in users
- `pdf-ingest.ts`
  - PDF validation, metadata extraction, page counting, and page truncation decisions
- `pdf-segmentation.ts`
  - page classification and block ordering
- `pdf-export.ts`
  - HTML, Markdown, searchable PDF, and reflowed PDF generation
- `pdf-prompts.ts`
  - OCR prompts tuned for page or region OCR

The image OCR implementation stays intact and should not be overloaded with PDF-specific branches.

## Page and Entry Strategy

### Shared workspace

Upgrade `apps/web/components/ocr-workspace.tsx` into a document workspace that:

- accepts images and PDFs from the same upload zone
- rejects mixed batches containing both types in one run
- shows image-specific or PDF-specific helper text after file selection
- routes images to the existing image flow and PDFs to the new PDF flow

Pre-submit PDF messaging contract:

- Extend the existing `/v1/limits` response with a stable `pdf` object:

```ts
type PdfLimitSnapshot = {
  maxFileMb: number;
  maxPagesPerDocument: number;
  requestPageLimitAnonymous: number;
  dailyPageLimitLoggedIn: number;
  remainingPages: number;
};
```

- After file selection, the frontend should read the selected PDF page count locally.
- The workspace should combine local page count with `/v1/limits.pdf` to show:
  - whether the file is accepted
  - how many pages will be processed
  - whether truncation will happen
  - whether the upgrade CTA should be expected after processing
- No separate PDF preflight API is required in v1 as long as `/v1/limits.pdf` exists and `POST /v1/pdf/ocr` remains the final server-authoritative preflight.

### Dedicated PDF page

Add a dedicated route such as `apps/web/app/pdf-para-texto/page.tsx`.

That page should:

- reuse `ToolLanding`
- default the workspace messaging to PDF intent
- explain page limits and upgrade prompts
- target PDF OCR search intent the same way existing intent pages target JPG or PNG scenarios

### Shared marketing and product framing

Update site content definitions in `apps/web/lib/site.ts` and AI-readable route descriptions in `apps/web/lib/llms.ts` so the product clearly covers:

- image OCR
- PDF OCR
- searchable PDF output
- reflowed PDF output

## PDF Processing Flow

### Step 1: preflight and quota evaluation

When a PDF request arrives:

1. validate MIME type and file size
2. inspect page count
3. resolve viewer context and daily remaining PDF allowance
4. compute `processablePages`
5. if the allowance is smaller than the document length, truncate processing to the allowed prefix and mark the result as partially locked

Preflight result fields should include:

- `totalPages`
- `processablePages`
- `lockedPages`
- `truncated`
- `remainingPdfPagesToday`

Preflight should map directly into the final response using the frozen `billingUpsell` object described in the wire contract below. Do not introduce a second set of `upgrade*` field names.

If `processablePages` is `0`, the route should return `429` with a stable body shape such as:

```json
{
  "error": "No PDF pages remaining today.",
  "code": "pdf_page_limit_reached",
  "remainingPdfPagesToday": 0,
  "totalPages": 30,
  "processablePages": 0,
  "lockedPages": 30,
  "billingUpsell": {
    "required": true,
    "message": "Seu limite gratuito de paginas PDF acabou. Desbloqueie mais paginas quando a cobranca estiver ativa.",
    "ctaLabel": "Desbloquear mais paginas",
    "ctaHref": "/conta"
  }
}
```

Rule: if the worker can read document metadata, zero-quota errors must still return the real `totalPages` and `lockedPages` for the uploaded PDF. They must not be zeroed out.

### Step 2: page classification

For each page in the allowed range:

1. inspect whether the page has a usable text layer
2. inspect image objects and layout zones
3. classify the page as:
  - `text-layer`
  - `ocr`
  - `mixed`

### Step 3: region-aware extraction

The processing standard for mixed pages is region-based, not page-wide fallback.

For a mixed page such as:

- a few lines of text
- an image block
- a two-column lower section with one pure text column and one image-containing column

the pipeline should:

1. split the page into ordered layout regions
2. extract native text from text-bearing regions
3. OCR image-only regions
4. further subdivide mixed regions when needed
5. rebuild page reading order from region coordinates and layout heuristics

### Reading order rules

The v1 reading order should optimize for human-readable continuity, not exact publishing fidelity.

Recommended heuristics:

- top-to-bottom for full-width blocks
- left column top-to-bottom before right column top-to-bottom in clear two-column sections
- preserve full-width images or headings before lower column groups
- keep captions attached to the nearest associated image when detectable

If the layout is too ambiguous, prefer a stable deterministic order over aggressive inference.

## Intermediate Data Model

PDF OCR should normalize every processed page into a shared page structure before export.

Suggested response shape:

```ts
type PdfPageResult = {
  pageNumber: number;
  status: "success" | "partial" | "failed";
  source: "text-layer" | "ocr" | "mixed";
  width: number;
  height: number;
  text?: string;
  markdown?: string;
  html?: string;
  errorCode?: string;
  errorMessage?: string;
  blocks: Array<{
    id: string;
    kind: "heading" | "paragraph" | "image" | "caption" | "separator";
    order: number;
    text?: string;
    bbox?: { x: number; y: number; width: number; height: number };
    source: "text-layer" | "ocr";
  }>;
};

type PdfDocumentResult = {
  kind: "pdf";
  totalPages: number;
  processedPages: number;
  lockedPages: number;
  truncated: boolean;
  html: string;
  md: string;
  txt: string;
  previewHtml: string;
  remainingPdfPagesToday: number;
  exportToken: string;
  exportManifest: {
    documentId: string;
    totalPages: number;
    processedPageNumbers: number[];
    failedPageNumbers: number[];
    pageLayouts: Array<{
      pageNumber: number;
      source: "text-layer" | "ocr" | "mixed";
      width: number;
      height: number;
      blocks: Array<{
        id: string;
        kind: "heading" | "paragraph" | "image" | "caption" | "separator";
        order: number;
        text?: string;
        bbox?: { x: number; y: number; width: number; height: number };
        source: "text-layer" | "ocr";
      }>;
    }>;
    billingUpsell?: {
      required: boolean;
      message: string;
      ctaLabel: string;
      ctaHref: string;
    };
  };
  pageStats: {
    textLayerPages: number;
    ocrPages: number;
    mixedPages: number;
  };
  failedPages: Array<{
    pageNumber: number;
    errorCode: string;
    errorMessage: string;
  }>;
  exportSupport: {
    searchablePdf: boolean;
    reflowedPdf: boolean;
  };
  billingUpsell?: {
    required: boolean;
    message: string;
    ctaLabel: string;
    ctaHref: string;
  };
  pages: PdfPageResult[];
};
```

This is the frozen v1 wire contract for the OCR response. Frontend and backend should implement these field names as written.

For implementation alignment:

- `processedPages` in v1 means the number of pages with final status `success` or `partial`. It does not include `failed` pages and it does not include locked pages outside the processed prefix.
- `previewHtml` is the only preview field in the OCR response. It should contain sanitized HTML for the processed portion only and is the canonical source for the PDF result panel preview.
- The frontend should not guess between `html`, `txt`, or another field when rendering the preview panel; it should render `previewHtml` directly.

## Export Design

### Searchable PDF

Goal: preserve the original visual page appearance while adding a searchable and copyable text layer.

Behavior:

- `text-layer` page: pass through the original page content without adding a duplicate text layer
- `ocr` page: render the original page visuals as the background and add a hidden OCR text layer
- `mixed` page: preserve the original page content and add hidden OCR text only for image-only or OCR-derived regions, with overlap suppression against native text boxes
- keep page dimensions identical to the source page where possible
- if exact positioning is imperfect, prioritize text searchability and stable copy behavior over visual micro-alignment

### Reflowed PDF

Goal: create a cleaner reading document from recovered headings, paragraphs, and block order.

Behavior:

- generate a new document from normalized blocks
- preserve major document hierarchy and page boundaries where useful
- do not attempt exact visual recreation
- optimize for readability and downstream editing

### HTML and Markdown

Generate a single full-document HTML file and a single full-document Markdown file.

Recommended structure:

- top-level title derived from file name
- page separators such as `<!-- Page 3 -->` in HTML and `---` plus page labels in Markdown where needed
- ordered headings and paragraphs from the normalized block stream
- optional image placeholders only if they add value to comprehension
- if the document was truncated by quota, exports should contain only processed pages and append one closing note that the remaining pages were locked for upgrade

### TXT

Keep a full-document text export as a fallback and preview source even if PDF marketing emphasizes HTML, Markdown, and PDF outputs.

### Export delivery contract

- `POST /v1/pdf/ocr` returns metadata, page-level results, and inline text exports for preview.
- PDF file downloads are generated on demand by the export endpoints, not embedded in the OCR response.
- Export endpoints receive the original PDF file, the canonical `exportManifest` returned by the OCR response, and the signed `exportToken`.
- The token must be checked server-side before rendering any export so clients cannot unlock extra pages by mutating payload fields.
- If the OCR response is truncated, every export should cover only the processed prefix pages and include a trailing locked-pages note in text-based outputs.
- PDF exports should omit locked pages rather than inserting synthetic blank pages.
- Searchable PDF should keep failed pages as visual-only original pages with no added OCR text layer and should mark the document as degraded in export metadata.
- Reflowed PDF, HTML, Markdown, and TXT should exclude failed pages from generated text output and append a short note listing omitted page numbers.

Frozen export request contracts:

```ts
type PdfExportRequest = {
  file: File; // multipart field name: file
  exportToken: string; // multipart field name: exportToken
  exportManifest: PdfDocumentResult["exportManifest"]; // multipart field name: exportManifest as JSON string part
};

type PdfExportError = {
  ok: false;
  error: string;
  code:
    | "pdf_export_token_invalid"
    | "pdf_export_manifest_invalid"
    | "pdf_export_source_mismatch"
    | "pdf_export_generation_failed";
};
```

The export endpoints should stream the file body on success with these headers:

- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="<generated-name>.pdf"`

They should return `PdfExportError` JSON only on failure.

## Frontend Workspace Changes

### File selection and validation

Update the upload input so it accepts image files and PDFs.

Rules:

- a batch may contain only one document kind
- image batches can still contain multiple images
- PDF batches in v1 can contain only one PDF
- show immediate validation feedback when the selection breaks those rules

### Dynamic workspace messaging

When the selected file is a PDF, the workspace should reveal:

- page processing limits for the current viewer
- whether the result will be truncated
- available output types
- an upgrade prompt when pages are locked

When the selected file is an image, keep the current UX with minimal disruption.

### Result panel behavior for PDF

The result panel for PDFs should surface:

- document name
- total pages and processed pages
- truncated status if any
- page source summary (`text-layer`, `ocr`, `mixed`)
- download buttons for searchable PDF, reflowed PDF, HTML, and Markdown
- HTML or text preview for the processed portion
- monetization prompt for locked pages

## Limits and Billing Placeholder Design

### Anonymous rules

- can upload a PDF
- can process at most 5 pages from that document
- receives a partial result if the PDF is longer than 5 pages

### Logged-in rules

- gets 20 PDF pages per day for free
- allowance is cumulative across uploads
- a single run still accepts one PDF only

### Upgrade placeholder behavior

When a PDF exceeds the current allowance:

- do not hard-fail if some pages can still be processed
- complete the allowed prefix
- return a partial-success response with locked-page metadata
- show a clear CTA such as `Desbloquear mais paginas`
- point the CTA to a temporary placeholder path until real billing exists

## Error Handling

The PDF flow must support partial success and specific messaging.

Required categories:

- unsupported file type
- file too large
- invalid or unreadable PDF
- page count unavailable
- no remaining page allowance
- partially processed due to allowance
- PDF parsing failure on individual pages
- OCR failure on individual regions or pages
- export generation failure

The frontend should avoid collapsing all PDF failures into a single generic banner.

Failure contract:

- A document may still return `200` with `partial` document success when at least one page is usable.
- Failed pages must appear in `failedPages` and in the per-page `status` fields.
- `success` page: full text and block result available.
- `partial` page: some regions failed, but the page still contributes text and exportable output.
- `failed` page: the page does not debit quota; searchable PDF may keep the original visual page without OCR text, while text-based exports omit that page and document the omission. In `pages[]`, `failed` pages should omit `text`, `markdown`, and `html` rather than returning placeholder strings.
- Locked pages outside the processable prefix are represented only through document-level metadata such as `lockedPages`, not as page objects in `pages[]`.

Frozen v1 error/status matrix:

| Scenario | HTTP | Code | Body shape |
| --- | --- | --- | --- |
| another logged-in PDF job active | `409` | `pdf_job_in_progress` | top-level error JSON |
| no PDF pages remaining today | `429` | `pdf_page_limit_reached` | top-level error JSON |
| unsupported file type | `400` | `pdf_file_type_invalid` | top-level error JSON |
| file too large | `413` | `pdf_file_too_large` | top-level error JSON |
| unreadable or invalid PDF | `400` | `pdf_invalid` | top-level error JSON |
| page counting failed | `400` | `pdf_page_count_failed` | top-level error JSON |
| OCR route partial success | `200` | none | `PdfDocumentResult` with `failedPages` and/or `billingUpsell` |
| no usable output from any processable page | `502` | `pdf_processing_failed` | top-level error JSON |
| export token or manifest invalid | `400` | export-specific code | `PdfExportError` |
| export rendering failed | `502` | `pdf_export_generation_failed` | `PdfExportError` |

Top-level OCR error body for non-200 responses:

```ts
type PdfOcrError = {
  error: string;
  code:
    | "pdf_job_in_progress"
    | "pdf_page_limit_reached"
    | "pdf_file_type_invalid"
    | "pdf_file_too_large"
    | "pdf_invalid"
    | "pdf_page_count_failed"
    | "pdf_processing_failed";
  remainingPdfPagesToday: number;
  totalPages?: number;
  processablePages?: number;
  lockedPages?: number;
  billingUpsell?: {
    required: boolean;
    message: string;
    ctaLabel: string;
    ctaHref: string;
  };
};
```

## Testing Strategy

This work should follow TDD.

### Backend tests

- schema validation for PDF request payloads
- page allowance logic for anonymous and logged-in viewers
- truncation and locked-page metadata behavior
- mixed-page reading order heuristics
- export generation for searchable PDF and reflowed PDF metadata contracts

### Frontend tests

- workspace file-type detection and routing
- rejection of mixed image + PDF selections in one batch
- PDF-specific limit messaging
- partial-result upgrade prompt rendering
- correct download button visibility by document kind

### Sample validation set

Use at least these real fixture classes:

- native text PDF
- pure scanned/image PDF
- mixed-content PDF with text, image blocks, and two-column lower content
- PDF longer than anonymous allowance
- PDF longer than remaining logged-in allowance

## Rollout Notes

- Start with a synchronous request model for PDFs.
- Design response fields so async jobs and billing can be added later without breaking the client contract.
- Keep image OCR behavior stable while introducing PDF support.
- Update public copy so users understand the difference between image OCR and PDF OCR without learning internal implementation details.

## Acceptance Criteria

- Users can select either images or one PDF from the same upload entry.
- Images still use the current OCR flow without regression.
- PDFs use a dedicated backend route and pipeline.
- Anonymous users receive at most the first 5 processed pages.
- Logged-in users receive at most their remaining free-page allowance up to 20 cumulative pages per day.
- Mixed-content pages use text-layer extraction first and OCR only where needed.
- PDF output includes searchable PDF, reflowed PDF, HTML, and Markdown.
- The site exposes a dedicated PDF landing page that reuses the shared workspace.
- The UI shows a clear upgrade placeholder when pages are locked.
