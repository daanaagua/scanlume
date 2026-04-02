import { API_BASE_URL } from "@/lib/site";

export type ViewerUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  emailVerified: boolean;
  emailVerifiedAt: string | null;
  hasPassword: boolean;
  authProviders: string[];
};

export type AccountResponse = {
  viewer: {
    authenticated: boolean;
    user: ViewerUser | null;
  };
  currentPlan: {
    id: string;
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
  usageToday: {
    usedImages: number;
    usedCredits: number;
    remainingImages: number;
    remainingCredits: number;
  };
  billing: {
    status: string;
    provider: string | null;
    billingEmail: string | null;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  };
  waitlist: {
    joined: boolean;
    count: number;
    joinedAt: string | null;
    canJoin: boolean;
  };
  availablePlans: Array<{
    id: string;
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
  }>;
  notes: {
    replyWindow: string;
    subscriptions: string;
  };
};

export async function fetchAccount(browserId?: string) {
  const url = new URL(`${API_BASE_URL}/v1/account`);
  if (browserId) {
    url.searchParams.set("browserId", browserId);
  }

  const response = await fetch(url.toString(), {
    cache: "no-store",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel carregar os dados da conta.");
  }

  return (await response.json()) as AccountResponse;
}

export async function joinWaitlist() {
  const response = await fetch(`${API_BASE_URL}/v1/waitlist/join`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ source: "account" }),
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel entrar na lista de espera.");
  }

  return (await response.json()) as {
    ok: true;
    waitlist: AccountResponse["waitlist"];
  };
}
