import { z } from "zod";

export const pdfPreparedPageSchema = z.object({
  pageNumber: z.number().int().positive(),
  source: z.enum(["text-layer", "ocr", "mixed"]),
  pagePngBase64: z.string().min(1).optional(),
  nativeTextBlocks: z.array(
    z.object({
      text: z.string(),
      bbox: z.object({
        x: z.number(),
        y: z.number(),
        width: z.number(),
        height: z.number(),
      }),
    }),
  ),
  ocrRegions: z.array(
    z.object({
      id: z.string().min(1),
      imageBase64: z.string().min(1),
      bbox: z.object({
        x: z.number(),
        y: z.number(),
        width: z.number(),
        height: z.number(),
      }),
    }),
  ),
});

export const pdfOcrUploadSchema = z.object({
  file: z.instanceof(File),
  browserId: z.string().min(8),
  totalPages: z.number().int().positive(),
  sourcePath: z.string().trim().min(1).max(300).optional(),
  preparedPages: z.array(pdfPreparedPageSchema),
});

export const billingUpsellSchema = z.object({
  required: z.boolean(),
  message: z.string(),
  ctaLabel: z.string(),
  ctaHref: z.string(),
});

export const pdfLimitSnapshotSchema = z.object({
  maxFileMb: z.number().positive(),
  maxPagesPerDocument: z.number().int().positive(),
  requestPageLimitAnonymous: z.number().int().positive(),
  dailyPageLimitLoggedIn: z.number().int().positive(),
  remainingPages: z.number().int().min(0),
});

export type PdfLimitSnapshot = z.infer<typeof pdfLimitSnapshotSchema>;
