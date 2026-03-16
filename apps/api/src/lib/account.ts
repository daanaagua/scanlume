import { getLoggedInDailyCreditLimit, getLoggedInDailyImageLimit, type SessionViewer } from "./auth";
import { readNumber, type WorkerEnv } from "./store";

export type AccountPlanId = "anonymous" | "free" | "starter" | "pro";
export type BillingStatus = "inactive" | "active" | "trialing" | "past_due" | "canceled";

export type AccountPlan = {
  id: AccountPlanId;
  label: string;
  shortLabel: string;
  description: string;
  priceLabel: string;
  isPaid: boolean;
  isCurrent: boolean;
  comingSoon: boolean;
  entitlements: {
    dailyImages: number;
    dailyCredits: number;
    maxBatchFiles: number;
    maxImageMb: number;
    maxBatchTotalMb: number;
  };
  features: string[];
};

export type BillingSummary = {
  status: BillingStatus;
  provider: string | null;
  billingEmail: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

export type PlanEntitlements = AccountPlan["entitlements"];

export type ResolvedPlanContext = {
  currentPlan: AccountPlan;
  billing: BillingSummary;
};

export type WaitlistSummary = {
  joined: boolean;
  count: number;
  joinedAt: string | null;
  canJoin: boolean;
};

export type AccountSnapshot = {
  viewer: {
    authenticated: boolean;
    user: SessionViewer | null;
  };
  currentPlan: AccountPlan;
  usageToday: {
    usedImages: number;
    usedCredits: number;
    remainingImages: number;
    remainingCredits: number;
  };
  billing: BillingSummary;
  waitlist: WaitlistSummary;
  availablePlans: AccountPlan[];
  notes: {
    replyWindow: string;
    subscriptions: string;
  };
};

type EntitlementOverrides = Partial<Pick<PlanEntitlements, "dailyImages" | "dailyCredits">>;

type SubscriptionRow = {
  plan_id: string;
  status: string;
  provider: string | null;
  billing_email: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: number;
};

type WaitlistRow = {
  created_at: string;
};

type AccountViewerInput = {
  type: "anonymous" | "user";
  user: SessionViewer | null;
  dailyImageLimit: number;
  dailyCreditLimit: number;
  usage: {
    usedImages: number;
    usedCredits: number;
  };
};

export async function buildAccountSnapshot(env: WorkerEnv, viewer: AccountViewerInput): Promise<AccountSnapshot> {
  const resolvedPlan = await resolveCurrentPlan(env, {
    type: viewer.type,
    user: viewer.user,
    overrides: {
      dailyImages: viewer.dailyImageLimit,
      dailyCredits: viewer.dailyCreditLimit,
    },
  });
  const catalog = getPlanCatalog(env);
  const currentPlan = resolvedPlan.currentPlan;

  return {
    viewer: {
      authenticated: viewer.type === "user",
      user: viewer.user,
    },
    currentPlan,
    usageToday: {
      usedImages: viewer.usage.usedImages,
      usedCredits: viewer.usage.usedCredits,
      remainingImages: Math.max(viewer.dailyImageLimit - viewer.usage.usedImages, 0),
      remainingCredits: Math.max(viewer.dailyCreditLimit - viewer.usage.usedCredits, 0),
    },
    billing: resolvedPlan.billing,
    waitlist: await readWaitlistSummary(env, viewer.user),
    availablePlans: [
      withCurrentFlag(catalog.free, currentPlan.id === "free"),
      withCurrentFlag(catalog.starter, currentPlan.id === "starter"),
      withCurrentFlag(catalog.pro, currentPlan.id === "pro"),
    ],
    notes: {
      replyWindow: "Respondemos em ate 1 dia.",
      subscriptions: "Assinaturas pagas e cobranca recorrente entram na proxima fase do produto.",
    },
  };
}

export async function joinWaitlist(
  env: WorkerEnv,
  input: { user: SessionViewer; source?: string; now: string },
) {
  if (!env.DB) {
    throw new Error("D1 binding is required for the waitlist.");
  }

  await env.DB.prepare(
    `INSERT INTO waitlist_signups (user_id, email, source, status, created_at, updated_at)
     VALUES (?, ?, ?, 'active', ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       email = excluded.email,
       source = excluded.source,
       status = 'active',
       updated_at = excluded.updated_at;`,
  )
    .bind(input.user.id, input.user.email, input.source ?? "account", input.now, input.now)
    .run();

  return readWaitlistSummary(env, input.user);
}

export async function resolveCurrentPlan(
  env: WorkerEnv,
  input: {
    type: "anonymous" | "user";
    user: SessionViewer | null;
    overrides?: EntitlementOverrides;
  },
): Promise<ResolvedPlanContext> {
  const catalog = getPlanCatalog(env);

  if (input.type !== "user" || !input.user) {
    return {
      currentPlan: withCurrentFlag(applyEntitlementOverrides(catalog.anonymous, input.overrides), true),
      billing: {
        status: "inactive",
        provider: null,
        billingEmail: null,
        currentPeriodStart: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      },
    };
  }

  const subscription = await readUserSubscription(env, input.user.id);
  return {
    currentPlan: withCurrentFlag(resolveUserPlan(catalog, subscription, input.overrides), true),
    billing: {
      status: normalizeBillingStatus(subscription?.status),
      provider: subscription?.provider ?? null,
      billingEmail: subscription?.billing_email ?? input.user.email ?? null,
      currentPeriodStart: subscription?.current_period_start ?? null,
      currentPeriodEnd: subscription?.current_period_end ?? null,
      cancelAtPeriodEnd: Boolean(subscription?.cancel_at_period_end),
    },
  };
}

function getPlanCatalog(env: WorkerEnv) {
  const maxBatchFiles = readNumber(env.MAX_BATCH_FILES, 10);
  const maxImageMb = readNumber(env.MAX_IMAGE_MB, 5);
  const maxBatchTotalMb = readNumber(env.MAX_BATCH_TOTAL_MB, 20);

  return {
    anonymous: {
      id: "anonymous",
      label: "Teste gratis",
      shortLabel: "Teste",
      description: "Para testar o OCR sem login obrigatorio.",
      priceLabel: "Gratis",
      isPaid: false,
      isCurrent: false,
      comingSoon: false,
      entitlements: {
        dailyImages: readNumber(env.DAILY_IMAGE_LIMIT, 5),
        dailyCredits: readNumber(env.DAILY_CREDIT_LIMIT, 5),
        maxBatchFiles,
        maxImageMb,
        maxBatchTotalMb,
      },
      features: ["OCR simples", "Texto formatado", "Sem login obrigatorio"],
    } satisfies AccountPlan,
    free: {
      id: "free",
      label: "Conta gratuita",
      shortLabel: "Gratis",
      description: "Conta com limites diarios maiores para uso recorrente.",
      priceLabel: "Gratis",
      isPaid: false,
      isCurrent: false,
      comingSoon: false,
      entitlements: {
        dailyImages: getLoggedInDailyImageLimit(env),
        dailyCredits: getLoggedInDailyCreditLimit(env),
        maxBatchFiles,
        maxImageMb,
        maxBatchTotalMb,
      },
      features: ["Login com Google", "Mais creditos diarios", "Historico de conta"],
    } satisfies AccountPlan,
    starter: {
      id: "starter",
      label: "Inicial",
      shortLabel: "Inicial",
      description: "Primeiro plano pago para lotes maiores e uso mais frequente.",
      priceLabel: "Em breve",
      isPaid: true,
      isCurrent: false,
      comingSoon: true,
      entitlements: {
        dailyImages: 500,
        dailyCredits: 500,
        maxBatchFiles: 30,
        maxImageMb,
        maxBatchTotalMb: 60,
      },
      features: ["Lotes maiores", "Prioridade futura", "Base para cobranca recorrente"],
    } satisfies AccountPlan,
    pro: {
      id: "pro",
      label: "Pro",
      shortLabel: "Pro",
      description: "Preparado para operacao pesada e assinaturas futuras.",
      priceLabel: "Em breve",
      isPaid: true,
      isCurrent: false,
      comingSoon: true,
      entitlements: {
        dailyImages: 2000,
        dailyCredits: 2000,
        maxBatchFiles: 80,
        maxImageMb,
        maxBatchTotalMb: 120,
      },
      features: ["Uso intenso", "Base para equipe", "Suporte comercial futuro"],
    } satisfies AccountPlan,
  };
}

async function readUserSubscription(env: WorkerEnv, userId: string) {
  if (!env.DB) {
    return null;
  }

  try {
    return await env.DB.prepare(
      `SELECT plan_id, status, provider, billing_email, current_period_start, current_period_end, cancel_at_period_end
       FROM user_subscriptions
       WHERE user_id = ?
       LIMIT 1;`,
    )
      .bind(userId)
      .first<SubscriptionRow>();
  } catch {
    return null;
  }
}

function resolveUserPlan(
  catalog: ReturnType<typeof getPlanCatalog>,
  subscription: SubscriptionRow | null,
  overrides?: EntitlementOverrides,
) {
  if (subscription && ["active", "trialing"].includes(subscription.status)) {
    const plan = catalog[normalizePlanId(subscription.plan_id)];
    if (plan) {
      return applyEntitlementOverrides(plan, overrides);
    }
  }

  return applyEntitlementOverrides(catalog.free, overrides);
}

function normalizePlanId(value: string | null | undefined): AccountPlanId {
  if (value === "starter" || value === "pro" || value === "free") {
    return value;
  }

  return "free";
}

function normalizeBillingStatus(value: string | null | undefined): BillingStatus {
  if (value === "active" || value === "trialing" || value === "past_due" || value === "canceled") {
    return value;
  }

  return "inactive";
}

function withCurrentFlag(plan: AccountPlan, isCurrent: boolean) {
  return {
    ...plan,
    isCurrent,
  } satisfies AccountPlan;
}

function applyEntitlementOverrides(plan: AccountPlan, overrides?: EntitlementOverrides) {
  if (!overrides) {
    return plan;
  }

  return {
    ...plan,
    entitlements: {
      ...plan.entitlements,
      dailyImages: overrides.dailyImages ? Math.max(plan.entitlements.dailyImages, overrides.dailyImages) : plan.entitlements.dailyImages,
      dailyCredits: overrides.dailyCredits ? Math.max(plan.entitlements.dailyCredits, overrides.dailyCredits) : plan.entitlements.dailyCredits,
    },
  } satisfies AccountPlan;
}

async function readWaitlistSummary(env: WorkerEnv, user: SessionViewer | null): Promise<WaitlistSummary> {
  if (!env.DB) {
    return {
      joined: false,
      count: 0,
      joinedAt: null,
      canJoin: Boolean(user),
    };
  }

  try {
    const [countRow, joinedRow] = await Promise.all([
      env.DB.prepare(
        `SELECT COUNT(*) as total FROM waitlist_signups WHERE status = 'active';`,
      ).first<{ total: number | string }>(),
      user
        ? env.DB.prepare(
            `SELECT created_at FROM waitlist_signups WHERE user_id = ? AND status = 'active' LIMIT 1;`,
          )
            .bind(user.id)
            .first<WaitlistRow>()
        : Promise.resolve(null),
    ]);

    return {
      joined: Boolean(joinedRow),
      count: Number(countRow?.total ?? 0),
      joinedAt: joinedRow?.created_at ?? null,
      canJoin: Boolean(user),
    };
  } catch {
    return {
      joined: false,
      count: 0,
      joinedAt: null,
      canJoin: Boolean(user),
    };
  }
}
