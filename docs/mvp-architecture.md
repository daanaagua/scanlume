# Scanlume MVP Architecture

## Final stack

- Frontend: `Next.js App Router` + TypeScript + CSS variables, focused on SSR-first SEO pages.
- API: `Cloudflare Workers` + `Hono` + direct `fetch` calls to the Ark OpenAI-compatible API.
- Hot-state limits: `Cloudflare KV` for daily image and credit counters.
- Event logging: `Cloudflare D1` for `usage_events`, `daily_budget`, `jobs`, and snapshots.
- Object storage: `Cloudflare R2` reserved for later async batches and zip artifacts.
- Bot protection: `Cloudflare Turnstile` when site/secret keys are configured.

## Repository structure

```txt
scanlume/
├── apps/
│   ├── api/                # Hono worker for OCR, rate limits, budget guardrails
│   └── web/                # Next.js marketing site and OCR interface
├── docs/
│   └── mvp-architecture.md
└── README.md
```

## MVP information architecture

- `/` - homepage targeting `imagem para texto` with the main CTA.
- `/imagem-para-texto` - primary tool page with both OCR modes.
- `/imagem-para-word` - formatted export landing page.
- `/ocr-online` - generic OCR intent page.
- `/jpg-para-texto` - JPG-specific landing page.
- `/png-para-texto` - PNG-specific landing page.
- `/sobre` - trust page.
- `/contato` - contact and support page.
- `/privacidade` - privacy and data-processing explanation.
- `/termos` - terms and fair-use page.

## Core user flows

### Simple OCR

1. User uploads one or more images.
2. Web app converts the file to a data URL and sends one request per image.
3. Worker calls `POST /responses` with `thinking: { "type": "disabled" }`.
4. Worker returns plain text and token usage.
5. Web app previews the text and offers `.txt` download.

### Formatted Text

1. User uploads one or more images.
2. Worker calls `POST /chat/completions` with `response_format.type = json_schema`.
3. Worker parses `blocks[]` and converts them into `txt`, `md`, and `html`.
4. Web app previews the chosen format and enables export.

## MVP limit model

- Anonymous users: max `5` images/day.
- Credits: `simple = 1`, `formatted = 3`.
- Default anonymous daily credits: `5`.
- Per image max: `5 MB`.
- Per batch max: `10` images.
- Per batch total size: `20 MB`.
- Budget guardrails:
  - soft stop: `18 RMB`
  - hard stop: `20 RMB`

## Data model

### usage_events

- `id`
- `ip_hash`
- `browser_id`
- `user_id`
- `mode`
- `image_count`
- `input_tokens`
- `output_tokens`
- `cost_rmb`
- `created_at`

### daily_budget

- `date`
- `total_cost_rmb`
- `total_requests`
- `total_images`
- `soft_stopped`
- `hard_stopped`

### jobs

- `id`
- `status`
- `mode`
- `result_format`
- `file_count`
- `zip_url`
- `created_at`
- `completed_at`

### rate_limits

- `key`
- `date`
- `used_images`
- `used_credits`
- `updated_at`

## Notes for rollout

- Batch zip export is client-side in MVP to avoid unnecessary storage costs.
- R2 and Queues stay optional until async processing is required.
- `llms.txt` is included as an AI-readable site summary, but `robots.txt` and `sitemap.xml` remain the primary SEO requirements.
