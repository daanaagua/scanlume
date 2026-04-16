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

const authEmailSchema = z.string().trim().email().max(190).transform((value) => value.toLowerCase());
const authPasswordSchema = z.string().min(8).max(128);

export const authRegisterSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: authEmailSchema,
  password: authPasswordSchema,
});

export const authLoginSchema = z.object({
  email: authEmailSchema,
  password: authPasswordSchema,
});

export const authForgotPasswordSchema = z.object({
  email: authEmailSchema,
});

export const authVerifyEmailSchema = z.object({
  token: z.string().min(20).max(255),
});

export const authResetPasswordSchema = z.object({
  token: z.string().min(20).max(255),
  password: authPasswordSchema,
});

const formattedTextBlockTypes = ["h1", "h2", "p", "br"] as const;
const formattedTableAlignments = ["left", "center", "right"] as const;

export const formattedTextBlockSchema = z.object({
  type: z.enum(formattedTextBlockTypes),
  text: z.string().default(""),
  order: z.number(),
});

export const formattedTableCellSchema = z.object({
  rowStart: z.number().int().positive(),
  rowEnd: z.number().int().positive(),
  colStart: z.number().int().positive(),
  colEnd: z.number().int().positive(),
  text: z.string().default(""),
  isHeader: z.boolean().default(false),
  align: z.enum(formattedTableAlignments).default("left"),
});

export const formattedTableRowGroupSchema = z.object({
  label: z.string().default(""),
  rowStart: z.number().int().positive(),
  rowEnd: z.number().int().positive(),
});

export const formattedTableRecordFieldSchema = z.object({
  column: z.string().min(1).max(200),
  value: z.string().default(""),
});

export const formattedTableRecordSchema = z.object({
  rowNumber: z.number().int().positive(),
  groupLabel: z.string().default(""),
  fields: z.array(formattedTableRecordFieldSchema).default([]),
});

export const formattedTableBlockSchema = z.object({
  type: z.literal("table"),
  order: z.number(),
  title: z.string().default(""),
  columns: z.array(z.string().min(1).max(200)).default([]),
  headerRows: z.array(z.number().int().positive()).default([]),
  cells: z.array(formattedTableCellSchema).min(1),
  rowGroups: z.array(formattedTableRowGroupSchema).default([]),
  records: z.array(formattedTableRecordSchema).default([]),
  notes: z.array(z.string()).default([]),
});

export const formattedBlockSchema = z.union([formattedTextBlockSchema, formattedTableBlockSchema]);

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
          anyOf: [
            {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  enum: [...formattedTextBlockTypes],
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
            {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  const: "table",
                },
                order: {
                  type: "number",
                },
                title: {
                  type: "string",
                },
                columns: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                headerRows: {
                  type: "array",
                  items: {
                    type: "integer",
                  },
                },
                cells: {
                  type: "array",
                  minItems: 1,
                  items: {
                    type: "object",
                    properties: {
                      rowStart: { type: "integer" },
                      rowEnd: { type: "integer" },
                      colStart: { type: "integer" },
                      colEnd: { type: "integer" },
                      text: { type: "string" },
                      isHeader: { type: "boolean" },
                      align: {
                        type: "string",
                        enum: [...formattedTableAlignments],
                      },
                    },
                    required: ["rowStart", "rowEnd", "colStart", "colEnd", "text", "isHeader", "align"],
                    additionalProperties: false,
                  },
                },
                rowGroups: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      label: { type: "string" },
                      rowStart: { type: "integer" },
                      rowEnd: { type: "integer" },
                    },
                    required: ["label", "rowStart", "rowEnd"],
                    additionalProperties: false,
                  },
                },
                records: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      rowNumber: { type: "integer" },
                      groupLabel: { type: "string" },
                      fields: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            column: { type: "string" },
                            value: { type: "string" },
                          },
                          required: ["column", "value"],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ["rowNumber", "groupLabel", "fields"],
                    additionalProperties: false,
                  },
                },
                notes: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
              },
              required: ["type", "order", "title", "columns", "headerRows", "cells", "rowGroups", "records", "notes"],
              additionalProperties: false,
            },
          ],
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
export type FormattedTableBlock = z.infer<typeof formattedTableBlockSchema>;
export type FormattedTableCell = z.infer<typeof formattedTableCellSchema>;
export type FormattedTableRecord = z.infer<typeof formattedTableRecordSchema>;
export type FormattedTableRowGroup = z.infer<typeof formattedTableRowGroupSchema>;
export type FormattedTextBlock = z.infer<typeof formattedTextBlockSchema>;
export type SupportAssistant = z.infer<typeof supportAssistantSchema>;
export type SupportCategory = z.infer<typeof supportCategorySchema>;
export type SupportChatRequest = z.infer<typeof supportChatRequestSchema>;
export type SupportPriority = z.infer<typeof supportPrioritySchema>;
export type AuthForgotPasswordRequest = z.infer<typeof authForgotPasswordSchema>;
export type AuthLoginRequest = z.infer<typeof authLoginSchema>;
export type AuthRegisterRequest = z.infer<typeof authRegisterSchema>;
export type AuthResetPasswordRequest = z.infer<typeof authResetPasswordSchema>;
export type AuthVerifyEmailRequest = z.infer<typeof authVerifyEmailSchema>;
