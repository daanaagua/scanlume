import { Hono, type Context } from "hono";
import { cors } from "hono/cors";

import { buildAccountSnapshot, joinWaitlist, resolveCurrentPlan, type AccountPlan } from "./lib/account";
import {
  authenticatePasswordViewer,
  buildGoogleAuthorizationUrl,
  clearOauthState,
  createUserSession,
  destroyUserSession,
  exchangeGoogleCode,
  fetchGoogleUser,
  getGoogleRedirectUri,
  getSessionViewer,
  getWebOrigin,
  isGoogleAuthConfigured,
  randomToken,
  readOauthState,
  registerPasswordViewer,
  requestEmailVerification,
  requestPasswordReset,
  resetPasswordWithToken,
  sanitizeRedirectPath,
  setOauthState,
  verifyEmailToken,
  upsertGoogleViewer,
} from "./lib/auth";
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
  SUPPORT_SYSTEM_PROMPT,
} from "./lib/prompts";
import { inspectPdfFile, parsePreparedPagesJson } from "./lib/pdf-ingest";
import { defaultPdfUpsell, buildPdfAllowance, countBillablePdfPages, acquirePdfProcessingLock, releasePdfProcessingLock } from "./lib/pdf-limits";
import { assemblePdfDocumentResult, buildPdfRouteOutcome } from "./lib/pdf-ocr";
import { buildPdfRegionPrompt } from "./lib/pdf-prompts";
import { buildPdfPageResult, mapStructuredOcrBlocks } from "./lib/pdf-segmentation";
import type { PdfPageBlock } from "./lib/pdf-segmentation";
import {
  buildReflowedPdfBytes,
  buildSearchablePdfBytes,
  mapPdfExportError,
  signPdfExportToken,
  streamPdfResponse,
  verifyPdfExportToken,
} from "./lib/pdf-export";
import {
  authForgotPasswordSchema,
  authLoginSchema,
  authRegisterSchema,
  authResetPasswordSchema,
  authVerifyEmailSchema,
  formattedBlocksEnvelopeSchema,
  formattedJsonSchema,
  ocrRequestSchema,
  supportAssistantJsonSchema,
  supportAssistantSchema,
  supportChatRequestSchema,
  type SupportAssistant,
} from "./lib/schema";
import { pdfLimitSnapshotSchema, pdfOcrUploadSchema } from "./lib/pdf-schema";
import {
  appendSupportMessage,
  ensureSupportConversation,
  getSupportConversationForViewer,
  listPendingSupportNotifications,
  listSupportMessages,
  markSupportNotificationAttempt,
  markSupportNotificationSent,
  queueSupportNotification,
  toSupportNotificationPayload,
  type SupportMessage,
} from "./lib/support";
import {
  getClientIp,
  persistUsageEvent,
  readBudgetState,
  readCreditBalance,
  readNumber,
  readRateState,
  tryConsumeCredits,
  readUserDailyPdfUsage,
  readUserDailyUsage,
  sha256Hex,
  todayKey,
  type WorkerEnv,
  writeBudgetState,
  writeRateState,
  writeUserDailyPdfUsage,
  writeUserDailyUsage,
} from "./lib/store";

const INPUT_PRICE_PER_M = 0.8;
const OUTPUT_PRICE_PER_M = 2.0;
const CACHE_HIT_PRICE_PER_M = 0.16;

type AppBindings = {
  Bindings: WorkerEnv;
};

type ViewerContext = {
  balance: {
    grantedCredits: number;
    remainingCredits: number;
    usedCredits: number;
  };
  browserId: string;
  clientIp: string;
  currentPlan: AccountPlan;
  dailyCreditLimit: number;
  dailyImageLimit: number;
  rateKey: string | null;
  type: "anonymous" | "user";
  usage: {
    usedCredits: number;
    usedImages: number;
  };
  user: Awaited<ReturnType<typeof getSessionViewer>>;
};

type SupportReplyResult = {
  assistant: SupportAssistant;
  notificationSent: boolean;
  source: "n8n" | "fallback";
};

const app = new Hono<AppBindings>();

function normalizeFormattedBlockType(value?: string): "h1" | "h2" | "p" | "br" {
  return value === "h1" || value === "h2" || value === "br" ? value : "p";
}

function toFormattedBlocks(blocks: PdfPageBlock[]) {
  return blocks
    .filter((block): block is PdfPageBlock & { text: string; order: number } => typeof block.text === "string" && typeof block.order === "number")
    .map((block) => ({
      type: normalizeFormattedBlockType(block.kind),
      text: block.text,
      order: block.order,
    }));
}

app.use("*", async (c, next) => {
  const middleware = cors({
    origin: (origin) => resolveCorsOrigin(c.env, origin),
    allowHeaders: ["Authorization", "Content-Type"],
    allowMethods: ["GET", "POST", "OPTIONS"],
    credentials: true,
  });

  return middleware(c, next);
});

app.get("/", (c) =>
  c.json({
    app: c.env.APP_NAME ?? "scanlume",
    status: "ok",
    docs: [
      "/v1/health",
      "/v1/limits",
      "/v1/me",
      "/v1/account",
      "/v1/waitlist/join",
      "/v1/auth/register",
      "/v1/auth/login",
      "/v1/auth/forgot-password",
      "/v1/auth/reset-password",
      "/v1/auth/verify-email",
      "/v1/auth/google/start",
      "/v1/support/chat",
      "/v1/ocr",
    ],
  }),
);

app.get("/v1/health", (c) =>
  c.json({
    status: "ok",
    provider: "ark",
    modelConfigured: Boolean(c.env.ARK_MODEL),
    googleAuthConfigured: isGoogleAuthConfigured(c.env),
    authEmailConfigured: Boolean(c.env.RESEND_API_KEY && c.env.AUTH_EMAIL_FROM),
    turnstileConfigured: Boolean(c.env.TURNSTILE_SECRET_KEY),
    d1Configured: Boolean(c.env.DB),
    kvConfigured: Boolean(c.env.RATE_LIMITS),
    supportWebhookConfigured: Boolean(c.env.SUPPORT_N8N_WEBHOOK_URL),
    supportSyncConfigured: Boolean(c.env.SUPPORT_SYNC_TOKEN),
  }),
);

app.get("/v1/me", async (c) => {
  const user = await getSessionViewer(c, c.env);

  return c.json({
    authenticated: Boolean(user),
    user,
  });
});

app.get("/v1/account", async (c) => {
  const viewer = await resolveViewerContext(c, c.req.query("browserId") ?? undefined);
  const account = await buildAccountSnapshot(c.env, viewer);
  return c.json(account);
});

app.post("/v1/waitlist/join", async (c) => {
  const user = await getSessionViewer(c, c.env);
  if (!user) {
    return c.json({ error: "Authentication required." }, 401);
  }

  const payload = await c.req.json().catch(() => null);
  const source =
    payload && typeof payload === "object" && typeof Reflect.get(payload, "source") === "string"
      ? String(Reflect.get(payload, "source")).slice(0, 60)
      : "account";

  const waitlist = await joinWaitlist(c.env, {
    user,
    source,
    now: new Date().toISOString(),
  });

  return c.json({
    ok: true,
    waitlist,
  });
});

app.get("/v1/support/conversations/:conversationId", async (c) => {
  const user = await getSessionViewer(c, c.env);
  const browserId = c.req.query("browserId") ?? "anonymous-browser";
  const conversation = await getSupportConversationForViewer(c.env, {
    conversationId: c.req.param("conversationId"),
    user,
    browserId,
  });

  if (!conversation) {
    return c.json({ error: "Conversation not found." }, 404);
  }

  const messages = await listSupportMessages(c.env, conversation.id, 40);
  return c.json({
    conversation,
    messages,
    viewer: {
      authenticated: Boolean(user),
      user,
    },
  });
});

app.post("/v1/support/chat", async (c) => {
  const payload = await c.req.json().catch(() => null);
  const parsed = supportChatRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return c.json({ error: "Invalid support payload.", details: parsed.error.flatten() }, 400);
  }

  const user = await getSessionViewer(c, c.env);
  const browserId = parsed.data.browserId ?? "anonymous-browser";
  const name = (user?.name ?? parsed.data.name ?? "").trim();
  const email = (user?.email ?? parsed.data.email ?? "").trim();

  if (!email) {
    return c.json({ error: "Email is required for anonymous support messages." }, 400);
  }

  const sourcePath = sanitizeRedirectPath(parsed.data.sourcePath ?? "/contato");
  const createdAt = new Date().toISOString();
  const conversation = await ensureSupportConversation(c.env, {
    conversationId: parsed.data.conversationId,
    user,
    browserId,
    name: name || email,
    email,
    sourcePath,
    now: createdAt,
  });

  const priorMessages = await listSupportMessages(c.env, conversation.id, 10);
  const userMessage = await appendSupportMessage(c.env, {
    conversationId: conversation.id,
    role: "user",
    body: parsed.data.message,
    createdAt,
  });
  const conversationHistory = [...priorMessages, userMessage].slice(-10);

  const reply = await runSupportAssistant(c.env, {
    conversation,
    user,
    messages: conversationHistory,
  });

  const assistantMessage = await appendSupportMessage(c.env, {
    conversationId: conversation.id,
    role: "assistant",
    body: reply.assistant.reply_user,
    category: reply.assistant.category,
    priority: reply.assistant.priority,
    needsHuman: reply.assistant.needs_human,
    humanReason: reply.assistant.human_reason,
    summaryForTeam: reply.assistant.summary_for_team,
    createdAt: new Date().toISOString(),
  });

  const notificationId = await queueSupportNotification(c.env, {
    conversationId: conversation.id,
    userMessageId: userMessage.id,
    assistantMessageId: assistantMessage.id,
    payload: toSupportNotificationPayload({
      conversation,
      user,
      userMessage,
      assistantMessage,
      assistant: reply.assistant,
    }),
    createdAt: assistantMessage.createdAt,
  });

  if (reply.notificationSent) {
    await markSupportNotificationSent(c.env, notificationId, new Date().toISOString());
  }

  return c.json({
    conversationId: conversation.id,
    contactProfile: {
      name: conversation.name,
      email: conversation.email,
    },
    assistant: {
      replyUser: reply.assistant.reply_user,
      category: reply.assistant.category,
      priority: reply.assistant.priority,
      needsHuman: reply.assistant.needs_human,
      humanReason: reply.assistant.human_reason,
      summaryForTeam: reply.assistant.summary_for_team,
      source: reply.source,
    },
    messages: [userMessage, assistantMessage],
    viewer: {
      authenticated: Boolean(user),
      user,
    },
  });
});

app.get("/v1/support/pending-notifications", async (c) => {
  if (!isSupportSyncAuthorized(c)) {
    return c.json({ error: "Unauthorized." }, 401);
  }

  const limit = clampNumber(Number(c.req.query("limit") ?? 20), 1, 50);
  const items = await listPendingSupportNotifications(c.env, limit);
  return c.json({
    items,
    count: items.length,
  });
});

app.post("/v1/support/pending-notifications/:notificationId/ack", async (c) => {
  if (!isSupportSyncAuthorized(c)) {
    return c.json({ error: "Unauthorized." }, 401);
  }

  const payload = await c.req.json().catch(() => null);
  const delivered = Boolean(payload && typeof payload === "object" && Reflect.get(payload, "delivered") === true);
  const error = payload && typeof payload === "object" ? String(Reflect.get(payload, "error") ?? "") : "";
  const notificationId = c.req.param("notificationId");
  const now = new Date().toISOString();

  if (delivered) {
    await markSupportNotificationSent(c.env, notificationId, now);
    return c.json({ ok: true, status: "sent" });
  }

  await markSupportNotificationAttempt(c.env, notificationId, error || "delivery_failed", now);
  return c.json({ ok: true, status: "pending" });
});

app.post("/v1/auth/register", async (c) => {
  const payload = await c.req.json().catch(() => null);
  const parsed = authRegisterSchema.safeParse(payload);
  if (!parsed.success) {
    return c.json({ error: "Invalid registration payload.", details: parsed.error.flatten() }, 400);
  }

  try {
    const user = await registerPasswordViewer(c.env, parsed.data);
    const verification = user.emailVerified
      ? { emailDeliveryConfigured: Boolean(c.env.RESEND_API_KEY && c.env.AUTH_EMAIL_FROM), emailSent: false }
      : await requestEmailVerification(c.env, user).catch((error) => {
          logAuthError(c, "register.send_verification", error, { emailHint: maskEmail(parsed.data.email) });
          return {
            emailDeliveryConfigured: Boolean(c.env.RESEND_API_KEY && c.env.AUTH_EMAIL_FROM),
            emailSent: false,
          };
        });

    return c.json({
      ok: true,
      requiresEmailVerification: !user.emailVerified,
      emailHint: maskEmail(parsed.data.email),
      verification,
    });
  } catch (error) {
    logAuthError(c, "register", error, { emailHint: maskEmail(parsed.data.email) });
    return c.json(toAuthErrorPayload(error), toAuthErrorStatus(error));
  }
});

app.post("/v1/auth/login", async (c) => {
  const payload = await c.req.json().catch(() => null);
  const parsed = authLoginSchema.safeParse(payload);
  if (!parsed.success) {
    return c.json({ error: "Invalid login payload.", details: parsed.error.flatten() }, 400);
  }

  try {
    const user = await authenticatePasswordViewer(c.env, parsed.data.email, parsed.data.password);
    await createUserSession(c, c.env, user.id);

    return c.json({
      ok: true,
      viewer: {
        authenticated: true,
        user,
      },
    });
  } catch (error) {
    logAuthError(c, "login", error, { emailHint: maskEmail(parsed.data.email) });
    return c.json(toAuthErrorPayload(error), toAuthErrorStatus(error));
  }
});

app.post("/v1/auth/forgot-password", async (c) => {
  const payload = await c.req.json().catch(() => null);
  const parsed = authForgotPasswordSchema.safeParse(payload);
  if (!parsed.success) {
    return c.json({ error: "Invalid forgot password payload.", details: parsed.error.flatten() }, 400);
  }

  try {
    const result = await requestPasswordReset(c.env, parsed.data.email);
    return c.json({
      ok: true,
      emailDeliveryConfigured: result.emailDeliveryConfigured,
      message:
        result.emailDeliveryConfigured
          ? "Se o email existir, enviaremos um link de redefinicao em instantes."
          : "O fluxo foi preparado, mas o envio de email ainda nao esta configurado no ambiente.",
    });
  } catch (error) {
    logAuthError(c, "forgot_password", error, { emailHint: maskEmail(parsed.data.email) });
    return c.json(toAuthErrorPayload(error), toAuthErrorStatus(error));
  }
});

app.post("/v1/auth/verify-email", async (c) => {
  const payload = await c.req.json().catch(() => null);
  const parsed = authVerifyEmailSchema.safeParse(payload);
  if (!parsed.success) {
    return c.json({ error: "Invalid verification payload.", details: parsed.error.flatten() }, 400);
  }

  try {
    const user = await verifyEmailToken(c.env, parsed.data.token);
    await createUserSession(c, c.env, user.id);
    return c.json({ ok: true, viewer: { authenticated: true, user } });
  } catch (error) {
    logAuthError(c, "verify_email", error);
    return c.json(toAuthErrorPayload(error), toAuthErrorStatus(error));
  }
});

app.post("/v1/auth/resend-verification", async (c) => {
  const user = await getSessionViewer(c, c.env, { allowUnverified: true });
  if (!user) {
    return c.json({ error: "Authentication required." }, 401);
  }

  if (user.emailVerified) {
    return c.json({ ok: true, emailSent: false, alreadyVerified: true });
  }

  try {
    const result = await requestEmailVerification(c.env, user);
    return c.json({
      ok: true,
      emailSent: result.emailSent,
      emailDeliveryConfigured: result.emailDeliveryConfigured,
    });
  } catch (error) {
    logAuthError(c, "resend_verification", error, { userId: user.id, emailHint: maskEmail(user.email) });
    return c.json(toAuthErrorPayload(error), toAuthErrorStatus(error));
  }
});

app.post("/v1/auth/reset-password", async (c) => {
  const payload = await c.req.json().catch(() => null);
  const parsed = authResetPasswordSchema.safeParse(payload);
  if (!parsed.success) {
    return c.json({ error: "Invalid reset password payload.", details: parsed.error.flatten() }, 400);
  }

  try {
    const user = await resetPasswordWithToken(c.env, parsed.data.token, parsed.data.password);
    await createUserSession(c, c.env, user.id);
    return c.json({ ok: true, viewer: { authenticated: true, user } });
  } catch (error) {
    logAuthError(c, "reset_password", error);
    return c.json(toAuthErrorPayload(error), toAuthErrorStatus(error));
  }
});

app.get("/v1/auth/google/start", async (c) => {
  if (!isGoogleAuthConfigured(c.env)) {
    return c.redirect(buildWebRedirect(c.env, "/imagem-para-texto", "google_not_configured"), 302);
  }

  const redirectTo = sanitizeRedirectPath(c.req.query("redirectTo") ?? "/imagem-para-texto");
  const state = randomToken(24);
  setOauthState(c, c.env, state, redirectTo);

  return c.redirect(buildGoogleAuthorizationUrl(c.env, new URL(c.req.url).origin, state), 302);
});

app.get("/v1/auth/google/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");
  const stored = readOauthState(c);
  clearOauthState(c, c.env);

  if (!code || !state || !stored.state || state !== stored.state) {
    return c.redirect(buildWebRedirect(c.env, stored.redirectTo, "google_state_invalid"), 302);
  }

  try {
    const accessToken = await exchangeGoogleCode(
      c.env,
      code,
      getGoogleRedirectUri(c.env, new URL(c.req.url).origin),
    );
    const googleProfile = await fetchGoogleUser(accessToken);
    const user = await upsertGoogleViewer(c.env, googleProfile);

    await createUserSession(c, c.env, user.id);

    return c.redirect(buildWebRedirect(c.env, stored.redirectTo, "google_connected"), 302);
  } catch (error) {
    const message = error instanceof Error ? error.message : "google_auth_failed";
    logAuthError(c, "google_callback", error, { redirectTo: stored.redirectTo });
    return c.redirect(buildWebRedirect(c.env, stored.redirectTo, "google_auth_failed", message), 302);
  }
});

app.post("/v1/auth/logout", async (c) => {
  await destroyUserSession(c, c.env);
  return c.json({ ok: true });
});

app.get("/v1/limits", async (c) => {
  const date = todayKey();
  const budget = await readBudgetState(c.env, date);
  const softBudgetRmb = readNumber(c.env.SOFT_BUDGET_RMB, 18);
  const hardBudgetRmb = readNumber(c.env.HARD_BUDGET_RMB, 20);
  const viewer = await resolveViewerContext(c, c.req.query("browserId") ?? undefined);
  const derivedRemainingPdfPages = Math.floor(Math.max(viewer.balance.remainingCredits, 0) / 2);
  const derivedGrantedPdfPages = Math.max(Math.floor(Math.max(viewer.balance.grantedCredits, 0) / 2), 1);

  return c.json({
    viewer: {
      authenticated: viewer.type === "user",
      type: viewer.type,
      user: viewer.user,
    },
    plan: {
      id: viewer.currentPlan.id,
      label: viewer.currentPlan.label,
      shortLabel: viewer.currentPlan.shortLabel,
    },
    limits: {
      dailyImages: viewer.dailyImageLimit,
      dailyCredits: viewer.balance.grantedCredits,
      maxImageMb: viewer.currentPlan.entitlements.maxImageMb,
      maxBatchFiles: viewer.currentPlan.entitlements.maxBatchFiles,
      maxBatchTotalMb: viewer.currentPlan.entitlements.maxBatchTotalMb,
      softBudgetRmb,
      hardBudgetRmb,
      pdf: pdfLimitSnapshotSchema.parse({
        maxFileMb: readNumber(c.env.PDF_MAX_FILE_MB, 15),
        maxPagesPerDocument: readNumber(c.env.PDF_MAX_PAGES_PER_DOCUMENT, 50),
        requestPageLimitAnonymous: Math.max(Math.floor(Math.max(viewer.type === "anonymous" ? viewer.balance.grantedCredits : 5, 0) / 2), 1),
        dailyPageLimitLoggedIn: derivedGrantedPdfPages,
        remainingPages: derivedRemainingPdfPages,
      }),
    },
    usage: {
      usedImages: viewer.usage.usedImages,
      usedCredits: viewer.balance.usedCredits,
      remainingImages: Math.max(viewer.dailyImageLimit - viewer.usage.usedImages, 0),
      remainingCredits: viewer.balance.remainingCredits,
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
  const viewer = await resolveViewerContext(c, browserId);
  const imageLimitBytes = viewer.currentPlan.entitlements.maxImageMb * 1024 * 1024;
  if (image.size > imageLimitBytes) {
    return c.json({ error: `The selected image exceeds the ${viewer.currentPlan.entitlements.maxImageMb} MB limit.` }, 413);
  }
  const ipHash = await sha256Hex(viewer.clientIp);
  const date = todayKey();
  const budgetState = await readBudgetState(c.env, date);

  const requestedCredits = mode === "formatted" ? 2 : 1;
  const softBudgetRmb = readNumber(c.env.SOFT_BUDGET_RMB, 18);
  const hardBudgetRmb = readNumber(c.env.HARD_BUDGET_RMB, 20);
  const preflightEstimate = estimatePreflightCost(mode, image.size);

  if (viewer.balance.remainingCredits < requestedCredits) {
    return c.json({ error: "Insufficient credits.", code: "credit_limit" }, 429);
  }

  if (budgetState.totalCostRmb >= hardBudgetRmb) {
    return c.json({ error: "Daily budget cap reached.", code: "hard_budget_stop" }, 429);
  }

  if (budgetState.totalCostRmb + preflightEstimate > hardBudgetRmb) {
    return c.json({ error: "This request would exceed the hard daily budget.", code: "budget_preflight_stop" }, 429);
  }

  const turnstileOk = await verifyTurnstile(c.env, turnstileToken, viewer.clientIp);
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
  const creditActor = viewer.type === "user" && viewer.user
    ? { type: "user" as const, key: viewer.user.id }
    : { type: "anonymous" as const, key: viewer.rateKey ?? "anonymous-browser" };
  const creditSettlement = await tryConsumeCredits(c.env, {
    actor: creditActor,
    amount: requestedCredits,
    now: new Date().toISOString(),
  });
  if (!creditSettlement.ok) {
    return c.json({ error: "Insufficient credits.", code: "credit_limit" }, 429);
  }
  const nextBalance = await readCreditBalance(c.env, creditActor);
  const nextUsageState = {
    usedImages: viewer.usage.usedImages + 1,
    usedCredits: viewer.usage.usedCredits + requestedCredits,
  };
  const nextBudgetState = {
    totalCostRmb: round8(budgetState.totalCostRmb + actualCost.total_rmb),
    totalRequests: budgetState.totalRequests + 1,
    totalImages: budgetState.totalImages + 1,
  };
  const createdAt = new Date().toISOString();

  if (viewer.type === "user" && viewer.user) {
    await writeUserDailyUsage(c.env, viewer.user.id, date, nextUsageState, createdAt);
  } else if (viewer.rateKey) {
    await writeRateState(c.env, viewer.rateKey, date, nextUsageState);
  }
  await writeBudgetState(c.env, date, nextBudgetState);

  await persistUsageEvent(c.env, {
    id: crypto.randomUUID(),
    ipHash,
    browserId: viewer.browserId,
    userId: viewer.user?.id ?? null,
    mode,
    imageCount: 1,
    inputTokens: result.usage.input_tokens,
    outputTokens: result.usage.output_tokens,
    costRmb: actualCost.total_rmb,
    createdAt,
    date,
    rateKey: viewer.rateKey ?? undefined,
    usedImages: nextUsageState.usedImages,
    usedCredits: nextUsageState.usedCredits,
    softStopped: nextBudgetState.totalCostRmb >= softBudgetRmb,
    hardStopped: nextBudgetState.totalCostRmb >= hardBudgetRmb,
  });

  return c.json({
    mode,
    viewer: {
      authenticated: viewer.type === "user",
      type: viewer.type,
      user: viewer.user,
    },
    plan: {
      id: viewer.currentPlan.id,
      label: viewer.currentPlan.label,
      shortLabel: viewer.currentPlan.shortLabel,
    },
    result: result.payload,
    usage: {
      ...result.usage,
      cost_rmb: actualCost,
      elapsed_ms: Date.now() - startedAt,
    },
    limits: {
      remainingImages: Math.max(viewer.dailyImageLimit - nextUsageState.usedImages, 0),
      remainingCredits: nextBalance.remainingCredits,
      softBudgetReached: nextBudgetState.totalCostRmb >= softBudgetRmb,
      hardBudgetReached: nextBudgetState.totalCostRmb >= hardBudgetRmb,
      totalBudgetRmb: nextBudgetState.totalCostRmb,
      dailyImageLimit: viewer.dailyImageLimit,
      dailyCreditLimit: nextBalance.grantedCredits,
    },
  });
});

app.post("/v1/pdf/ocr", async (c) => {
  if (!c.env.ARK_API_KEY || !c.env.ARK_MODEL) {
    return c.json({ error: "Ark credentials are missing. Configure ARK_MODEL and ARK_API_KEY in the worker." }, 500);
  }

  const form = await c.req.formData();
  const file = form.get("file");
  const browserId = String(form.get("browserId") ?? "");
  const totalPages = Number(form.get("totalPages") ?? 0);
  const sourcePath = String(form.get("sourcePath") ?? "");
  const preparedPagesRaw = String(form.get("preparedPages") ?? "[]");

  if (!(file instanceof File)) {
    return c.json({ error: "Invalid request payload.", code: "pdf_file_type_invalid", remainingPdfPagesToday: 0 }, 400);
  }

  const viewer = await resolveViewerContext(c, browserId);
  const lock = viewer.type === "user" && viewer.user ? await acquirePdfProcessingLock({ lockKey: `pdf:${viewer.user.id}` }).catch((error) => null) : null;
  if (viewer.type === "user" && viewer.user && !lock) {
    return c.json({ error: "Another PDF job is already running.", code: "pdf_job_in_progress", remainingPdfPagesToday: Math.floor(Math.max(viewer.balance.remainingCredits, 0) / 2) }, 409);
  }

  try {
    const preparedPages = parsePreparedPagesJson(preparedPagesRaw) as Array<{
      pageNumber: number;
      source: "text-layer" | "ocr" | "mixed";
      width: number;
      height: number;
      pagePngBase64?: string;
      nativeTextBlocks: Array<{ text: string; bbox: { x: number; y: number; width: number; height: number } }>;
      ocrRegions: Array<{ id: string; imageBase64: string; bbox: { x: number; y: number; width: number; height: number } }>;
    }>;
    const parsed = pdfOcrUploadSchema.safeParse({ file, browserId, totalPages, sourcePath: sourcePath || undefined, preparedPages });
    if (!parsed.success) {
      return c.json({ error: "Invalid request payload.", code: "pdf_invalid", remainingPdfPagesToday: Math.floor(Math.max(viewer.balance.remainingCredits, 0) / 2) }, 400);
    }

    const inspection = await inspectPdfFile({ file, env: c.env });
    const resolvedTotalPages = parsed.data.totalPages;
    const allowance = buildPdfAllowance({
      viewerType: viewer.type,
      totalPages: resolvedTotalPages,
      remainingCredits: viewer.balance.remainingCredits,
      maxPagesPerDocument: readNumber(c.env.PDF_MAX_PAGES_PER_DOCUMENT, 50),
    });

    if (allowance.processablePages === 0) {
      return c.json(
        {
          error: "Insufficient credits for another PDF page.",
          code: "pdf_page_limit_reached",
          remainingPdfPagesToday: 0,
          totalPages: resolvedTotalPages,
          processablePages: 0,
          lockedPages: resolvedTotalPages,
          billingUpsell: defaultPdfUpsell(),
        },
        429,
      );
    }

    const pages = await Promise.all(
      parsed.data.preparedPages.slice(0, allowance.processablePages).map(async (page) => {
        try {
          if (page.source === "text-layer") {
            const text = page.nativeTextBlocks.map((block: { text: string }) => block.text).join("\n");
            return buildPdfPageResult({
              pageNumber: page.pageNumber,
              status: "success",
              source: page.source,
              width: page.width,
              height: page.height,
              text,
              markdown: text,
              html: `<p>${text.replace(/\n/g, "<br />")}</p>`,
              blocks: page.nativeTextBlocks.map((block: { text: string; bbox: { x: number; y: number; width: number; height: number } }, index: number) => ({
                id: `native-${index}`,
                kind: "p",
                order: index,
                text: block.text,
                source: "text-layer",
                bbox: block.bbox,
              })),
            });
          }

          const ocrTexts: string[] = [];
          const ocrMarkdowns: string[] = [];
          const ocrHtmlSnippets: string[] = [];
          const ocrBlocks: PdfPageBlock[] = [];

          if (page.source === "ocr" && page.pagePngBase64) {
            const result = await runFormattedOcr(
              c.env,
              `data:image/png;base64,${page.pagePngBase64}`,
              buildPdfRegionPrompt({ pageNumber: page.pageNumber, regionKind: "page" }),
            );
            if (!result.ok) {
              throw new Error(result.error);
            }
            ocrTexts.push(result.payload.txt);
            ocrMarkdowns.push(result.payload.md);
            ocrHtmlSnippets.push(result.payload.html);
            ocrBlocks.push(
              ...mapStructuredOcrBlocks({
                idPrefix: `ocr-${page.pageNumber}`,
                orderOffset: 0,
                source: "ocr",
                regionBbox: { x: 0, y: 0, width: page.width, height: page.height },
                blocks: result.payload.blocks,
              }),
            );
          }

          if (page.source === "mixed") {
            let successfulRegions = 0;
            for (const [index, region] of page.ocrRegions.entries()) {
              const result = await runFormattedOcr(
                c.env,
                `data:image/png;base64,${region.imageBase64}`,
                buildPdfRegionPrompt({ pageNumber: page.pageNumber, regionKind: "region" }),
              );
              if (result.ok && result.payload.txt.trim()) {
                successfulRegions += 1;
                ocrTexts.push(result.payload.txt);
                ocrMarkdowns.push(result.payload.md);
                ocrHtmlSnippets.push(result.payload.html);
                ocrBlocks.push(
                  ...mapStructuredOcrBlocks({
                    idPrefix: region.id,
                    orderOffset: page.nativeTextBlocks.length + index * 100,
                    source: "ocr",
                    regionBbox: region.bbox,
                    blocks: result.payload.blocks,
                  }),
                );
              }
            }
            const nativeText = page.nativeTextBlocks.map((block: { text: string }) => block.text).join("\n");
            const combinedText = [nativeText, ...ocrTexts].filter(Boolean).join("\n\n");
            if (page.ocrRegions.length > 0 && successfulRegions === 0) {
              return buildPdfPageResult({
                pageNumber: page.pageNumber,
                status: "failed",
                source: page.source,
                width: page.width,
                height: page.height,
                errorCode: "ocr_failed",
                errorMessage: "Mixed PDF OCR failed for all raster regions.",
                blocks: [],
              });
            }

            const status = successfulRegions === page.ocrRegions.length ? "success" : "partial";
            const combinedStructuredBlocks = [
              ...page.nativeTextBlocks.map((block: { text: string; bbox: { x: number; y: number; width: number; height: number } }, index: number) => ({
                id: `native-${page.pageNumber}-${index}`,
                kind: "p",
                order: index,
                text: block.text,
                source: "text-layer" as const,
                bbox: block.bbox,
              })),
              ...ocrBlocks,
            ];
            const formattedBlocks = toFormattedBlocks(combinedStructuredBlocks);
            return buildPdfPageResult({
              pageNumber: page.pageNumber,
              status,
              source: page.source,
              width: page.width,
              height: page.height,
              text: combinedText,
              markdown: blocksToMarkdown(formattedBlocks),
              html: blocksToHtml(formattedBlocks),
              blocks: combinedStructuredBlocks,
            });
          }

          const combinedText = ocrTexts.join("\n\n");
          const formattedBlocks = toFormattedBlocks(ocrBlocks);
          return buildPdfPageResult({
            pageNumber: page.pageNumber,
            status: "success",
            source: page.source,
            width: page.width,
            height: page.height,
            text: combinedText,
            markdown: formattedBlocks.length > 0 ? blocksToMarkdown(formattedBlocks) : ocrMarkdowns.join("\n\n"),
            html: formattedBlocks.length > 0 ? blocksToHtml(formattedBlocks) : ocrHtmlSnippets.join("\n"),
            blocks: ocrBlocks,
          });
        } catch (error) {
          return buildPdfPageResult({
            pageNumber: page.pageNumber,
            status: "failed",
            source: page.source,
            width: 600,
            height: 800,
            errorCode: "ocr_failed",
            errorMessage: error instanceof Error ? error.message : "Unknown OCR failure",
            blocks: [],
          });
        }
      }),
    );

    const routedPages = buildPdfRouteOutcome({ totalPages: resolvedTotalPages, pages });
    const billablePages = countBillablePdfPages(routedPages);
    const date = todayKey();
    const createdAt = new Date().toISOString();
    const creditActor = viewer.type === "user" && viewer.user
      ? { type: "user" as const, key: viewer.user.id }
      : { type: "anonymous" as const, key: viewer.rateKey ?? "anonymous-browser" };
    const chargedCredits = billablePages * 2;
    const creditSettlement = await tryConsumeCredits(c.env, {
      actor: creditActor,
      amount: chargedCredits,
      now: createdAt,
    });
    if (!creditSettlement.ok) {
      return c.json({ error: "Insufficient credits.", code: "credit_limit", remainingPdfPagesToday: Math.floor(Math.max(creditSettlement.remainingCredits, 0) / 2) }, 429);
    }
    const nextBalance = await readCreditBalance(c.env, creditActor);
    if (viewer.type === "user" && viewer.user) {
      const currentPdfUsage = await readUserDailyPdfUsage(c.env, viewer.user.id, date);
      await writeUserDailyPdfUsage(c.env, viewer.user.id, date, { usedPages: currentPdfUsage.usedPages + billablePages }, createdAt);
    }

    const draft = assemblePdfDocumentResult({
      documentId: inspection.sourceHash,
      fileName: file.name,
      totalPages: resolvedTotalPages,
      pages: routedPages,
      lockedPages: allowance.lockedPages,
      remainingPdfPagesToday: Math.floor(Math.max(nextBalance.remainingCredits, 0) / 2),
      exportToken: "pending",
    });
    const manifestHash = await sha256Hex(JSON.stringify(draft.exportManifest));
    const exportToken = await signPdfExportToken({
      sourceHash: inspection.sourceHash,
      exportManifestHash: manifestHash,
      processedPageNumbers: draft.exportManifest.processedPageNumbers,
      expiresAt: Date.now() + 10 * 60 * 1000,
      secret: c.env.PDF_EXPORT_SIGNING_SECRET ?? "scanlume-dev-secret",
    });

    const result = {
      ...draft,
      exportToken,
    };

    return c.json(result);
  } catch (error) {
    if (error instanceof Error && "status" in error && "code" in error) {
      const pdfError = error as Error & { status: number; code: string; details?: Record<string, unknown> };
      return c.json(
        {
          error: pdfError.message,
          code: pdfError.code,
          remainingPdfPagesToday: Math.floor(Math.max(viewer.balance.remainingCredits, 0) / 2),
          ...(pdfError.details ?? {}),
        },
        pdfError.status as 400 | 413 | 429 | 502,
      );
    }

    return c.json({ error: error instanceof Error ? error.message : "PDF processing failed.", code: "pdf_processing_failed", remainingPdfPagesToday: Math.floor(Math.max(viewer.balance.remainingCredits, 0) / 2) }, 502);
  } finally {
    await releasePdfProcessingLock(lock);
  }
});

app.post("/v1/pdf/export/searchable", async (c) => {
  try {
    const form = await c.req.formData();
    const file = form.get("file");
    const exportToken = String(form.get("exportToken") ?? "");
    const exportManifestPart = form.get("exportManifest");
    if (!(file instanceof File) || !(exportManifestPart instanceof File)) {
      throw new Error("manifest invalid");
    }

    const exportManifest = JSON.parse(await exportManifestPart.text()) as Parameters<typeof buildSearchablePdfBytes>[1];
    const inspection = await inspectPdfFile({ file, env: c.env });
    await verifyPdfExportToken(exportToken, {
      sourceHash: inspection.sourceHash,
      exportManifestHash: await sha256Hex(JSON.stringify(exportManifest)),
      now: Date.now(),
      secret: c.env.PDF_EXPORT_SIGNING_SECRET ?? "scanlume-dev-secret",
    });
    const bytes = await buildSearchablePdfBytes(new Uint8Array(await file.arrayBuffer()), exportManifest);
    return streamPdfResponse(bytes, `${file.name.replace(/\.[^.]+$/, "")}-searchable.pdf`);
  } catch (error) {
    const mapped = mapPdfExportError(error);
    return c.json(mapped, mapped.status as 400 | 502);
  }
});

app.post("/v1/pdf/export/reflowed", async (c) => {
  try {
    const form = await c.req.formData();
    const file = form.get("file");
    const exportToken = String(form.get("exportToken") ?? "");
    const exportManifestPart = form.get("exportManifest");
    if (!(file instanceof File) || !(exportManifestPart instanceof File)) {
      throw new Error("manifest invalid");
    }

    const exportManifest = JSON.parse(await exportManifestPart.text()) as Parameters<typeof buildReflowedPdfBytes>[0];
    const inspection = await inspectPdfFile({ file, env: c.env });
    await verifyPdfExportToken(exportToken, {
      sourceHash: inspection.sourceHash,
      exportManifestHash: await sha256Hex(JSON.stringify(exportManifest)),
      now: Date.now(),
      secret: c.env.PDF_EXPORT_SIGNING_SECRET ?? "scanlume-dev-secret",
    });
    const bytes = await buildReflowedPdfBytes(exportManifest);
    return streamPdfResponse(bytes, `${file.name.replace(/\.[^.]+$/, "")}-reflowed.pdf`);
  } catch (error) {
    const mapped = mapPdfExportError(error);
    return c.json(mapped, mapped.status as 400 | 502);
  }
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

async function runFormattedOcr(env: WorkerEnv, imageUrl: string, promptText = FORMATTED_PROMPT) {
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
            { type: "text", text: promptText },
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

async function resolveViewerContext(c: Context<AppBindings>, browserId?: string): Promise<ViewerContext> {
  const date = todayKey();
  const clientIp = getClientIp(c.req.raw);
  const user = await getSessionViewer(c, c.env);

  if (user) {
    const usage = await readUserDailyUsage(c.env, user.id, date);
    const balance = await readCreditBalance(c.env, { type: "user", key: user.id });
    const resolvedPlan = await resolveCurrentPlan(c.env, {
      type: "user",
      user,
    });
    return {
      balance,
      type: "user",
      user,
      usage,
      clientIp,
      browserId: browserId ?? "logged-in-user",
      rateKey: null,
      currentPlan: resolvedPlan.currentPlan,
      dailyImageLimit: resolvedPlan.currentPlan.entitlements.dailyImages,
      dailyCreditLimit: resolvedPlan.currentPlan.entitlements.dailyCredits,
    };
  }

  const resolvedBrowserId = browserId ?? "anonymous-browser";
  const rateKey = await sha256Hex(`${clientIp}:${resolvedBrowserId}`);
  const usage = await readRateState(c.env, rateKey, date);
  const balance = await readCreditBalance(c.env, { type: "anonymous", key: rateKey });
  const resolvedPlan = await resolveCurrentPlan(c.env, {
    type: "anonymous",
    user: null,
  });

  return {
    balance,
    type: "anonymous",
    user: null,
    usage,
    clientIp,
    browserId: resolvedBrowserId,
    rateKey,
    currentPlan: resolvedPlan.currentPlan,
    dailyImageLimit: resolvedPlan.currentPlan.entitlements.dailyImages,
    dailyCreditLimit: resolvedPlan.currentPlan.entitlements.dailyCredits,
  };
}

async function resolveRemainingPdfPagesToday(env: WorkerEnv, viewer: ViewerContext) {
  if (viewer.type !== "user" || !viewer.user) {
    return 5;
  }

  const usage = await readUserDailyPdfUsage(env, viewer.user.id, todayKey());
  const dailyLimit = readNumber(env.PDF_DAILY_PAGE_LIMIT_LOGGED_IN, 20);
  return Math.max(dailyLimit - usage.usedPages, 0);
}

function buildWebRedirect(env: WorkerEnv, redirectTo: string, status: string, error?: string) {
  const url = new URL(sanitizeRedirectPath(redirectTo), getWebOrigin(env));
  url.searchParams.set("auth", status);
  if (error) {
    url.searchParams.set("error", error.slice(0, 120));
  }
  return url.toString();
}

function resolveCorsOrigin(env: WorkerEnv, requestOrigin?: string) {
  const allowedOrigins = new Set([
    ...getAllowedWebOrigins(env),
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ]);

  if (requestOrigin && allowedOrigins.has(requestOrigin)) {
    return requestOrigin;
  }

  return getWebOrigin(env);
}

function getAllowedWebOrigins(env: WorkerEnv) {
  const primaryOrigin = getWebOrigin(env);
  const allowed = new Set([primaryOrigin]);

  try {
    const url = new URL(primaryOrigin);
    if (url.hostname.startsWith("www.")) {
      allowed.add(`${url.protocol}//${url.hostname.slice(4)}`);
    } else if (!url.hostname.startsWith("localhost") && !url.hostname.startsWith("127.0.0.1")) {
      allowed.add(`${url.protocol}//www.${url.hostname}`);
    }
  } catch {
    return Array.from(allowed);
  }

  return Array.from(allowed);
}

async function runSupportAssistant(
  env: WorkerEnv,
  input: {
    conversation: {
      id: string;
      name: string;
      email: string;
      sourcePath: string;
    };
    user: Awaited<ReturnType<typeof getSessionViewer>>;
    messages: SupportMessage[];
  },
): Promise<SupportReplyResult> {
  const n8nReply = await runSupportViaN8n(env, input);
  if (n8nReply) {
    return n8nReply;
  }

  try {
    return {
      assistant: await runSupportViaArk(env, input),
      notificationSent: false,
      source: "fallback",
    };
  } catch {
    return {
      assistant: {
        reply_user:
          "Recebi sua mensagem e vou encaminhar para o time. Se puder, envie mais detalhes sobre o contexto e o resultado esperado.",
        category: "other",
        priority: "medium",
        needs_human: true,
        human_reason: "support_fallback_failed",
        summary_for_team: "Mensagem recebida, mas o fluxo automatico de suporte falhou e exige acompanhamento humano.",
        collected_user_profile: {
          name: input.conversation.name,
          email: input.conversation.email,
        },
      },
      notificationSent: false,
      source: "fallback",
    };
  }
}

async function runSupportViaN8n(
  env: WorkerEnv,
  input: {
    conversation: {
      id: string;
      name: string;
      email: string;
      sourcePath: string;
    };
    user: Awaited<ReturnType<typeof getSessionViewer>>;
    messages: SupportMessage[];
  },
) {
  if (!env.SUPPORT_N8N_WEBHOOK_URL) {
    return null;
  }

  const controller = new AbortController();
  const timeout = readNumber(env.SUPPORT_N8N_TIMEOUT_MS, 12000);
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(env.SUPPORT_N8N_WEBHOOK_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(env.SUPPORT_N8N_WEBHOOK_SECRET
          ? { "x-scanlume-support-secret": env.SUPPORT_N8N_WEBHOOK_SECRET }
          : {}),
      },
      body: JSON.stringify({
        event: "support_chat_turn",
        model: env.ARK_MODEL,
        systemPrompt: SUPPORT_SYSTEM_PROMPT,
        responseSchema: supportAssistantJsonSchema,
        conversation: input.conversation,
        viewer: {
          authenticated: Boolean(input.user),
          id: input.user?.id ?? null,
          name: input.conversation.name,
          email: input.conversation.email,
        },
        messages: input.messages.map((message) => ({
          role: message.role,
          content: message.body,
          createdAt: message.createdAt,
        })),
      }),
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as Record<string, unknown>;
    const assistant = parseSupportAssistantPayload(payload);
    if (!assistant) {
      return null;
    }

    return {
      assistant,
      notificationSent: Boolean(Reflect.get(payload, "notificationSent")),
      source: "n8n",
    } satisfies SupportReplyResult;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function runSupportViaArk(
  env: WorkerEnv,
  input: {
    conversation: {
      id: string;
      name: string;
      email: string;
      sourcePath: string;
    };
    user: Awaited<ReturnType<typeof getSessionViewer>>;
    messages: SupportMessage[];
  },
) {
  if (!env.ARK_API_KEY || !env.ARK_MODEL) {
    return {
      reply_user:
        "Recebi sua mensagem e vou encaminhar para o time. Se precisar de ajuda urgente, descreva o problema com o maximo de detalhes.",
      category: "other",
      priority: "medium",
      needs_human: true,
      human_reason: "support_model_not_configured",
      summary_for_team: "Mensagem recebida, mas o assistente de suporte nao estava configurado no momento.",
      collected_user_profile: {
        name: input.conversation.name,
        email: input.conversation.email,
      },
    } satisfies SupportAssistant;
  }

  const response = await fetch(`${env.ARK_API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.ARK_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.ARK_MODEL,
      thinking: { type: "disabled" },
      messages: buildSupportModelMessages(input),
      response_format: {
        type: "json_schema",
        json_schema: supportAssistantJsonSchema,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const payload = (await response.json()) as Record<string, unknown>;
  const content = extractChatContent(payload);
  const parsedJson = safeParseJson(content);
  const validated = supportAssistantSchema.safeParse(parsedJson);
  if (!validated.success) {
    throw new Error("Support assistant output did not match the expected schema.");
  }

  return withSupportProfileFallback(validated.data, input.conversation.name, input.conversation.email);
}

function buildSupportModelMessages(input: {
  conversation: {
    name: string;
    email: string;
    sourcePath: string;
  };
  user: Awaited<ReturnType<typeof getSessionViewer>>;
  messages: SupportMessage[];
}) {
  return [
    {
      role: "system",
      content: SUPPORT_SYSTEM_PROMPT,
    },
    {
      role: "system",
      content: [
        `Current support context:`,
        `- authenticated: ${input.user ? "yes" : "no"}`,
        `- name: ${input.conversation.name || "unknown"}`,
        `- email: ${input.conversation.email || "unknown"}`,
        `- source_path: ${input.conversation.sourcePath}`,
        `- site language: pt-BR`,
      ].join("\n"),
    },
    ...input.messages.map((message) => ({
      role: message.role,
      content: message.body,
    })),
  ];
}

function parseSupportAssistantPayload(payload: Record<string, unknown>) {
  const direct = supportAssistantSchema.safeParse(payload);
  if (direct.success) {
    return withSupportProfileFallback(
      direct.data,
      direct.data.collected_user_profile.name,
      direct.data.collected_user_profile.email,
    );
  }

  const nested = Reflect.get(payload, "assistant");
  const parsedNested = supportAssistantSchema.safeParse(nested);
  if (!parsedNested.success) {
    return null;
  }

  const fallbackName = typeof Reflect.get(payload, "name") === "string" ? String(Reflect.get(payload, "name")) : "";
  const fallbackEmail = typeof Reflect.get(payload, "email") === "string" ? String(Reflect.get(payload, "email")) : "";
  return withSupportProfileFallback(parsedNested.data, fallbackName, fallbackEmail);
}

function withSupportProfileFallback(assistant: SupportAssistant, name: string, email: string) {
  return {
    ...assistant,
    collected_user_profile: {
      name: assistant.collected_user_profile.name || name,
      email: assistant.collected_user_profile.email || email,
    },
  } satisfies SupportAssistant;
}

function isSupportSyncAuthorized(c: Context<AppBindings>) {
  if (!c.env.SUPPORT_SYNC_TOKEN) {
    return false;
  }

  const header = c.req.header("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  return token.length > 0 && token === c.env.SUPPORT_SYNC_TOKEN;
}

function logAuthError(
  c: Context<AppBindings>,
  action: string,
  error: unknown,
  extra: Record<string, string | undefined> = {},
) {
  const reason = error instanceof Error ? error : new Error(String(error));
  console.error("[auth]", {
    action,
    method: c.req.method,
    path: new URL(c.req.url).pathname,
    ...extra,
    message: reason.message,
    stack: reason.stack,
  });
}

function maskEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  const [localPart, domain] = normalized.split("@");
  if (!localPart || !domain) {
    return normalized;
  }

  const visible = localPart.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(localPart.length - visible.length, 1))}@${domain}`;
}

function toAuthErrorStatus(error: unknown) {
  const message = error instanceof Error ? error.message : "auth_failed";

  if (message === "email_already_registered") {
    return 409;
  }

  if (message === "invalid_credentials") {
    return 401;
  }

  if (message === "email_not_verified") {
    return 403;
  }

  if (message === "password_too_short") {
    return 400;
  }

  if (message === "token_invalid_or_expired") {
    return 400;
  }

  if (message === "email_delivery_not_configured") {
    return 503;
  }

  if (message.startsWith("email_delivery_failed:")) {
    return 502;
  }

  return 500;
}

function toAuthErrorPayload(error: unknown) {
  const message = error instanceof Error ? error.message : "auth_failed";

  if (message === "email_already_registered") {
    return { error: "This email is already registered. Try signing in instead." };
  }

  if (message === "invalid_credentials") {
    return { error: "Email or password is incorrect." };
  }

  if (message === "email_not_verified") {
    return { error: "Please confirm your email before signing in or using password recovery." };
  }

  if (message === "password_too_short") {
    return { error: "Password must contain at least 8 characters." };
  }

  if (message === "token_invalid_or_expired") {
    return { error: "This link is invalid or has already expired." };
  }

  if (message === "email_delivery_not_configured") {
    return { error: "Email delivery is not configured in this environment yet." };
  }

  if (message.startsWith("email_delivery_failed:")) {
    return { error: "We could not send the email right now. Try again in a moment." };
  }

  return { error: "Authentication failed." };
}

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, Math.round(value)));
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
