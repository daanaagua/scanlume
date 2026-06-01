import type { ClientLocale } from "@/lib/client-locale";

type ApiData = {
  remainingCredits: number;
  effectiveTier: string | null;
  keys: Array<{
    id: string;
    label: string;
    lastFour: string;
    lastUsedAt: string | null;
    createdAt: string;
  }>;
  packs?: Array<{
    id: string;
    tier: string;
    creditsRemaining: number;
    expiresAt: string;
  }>;
};

type Props = {
  api: ApiData;
  locale?: ClientLocale;
  onCreateKey: () => void;
  onRegenerateKey: (id: string) => void;
  onRevokeKey: (id: string) => void;
};

const API_KEY_PANEL_COPY = {
  "pt-BR": {
    remaining: "API credits restantes",
    numberLocale: "pt-BR",
    currentTier: (tier: string) => `Tier atual: ${tier}`,
    noPack: "Sem API pack ativo.",
    expires: (tier: string, date: string) => `${tier} expira em ${date}`,
    create: "Criar API key",
    regenerate: "Regenerar",
    revoke: "Revogar",
  },
  en: {
    remaining: "API credits remaining",
    numberLocale: "en-US",
    currentTier: (tier: string) => `Current tier: ${tier}`,
    noPack: "No active API pack.",
    expires: (tier: string, date: string) => `${tier} expires on ${date}`,
    create: "Create API key",
    regenerate: "Regenerate",
    revoke: "Revoke",
  },
} as const;

export function ApiKeyPanel({ api, locale = "pt-BR", onCreateKey, onRegenerateKey, onRevokeKey }: Props) {
  const copy = API_KEY_PANEL_COPY[locale];
  const dateLocale = locale === "en" ? "en-US" : "pt-BR";

  return (
    <article className="account-card">
      <span>{copy.remaining}</span>
      <strong>{api.remainingCredits.toLocaleString(copy.numberLocale)}</strong>
      <p>{api.effectiveTier ? copy.currentTier(api.effectiveTier) : copy.noPack}</p>
      {api.packs?.map((pack) => (
        <small key={pack.id}>{copy.expires(pack.tier, new Date(pack.expiresAt).toLocaleDateString(dateLocale))}</small>
      ))}
      <div className="hero-actions">
        <button type="button" className="solid-button" onClick={onCreateKey}>
          {copy.create}
        </button>
      </div>
      <ul>
        {api.keys.map((key) => (
          <li key={key.id}>
            <strong>{key.label}</strong> ••••{key.lastFour}
            <div className="hero-actions">
              <button type="button" className="ghost-button" onClick={() => onRegenerateKey(key.id)}>{copy.regenerate}</button>
              <button type="button" className="ghost-button" onClick={() => onRevokeKey(key.id)}>{copy.revoke}</button>
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}
