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
  availablePlans: AccountPlan[];
  notes: {
    replyWindow: string;
    subscriptions: string;
  };
};

type SubscriptionRow = {
  plan_id: string;
  status: string;
  provider: string | null;
  billing_email: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: number;
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
  const catalog = getPlanCatalog(env);
  const subscription = viewer.user ? await readUserSubscription(env, viewer.user.id) : null;
  const currentPlan = viewer.type === "user"
    ? withCurrentFlag(resolveUserPlan(catalog, viewer, subscription), true)
    : withCurrentFlag(catalog.anonymous, true);

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
    billing: {
      status: normalizeBillingStatus(subscription?.status),
      provider: subscription?.provider ?? null,
      billingEmail: subscription?.billing_email ?? viewer.user?.email ?? null,
      currentPeriodStart: subscription?.current_period_start ?? null,
      currentPeriodEnd: subscription?.current_period_end ?? null,
      cancelAtPeriodEnd: Boolean(subscription?.cancel_at_period_end),
    },
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

function getPlanCatalog(env: WorkerEnv) {
  const maxBatchFiles = readNumber(env.MAX_BATCH_FILES, 10);
  const maxImageMb = readNumber(env.MAX_IMAGE_MB, 5);
  const maxBatchTotalMb = readNumber(env.MAX_BATCH_TOTAL_MB, 20);

  return {
    anonymous: {
      id: "anonymous",
      label: "Teste gratis",
      shortLabel: "Trial",
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
      features: ["Simple OCR", "Formatted Text", "Sem login obrigatorio"],
    } satisfies AccountPlan,
    free: {
      id: "free",
      label: "Conta gratuita",
      shortLabel: "Free",
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
      label: "Starter",
      shortLabel: "Starter",
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
  viewer: AccountViewerInput,
  subscription: SubscriptionRow | null,
) {
  if (subscription && ["active", "trialing"].includes(subscription.status)) {
    const plan = catalog[normalizePlanId(subscription.plan_id)];
    if (plan) {
      return {
        ...plan,
        entitlements: {
          ...plan.entitlements,
          dailyImages: Math.max(plan.entitlements.dailyImages, viewer.dailyImageLimit),
          dailyCredits: Math.max(plan.entitlements.dailyCredits, viewer.dailyCreditLimit),
        },
      } satisfies AccountPlan;
    }
  }

  return {
    ...catalog.free,
    entitlements: {
      ...catalog.free.entitlements,
      dailyImages: viewer.dailyImageLimit,
      dailyCredits: viewer.dailyCreditLimit,
    },
  } satisfies AccountPlan;
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
