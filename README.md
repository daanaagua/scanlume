# Scanlume

OCR tool site for the pt-BR market, focused on `imagem para texto` with two product modes:

- `Simple OCR`: fast, cheap, plain text output.
- `Formatted Text`: preserves the main reading structure for TXT, Markdown, and HTML export.

## Stack

- `apps/web`: Next.js App Router marketing site and tool UI.
- `apps/api`: Cloudflare Worker powered by Hono for OCR, limits, and budget control.

## Local development

1. Install dependencies with `pnpm install` in the repo root.
2. Copy the Ark credentials into your local env setup.
3. Run `pnpm dev:web` and `pnpm dev:api`, or `pnpm dev` after both apps are configured.

See `docs/mvp-architecture.md` for the MVP information architecture and data model.
