# Scanlume Frontend Refresh Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立 Scanlume 新前端视觉基线，并完成首页、主工具页和 OCR 工作台的第一阶段真实接入。

**Architecture:** 第一阶段只改 `apps/web` 的视觉和组件结构，不改 `apps/api`。先生成统一参考图，再用 AGY 产出单页皮肤草案，主代理把草案收敛进现有 Next.js/React/CSS 组件，并用源码测试、构建和 Playwright 桌面/移动截图确认 OCR 主路径没有回退。

**Tech Stack:** Next.js App Router, React 19, TypeScript, CSS variables, Vitest, Testing Library, Playwright, image skill, AGY CLI

---

## 范围

本计划只覆盖第一阶段：

- 视觉参考资产：`docs/qa/visual-refresh/`
- 首页：`apps/web/app/page.tsx`
- 主工具页模板：`apps/web/components/tool-landing.tsx`
- OCR 工作台：`apps/web/components/ocr-workspace.tsx`
- 全局样式：`apps/web/app/globals.css`
- 测试：`apps/web/app/__tests__/home-page.test.tsx`、`apps/web/components/__tests__/ocr-workspace.test.tsx`

本计划明确不改：

- `apps/api`
- OCR/PDF OCR API contract
- 账号、计费、下载、PDF export 行为
- sitemap、metadata、llms 的核心内容

## Task 1: 生成和记录统一视觉参考图

**Files:**
- Create: `docs/qa/visual-refresh/2026-05-31-scanlume-visual-reference.md`
- Create: `docs/qa/visual-refresh/scanlume-ocr-desk-reference.png`

- [ ] **Step 1: 用 image skill 生成参考图**

Prompt:

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

- [ ] **Step 2: 保存参考图**

将生成结果复制到：

```bash
docs/qa/visual-refresh/scanlume-ocr-desk-reference.png
```

- [ ] **Step 3: 记录参考图用途**

写入 `docs/qa/visual-refresh/2026-05-31-scanlume-visual-reference.md`：

```markdown
# Scanlume Visual Refresh Reference

## Purpose

This image is the phase-1 visual reference for the Scanlume frontend refresh. It guides the homepage, primary tool page, and OCR workspace skin.

## Prompt

[paste the exact prompt used in Task 1 Step 1]

## Implementation Rules

- Treat the image as direction, not a static mock.
- Keep OCR upload, scan progress, result preview, account, pricing, copy, download, and PDF controls wired to existing code.
- AGY may propose skin code, but it must not change API calls, auth logic, billing logic, downloads, PDF parsing, metadata, sitemap, or llms files.
```

- [ ] **Step 4: Commit**

Run:

```bash
git add docs/qa/visual-refresh/2026-05-31-scanlume-visual-reference.md docs/qa/visual-refresh/scanlume-ocr-desk-reference.png
git commit -m "docs: add Scanlume visual refresh reference"
```

Expected: commit succeeds with only docs/QA visual reference files.

## Task 2: 补首页和工作台结构测试

**Files:**
- Modify: `apps/web/app/__tests__/home-page.test.tsx`
- Modify: `apps/web/components/__tests__/ocr-workspace.test.tsx`

- [ ] **Step 1: 写首页失败测试**

在 `apps/web/app/__tests__/home-page.test.tsx` 的 `describe("Home and product surfacing", ...)` 内新增：

```tsx
it("uses the optical desk refresh structure without losing the primary OCR workspace", () => {
  const { container } = render(<Home />);

  expect(container.querySelector(".scanlume-hero-shell")).not.toBeNull();
  expect(container.querySelector(".scanlume-hero-stage")).not.toBeNull();
  expect(container.querySelector(".scanlume-workflow-strip")).not.toBeNull();
  expect(container.querySelector(".command-hero-card")).toBeNull();
  expect(screen.getByTestId("ocr-workspace")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /abrir a ferramenta/i })).toHaveAttribute("href", "/imagem-para-texto");
});
```

- [ ] **Step 2: 写 OCR 工作台失败测试**

在 `apps/web/components/__tests__/ocr-workspace.test.tsx` 的 `describe("OcrWorkspace", ...)` 内新增：

```tsx
it("uses the optical desk workspace frame while preserving upload scan and result regions", async () => {
  const { container } = render(<OcrWorkspace defaultMode="simple" priorityLayout />);

  expect(await screen.findByText(/Upload rapido/i)).not.toBeNull();
  expect(container.querySelector(".ocr-desk-shell")).not.toBeNull();
  expect(container.querySelector(".ocr-desk-command-bar")).not.toBeNull();
  expect(container.querySelector(".ocr-desk-scan-lane")).not.toBeNull();
  expect(screen.getByRole("region", { name: /entrada de arquivos/i })).toBeInTheDocument();
  expect(screen.getByLabelText(/Leitura OCR ao vivo/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/Preview do resultado/i)).toBeInTheDocument();
});
```

- [ ] **Step 3: 跑测试确认失败**

Run:

```bash
pnpm --dir apps/web test app/__tests__/home-page.test.tsx components/__tests__/ocr-workspace.test.tsx
```

Expected: FAIL because `.scanlume-hero-shell` and `.ocr-desk-shell` do not exist yet.

- [ ] **Step 4: Commit failing tests?**

不要提交失败测试。进入 Task 3 做最小实现后一起提交。

## Task 3: 接入首页 optical desk 第一屏

**Files:**
- Modify: `apps/web/app/page.tsx`
- Modify: `apps/web/app/globals.css`
- Test: `apps/web/app/__tests__/home-page.test.tsx`

- [ ] **Step 1: 让 AGY 生成首页皮肤草案**

Run:

```bash
agy --print --print-timeout 10m --dangerously-skip-permissions --prompt "$(cat <<'PROMPT'
You are editing a Next.js frontend skin draft for Scanlume in /home/ubuntu/projects/scanlume.

Task: propose a homepage visual skin for apps/web/app/page.tsx and apps/web/app/globals.css.

Important constraints:
- Do not change API calls, auth, billing, OCR logic, sitemap, llms, metadata, or backend files.
- Keep the real OcrWorkspace mounted.
- The design direction is optical document scanner desk, paper white, light grid, green scanning light, document queue, output channels.
- Avoid purple gradients, abstract AI orbs, stock people, huge generic SaaS cards, nested cards.
- First viewport must show product purpose and real OCR entry.
- Use class names: scanlume-hero-shell, scanlume-hero-stage, scanlume-workflow-strip.
- Return a concise patch-style proposal only. Do not run commands.

Relevant current files:
$(sed -n '1,180p' apps/web/app/page.tsx)
--- CSS excerpt ---
$(sed -n '1,220p' apps/web/app/globals.css)
PROMPT
)"
```

Expected: AGY returns a patch-style proposal for homepage markup and CSS.

- [ ] **Step 2: 主代理接入 JSX**

Replace the existing `<section className="command-hero">...</section>` in `apps/web/app/page.tsx` with a section shaped like:

```tsx
<section className="scanlume-hero-shell">
  <div className="container scanlume-hero-grid">
    <div className="scanlume-hero-copy">
      <p className="eyebrow">Scanlume em pt-BR</p>
      <h1>OCR online para transformar imagens e PDF em texto editavel.</h1>
      <p className="hero-lead">...</p>
      <div className="hero-actions">...</div>
      <div className="scanlume-workflow-strip" aria-label="Fluxo principal do OCR">...</div>
    </div>
    <div className="scanlume-hero-stage" aria-label="Previa visual do workspace OCR">...</div>
  </div>
</section>
```

Rules:

- Keep the existing three CTAs and their hrefs.
- Keep the existing support email note.
- Keep the existing mode labels from `SIMPLE_MODE_LABEL` and `FORMATTED_MODE_LABEL`.
- Do not remove the real `<OcrWorkspace defaultMode="simple" priorityLayout />`.

- [ ] **Step 3: 主代理接入 CSS**

Append a scoped block near the top of `apps/web/app/globals.css` after the current visual pass variables:

```css
.scanlume-hero-shell { ... }
.scanlume-hero-grid { ... }
.scanlume-hero-copy { ... }
.scanlume-hero-stage { ... }
.scanlume-workflow-strip { ... }
@media (max-width: 760px) { ... }
```

CSS must ensure:

- desktop hero has two columns without text overlap
- mobile is one column
- no viewport-width font scaling
- no negative letter spacing
- stage is decorative but accessible via `aria-label`

- [ ] **Step 4: 跑首页测试**

Run:

```bash
pnpm --dir apps/web test app/__tests__/home-page.test.tsx
```

Expected: PASS.

## Task 4: 接入 OCR 工作台第一阶段皮肤

**Files:**
- Modify: `apps/web/components/ocr-workspace.tsx`
- Modify: `apps/web/app/globals.css`
- Test: `apps/web/components/__tests__/ocr-workspace.test.tsx`

- [ ] **Step 1: 让 AGY 生成 OCR 工作台皮肤草案**

Run:

```bash
agy --print --print-timeout 10m --dangerously-skip-permissions --prompt "$(cat <<'PROMPT'
You are editing a Next.js OCR workspace skin draft for Scanlume in /home/ubuntu/projects/scanlume.

Task: propose a visual skin for apps/web/components/ocr-workspace.tsx and apps/web/app/globals.css.

Important constraints:
- Do not change API calls, file validation, PDF behavior, auth dialog, billing, downloads, or result rendering logic.
- Preserve role="region" aria-label="Entrada de arquivos", aria-label="Leitura OCR ao vivo", and aria-label="Preview do resultado".
- Use class names: ocr-desk-shell, ocr-desk-command-bar, ocr-desk-scan-lane.
- Keep upload, scan, result, and status rail in one coherent workspace.
- Desktop should feel like an optical document scanner desk. Mobile must remain task-first and readable.
- Return a concise patch-style proposal only. Do not run commands.

Relevant current file excerpts:
$(sed -n '640,980p' apps/web/components/ocr-workspace.tsx)
--- CSS excerpt ---
$(sed -n '1360,1620p' apps/web/app/globals.css)
$(sed -n '2910,3035p' apps/web/app/globals.css)
PROMPT
)"
```

Expected: AGY returns a patch-style proposal focused on class wrappers and CSS.

- [ ] **Step 2: 主代理接入 JSX wrappers**

In `apps/web/components/ocr-workspace.tsx`:

- Change root section class from `workspace-shell...` to include `ocr-desk-shell`.
- Change `.workspace-grid.workspace-desk-grid` wrapper to include `ocr-desk-command-bar`.
- Add `ocr-desk-scan-lane` to the scan panel or its visual frame wrapper.

Do not change state, handlers, fetch calls, downloads, clipboard, or PDF export code.

- [ ] **Step 3: 主代理接入 CSS**

Add CSS for:

```css
.ocr-desk-shell { ... }
.ocr-desk-command-bar { ... }
.ocr-desk-scan-lane { ... }
.ocr-desk-shell .upload-panel { ... }
.ocr-desk-shell .scan-panel { ... }
.ocr-desk-shell .result-panel { ... }
@media (max-width: 760px) { ... }
```

Rules:

- Keep upload, scan, and result panels visible and readable.
- Keep `.upload-actions .solid-button` easy to find.
- Keep `.format-tabs` stable and compact.
- Do not rely on hover-only interactions for essential controls.

- [ ] **Step 4: 跑 OCR 工作台测试**

Run:

```bash
pnpm --dir apps/web test components/__tests__/ocr-workspace.test.tsx
```

Expected: PASS.

## Task 5: ToolLanding 与主工具页轻量对齐

**Files:**
- Modify: `apps/web/components/tool-landing.tsx`
- Modify: `apps/web/app/globals.css`
- Test: `apps/web/app/__tests__/home-page.test.tsx`

- [ ] **Step 1: 增加 ToolLanding refresh class**

In `apps/web/components/tool-landing.tsx`, change the hero section class to:

```tsx
<section className="scanlume-tool-hero command-hero command-hero-compact">
```

Keep all existing content and the workspace section.

- [ ] **Step 2: 增加 CSS**

Add:

```css
.scanlume-tool-hero { ... }
.scanlume-tool-hero .command-hero-card { ... }
.scanlume-tool-hero .command-mode-row { ... }
@media (max-width: 760px) { ... }
```

Rules:

- Must not hide H1.
- Must keep `#ocr-workspace` anchor behavior.
- Must not alter `ToolLanding({ slug })`.

- [ ] **Step 3: 跑相关测试**

Run:

```bash
pnpm --dir apps/web test app/__tests__/home-page.test.tsx app/__tests__/seo-foundations.test.tsx
```

Expected: PASS.

## Task 6: 浏览器验收、构建和提交

**Files:**
- Modify/Create only files touched by Tasks 1-5.

- [ ] **Step 1: Run targeted tests**

Run:

```bash
pnpm --dir apps/web test app/__tests__/home-page.test.tsx components/__tests__/ocr-workspace.test.tsx app/__tests__/seo-foundations.test.tsx
```

Expected: PASS.

- [ ] **Step 2: Run lint/build**

Run:

```bash
pnpm --dir apps/web lint
pnpm --dir apps/web build
```

Expected: PASS.

- [ ] **Step 3: Start local dev server**

Run:

```bash
pnpm dev:web
```

Expected: local Next dev server starts, usually on `http://localhost:3000`.

- [ ] **Step 4: Playwright desktop/mobile visual scan**

Use Playwright to open:

- `/`
- `/imagem-para-texto`
- `/pdf-para-texto`

Viewports:

- `1440 x 1100`
- `390 x 900`

Check:

- no text overlap
- no unexpected horizontal overflow
- header does not cover content
- homepage has `.scanlume-hero-shell`
- workspace has `.ocr-desk-shell`
- primary upload/start/result controls remain visible

- [ ] **Step 5: Commit implementation**

Run:

```bash
git add docs/qa/visual-refresh apps/web/app/page.tsx apps/web/components/tool-landing.tsx apps/web/components/ocr-workspace.tsx apps/web/app/globals.css apps/web/app/__tests__/home-page.test.tsx apps/web/components/__tests__/ocr-workspace.test.tsx docs/superpowers/plans/2026-05-31-scanlume-frontend-refresh-phase1.md
git commit -m "Refresh Scanlume OCR frontend phase 1"
```

Expected: commit succeeds. Do not commit unrelated files.

## Self-review

- Spec coverage: 本计划覆盖 spec 的第一阶段实施顺序：参考图、首页、OCR 工作台、ToolLanding 轻量对齐和视觉验收。价格/API、Blog、信任/账号页留给后续阶段计划。
- Placeholder scan: 本计划不包含占位词或未定义的执行步骤。
- Type consistency: 使用的 class names 与测试一致：`scanlume-hero-shell`、`scanlume-hero-stage`、`scanlume-workflow-strip`、`ocr-desk-shell`、`ocr-desk-command-bar`、`ocr-desk-scan-lane`。
