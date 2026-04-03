import { getLoggedInDailyCreditLimit, getLoggedInDailyImageLimit, type SessionViewer } from "./auth";
import { readNumber, type WorkerEnv } from "./store";

export type AccountPlanId = "anonymous" | "free" | "starter" | "pro" | "business";
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
  usage: {
    grantedCredits: number;
    usedCredits: number;
    remainingCredits: number;
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
  balance: {
    grantedCredits: number;
    usedCredits: number;
    remainingCredits: number;
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
    usage: {
      grantedCredits: viewer.balance.grantedCredits,
      usedCredits: viewer.balance.usedCredits,
      remainingCredits: viewer.balance.remainingCredits,
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
      withCurrentFlag(catalog.business, currentPlan.id === "business"),
    ],
    notes: {
      replyWindow: "Respondemos em ate 1 dia.",
      subscriptions: "Planos anuais aprovados: Starter $48 / ano (100.000 creditos), Pro $82 / ano (240.000 creditos), Business $228 / ano (800.000 creditos).",
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
      description: "Conta gratuita com 50 creditos totais para uso recorrente em OCR simples, formatado e PDF.",
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
      features: ["50 creditos totais", "Login com Google", "Historico de conta"],
    } satisfies AccountPlan,
    starter: {
      id: "starter",
      label: "Starter",
      shortLabel: "Starter",
      description: "Primeiro plano pago para quem precisa mais creditos e lotes maiores sem sair do fluxo self-serve.",
      priceLabel: "$5 / mes",
      isPaid: true,
      isCurrent: false,
      comingSoon: false,
      entitlements: {
        dailyImages: 8000,
        dailyCredits: 8000,
        maxBatchFiles: 30,
        maxImageMb: 20,
        maxBatchTotalMb: 40,
      },
      features: ["8.000 creditos", "30 arquivos por lote", "20 MB por imagem", "40 MB por lote"],
    } satisfies AccountPlan,
    pro: {
      id: "pro",
      label: "Pro",
      shortLabel: "Pro",
      description: "Plano recomendado para uso serio com mais creditos, lotes maiores e melhor custo por rotina recorrente.",
      priceLabel: "$9 / mes",
      isPaid: true,
      isCurrent: false,
      comingSoon: false,
      entitlements: {
        dailyImages: 24000,
        dailyCredits: 24000,
        maxBatchFiles: 50,
        maxImageMb: 20,
        maxBatchTotalMb: 80,
      },
      features: ["24.000 creditos", "50 arquivos por lote", "20 MB por imagem", "80 MB por lote", "Plano recomendado"],
    } satisfies AccountPlan,
    business: {
      id: "business",
      label: "Business",
      shortLabel: "Business",
      description: "Mais creditos, lotes amplos e suporte prioritario para equipes que operam OCR em alta frequencia.",
      priceLabel: "$24 / mes",
      isPaid: true,
      isCurrent: false,
      comingSoon: false,
      entitlements: {
        dailyImages: 60000,
        dailyCredits: 60000,
        maxBatchFiles: 80,
        maxImageMb: 30,
        maxBatchTotalMb: 120,
      },
      features: ["60.000 creditos", "80 arquivos por lote", "30 MB por imagem", "120 MB por lote", "Suporte prioritario"],
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
  if (value === "starter" || value === "pro" || value === "business" || value === "free") {
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
