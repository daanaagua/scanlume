import { API_BASE_URL } from "@/lib/site";

export type ViewerUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
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
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel carregar os dados da conta.");
  }

  return (await response.json()) as AccountResponse;
}
