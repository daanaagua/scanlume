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
  onCreateKey: () => void;
  onRegenerateKey: (id: string) => void;
  onRevokeKey: (id: string) => void;
};

export function ApiKeyPanel({ api, onCreateKey, onRegenerateKey, onRevokeKey }: Props) {
  return (
    <article className="account-card">
      <span>API credits restantes</span>
      <strong>{api.remainingCredits.toLocaleString("pt-BR")}</strong>
      <p>{api.effectiveTier ? `Tier atual: ${api.effectiveTier}` : "Sem API pack ativo."}</p>
      {api.packs?.map((pack) => (
        <small key={pack.id}>{pack.tier} expira em {new Date(pack.expiresAt).toLocaleDateString("pt-BR")}</small>
      ))}
      <div className="hero-actions">
        <button type="button" className="solid-button" onClick={onCreateKey}>
          Criar API key
        </button>
      </div>
      <ul>
        {api.keys.map((key) => (
          <li key={key.id}>
            <strong>{key.label}</strong> ••••{key.lastFour}
            <div className="hero-actions">
              <button type="button" className="ghost-button" onClick={() => onRegenerateKey(key.id)}>Regenerar</button>
              <button type="button" className="ghost-button" onClick={() => onRevokeKey(key.id)}>Revogar</button>
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}
