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
- `upgradeRequired`
- `upgradeMessage`
- `upgradeCta`

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
  source: "text-layer" | "ocr" | "mixed";
  width: number;
  height: number;
  text: string;
  markdown: string;
  html: string;
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
  searchablePdfBase64: string;
  reflowedPdfBase64: string;
  html: string;
  md: string;
  txt: string;
  preview: string;
  pageStats: {
    textLayerPages: number;
    ocrPages: number;
    mixedPages: number;
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

The exact field names can change, but the response should preserve those semantics.

## Export Design

### Searchable PDF

Goal: preserve the original visual page appearance while adding a searchable and copyable text layer.

Behavior:

- render the original page visuals as the background for each processed page
- overlay extracted text and OCR text at matching page positions
- keep page dimensions identical to the source page where possible
- if exact positioning is imperfect, prioritize text searchability and stable copy behavior

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

### TXT

Keep a full-document text export as a fallback and preview source even if PDF marketing emphasizes HTML, Markdown, and PDF outputs.

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
