import { Hono } from "hono";
import { cors } from "hono/cors";

import {
  blocksToHtml,
  blocksToMarkdown,
  blocksToText,
  extractResponseText,
} from "./lib/formatters";
import {
  FORMATTED_PROMPT,
  FORMATTED_SYSTEM_PROMPT,
  SIMPLE_PROMPT,
} from "./lib/prompts";
import {
  formattedBlocksEnvelopeSchema,
  formattedJsonSchema,
  ocrRequestSchema,
} from "./lib/schema";
import {
  getClientIp,
  persistUsageEvent,
  readBudgetState,
  readNumber,
  readRateState,
  sha256Hex,
  todayKey,
  type WorkerEnv,
  writeBudgetState,
  writeRateState,
} from "./lib/store";

const INPUT_PRICE_PER_M = 0.8;
const OUTPUT_PRICE_PER_M = 2.0;
const CACHE_HIT_PRICE_PER_M = 0.16;

type AppBindings = {
  Bindings: WorkerEnv;
};

const app = new Hono<AppBindings>();

app.use("*", cors());

app.get("/", (c) =>
  c.json({
    app: c.env.APP_NAME ?? "scanlume",
    status: "ok",
    docs: ["/v1/health", "/v1/limits", "/v1/ocr"],
  }),
);

app.get("/v1/health", (c) =>
  c.json({
    status: "ok",
    provider: "ark",
    modelConfigured: Boolean(c.env.ARK_MODEL),
    turnstileConfigured: Boolean(c.env.TURNSTILE_SECRET_KEY),
    d1Configured: Boolean(c.env.DB),
    kvConfigured: Boolean(c.env.RATE_LIMITS),
  }),
);

app.get("/v1/limits", async (c) => {
  const date = todayKey();
  const budget = await readBudgetState(c.env, date);
  const softBudgetRmb = readNumber(c.env.SOFT_BUDGET_RMB, 18);
  const hardBudgetRmb = readNumber(c.env.HARD_BUDGET_RMB, 20);

  return c.json({
    limits: {
      dailyImages: readNumber(c.env.DAILY_IMAGE_LIMIT, 5),
      dailyCredits: readNumber(c.env.DAILY_CREDIT_LIMIT, 5),
      maxImageMb: readNumber(c.env.MAX_IMAGE_MB, 5),
      maxBatchFiles: readNumber(c.env.MAX_BATCH_FILES, 10),
      maxBatchTotalMb: readNumber(c.env.MAX_BATCH_TOTAL_MB, 20),
      softBudgetRmb,
      hardBudgetRmb,
    },
    budget,
    status: {
      softStopped: budget.totalCostRmb >= softBudgetRmb,
      hardStopped: budget.totalCostRmb >= hardBudgetRmb,
    },
  });
});

app.post("/v1/ocr", async (c) => {
  if (!c.env.ARK_API_KEY || !c.env.ARK_MODEL) {
    return c.json(
      {
        error: "Ark credentials are missing. Configure ARK_MODEL and ARK_API_KEY in the worker.",
      },
      500,
    );
  }

  const payload = await c.req.json().catch(() => null);
  const parsed = ocrRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return c.json({ error: "Invalid request payload.", details: parsed.error.flatten() }, 400);
  }

  const { image, mode, browserId, turnstileToken } = parsed.data;
  const imageLimitBytes = readNumber(c.env.MAX_IMAGE_MB, 5) * 1024 * 1024;
  if (image.size > imageLimitBytes) {
    return c.json({ error: "The selected image exceeds the 5 MB limit." }, 413);
  }

  const clientIp = getClientIp(c.req.raw);
  const resolvedBrowserId = browserId ?? "anonymous-browser";
  const rateKey = await sha256Hex(`${clientIp}:${resolvedBrowserId}`);
  const ipHash = await sha256Hex(clientIp);
  const date = todayKey();
  const rateState = await readRateState(c.env, rateKey, date);
  const budgetState = await readBudgetState(c.env, date);

  const requestedCredits = mode === "formatted" ? 3 : 1;
  const dailyImageLimit = readNumber(c.env.DAILY_IMAGE_LIMIT, 5);
  const dailyCreditLimit = readNumber(c.env.DAILY_CREDIT_LIMIT, 5);
  const softBudgetRmb = readNumber(c.env.SOFT_BUDGET_RMB, 18);
  const hardBudgetRmb = readNumber(c.env.HARD_BUDGET_RMB, 20);
  const preflightEstimate = estimatePreflightCost(mode, image.size);

  if (rateState.usedImages + 1 > dailyImageLimit) {
    return c.json({ error: "Daily image limit reached.", code: "daily_image_limit" }, 429);
  }

  if (rateState.usedCredits + requestedCredits > dailyCreditLimit) {
    return c.json({ error: "Daily credits exhausted.", code: "daily_credit_limit" }, 429);
  }

  if (budgetState.totalCostRmb >= hardBudgetRmb) {
    return c.json({ error: "Daily budget cap reached.", code: "hard_budget_stop" }, 429);
  }

  if (budgetState.totalCostRmb + preflightEstimate > hardBudgetRmb) {
    return c.json({ error: "This request would exceed the hard daily budget.", code: "budget_preflight_stop" }, 429);
  }

  const turnstileOk = await verifyTurnstile(c.env, turnstileToken, clientIp);
  if (!turnstileOk) {
    return c.json({ error: "Turnstile validation failed.", code: "turnstile_failed" }, 400);
  }

  const startedAt = Date.now();
  const result = mode === "simple"
    ? await runSimpleOcr(c.env, image.dataUrl)
    : await runFormattedOcr(c.env, image.dataUrl);

  if (!result.ok) {
    return c.json({ error: result.error }, 502);
  }

  const actualCost = calcCost(result.usage);
  const nextRateState = {
    usedImages: rateState.usedImages + 1,
    usedCredits: rateState.usedCredits + requestedCredits,
  };
  const nextBudgetState = {
    totalCostRmb: round8(budgetState.totalCostRmb + actualCost.total_rmb),
    totalRequests: budgetState.totalRequests + 1,
    totalImages: budgetState.totalImages + 1,
  };

  await writeRateState(c.env, rateKey, date, nextRateState);
  await writeBudgetState(c.env, date, nextBudgetState);

  const createdAt = new Date().toISOString();
  await persistUsageEvent(c.env, {
    id: crypto.randomUUID(),
    ipHash,
    browserId: resolvedBrowserId,
    mode,
    imageCount: 1,
    inputTokens: result.usage.input_tokens,
    outputTokens: result.usage.output_tokens,
    costRmb: actualCost.total_rmb,
    createdAt,
    date,
    rateKey,
    usedImages: nextRateState.usedImages,
    usedCredits: nextRateState.usedCredits,
    softStopped: nextBudgetState.totalCostRmb >= softBudgetRmb,
    hardStopped: nextBudgetState.totalCostRmb >= hardBudgetRmb,
  });

  return c.json({
    mode,
    result: result.payload,
    usage: {
      ...result.usage,
      cost_rmb: actualCost,
      elapsed_ms: Date.now() - startedAt,
    },
    limits: {
      remainingImages: Math.max(dailyImageLimit - nextRateState.usedImages, 0),
      remainingCredits: Math.max(dailyCreditLimit - nextRateState.usedCredits, 0),
      softBudgetReached: nextBudgetState.totalCostRmb >= softBudgetRmb,
      hardBudgetReached: nextBudgetState.totalCostRmb >= hardBudgetRmb,
      totalBudgetRmb: nextBudgetState.totalCostRmb,
    },
  });
});

async function runSimpleOcr(env: WorkerEnv, imageUrl: string) {
  const response = await fetch(`${env.ARK_API_BASE}/responses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.ARK_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.ARK_MODEL,
      max_output_tokens: 1200,
      thinking: { type: "disabled" },
      input: [
        {
          role: "user",
          content: [
            { type: "input_image", image_url: imageUrl },
            { type: "input_text", text: SIMPLE_PROMPT },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    return { ok: false as const, error: await response.text() };
  }

  const data = (await response.json()) as Record<string, unknown>;
  const text = extractResponseText(data);
  if (!text) {
    return { ok: false as const, error: "No text returned from the OCR response." };
  }

  return {
    ok: true as const,
    payload: {
      txt: text,
      preview: text,
    },
    usage: normalizeUsage(data),
  };
}

async function runFormattedOcr(env: WorkerEnv, imageUrl: string) {
  const response = await fetch(`${env.ARK_API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.ARK_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.ARK_MODEL,
      thinking: { type: "disabled" },
      messages: [
        {
          role: "system",
          content: FORMATTED_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: [
            { type: "text", text: FORMATTED_PROMPT },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: formattedJsonSchema,
      },
    }),
  });

  if (!response.ok) {
    return { ok: false as const, error: await response.text() };
  }

  const data = (await response.json()) as Record<string, unknown>;
  const content = extractChatContent(data);
  if (!content) {
    return { ok: false as const, error: "No structured output returned from the OCR response." };
  }

  const parsedJson = safeParseJson(content);
  const validated = formattedBlocksEnvelopeSchema.safeParse(parsedJson);
  if (!validated.success) {
    return { ok: false as const, error: "Structured OCR output did not match the expected schema." };
  }

  const txt = blocksToText(validated.data.blocks);
  const md = blocksToMarkdown(validated.data.blocks);
  const html = blocksToHtml(validated.data.blocks);

  return {
    ok: true as const,
    payload: {
      txt,
      md,
      html,
      preview: html,
      blocks: validated.data.blocks,
    },
    usage: normalizeUsage(data),
  };
}

function safeParseJson(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function extractChatContent(payload: Record<string, unknown>) {
  const choices = payload.choices;
  if (!Array.isArray(choices) || choices.length === 0) {
    return "";
  }

  const firstChoice = choices[0];
  if (typeof firstChoice !== "object" || firstChoice === null) {
    return "";
  }

  const message = Reflect.get(firstChoice, "message");
  if (typeof message !== "object" || message === null) {
    return "";
  }

  const content = Reflect.get(message, "content");
  return typeof content === "string" ? content : "";
}

function normalizeUsage(payload: Record<string, unknown>) {
  const usage = payload.usage;
  if (typeof usage !== "object" || usage === null) {
    return {
      input_tokens: 0,
      output_tokens: 0,
      input_tokens_details: {
        cached_tokens: 0,
      },
    };
  }

  const inputTokens = numberFromUnknown(Reflect.get(usage, "input_tokens"));
  const outputTokens = numberFromUnknown(Reflect.get(usage, "output_tokens"));
  const inputDetails = Reflect.get(usage, "input_tokens_details");
  const cachedTokens =
    typeof inputDetails === "object" && inputDetails !== null
      ? numberFromUnknown(Reflect.get(inputDetails, "cached_tokens"))
      : 0;

  return {
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    input_tokens_details: {
      cached_tokens: cachedTokens,
    },
  };
}

function numberFromUnknown(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function calcCost(usage: {
  input_tokens: number;
  output_tokens: number;
  input_tokens_details?: { cached_tokens?: number };
}) {
  const cachedTokens = usage.input_tokens_details?.cached_tokens ?? 0;
  const freshInputTokens = Math.max(usage.input_tokens - cachedTokens, 0);

  const inputCost = freshInputTokens / 1_000_000 * INPUT_PRICE_PER_M;
  const cacheCost = cachedTokens / 1_000_000 * CACHE_HIT_PRICE_PER_M;
  const outputCost = usage.output_tokens / 1_000_000 * OUTPUT_PRICE_PER_M;

  return {
    input_rmb: round8(inputCost),
    cache_hit_rmb: round8(cacheCost),
    output_rmb: round8(outputCost),
    total_rmb: round8(inputCost + cacheCost + outputCost),
  };
}

function estimatePreflightCost(mode: "simple" | "formatted", bytes: number) {
  const megabytes = bytes / (1024 * 1024);
  if (mode === "formatted") {
    return megabytes > 2 ? 0.0022 : 0.0012;
  }

  return megabytes > 2 ? 0.007 : 0.001;
}

function round8(value: number) {
  return Math.round(value * 100000000) / 100000000;
}

async function verifyTurnstile(env: WorkerEnv, token: string | undefined, ip: string) {
  if (!env.TURNSTILE_SECRET_KEY) {
    return true;
  }

  if (!token) {
    return false;
  }

  const formData = new FormData();
  formData.set("secret", env.TURNSTILE_SECRET_KEY);
  formData.set("response", token);
  formData.set("remoteip", ip);

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    return false;
  }

  const result = (await response.json()) as { success?: boolean };
  return Boolean(result.success);
}

export default app;
