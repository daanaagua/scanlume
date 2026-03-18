# Scanlume Web App

This app contains the public-facing Scanlume website and OCR workspace.

Live product: `https://www.scanlume.com`

Primary landing page: `https://www.scanlume.com/imagem-para-texto`

## Responsibilities

- render the homepage and SEO landing pages
- host the OCR workspace UI
- publish trust pages such as `sobre`, `contato`, `privacidade`, and `termos`
- publish blog content and product-supporting pages
- expose generated assets such as `robots.txt`, `sitemap.xml`, and `llms.txt`

## Local development

From the repository root:

1. Install dependencies with `pnpm install`
2. Start the frontend with `pnpm dev:web`
3. Open `http://localhost:3000`

## Useful commands

- `pnpm dev:web`
- `pnpm --dir apps/web lint`
- `pnpm --dir apps/web build`

## Notes

- The app uses the Next.js App Router.
- Product metadata, landing page copy, and tool routing are largely driven from `apps/web/lib/site.ts`.
- The OCR UI talks to the Cloudflare Worker API defined in `apps/api`.
