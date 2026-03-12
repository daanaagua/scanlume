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

export const supportCategorySchema = z.enum([
  "usage",
  "complaint",
  "suggestion",
  "bug",
  "billing",
  "account",
  "other",
]);

export const supportPrioritySchema = z.enum(["low", "medium", "high"]);

export const supportProfileSchema = z.object({
  name: z.string().max(120).default(""),
  email: z.string().max(190).default(""),
});

export const supportAssistantSchema = z.object({
  reply_user: z.string().min(1).max(3000),
  category: supportCategorySchema,
  priority: supportPrioritySchema,
  needs_human: z.boolean(),
  human_reason: z.string().max(500).default(""),
  summary_for_team: z.string().min(1).max(600),
  collected_user_profile: supportProfileSchema,
});

export const supportChatRequestSchema = z.object({
  browserId: z.string().min(8).max(128).optional(),
  conversationId: z.string().min(8).max(64).optional(),
  name: z.string().trim().min(1).max(120).optional(),
  email: z.string().trim().email().max(190).optional(),
  message: z.string().trim().min(1).max(4000),
  sourcePath: z.string().trim().min(1).max(300).optional(),
});

export const supportAssistantJsonSchema = {
  name: "scanlume_support_reply",
  strict: true,
  schema: {
    type: "object",
    properties: {
      reply_user: {
        type: "string",
      },
      category: {
        type: "string",
        enum: ["usage", "complaint", "suggestion", "bug", "billing", "account", "other"],
      },
      priority: {
        type: "string",
        enum: ["low", "medium", "high"],
      },
      needs_human: {
        type: "boolean",
      },
      human_reason: {
        type: "string",
      },
      summary_for_team: {
        type: "string",
      },
      collected_user_profile: {
        type: "object",
        properties: {
          name: { type: "string" },
          email: { type: "string" },
        },
        required: ["name", "email"],
        additionalProperties: false,
      },
    },
    required: [
      "reply_user",
      "category",
      "priority",
      "needs_human",
      "human_reason",
      "summary_for_team",
      "collected_user_profile",
    ],
    additionalProperties: false,
  },
} as const;

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
export type SupportAssistant = z.infer<typeof supportAssistantSchema>;
export type SupportCategory = z.infer<typeof supportCategorySchema>;
export type SupportChatRequest = z.infer<typeof supportChatRequestSchema>;
export type SupportPriority = z.infer<typeof supportPrioritySchema>;
