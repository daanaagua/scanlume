# Cloudflare bindings persistence

`git push` itself does not clear Cloudflare bindings. The usual cause is that the API Worker bindings only exist in the dashboard and are not fully declared in `apps/api/wrangler.jsonc`.

To keep D1 and KV stable across deploys, declare them once in Wrangler and keep deploying the same Worker name.

## API Worker

Required bindings:

- D1 binding name: `DB`
- KV binding name: `RATE_LIMITS`

Recommended `apps/api/wrangler.jsonc` structure:

```jsonc
{
  "name": "scanlume-api",
  "main": "src/index.ts",
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "scanlume",
      "database_id": "<your-d1-id>",
      "preview_database_id": "<your-d1-id>"
    }
  ],
  "kv_namespaces": [
    {
      "binding": "RATE_LIMITS",
      "id": "<your-kv-id>",
      "preview_id": "<your-kv-id>"
    }
  ]
}
```

## Why this matters

If those IDs are not declared in code, redeploying from the Cloudflare UI can leave you dependent on manual dashboard bindings, which is why the binding setup feels fragile.

## Stable deploy pattern

1. Keep the Worker name fixed as `scanlume-api`
2. Put D1 and KV IDs into `apps/api/wrangler.jsonc`
3. Keep secrets only in Cloudflare Secrets
4. Redeploy the same project instead of recreating it

## Frontend Worker

`apps/web/wrangler.jsonc` currently only needs the static assets binding and does not use D1 or KV directly, so the repeat-binding problem is mainly on the API Worker side.
