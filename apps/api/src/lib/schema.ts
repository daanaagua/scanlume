import { z } from "zod";

export const modeSchema = z.enum(["simple", "formatted"]);

export const imagePayloadSchema = z.object({
  name: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(120),
  dataUrl: z.string().startsWith("data:"),
  size: z.number().int().positive(),
});

export const ocrRequestSchema = z.object({
  mode: modeSchema,
  image: imagePayloadSchema,
  browserId: z.string().min(8).max(128).optional(),
  turnstileToken: z.string().min(10).optional(),
});

export const formattedBlockSchema = z.object({
  type: z.enum(["h1", "h2", "p", "br"]),
  text: z.string().default(""),
  order: z.number(),
});

export const formattedBlocksEnvelopeSchema = z.object({
  blocks: z.array(formattedBlockSchema).min(1),
});

export const formattedJsonSchema = {
  name: "formatted_blocks",
  strict: true,
  schema: {
    type: "object",
    properties: {
      blocks: {
        type: "array",
        items: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["h1", "h2", "p", "br"],
            },
            text: {
              type: "string",
            },
            order: {
              type: "number",
            },
          },
          required: ["type", "text", "order"],
          additionalProperties: false,
        },
        minItems: 1,
      },
    },
    required: ["blocks"],
    additionalProperties: false,
  },
} as const;

export type Mode = z.infer<typeof modeSchema>;
export type OcrRequest = z.infer<typeof ocrRequestSchema>;
export type FormattedBlock = z.infer<typeof formattedBlockSchema>;
