# Scanlume Visual Refresh Reference

## Purpose

This image is the phase-1 visual reference for the Scanlume frontend refresh. It guides the homepage, primary tool page, and OCR workspace skin.

## Saved Asset

- `docs/qa/visual-refresh/scanlume-ocr-desk-reference.png`

## Prompt

```text
Use case: ui-mockup
Asset type: desktop web UI reference image for Scanlume frontend refresh
Primary request: Create a production-grade web UI reference image for Scanlume, a Brazilian Portuguese OCR product.
Scene/backdrop: optical document scanner desk, white paper, subtle grid, green scanning light, document queue, output channels, quiet operational SaaS tool.
Subject: A usable OCR workspace with upload queue, live scan center, and output preview. It should feel like a real product screen, not a generic landing page.
Composition: Desktop 1440px composition. Header stays compact. Main viewport shows product name, upload command, scan state, and result preview in one coherent first viewport.
Text: Use short Portuguese UI labels such as "Upload", "Escaneando", "Resultado", "Copiar", "Baixar", "OCR simples", "Texto formatado". Avoid long paragraphs.
Style constraints: Avoid purple gradients, abstract AI orbs, stock-photo people, oversized marketing hero cards, rounded card-heavy generic SaaS layout. Use restrained green scan light, paper white, ink black, light grid, amber warning, and blue info accents.
Quality: polished, sharp, production-grade, responsive-safe spacing, no text overlap, no watermark.
```

## Implementation Rules

- Treat the image as direction, not a static mock.
- Keep OCR upload, scan progress, result preview, account, pricing, copy, download, and PDF controls wired to existing code.
- AGY may propose skin code, but it must not change API calls, auth logic, billing logic, downloads, PDF parsing, metadata, sitemap, or llms files.
- The reference uses a compact scanner-desk composition; the actual site must remain accessible, responsive, and pt-BR SEO-safe.

