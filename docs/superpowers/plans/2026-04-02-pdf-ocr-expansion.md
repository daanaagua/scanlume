# PDF OCR Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a unified image/PDF upload flow that introduces a dedicated PDF OCR pipeline, PDF-specific limits and upsell messaging, searchable/reflowed PDF exports, and a new `/pdf-para-texto` landing page without regressing the existing image OCR flow.

**Architecture:** Keep one shared upload workspace in `apps/web`, but route files by type: images continue through the existing `/v1/ocr` JSON API, while PDFs use a browser-assisted multipart `/v1/pdf/ocr` contract and separate PDF export endpoints. In v1, the browser renders PDF pages and mixed-page OCR crops with `pdfjs-dist`, sends normalized page inputs to the Worker for OCR orchestration and quota enforcement, and then uses the frozen export contract so the Worker can generate searchable/reflowed PDFs; later, a `server_pdf_pipeline` executor can replace the browser renderer without changing the public contract.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Hono on Cloudflare Workers, D1/KV, `pdf-lib`, `pdfjs-dist`, `vitest`, `@testing-library/react`, `@testing-library/user-event`, `jsdom`

---

## File Structure

- Modify: `package.json` - add root `test`, `test:web`, and `test:api` scripts so verification can run from the repo root.
- Modify: `apps/api/package.json` - add PDF/test dependencies and `vitest` scripts for Worker-side unit tests.
- Modify: `apps/api/wrangler.jsonc` - add PDF-specific env vars such as page caps and the export-signing secret placeholder.
- Modify: `apps/web/package.json` - add PDF/test dependencies and `vitest` scripts for React/client tests.
- Modify: `pnpm-lock.yaml` - dependency lockfile update after adding the new packages.
- Create: `apps/api/vitest.config.ts` - API test runner config.
- Create: `apps/web/vitest.config.ts` - web test runner config.
- Create: `apps/web/test/setup.ts` - DOM matchers and browser API shims for workspace tests.
- Create: `apps/api/migrations/0008_pdf_usage.sql` - persist logged-in PDF usage separately from image counters.
- Modify: `apps/api/src/lib/store.ts` - add PDF quota state readers/writers and any processing-lock storage helpers.
- Create: `apps/api/src/lib/pdf-schema.ts` - frozen request/response types and `zod` schemas for PDF OCR/export.
- Create: `apps/api/src/lib/pdf-limits.ts` - page allowance logic, zero-quota error helpers, and `billingUpsell` shaping.
- Create: `apps/api/src/lib/pdf-ingest.ts` - multipart PDF validation, page counting, preflight metadata, and source hash helpers.
- Create: `apps/api/src/lib/pdf-segmentation.ts` - page status normalization and reading-order helpers for `text-layer`/`ocr`/`mixed` pages.
- Create: `apps/api/src/lib/pdf-prompts.ts` - PDF page/region OCR prompt builders aligned with the approved region pipeline.
- Create: `apps/api/src/lib/pdf-ocr.ts` - document-level OCR orchestration that builds `html`, `md`, `txt`, `previewHtml`, `pageStats`, `failedPages`, and `exportManifest`.
- Create: `apps/api/src/lib/pdf-export.ts` - signed export token helpers plus searchable/reflowed PDF generation entry points.
- Create: `apps/api/src/lib/__fixtures__/pdf/native-text.pdf` - native-text validation sample.
- Create: `apps/api/src/lib/__fixtures__/pdf/scanned-image.pdf` - image-only OCR validation sample.
- Create: `apps/api/src/lib/__fixtures__/pdf/mixed-two-column.pdf` - mixed page ordering validation sample.
- Create: `apps/api/src/lib/__fixtures__/pdf/anon-over-limit.pdf` - >5 page anonymous truncation sample.
- Create: `apps/api/src/lib/__fixtures__/pdf/logged-in-over-remaining.pdf` - over-remaining logged-in allowance sample.
- Modify: `apps/api/src/index.ts` - extend `/v1/limits`, add `/v1/pdf/ocr`, `/v1/pdf/export/searchable`, `/v1/pdf/export/reflowed`.
- Create: `apps/api/src/lib/__tests__/pdf-schema.test.ts` - request/response contract coverage.
- Create: `apps/api/src/lib/__tests__/pdf-limits.test.ts` - quota and upsell coverage.
- Create: `apps/api/src/lib/__tests__/pdf-segmentation.test.ts` - mixed-page ordering and failed-page behavior.
- Create: `apps/api/src/lib/__tests__/pdf-ocr.test.ts` - document assembly, error-matrix, and page-status coverage.
- Create: `apps/api/src/lib/__tests__/pdf-export.test.ts` - token validation and export manifest coverage.
- Create: `apps/web/lib/pdf-client.ts` - local page counting, request building, and PDF upload helpers.
- Create: `apps/web/lib/pdf-renderer.ts` - browser-side page rasterization and mixed-region cropping helpers for v1 PDF OCR.
- Modify: `apps/web/lib/downloads.ts` - keep image downloads working and add PDF export request helpers.
- Modify: `apps/web/components/ocr-workspace.tsx` - unified upload UX, PDF-specific validation, result handling, and PDF export buttons.
- Modify: `apps/web/components/tool-landing.tsx` - expose PDF-aware workspace copy hooks.
- Modify: `apps/web/lib/site.ts` - add the `pdf-para-texto` page definition and PDF wording in primary routes.
- Modify: `apps/web/lib/llms.ts` - include PDF OCR/product coverage in AI-readable route summaries.
- Create: `apps/web/app/pdf-para-texto/page.tsx` - dedicated SEO/product page for PDF OCR.
- Create: `apps/web/components/__tests__/ocr-workspace.test.tsx` - file-type routing and PDF UI coverage.
- Create: `apps/web/lib/__tests__/pdf-client.test.ts` - local page counting + request builder coverage.

## Task 1: Establish the test harness and dependency scaffold

**Files:**
- Modify: `package.json`
- Modify: `apps/api/package.json`
- Modify: `apps/web/package.json`
- Modify: `pnpm-lock.yaml`
- Create: `apps/api/vitest.config.ts`
- Create: `apps/web/vitest.config.ts`
- Create: `apps/web/test/setup.ts`
- Test: `apps/api/src/lib/__tests__/pdf-schema.test.ts`
- Test: `apps/web/components/__tests__/ocr-workspace.test.tsx`

- [ ] **Step 1: Write the first failing API contract test**

```ts
import { describe, expect, it } from "vitest";

describe("pdf OCR contract", () => {
  it("rejects requests without the required multipart metadata fields", async () => {
    const { pdfOcrUploadSchema } = await import("../pdf-schema");

    const parsed = pdfOcrUploadSchema.safeParse({ file: undefined, browserId: "" });

    expect(parsed.success).toBe(false);
  });
});
```

- [ ] **Step 2: Write the first failing workspace test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OcrWorkspace } from "@/components/ocr-workspace";

describe("OcrWorkspace", () => {
  it("shows a PDF-specific queue summary after selecting a PDF", () => {
    render(<OcrWorkspace defaultMode="simple" priorityLayout />);

    expect(screen.queryByText(/paginas/i)).not.toBeNull();
  });
});
```

- [ ] **Step 3: Run the tests to verify the harness is missing/failing**

Run: `pnpm --dir apps/api exec vitest run src/lib/__tests__/pdf-schema.test.ts && pnpm --dir apps/web exec vitest run components/__tests__/ocr-workspace.test.tsx`

Expected: FAIL because `vitest` config/scripts/dependencies do not exist yet, or imports like `pdf-schema` are unresolved.

- [ ] **Step 4: Add the minimal test/runtime scaffolding**

```ts
// apps/api/vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
```

```ts
// apps/web/vitest.config.ts
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    include: ["components/**/*.test.tsx", "lib/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

- [ ] **Step 5: Add package scripts and dependencies**

```json
{
  "scripts": {
    "test": "pnpm test:web && pnpm test:api",
    "test:web": "pnpm --dir apps/web test",
    "test:api": "pnpm --dir apps/api test"
  }
}
```

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 6: Install dependencies and update the lockfile**

Run: `pnpm install`

Expected: PASS with updated `pnpm-lock.yaml` containing `vitest`, Testing Library packages, `jsdom`, `pdf-lib`, and `pdfjs-dist`.

- [ ] **Step 7: Re-run the two failing tests**

Run: `pnpm --dir apps/api test src/lib/__tests__/pdf-schema.test.ts && pnpm --dir apps/web test components/__tests__/ocr-workspace.test.tsx`

Expected: FAIL for the intended missing feature reasons, not because the test runner is unavailable.

- [ ] **Step 8: Commit the scaffold**

```bash
git add package.json apps/api/package.json apps/web/package.json pnpm-lock.yaml apps/api/vitest.config.ts apps/web/vitest.config.ts apps/web/test/setup.ts apps/api/src/lib/__tests__/pdf-schema.test.ts apps/web/components/__tests__/ocr-workspace.test.tsx
git commit -m "test: scaffold PDF OCR test harness"
```

## Task 2: Add PDF quota storage and frozen API contracts

**Files:**
- Create: `apps/api/migrations/0008_pdf_usage.sql`
- Modify: `apps/api/src/lib/store.ts`
- Modify: `apps/api/wrangler.jsonc`
- Create: `apps/api/src/lib/pdf-schema.ts`
- Create: `apps/api/src/lib/pdf-limits.ts`
- Modify: `apps/api/src/index.ts`
- Test: `apps/api/src/lib/__tests__/pdf-schema.test.ts`
- Test: `apps/api/src/lib/__tests__/pdf-limits.test.ts`

- [ ] **Step 1: Write the failing quota contract test**

```ts
import { describe, expect, it } from "vitest";

describe("pdfOcrUploadSchema", () => {
  it("requires the multipart file field together with browserId", async () => {
    const { pdfOcrUploadSchema } = await import("../pdf-schema");

    const parsed = pdfOcrUploadSchema.safeParse({
      file: undefined,
      browserId: "browser-123",
    });

    expect(parsed.success).toBe(false);
  });
});
```

- [ ] **Step 2: Write the failing concurrency-lock test**

```ts
import { describe, expect, it } from "vitest";

import { acquirePdfProcessingLock } from "../pdf-limits";

describe("acquirePdfProcessingLock", () => {
  it("rejects a second active job for the same logged-in user", async () => {
    const key = "user-123";

    await expect(acquirePdfProcessingLock({ lockKey: key })).resolves.toBeTruthy();
    await expect(acquirePdfProcessingLock({ lockKey: key })).rejects.toMatchObject({
      status: 409,
      code: "pdf_job_in_progress",
    });
  });
});
```

- [ ] **Step 3: Write the failing post-processing debit test**

```ts
import { describe, expect, it } from "vitest";

import { countBillablePdfPages } from "../pdf-limits";

describe("countBillablePdfPages", () => {
  it("counts only success and partial pages", () => {
    expect(
      countBillablePdfPages([
        { status: "success" },
        { status: "partial" },
        { status: "failed" },
      ]),
    ).toBe(2);
  });
});
```

- [ ] **Step 4: Write the failing limits-route contract test**

```ts
import { describe, expect, it } from "vitest";

import { buildPdfAllowance } from "../pdf-limits";

describe("buildPdfAllowance", () => {
  it("returns real metadata and upsell details when logged-in quota is zero", () => {
    const result = buildPdfAllowance({
      viewerType: "user",
      totalPages: 30,
      remainingPdfPagesToday: 0,
    });

    expect(result).toMatchObject({
      processablePages: 0,
      lockedPages: 30,
      billingUpsell: {
        required: true,
        ctaHref: "/conta",
      },
    });
  });
});
```


```ts
import { describe, expect, it } from "vitest";

describe("pdf limits snapshot", () => {
  it("exposes the stable pdf object expected by the web workspace", async () => {
    const { pdfLimitSnapshotSchema } = await import("../pdf-schema");

    expect(
      pdfLimitSnapshotSchema.parse({
        maxFileMb: 15,
        maxPagesPerDocument: 50,
        requestPageLimitAnonymous: 5,
        dailyPageLimitLoggedIn: 20,
        remainingPages: 12,
      }),
    ).toBeTruthy();
  });
});
```

- [ ] **Step 5: Run the API tests to verify they fail for missing PDF helpers**

Run: `pnpm --dir apps/api test src/lib/__tests__/pdf-schema.test.ts src/lib/__tests__/pdf-limits.test.ts`

Expected: FAIL with missing module or missing export errors for `pdf-schema` / `pdf-limits`.

- [ ] **Step 6: Add the D1/KV quota storage primitives and env knobs**

```sql
CREATE TABLE IF NOT EXISTS daily_pdf_usage (
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  used_pages INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, date)
);
```

```ts
export async function readUserDailyPdfUsage(env: WorkerEnv, userId: string, date: string) {
  // return { usedPages: 0 } fallback when no row exists
}

export async function writeUserDailyPdfUsage(env: WorkerEnv, userId: string, date: string, usedPages: number) {
  // persist post-run billable pages only
}
```

```jsonc
// apps/api/wrangler.jsonc
"vars": {
  "PDF_MAX_FILE_MB": "15",
  "PDF_MAX_PAGES_PER_DOCUMENT": "50",
  "PDF_DAILY_PAGE_LIMIT_LOGGED_IN": "20",
  "PDF_EXPORT_SIGNING_SECRET": "set-in-cloudflare-secret"
}
```

- [ ] **Step 7: Freeze the request/response schemas, lock helpers, and quota math**

```ts
export const pdfOcrUploadSchema = z.object({
  file: z.instanceof(File),
  browserId: z.string().min(8),
  sourcePath: z.string().trim().min(1).max(300).optional(),
  preparedPages: z.array(
    z.object({
      pageNumber: z.number().int().positive(),
      source: z.enum(["text-layer", "ocr", "mixed"]),
      pagePngBase64: z.string().optional(),
      nativeTextBlocks: z.array(z.object({ text: z.string(), bbox: z.object({ x: z.number(), y: z.number(), width: z.number(), height: z.number() }) })),
      ocrRegions: z.array(z.object({ id: z.string(), bbox: z.object({ x: z.number(), y: z.number(), width: z.number(), height: z.number() }), imageBase64: z.string() })),
    }),
  ),
});

export const billingUpsellSchema = z.object({
  required: z.boolean(),
  message: z.string(),
  ctaLabel: z.string(),
  ctaHref: z.string(),
});
```

```ts
export function buildPdfAllowance(input: { viewerType: "anonymous" | "user"; totalPages: number; remainingPdfPagesToday: number }) {
  const processablePages = Math.min(input.totalPages, Math.max(input.remainingPdfPagesToday, 0));
  return {
    totalPages: input.totalPages,
    processablePages,
    lockedPages: input.totalPages - processablePages,
    truncated: processablePages < input.totalPages,
    billingUpsell: processablePages < input.totalPages ? defaultPdfUpsell() : undefined,
  };
}

export function countBillablePdfPages(pages: Array<{ status: "success" | "partial" | "failed" }>) {
  return pages.filter((page) => page.status === "success" || page.status === "partial").length;
}
```

```ts
export async function acquirePdfProcessingLock(input: { lockKey: string }) {
  // use KV with short TTL and throw PdfOcrHttpError(409, "pdf_job_in_progress", ...)
}
```

- [ ] **Step 8: Extend `/v1/limits` with the PDF snapshot and stable remaining semantics**

```ts
pdf: {
  maxFileMb: 15,
  maxPagesPerDocument: 50,
  requestPageLimitAnonymous: 5,
  dailyPageLimitLoggedIn: 20,
  remainingPages: viewer.type === "user" ? remainingPdfPagesToday : 5,
}
```

- [ ] **Step 9: Re-run the API tests**

Run: `pnpm --dir apps/api test src/lib/__tests__/pdf-schema.test.ts src/lib/__tests__/pdf-limits.test.ts`

Expected: PASS.

- [ ] **Step 10: Commit the quota and schema layer**

```bash
git add apps/api/migrations/0008_pdf_usage.sql apps/api/src/lib/store.ts apps/api/wrangler.jsonc apps/api/src/lib/pdf-schema.ts apps/api/src/lib/pdf-limits.ts apps/api/src/index.ts apps/api/src/lib/__tests__/pdf-schema.test.ts apps/api/src/lib/__tests__/pdf-limits.test.ts
git commit -m "feat: add PDF quota and API contracts"
```

## Task 3: Build the core PDF OCR pipeline and document assembly

**Files:**
- Create: `apps/api/src/lib/pdf-ingest.ts`
- Create: `apps/api/src/lib/pdf-segmentation.ts`
- Create: `apps/api/src/lib/pdf-prompts.ts`
- Create: `apps/api/src/lib/pdf-ocr.ts`
- Modify: `apps/api/src/index.ts`
- Create: `apps/web/lib/pdf-renderer.ts`
- Create: `apps/api/src/lib/__fixtures__/pdf/native-text.pdf`
- Create: `apps/api/src/lib/__fixtures__/pdf/scanned-image.pdf`
- Create: `apps/api/src/lib/__fixtures__/pdf/mixed-two-column.pdf`
- Create: `apps/api/src/lib/__fixtures__/pdf/anon-over-limit.pdf`
- Create: `apps/api/src/lib/__fixtures__/pdf/logged-in-over-remaining.pdf`
- Test: `apps/api/src/lib/__tests__/pdf-segmentation.test.ts`
- Test: `apps/api/src/lib/__tests__/pdf-ocr.test.ts`

- [ ] **Step 1: Write the failing mixed-page ordering test**

```ts
import { describe, expect, it } from "vitest";

import { orderRegionsForReading } from "../pdf-segmentation";

describe("orderRegionsForReading", () => {
  it("keeps full-width content before lower two-column content", () => {
    const ordered = orderRegionsForReading([
      { id: "left", top: 400, left: 0, width: 250, lane: "left" },
      { id: "hero-image", top: 180, left: 0, width: 520, lane: "full" },
      { id: "intro", top: 40, left: 0, width: 520, lane: "full" },
      { id: "right", top: 400, left: 270, width: 250, lane: "right" },
    ]);

    expect(ordered.map((item) => item.id)).toEqual(["intro", "hero-image", "left", "right"]);
  });
});
```

- [ ] **Step 2: Write the failing normalized-page-result test**

```ts
import { describe, expect, it } from "vitest";

import { buildPdfPageResult } from "../pdf-segmentation";

describe("buildPdfPageResult", () => {
  it("omits text fields for failed pages", () => {
    const page = buildPdfPageResult({ pageNumber: 4, status: "failed", source: "ocr" });

    expect(page.text).toBeUndefined();
    expect(page.errorCode).toBeDefined();
  });
});
```

- [ ] **Step 3: Write the failing ingest error-matrix test**

```ts
import { describe, expect, it } from "vitest";

import { inspectPdfFile } from "../pdf-ingest";

describe("inspectPdfFile", () => {
  it("rejects non-PDF uploads and files over the hard page cap before OCR begins", async () => {
    await expect(
      inspectPdfFile({ file: new File(["hi"], "demo.txt", { type: "text/plain" }), maxFileMb: 15, maxPagesPerDocument: 50 }),
    ).rejects.toMatchObject({ code: "pdf_file_type_invalid", status: 400 });
  });
});
```

- [ ] **Step 4: Write the failing document-assembly test**

```ts
import { describe, expect, it } from "vitest";

import { assemblePdfDocumentResult } from "../pdf-ocr";

describe("assemblePdfDocumentResult", () => {
  it("builds previewHtml, pageStats, failedPages, and exportManifest together", () => {
    const result = assemblePdfDocumentResult({
      fileName: "quarterly-report.pdf",
      totalPages: 4,
      pages: [
        { pageNumber: 1, status: "success", source: "text-layer", html: "<p>One</p>", markdown: "One", text: "One", blocks: [] },
        { pageNumber: 2, status: "partial", source: "mixed", html: "<p>Two</p>", markdown: "Two", text: "Two", blocks: [] },
        { pageNumber: 3, status: "failed", source: "ocr", errorCode: "ocr_failed", errorMessage: "bad page", blocks: [] },
      ],
      exportToken: "signed",
      remainingPdfPagesToday: 7,
      lockedPages: 1,
    });

    expect(result.previewHtml).toContain("Page 1");
    expect(result.previewHtml).not.toContain("<script");
    expect(result.html).toContain("<h1>quarterly-report</h1>");
    expect(result.html).toContain("<!-- Page 2 -->");
    expect(result.md).toContain("---\n\nPage 2");
    expect(result.txt).toContain("Locked pages: 4");
    expect(result.pageStats).toEqual({ textLayerPages: 1, ocrPages: 1, mixedPages: 1 });
    expect(result.failedPages).toEqual([{ pageNumber: 3, errorCode: "ocr_failed", errorMessage: "bad page" }]);
    expect(result.exportManifest.processedPageNumbers).toEqual([1, 2]);
    expect(result.exportManifest).toMatchObject({
      totalPages: 4,
      failedPageNumbers: [3],
      pageLayouts: [
        { pageNumber: 1, source: "text-layer" },
        { pageNumber: 2, source: "mixed" },
      ],
      billingUpsell: { required: true },
    });
  });
});
```

- [ ] **Step 5: Write the failing partial-success route test**

```ts
import { describe, expect, it } from "vitest";

import { buildPdfSuccessPayload } from "../pdf-ocr";

describe("buildPdfSuccessPayload", () => {
  it("returns billingUpsell and remainingPdfPagesToday after counting only billable pages", () => {
    const payload = buildPdfSuccessPayload({
      remainingPdfPagesTodayBeforeRun: 5,
      pages: [
        { pageNumber: 1, status: "success", source: "text-layer", html: "<p>A</p>", markdown: "A", text: "A", blocks: [] },
        { pageNumber: 2, status: "failed", source: "ocr", errorCode: "ocr_failed", errorMessage: "bad", blocks: [] },
      ],
      lockedPages: 8,
      exportToken: "signed",
    });

    expect(payload.remainingPdfPagesToday).toBe(4);
    expect(payload.billingUpsell?.required).toBe(true);
  });

  it("returns request-local remaining pages for anonymous responses", () => {
    const payload = buildPdfSuccessPayload({
      viewerType: "anonymous",
      remainingPdfPagesTodayBeforeRun: 5,
      pages: [{ pageNumber: 1, status: "success", source: "ocr", html: "<p>A</p>", markdown: "A", text: "A", blocks: [] }],
      lockedPages: 0,
      exportToken: "signed",
    });

    expect(payload.remainingPdfPagesToday).toBe(4);
  });
});
```

- [ ] **Step 6: Write the failing all-pages-failed route test**

```ts
import { describe, expect, it } from "vitest";

import { buildPdfRouteOutcome } from "../pdf-ocr";

describe("buildPdfRouteOutcome", () => {
  it("returns pdf_processing_failed when no processable page produces usable output", () => {
    expect(() =>
      buildPdfRouteOutcome({
        totalPages: 3,
        pages: [
          { pageNumber: 1, status: "failed", source: "ocr", errorCode: "ocr_failed", errorMessage: "bad", blocks: [] },
        ],
      }),
    ).toThrow(/pdf_processing_failed/);
  });
});
```

- [ ] **Step 7: Write the failing fixture-backed PDF sample test**

```ts
import { describe, expect, it } from "vitest";

import { inspectPdfFile } from "../pdf-ingest";

describe("fixture-backed PDF coverage", () => {
  it("recognizes the required validation sample set", async () => {
    const samples = [
      "native-text.pdf",
      "scanned-image.pdf",
      "mixed-two-column.pdf",
      "anon-over-limit.pdf",
      "logged-in-over-remaining.pdf",
    ];

    expect(samples).toHaveLength(5);
    expect(await inspectPdfFile(loadFixturePdf("native-text.pdf"))).toMatchObject({ totalPages: expect.any(Number) });
  });
});
```

- [ ] **Step 8: Run the segmentation/document tests to verify they fail**

Run: `pnpm --dir apps/api test src/lib/__tests__/pdf-segmentation.test.ts src/lib/__tests__/pdf-ocr.test.ts`

Expected: FAIL because `pdf-ingest.ts` / `pdf-segmentation.ts` / `pdf-ocr.ts` and the required fixture files do not exist yet.

- [ ] **Step 9: Implement PDF preflight helpers and non-200 error mapping in `pdf-ingest.ts`**

```ts
export async function inspectPdfFile(input: { file: File; maxFileMb: number; maxPagesPerDocument: number }) {
  if (input.file.type !== "application/pdf") {
    throw new PdfOcrHttpError(400, "pdf_file_type_invalid", "Only PDF files are supported.");
  }

  if (input.file.size > input.maxFileMb * 1024 * 1024) {
    throw new PdfOcrHttpError(413, "pdf_file_too_large", "The selected PDF exceeds the file size limit.");
  }

  const bytes = new Uint8Array(await input.file.arrayBuffer());
  let document;
  try {
    document = await getDocument({ data: bytes }).promise;
  } catch {
    throw new PdfOcrHttpError(400, "pdf_invalid", "The uploaded PDF could not be parsed.");
  }

  if (document.numPages > input.maxPagesPerDocument) {
    throw new PdfOcrHttpError(400, "pdf_page_count_failed", "The uploaded PDF exceeds the per-document page cap.");
  }

  return {
    bytes,
    totalPages: document.numPages,
    sourceHash: await sha256Hex(Buffer.from(bytes).toString("base64")),
  };
}
```

- [ ] **Step 10: Implement region-aware normalization, rendering, and prompt helpers**

```ts
export function orderRegionsForReading(regions: LayoutRegion[]) {
  return [...regions].sort((left, right) => {
    if (left.lane !== right.lane && left.top === right.top) {
      return laneRank(left.lane) - laneRank(right.lane);
    }
    if (Math.abs(left.top - right.top) > 24) {
      return left.top - right.top;
    }
    return left.left - right.left;
  });
}
```

```ts
// apps/web/lib/pdf-renderer.ts
export async function renderPdfPageToPng(input: { file: File; pageNumber: number }) {
  const bytes = new Uint8Array(await input.file.arrayBuffer());
  const document = await getDocument({ data: bytes }).promise;
  const page = await document.getPage(input.pageNumber);
  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Failed to create browser canvas context.");
  await page.render({ canvasContext: context, viewport }).promise;
  const blob = await new Promise<Blob>((resolve) => canvas.toBlob((value) => resolve(value!), "image/png"));
  return new Uint8Array(await blob.arrayBuffer());
}

export async function cropRegionPng(input: { pagePng: Uint8Array; bbox: BoundingBox }) {
  const blob = new Blob([input.pagePng], { type: "image/png" });
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = input.bbox.width;
  canvas.height = input.bbox.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Failed to create crop canvas context.");
  context.drawImage(bitmap, input.bbox.x, input.bbox.y, input.bbox.width, input.bbox.height, 0, 0, input.bbox.width, input.bbox.height);
  const croppedBlob = await new Promise<Blob>((resolve) => canvas.toBlob((value) => resolve(value!), "image/png"));
  return new Uint8Array(await croppedBlob.arrayBuffer());
}

export async function preparePdfPagesForUpload(input: { file: File; maxPages: number }) {
  const pages = [];
  for (let pageNumber = 1; pageNumber <= input.maxPages; pageNumber += 1) {
    const pagePng = await renderPdfPageToPng({ file: input.file, pageNumber });
    const nativeTextBlocks = await extractNativeTextBlocks({ file: input.file, pageNumber });
    const source = classifyPreparedPage({ nativeTextBlocks, pagePng });
    pages.push({
      pageNumber,
      source,
      pagePngBase64: source === "text-layer" ? undefined : uint8ToBase64(pagePng),
      nativeTextBlocks,
      ocrRegions: source === "mixed" ? await extractOcrRegions({ pagePng, nativeTextBlocks }) : [],
    });
  }
  return pages;
}
```

```ts
// apps/api/src/lib/pdf-prompts.ts
export function buildPdfRegionPrompt(input: { pageNumber: number; regionKind: "page" | "region"; lane: "full" | "left" | "right" }) {
  return [
    `OCR page ${input.pageNumber}`,
    input.regionKind === "region" ? "Return only the text visible inside the cropped region." : "Return the readable text in reading order.",
  ].join(" ");
}
```

```ts
export async function classifyPdfPage(page: PdfPageLike) {
  const textLayer = await extractNativeTextRegions(page);
  const imageRegions = await extractImageRegions(page);
  if (textLayer.length && !imageRegions.length) return "text-layer" as const;
  if (!textLayer.length && imageRegions.length) return "ocr" as const;
  return "mixed" as const;
}

export async function processPdfPages(input: {
  preparedPages: PreparedPdfPage[];
  processablePages: number;
  buildPdfRegionPrompt: typeof buildPdfRegionPrompt;
  runSimpleOcr: typeof runSimpleOcr;
  runFormattedOcr: typeof runFormattedOcr;
}) {
  return Promise.all(
    input.preparedPages.slice(0, input.processablePages).map(async (page) => {
      if (page.source === "text-layer") {
        return buildPdfPageResult(fromPreparedTextLayerPage(page));
      }
      if (page.source === "ocr") {
        const ocr = await input.runFormattedOcr(env, `data:image/png;base64,${page.pagePngBase64}`);
        return buildPdfPageResult(fromWholePageOcr(page, ocr));
      }
      const regionResults = await Promise.all(
        page.ocrRegions.map((region) =>
          input.runFormattedOcr(env, `data:image/png;base64,${region.imageBase64}`, {
            prompt: input.buildPdfRegionPrompt({ pageNumber: page.pageNumber, regionKind: "region", lane: inferLane(region.bbox) }),
          }),
        ),
      );
      return buildPdfPageResult(fromMixedPreparedPage(page, regionResults));
    }),
  );
}

export function buildPdfPageResult(input: PageBuildInput): PdfPageResult {
  if (input.status === "failed") {
    return {
      pageNumber: input.pageNumber,
      status: "failed",
      source: input.source,
      width: input.width,
      height: input.height,
      errorCode: input.errorCode,
      errorMessage: input.errorMessage,
      blocks: [],
    };
  }

  return {
    pageNumber: input.pageNumber,
    status: input.status,
    source: input.source,
    width: input.width,
    height: input.height,
    text: input.text,
    markdown: input.markdown,
    html: input.html,
    blocks: input.blocks,
  };
}
```

- [ ] **Step 11: Implement document-level OCR assembly and route payload helpers in `pdf-ocr.ts`**

```ts
export function assemblePdfDocumentResult(input: AssemblePdfDocumentInput): PdfDocumentResult {
  const successfulPages = input.pages.filter((page) => page.status === "success" || page.status === "partial");
  const failedPages = input.pages
    .filter((page) => page.status === "failed")
    .map((page) => ({ pageNumber: page.pageNumber, errorCode: page.errorCode!, errorMessage: page.errorMessage! }));
  const title = input.fileName.replace(/\.[^.]+$/, "");

  return {
    kind: "pdf",
    totalPages: input.totalPages,
    processedPages: successfulPages.length,
    lockedPages: input.lockedPages,
    truncated: input.lockedPages > 0,
    html: buildDocumentHtml({
      title,
      pages: successfulPages,
      lockedPages: input.lockedPages,
      failedPageNumbers: failedPages.map((page) => page.pageNumber),
    }),
    md: buildDocumentMarkdown({
      title,
      pages: successfulPages,
      lockedPages: input.lockedPages,
      failedPageNumbers: failedPages.map((page) => page.pageNumber),
    }),
    txt: buildDocumentText({
      title,
      pages: successfulPages,
      lockedPages: input.lockedPages,
      failedPageNumbers: failedPages.map((page) => page.pageNumber),
    }),
    previewHtml: sanitizePreviewHtml(buildPreviewHtml(successfulPages)),
    remainingPdfPagesToday: input.remainingPdfPagesToday,
    exportToken: input.exportToken,
    exportManifest: {
      documentId: input.documentId,
      totalPages: input.totalPages,
      processedPageNumbers: successfulPages.map((page) => page.pageNumber),
      failedPageNumbers: failedPages.map((page) => page.pageNumber),
      pageLayouts: input.pages.map((page) => ({
        pageNumber: page.pageNumber,
        source: page.source,
        width: page.width,
        height: page.height,
        blocks: page.blocks,
      })),
      billingUpsell: input.lockedPages > 0 ? defaultPdfUpsell() : undefined,
    },
    pageStats: summarizePageSources(input.pages),
    failedPages,
    exportSupport: { searchablePdf: true, reflowedPdf: true },
    billingUpsell: input.lockedPages > 0 ? defaultPdfUpsell() : undefined,
    pages: input.pages,
  };
}

export function buildPdfRouteOutcome(input: BuildPdfRouteOutcomeInput) {
  const usablePages = input.pages.filter((page) => page.status === "success" || page.status === "partial");
  if (usablePages.length === 0) {
    throw new PdfOcrHttpError(502, "pdf_processing_failed", "No usable output was produced for this PDF.");
  }
  return input.pages;
}

export function buildPdfSuccessPayload(input: AssemblePdfDocumentInput) {
  return assemblePdfDocumentResult(input);
}

export function sanitizePreviewHtml(html: string) {
  return html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
}
```

- [ ] **Step 12: Wire `/v1/pdf/ocr` to the real page pipeline, lock handling, and error matrix**

```ts
app.post("/v1/pdf/ocr", async (c) => {
  const form = await c.req.formData();
  const file = form.get("file");
  const browserId = String(form.get("browserId") ?? "");
  const viewer = await resolveViewerContext(c, browserId);
  const lock = viewer.type === "user" ? await acquirePdfProcessingLock({ lockKey: `pdf:${viewer.user!.id}` }) : null;
  try {
    const inspection = await inspectPdfFile({ file: file as File, maxFileMb: 15, maxPagesPerDocument: 50 });
    const preparedPages = JSON.parse(String(form.get("preparedPages") ?? "[]"));
    const allowance = buildPdfAllowance({
      viewerType: viewer.type,
      totalPages: inspection.totalPages,
      remainingPdfPagesToday: await resolveRemainingPdfPagesToday(c.env, viewer),
    });
    if (allowance.processablePages === 0) {
      throw new PdfOcrHttpError(429, "pdf_page_limit_reached", "No PDF pages remaining today.", {
        remainingPdfPagesToday: 0,
        totalPages: inspection.totalPages,
        processablePages: 0,
        lockedPages: inspection.totalPages,
        billingUpsell: defaultPdfUpsell(),
      });
    }

    const pages = await processPdfPages({
      bytes: inspection.bytes,
      processablePages: allowance.processablePages,
      preparedPages,
      buildPdfRegionPrompt,
      runSimpleOcr,
      runFormattedOcr,
    });

    const routedPages = buildPdfRouteOutcome({ totalPages: inspection.totalPages, pages });
    const billablePages = countBillablePdfPages(pages);
    const remainingAfterRun = viewer.type === "user"
      ? Math.max(currentRemainingPdfPagesToday - billablePages, 0)
      : Math.max(5 - billablePages, 0);
    await writeUserDailyPdfUsage(/* post-run debit only */);
    return c.json(buildPdfSuccessPayload({
      documentId: inspection.sourceHash,
      totalPages: inspection.totalPages,
      pages: routedPages,
      remainingPdfPagesToday: remainingAfterRun,
      lockedPages: allowance.lockedPages,
      exportToken: signedToken,
    }));
  } finally {
    await releasePdfProcessingLock(lock);
  }
});
```

- [ ] **Step 13: Re-run the segmentation/document tests**

Run: `pnpm --dir apps/api test src/lib/__tests__/pdf-segmentation.test.ts src/lib/__tests__/pdf-ocr.test.ts`

Expected: PASS.

- [ ] **Step 14: Commit the core pipeline layer**

```bash
git add apps/api/src/lib/pdf-ingest.ts apps/api/src/lib/pdf-segmentation.ts apps/api/src/lib/pdf-prompts.ts apps/api/src/lib/pdf-ocr.ts apps/api/src/index.ts apps/web/lib/pdf-renderer.ts apps/api/src/lib/__tests__/pdf-segmentation.test.ts apps/api/src/lib/__tests__/pdf-ocr.test.ts apps/api/src/lib/__fixtures__/pdf/native-text.pdf apps/api/src/lib/__fixtures__/pdf/scanned-image.pdf apps/api/src/lib/__fixtures__/pdf/mixed-two-column.pdf apps/api/src/lib/__fixtures__/pdf/anon-over-limit.pdf apps/api/src/lib/__fixtures__/pdf/logged-in-over-remaining.pdf
git commit -m "feat: add PDF OCR processing pipeline"
```

## Task 4: Add signed export endpoints for searchable and reflowed PDFs

**Files:**
- Create: `apps/api/src/lib/pdf-export.ts`
- Modify: `apps/api/src/index.ts`
- Test: `apps/api/src/lib/__tests__/pdf-export.test.ts`

- [ ] **Step 1: Write the failing export-token validation test**

```ts
import { describe, expect, it } from "vitest";

import { signPdfExportToken, verifyPdfExportToken } from "../pdf-export";

describe("verifyPdfExportToken", () => {
  it("rejects a tampered export manifest hash", async () => {
    const token = await signPdfExportToken({
      sourceHash: "source",
      exportManifestHash: "expected",
      processedPageNumbers: [1, 2, 3],
    });

    await expect(
      verifyPdfExportToken(token, { sourceHash: "source", exportManifestHash: "other" }),
    ).rejects.toThrow(/manifest/i);
  });

  it("rejects an expired token", async () => {
    const token = await signPdfExportToken({
      sourceHash: "source",
      exportManifestHash: "expected",
      processedPageNumbers: [1],
      expiresAt: 100,
    });

    await expect(
      verifyPdfExportToken(token, { sourceHash: "source", exportManifestHash: "expected", now: 200 }),
    ).rejects.toThrow(/expired/i);
  });
});
```

- [ ] **Step 2: Write the failing searchable-PDF behavior test**

```ts
import { describe, expect, it } from "vitest";

import { buildSearchablePdfPlan } from "../pdf-export";

describe("buildSearchablePdfPlan", () => {
  it("keeps failed pages visual-only and omits locked pages", () => {
    const plan = buildSearchablePdfPlan({
      processedPageNumbers: [1, 2, 3],
      failedPageNumbers: [2],
      lockedPageNumbers: [4, 5],
    });

    expect(plan.pages).toEqual([
      { pageNumber: 1, mode: "overlay" },
      { pageNumber: 2, mode: "visual-only" },
      { pageNumber: 3, mode: "overlay" },
    ]);
  });

  it("exposes the reflowed export route with the same manifest verification path", () => {
    expect(buildExportRouteConfig("reflowed")).toMatchObject({
      endpoint: "/v1/pdf/export/reflowed",
      contentType: "application/pdf",
    });
  });

  it("keeps text-layer pages passthrough, failed pages visual-only, and omits locked pages", async () => {
    const plan = await buildSearchablePdfPlan(samplePdfFile(), {
      totalPages: 5,
      processedPageNumbers: [1, 2, 3],
      failedPageNumbers: [2],
      pageLayouts: [
        { pageNumber: 1, source: "text-layer", width: 600, height: 800, blocks: [] },
        { pageNumber: 2, source: "ocr", width: 600, height: 800, blocks: [] },
        { pageNumber: 3, source: "mixed", width: 600, height: 800, blocks: [] },
      ],
    });

    expect(plan.pages).toEqual([
      { pageNumber: 1, mode: "passthrough" },
      { pageNumber: 2, mode: "visual-only" },
      { pageNumber: 3, mode: "overlay" },
    ]);
  });

  it("suppresses OCR overlays that collide with native text on mixed pages", async () => {
    const plan = await buildSearchablePdfPlan(samplePdfFile(), {
      totalPages: 1,
      processedPageNumbers: [1],
      failedPageNumbers: [],
      pageLayouts: [
        {
          pageNumber: 1,
          source: "mixed",
          width: 600,
          height: 800,
          blocks: [
            { id: "native", kind: "paragraph", order: 1, text: "Native text", source: "text-layer", bbox: { x: 10, y: 10, width: 100, height: 20 } },
            { id: "ocr-region", kind: "paragraph", order: 2, text: "OCR text", source: "ocr", bbox: { x: 12, y: 12, width: 100, height: 20 } },
          ],
        },
      ],
    });

    expect(plan.pages[0].overlayRegions).toEqual([]);
  });

  it("builds reflowed PDFs from normalized blocks only", async () => {
    const plan = await buildReflowedPdfPlan(samplePdfFile(), {
      totalPages: 3,
      processedPageNumbers: [1, 2],
      failedPageNumbers: [3],
      pageLayouts: [
        { pageNumber: 1, source: "text-layer", width: 600, height: 800, blocks: [{ id: "a", kind: "heading", order: 1, text: "Title", source: "text-layer" }] },
        { pageNumber: 2, source: "mixed", width: 600, height: 800, blocks: [{ id: "b", kind: "paragraph", order: 2, text: "Body", source: "ocr" }] },
      ],
    });

    expect(plan.mode).toBe("reflowed");
    expect(plan.blocks.map((block) => block.text).join(" ")).toContain("Title");
    expect(plan.blocks.map((block) => block.text).join(" ")).not.toContain("Page 3");
  });
});
```

- [ ] **Step 3: Write the failing export-error and header test**

```ts
import { describe, expect, it } from "vitest";

import { mapPdfExportError, streamPdfResponse } from "../pdf-export";

describe("pdf export responses", () => {
  it("maps token failures to PdfExportError JSON", () => {
    expect(mapPdfExportError(new Error("token"))).toEqual({
      ok: false,
      status: 400,
      code: "pdf_export_token_invalid",
      error: expect.any(String),
    });
  });

  it("maps render failures to 502 PdfExportError JSON", () => {
    expect(mapPdfExportError(new Error("generation"))).toEqual({
      ok: false,
      status: 502,
      code: "pdf_export_generation_failed",
      error: expect.any(String),
    });
  });

  it("sets the required PDF download headers on success", () => {
    const response = streamPdfResponse(new Uint8Array([1, 2, 3]), "scanlume-searchable.pdf");

    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toContain("scanlume-searchable.pdf");
  });
});
```

- [ ] **Step 4: Run the export tests to verify they fail**

Run: `pnpm --dir apps/api test src/lib/__tests__/pdf-export.test.ts`

Expected: FAIL because the export helpers do not exist yet.

- [ ] **Step 5: Implement canonical export-manifest hashing plus HMAC token signing**

```ts
export async function signPdfExportToken(input: SignedPdfExportPayload) {
  const payload = JSON.stringify({
    sourceHash: input.sourceHash,
    exportManifestHash: input.exportManifestHash,
    processedPageNumbers: input.processedPageNumbers,
    failedPageNumbers: input.failedPageNumbers,
    expiresAt: input.expiresAt,
  });
  const signature = await signWithHmac(payload, input.secret);
  return `${btoa(payload)}.${signature}`;
}
```

```ts
export async function canonicalizeExportManifest(input: PdfDocumentResult["exportManifest"]) {
  return JSON.stringify(sortKeysDeep(input));
}

export async function verifyPdfExportToken(token: string, input: VerificationInput) {
  const [encodedPayload, signature] = token.split(".");
  const payload = atob(encodedPayload);
  await assertValidHmac(payload, signature, input.secret);
  const parsed = JSON.parse(payload);
  if (parsed.expiresAt < input.now) throw new Error("Export token expired.");
  if (parsed.sourceHash !== input.sourceHash) throw new Error("Export source mismatch.");
  if (parsed.exportManifestHash !== input.exportManifestHash) throw new Error("Export manifest mismatch.");
}
```

```ts
export function mapPdfExportError(error: unknown) {
  if (isTokenError(error)) {
    return { ok: false as const, status: 400, code: "pdf_export_token_invalid", error: "Invalid export token." };
  }
  if (isManifestError(error)) {
    return { ok: false as const, status: 400, code: "pdf_export_manifest_invalid", error: "Invalid export manifest." };
  }
  if (isSourceMismatchError(error)) {
    return { ok: false as const, status: 400, code: "pdf_export_source_mismatch", error: "The uploaded PDF does not match the signed export request." };
  }
  return { ok: false as const, status: 502, code: "pdf_export_generation_failed", error: "Failed to generate the requested PDF export." };
}

export function buildExportRouteConfig(kind: "searchable" | "reflowed") {
  return {
    endpoint: kind === "searchable" ? "/v1/pdf/export/searchable" : "/v1/pdf/export/reflowed",
    contentType: "application/pdf",
  };
}
```

```ts
export function filterOverlappingOcrBlocks(blocks: ExportBlock[]) {
  const nativeBlocks = blocks.filter((block) => block.source === "text-layer");
  return blocks.filter((block) => {
    if (block.source !== "ocr") return true;
    return !nativeBlocks.some((nativeBlock) => intersects(nativeBlock.bbox, block.bbox));
  });
}

export async function buildSearchablePdfPlan(file: File, manifest: PdfDocumentResult["exportManifest"]) {
  return {
    mode: "searchable" as const,
    pages: manifest.pageLayouts.map((page) => ({
      pageNumber: page.pageNumber,
      mode: page.source === "text-layer" ? "passthrough" : manifest.failedPageNumbers.includes(page.pageNumber) ? "visual-only" : "overlay",
      overlayRegions: filterOverlappingOcrBlocks(page.blocks).filter((block) => block.source === "ocr"),
    })),
  };
}

export async function renderSearchablePdf(file: File, plan: Awaited<ReturnType<typeof buildSearchablePdfPlan>>) {
  const pdf = await PDFDocument.load(await file.arrayBuffer());
  for (const pagePlan of plan.pages) {
    if (pagePlan.mode === "overlay") {
      // draw invisible OCR text only for the filtered OCR regions
    }
  }
  return new Uint8Array(await pdf.save());
}

export async function buildReflowedPdfPlan(file: File, manifest: PdfDocumentResult["exportManifest"]) {
  return {
    mode: "reflowed" as const,
    blocks: manifest.pageLayouts.flatMap((page) => page.blocks),
  };
}

export async function renderReflowedPdf(plan: Awaited<ReturnType<typeof buildReflowedPdfPlan>>) {
  const pdf = await PDFDocument.create();
  let page = pdf.addPage([595, 842]);
  let cursorY = 800;
  for (const block of plan.blocks) {
    // draw normalized heading/paragraph text and paginate when cursor runs out
  }
  return new Uint8Array(await pdf.save());
}
```

- [ ] **Step 6: Implement searchable/reflowed export handlers plus PdfExportError mapping**

```ts
app.post("/v1/pdf/export/searchable", async (c) => {
  try {
    const form = await c.req.formData();
    const file = form.get("file") as File;
    const exportToken = String(form.get("exportToken") ?? "");
    const exportManifestPart = form.get("exportManifest") as File;
    const exportManifest = JSON.parse(await exportManifestPart.text());
    await verifyPdfExportToken(exportToken, await buildVerificationInput(file, exportManifest));
    const plan = await buildSearchablePdfPlan(file, {
      ...exportManifest,
      pageLayouts: exportManifest.pageLayouts.map((page) => ({
        ...page,
        blocks: filterOverlappingOcrBlocks(page.blocks),
      })),
    });
    return streamPdfResponse(await renderSearchablePdf(file, plan), "scanlume-searchable.pdf");
  } catch (error) {
    const mapped = mapPdfExportError(error);
    return c.json(mapped, mapped.status);
  }
});

app.post("/v1/pdf/export/reflowed", async (c) => {
  try {
    const form = await c.req.formData();
    const file = form.get("file") as File;
    const exportToken = String(form.get("exportToken") ?? "");
    const exportManifestPart = form.get("exportManifest") as File;
    const exportManifest = JSON.parse(await exportManifestPart.text());
    await verifyPdfExportToken(exportToken, await buildVerificationInput(file, exportManifest));
    const plan = await buildReflowedPdfPlan(file, exportManifest);
    return streamPdfResponse(await renderReflowedPdf(plan), "scanlume-reflowed.pdf");
  } catch (error) {
    const mapped = mapPdfExportError(error);
    return c.json(mapped, mapped.status);
  }
});
```

- [ ] **Step 7: Re-run the export tests**

Run: `pnpm --dir apps/api test src/lib/__tests__/pdf-export.test.ts`

Expected: PASS.

- [ ] **Step 8: Commit the export endpoints**

```bash
git add apps/api/src/lib/pdf-export.ts apps/api/src/index.ts apps/api/src/lib/__tests__/pdf-export.test.ts
git commit -m "feat: add signed PDF export endpoints"
```

## Task 5: Upgrade the shared workspace to handle PDFs end-to-end

**Files:**
- Create: `apps/web/lib/pdf-client.ts`
- Modify: `apps/web/lib/downloads.ts`
- Modify: `apps/web/components/ocr-workspace.tsx`
- Test: `apps/web/components/__tests__/ocr-workspace.test.tsx`
- Test: `apps/web/lib/__tests__/pdf-client.test.ts`

- [ ] **Step 1: Write the failing PDF page-count helper test**

```ts
import { describe, expect, it } from "vitest";

import { buildPdfSelectionSummary } from "@/lib/pdf-client";

describe("buildPdfSelectionSummary", () => {
  it("marks a PDF as truncated when local pages exceed the remaining allowance", () => {
    const summary = buildPdfSelectionSummary({
      totalPages: 12,
      remainingPages: 5,
      maxPagesPerDocument: 50,
    });

    expect(summary).toMatchObject({ processablePages: 5, truncated: true, lockedPages: 7 });
  });
});
```

- [ ] **Step 2: Extend the workspace test with failing selection-validation assertions**

```tsx
it("rejects a mixed batch of images and PDFs", async () => {
  render(<OcrWorkspace defaultMode="simple" priorityLayout />);

  expect(screen.queryByText(/nao misture imagens e pdf/i)).not.toBeNull();
});
```

```tsx
it("rejects selecting more than one PDF in v1", async () => {
  render(<OcrWorkspace defaultMode="simple" priorityLayout />);

  expect(screen.queryByText(/envie apenas 1 pdf por vez/i)).not.toBeNull();
});
```

- [ ] **Step 3: Extend the workspace test with a failing PDF UX assertion**

```tsx
it("shows PDF export buttons after a successful PDF result", async () => {
  render(<OcrWorkspace defaultMode="simple" priorityLayout />);

  expect(screen.queryByRole("button", { name: /Baixar PDF pesquisavel/i })).not.toBeNull();
  expect(screen.queryByRole("button", { name: /Baixar PDF reorganizado/i })).not.toBeNull();
  expect(screen.queryByRole("button", { name: /Baixar HTML/i })).not.toBeNull();
  expect(screen.queryByRole("button", { name: /Baixar Markdown/i })).not.toBeNull();
});

it("renders the PDF result summary fields required by the spec", async () => {
  render(<OcrWorkspace defaultMode="simple" priorityLayout />);

  expect(screen.queryByText(/quarterly-report\.pdf/i)).not.toBeNull();
  expect(screen.queryByText(/12 paginas no total/i)).not.toBeNull();
  expect(screen.queryByText(/5 paginas processadas/i)).not.toBeNull();
  expect(screen.queryByText(/texto nativo: 2/i)).not.toBeNull();
  expect(screen.queryByText(/ocr: 2/i)).not.toBeNull();
  expect(screen.queryByText(/misto: 1/i)).not.toBeNull();
  expect(screen.queryByText(/desbloquear mais paginas/i)).not.toBeNull();
  expect(screen.queryByTestId("pdf-preview-html")).not.toBeNull();
});

it("maps non-200 PDF OCR errors to specific UI messages instead of one generic banner", async () => {
  render(<OcrWorkspace defaultMode="simple" priorityLayout />);

  expect(screen.queryByText(/outro pdf ja esta em processamento/i)).not.toBeNull();
  expect(screen.queryByText(/seu limite gratuito de paginas pdf acabou/i)).not.toBeNull();
  expect(screen.queryByText(/o pdf enviado nao pode ser lido/i)).not.toBeNull();
});
```

- [ ] **Step 4: Add a failing PDF error-mapping helper test**

```ts
import { describe, expect, it } from "vitest";

import { mapPdfOcrError } from "@/lib/pdf-client";

describe("mapPdfOcrError", () => {
  it("maps the frozen server error codes to specific UI copy", () => {
    expect(mapPdfOcrError({ code: "pdf_job_in_progress", error: "busy", remainingPdfPagesToday: 0 })).toMatch(/outro pdf ja esta em processamento/i);
    expect(mapPdfOcrError({ code: "pdf_page_limit_reached", error: "limit", remainingPdfPagesToday: 0 })).toMatch(/limite gratuito/i);
    expect(mapPdfOcrError({ code: "pdf_invalid", error: "invalid", remainingPdfPagesToday: 0 })).toMatch(/nao pode ser lido/i);
  });
});
```

- [ ] **Step 5: Run the web tests to verify they fail for missing PDF support**

Run: `pnpm --dir apps/web test lib/__tests__/pdf-client.test.ts components/__tests__/ocr-workspace.test.tsx`

Expected: FAIL because the helper/module/UI states do not exist yet.

- [ ] **Step 6: Implement the local PDF helper**

```ts
export async function readPdfPageCount(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const document = await getDocument({ data: bytes }).promise;
  return document.numPages;
}

export function buildPdfSelectionSummary(input: { totalPages: number; remainingPages: number; maxPagesPerDocument: number }) {
  const processablePages = Math.min(input.totalPages, input.remainingPages, input.maxPagesPerDocument);
  return {
    processablePages,
    lockedPages: Math.max(input.totalPages - processablePages, 0),
    truncated: processablePages < input.totalPages,
  };
}

export function mapPdfOcrError(error: { code: string; error: string; remainingPdfPagesToday: number }) {
  if (error.code === "pdf_job_in_progress") return "Outro PDF ja esta em processamento para esta conta.";
  if (error.code === "pdf_page_limit_reached") return "Seu limite gratuito de paginas PDF acabou.";
  if (error.code === "pdf_invalid") return "O PDF enviado nao pode ser lido.";
  return error.error;
}

export async function buildPreparedPdfPages(file: File, processablePages: number) {
  return preparePdfPagesForUpload({ file, maxPages: processablePages });
}
```

- [ ] **Step 7: Add PDF request + export helpers in `downloads.ts`**

```ts
export async function requestPdfExport(endpoint: string, input: { file: File; exportToken: string; exportManifest: object }) {
  const form = new FormData();
  form.set("file", input.file);
  form.set("exportToken", input.exportToken);
  form.set("exportManifest", new Blob([JSON.stringify(input.exportManifest)], { type: "application/json" }));
  const response = await fetch(endpoint, { method: "POST", credentials: "include", body: form });
  if (!response.ok) throw new Error("Falha ao gerar o PDF.");
  triggerDownload(await response.blob(), "scanlume.pdf");
}
```

- [ ] **Step 8: Implement PDF-aware workspace state, selection validation, and error mapping**

```tsx
type DocumentKind = "image" | "pdf";

type PdfResultPayload = {
  kind: "pdf";
  totalPages: number;
  processedPages: number;
  lockedPages: number;
  html: string;
  md: string;
  txt: string;
  previewHtml: string;
  pageStats: { textLayerPages: number; ocrPages: number; mixedPages: number };
  exportToken: string;
  exportManifest: object;
  billingUpsell?: { required: boolean; message: string; ctaLabel: string; ctaHref: string };
};
```

```tsx
function validateSelection(nextFiles: File[], selectedKind: DocumentKind | null) {
  const kinds = new Set(nextFiles.map((file) => (file.type === "application/pdf" ? "pdf" : "image")));
  if (kinds.size > 1) return "Nao misture imagens e PDF no mesmo envio.";
  if ((selectedKind === "pdf" || [...kinds][0] === "pdf") && nextFiles.length > 1) {
    return "Envie apenas 1 PDF por vez nesta primeira versao.";
  }
  return null;
}
```

```tsx
if (selectedKind === "pdf") {
  const preparedPages = await buildPreparedPdfPages(item.file, pdfSummary.processablePages);
  formData.set("file", item.file);
  formData.set("browserId", browserId.current);
  formData.set("sourcePath", window.location.pathname);
  formData.set("preparedPages", JSON.stringify(preparedPages));
  const response = await fetch(`${API_BASE_URL}/v1/pdf/ocr`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
}
```

```tsx
function handlePdfInlineDownload(result: PdfResultPayload, format: "html" | "md" | "txt") {
  if (format === "html") return downloadHtmlFile("documento.html", result.html);
  if (format === "md") return downloadTextFile("documento.md", result.md, "text/markdown;charset=utf-8");
  return downloadTextFile("documento.txt", result.txt);
}
```

```tsx
function PdfResultSummary({ result, fileName }: { result: PdfResultPayload; fileName: string }) {
  return (
    <div>
      <strong>{fileName}</strong>
      <span>{result.totalPages} paginas no total</span>
      <span>{result.processedPages} paginas processadas</span>
      <span>Texto nativo: {result.pageStats.textLayerPages}</span>
      <span>OCR: {result.pageStats.ocrPages}</span>
      <span>Misto: {result.pageStats.mixedPages}</span>
      {result.billingUpsell?.required ? <a href={result.billingUpsell.ctaHref}>{result.billingUpsell.ctaLabel}</a> : null}
      <div data-testid="pdf-preview-html" dangerouslySetInnerHTML={{ __html: result.previewHtml }} />
    </div>
  );
}
```

```tsx
catch (error) {
  const payload = error as { code?: string; error?: string; remainingPdfPagesToday?: number };
  setGlobalError(mapPdfOcrError({
    code: payload.code ?? "unknown",
    error: payload.error ?? "Erro inesperado.",
    remainingPdfPagesToday: payload.remainingPdfPagesToday ?? 0,
  }));
}
```

- [ ] **Step 9: Re-run the web tests**

Run: `pnpm --dir apps/web test lib/__tests__/pdf-client.test.ts components/__tests__/ocr-workspace.test.tsx`

Expected: PASS.

- [ ] **Step 10: Commit the unified workspace changes**

```bash
git add apps/web/lib/pdf-client.ts apps/web/lib/downloads.ts apps/web/components/ocr-workspace.tsx apps/web/lib/__tests__/pdf-client.test.ts apps/web/components/__tests__/ocr-workspace.test.tsx
git commit -m "feat: add PDF flow to the OCR workspace"
```

## Task 6: Add the dedicated PDF landing page and product copy updates

**Files:**
- Modify: `apps/web/lib/site.ts`
- Modify: `apps/web/lib/llms.ts`
- Modify: `apps/web/components/tool-landing.tsx`
- Create: `apps/web/app/pdf-para-texto/page.tsx`
- Test: `apps/web/lib/__tests__/pdf-client.test.ts`

- [ ] **Step 1: Write the failing site-content test**

```ts
import { describe, expect, it } from "vitest";

import { toolPageContent } from "@/lib/site";

describe("toolPageContent", () => {
  it("defines the dedicated PDF landing page", () => {
    expect(toolPageContent["pdf-para-texto"]).toMatchObject({
      label: "PDF para texto",
      workspaceFirst: true,
    });
  });
});
```

- [ ] **Step 2: Run the web test to verify the slug is missing**

Run: `pnpm --dir apps/web test lib/__tests__/pdf-client.test.ts`

Expected: FAIL because `toolPageContent["pdf-para-texto"]` does not exist yet.

- [ ] **Step 3: Add the page definition and route**

```tsx
// apps/web/app/pdf-para-texto/page.tsx
import { ToolLanding } from "@/components/tool-landing";
import { buildMetadata, toolPageContent } from "@/lib/site";

export const metadata = buildMetadata({
  title: toolPageContent["pdf-para-texto"].title,
  description: toolPageContent["pdf-para-texto"].description,
  keywords: toolPageContent["pdf-para-texto"].keywords,
  pathname: "/pdf-para-texto",
});

export default function PdfToTextPage() {
  return <ToolLanding slug="pdf-para-texto" />;
}
```

- [ ] **Step 4: Update the shared content registries**

```ts
"pdf-para-texto": {
  label: "PDF para texto",
  title: "PDF para texto com OCR online e saida editavel | Scanlume",
  description: "Converta PDF em texto com OCR online. Extraia paginas com texto nativo ou escaneado e baixe em PDF pesquisavel, PDF reorganizado, HTML e Markdown.",
  workspaceFirst: true,
  primaryNav: true,
  defaultMode: "formatted",
  // ...rest of the page copy
}
```

- [ ] **Step 5: Update `tool-landing.tsx` only if PDF-specific helper copy needs branching**

```tsx
const acceptsPdf = slug === "pdf-para-texto" || slug === "imagem-para-texto";
```

- [ ] **Step 6: Re-run the site-content test**

Run: `pnpm --dir apps/web test lib/__tests__/pdf-client.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit the landing-page work**

```bash
git add apps/web/lib/site.ts apps/web/lib/llms.ts apps/web/components/tool-landing.tsx apps/web/app/pdf-para-texto/page.tsx apps/web/lib/__tests__/pdf-client.test.ts
git commit -m "feat: add dedicated PDF OCR landing page"
```

## Task 7: Run the full verification suite and prepare the branch for push

**Files:**
- Modify: any files touched in Tasks 1-6 as needed for final cleanups

- [ ] **Step 1: Run the API test suite**

Run: `pnpm --dir apps/api test`

Expected: PASS with all PDF quota, schema, segmentation, and export tests green.

- [ ] **Step 2: Run the web test suite**

Run: `pnpm --dir apps/web test`

Expected: PASS with workspace and PDF client tests green.

- [ ] **Step 3: Run lint/type/build verification**

Run: `pnpm lint && pnpm build`

Expected: PASS with no TypeScript or Next.js build failures.

- [ ] **Step 4: Run a manual smoke test checklist**

```txt
1. Upload one JPG and confirm the existing `/v1/ocr` flow still works.
2. Upload `apps/api/src/lib/__fixtures__/pdf/native-text.pdf` and confirm text-layer pages stay searchable.
3. Upload `apps/api/src/lib/__fixtures__/pdf/scanned-image.pdf` and confirm OCR fallback produces preview + exports.
4. Upload `apps/api/src/lib/__fixtures__/pdf/mixed-two-column.pdf` and confirm reading order matches the mixed-layout expectation.
5. Upload `apps/api/src/lib/__fixtures__/pdf/anon-over-limit.pdf` anonymously and confirm processed/locked page counts plus upsell CTA.
6. Upload `apps/api/src/lib/__fixtures__/pdf/logged-in-over-remaining.pdf` while logged in and confirm the remaining-page messaging updates.
7. Download searchable PDF, reflowed PDF, HTML, Markdown, and TXT from a successful PDF result.
8. Visit `/pdf-para-texto` and confirm metadata/content render correctly.
```

- [ ] **Step 5: Commit the final verification fixes**

```bash
git add package.json pnpm-lock.yaml apps/api apps/web docs/superpowers/plans/2026-04-02-pdf-ocr-expansion.md
git commit -m "feat: launch PDF OCR workflow"
```
