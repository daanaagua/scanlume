# Scanlume

Scanlume is a pt-BR OCR product for turning screenshots, JPG, and PNG files into editable text.

Live site: `https://www.scanlume.com`

Primary tool page: `https://www.scanlume.com/imagem-para-texto`

## What Scanlume does

Scanlume is built for people who need to extract text from visual material without installing desktop software. The current product focuses on common Brazilian Portuguese use cases such as:

- screenshots of landing pages, apps, and dashboards
- JPG and PNG images shared in team workflows
- photos of simple printed material that need quick OCR
- reuse of extracted text in Word, Markdown, HTML, and internal docs

The product currently offers two OCR modes:

- `Simple OCR`: faster plain-text extraction for lightweight workflows
- `Formatted Text`: structure-aware output designed to preserve headings, paragraphs, and reading order

## Why this repository exists

This repository contains the codebase behind Scanlume, including the public website, the OCR workflow UI, and the Cloudflare Worker API used for limits, authentication, and OCR orchestration.

It is useful if you want to:

- understand how the Scanlume product is structured
- review a pt-BR OCR product built for SEO-driven acquisition
- study a lightweight Next.js + Cloudflare architecture
- self-host or adapt a similar OCR workflow for your own market

## Product highlights

- pt-BR-first product positioning and supporting pages
- OCR workspace with simple and formatted modes
- export support for `TXT`, `Markdown`, and `HTML`
- trust pages, blog content, and product evidence pages that support discovery
- Cloudflare D1, KV, and Worker-based backend services
- IndexNow support for faster search engine notification on updated URLs

## Repository structure

```txt
scanlume/
├── apps/
│   ├── api/                # Cloudflare Worker API powered by Hono
│   └── web/                # Next.js App Router frontend and OCR UI
├── docs/                   # Architecture and deployment notes
├── scripts/                # Utility scripts such as IndexNow submission
└── README.md
```

## Key live URLs

- Homepage: `https://www.scanlume.com/`
- Main OCR page: `https://www.scanlume.com/imagem-para-texto`
- Word-oriented page: `https://www.scanlume.com/imagem-para-word`
- OCR hub: `https://www.scanlume.com/ocr-online`
- About page: `https://www.scanlume.com/sobre`
- Blog: `https://www.scanlume.com/blog`

## Stack

- Frontend: `Next.js App Router` + TypeScript
- API: `Cloudflare Workers` + `Hono`
- Database: `Cloudflare D1`
- Rate limiting and counters: `Cloudflare KV`
- OCR provider: Ark OpenAI-compatible API
- Search notification: IndexNow

## Local development

1. Install dependencies from the repo root with `pnpm install`.
2. Configure the required local environment variables and Cloudflare bindings.
3. Run `pnpm dev` from the repo root, or run `pnpm dev:web` and `pnpm dev:api` separately.

Helpful commands:

- `pnpm dev`
- `pnpm lint`
- `pnpm build`
- `pnpm submit:indexnow`

## Deployment notes

- `apps/web` is the public-facing marketing site and OCR workspace.
- `apps/api` is the Worker API that handles OCR requests, sessions, usage limits, and email flows.
- Keep D1 and KV bindings declared in `apps/api/wrangler.jsonc` so deployments stay stable.
- Keep secrets in Cloudflare secrets rather than committing them into the repository.

## Documentation

- `docs/README.md` - documentation index
- `docs/mvp-architecture.md` - product and architecture overview
- `docs/cloudflare-bindings.md` - Cloudflare binding persistence notes
- `apps/web/README.md` - frontend-specific notes

## Notes for reviewers and link references

If you are linking to Scanlume from a GitHub profile, GitHub Pages site, or external article, the best destination is usually:

- `https://www.scanlume.com/imagem-para-texto` for the main OCR workflow
- `https://www.scanlume.com/` for the broader product overview

## License

This repository is currently maintained as the product codebase for Scanlume. Add a formal license file if you plan to open-source reuse rights.
