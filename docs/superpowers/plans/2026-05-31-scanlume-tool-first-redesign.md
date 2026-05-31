# Scanlume Tool-First Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 Scanlume 首页和工具子页改为首屏直接展示真实 OCR 上传工作台的干净工具优先界面。

**Architecture:** 首页 `app/page.tsx` 直接渲染紧凑标题和 `OcrWorkspace`。所有工具子页通过共享 `components/tool-landing.tsx` 统一改为“标题栏 + 真实工作台 + SEO 内容”。`components/ocr-workspace.tsx` 只做展示层类名和 priority 布局文案收敛，不改变 OCR API、登录、额度、复制和下载逻辑。

**Tech Stack:** Next.js App Router, React 19, TypeScript, Vitest, Testing Library, CSS in `apps/web/app/globals.css`.

---

## File Map

- Modify: `apps/web/app/page.tsx`  
  负责首页首屏结构，删除假预览和多按钮营销 hero，把真实 OCR 工作台放进第一屏。
- Modify: `apps/web/components/tool-landing.tsx`  
  负责所有工具子页共享首屏结构，从 `command-hero -> workspace` 改为 `tool-first-landing -> workspace -> SEO sections`。
- Modify: `apps/web/components/ocr-workspace.tsx`  
  负责给 priority layout 增加工具优先类名和更短首屏文案。
- Modify: `apps/web/app/globals.css`  
  负责新增 `tool-first-*` 样式，降低装饰强度，保证移动端不横向溢出。
- Modify: `apps/web/app/__tests__/home-page.test.tsx`  
  负责首页和 `ToolLanding` 的结构断言。
- Modify: `apps/web/components/__tests__/ocr-workspace.test.tsx`  
  负责 OCR 工作台 priority layout 结构断言。

---

### Task 1: 写失败测试

**Files:**
- Modify: `apps/web/app/__tests__/home-page.test.tsx`
- Modify: `apps/web/components/__tests__/ocr-workspace.test.tsx`

- [ ] **Step 1: 更新首页测试为工具优先结构**

Replace the homepage structure assertions with:

```tsx
it("puts the real OCR workspace in the first homepage screen", () => {
  const { container } = render(<Home />);

  expect(container.querySelector(".tool-first-home")).not.toBeNull();
  expect(container.querySelector(".scanlume-hero-stage")).toBeNull();
  expect(container.querySelector(".scanlume-workflow-strip")).toBeNull();
  expect(container.querySelector(".command-hero-card")).toBeNull();
  expect(screen.getByTestId("ocr-workspace")).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: /abrir a ferramenta/i })).toBeNull();
});
```

- [ ] **Step 2: 更新工具页测试为共享工具优先结构**

Replace the PDF page structure expectations with:

```tsx
it("shows PDF-specific explanatory copy below a tool-first workspace", () => {
  const { container } = render(<ToolLanding slug="pdf-para-texto" />);

  expect(container.querySelector(".tool-first-landing")).not.toBeNull();
  expect(container.querySelector(".tool-first-workspace")).not.toBeNull();
  expect(container.querySelector(".command-hero")).toBeNull();
  expect(screen.getByTestId("ocr-workspace")).toBeInTheDocument();
  expect(screen.getAllByText(/pdfs com texto nativo, paginas escaneadas e layouts mistos/i).length).toBeGreaterThan(0);
});
```

- [ ] **Step 3: 更新 OCR 工作台测试为工具优先类名**

Add one assertion to the existing optical desk test:

```tsx
expect(container.querySelector(".ocr-tool-first-shell")).not.toBeNull();
```

- [ ] **Step 4: 运行测试确认失败**

Run:

```bash
pnpm --dir apps/web test app/__tests__/home-page.test.tsx components/__tests__/ocr-workspace.test.tsx
```

Expected: FAIL because `.tool-first-home`, `.tool-first-landing`, `.tool-first-workspace`, and `.ocr-tool-first-shell` do not exist yet, and old fake preview still exists on homepage.

---

### Task 2: 改首页为首屏真实工具

**Files:**
- Modify: `apps/web/app/page.tsx`

- [ ] **Step 1: 替换首页 hero**

Replace the current `scanlume-hero-shell` section and the following separate `tool-workspace-band is-priority` section with:

```tsx
<section className="tool-first-home">
  <div className="container tool-first-home-inner">
    <div className="tool-first-intro">
      <p className="eyebrow scanlume-signal-label">Scanlume OCR</p>
      <h1>OCR online em pt-BR.</h1>
      <p>
        Envie imagem ou PDF, extraia texto editavel e baixe em TXT, Markdown, HTML ou PDF.
      </p>
      <div className="tool-first-pills" aria-label="Recursos principais">
        <span>Gratis para testar</span>
        <span>Imagem e PDF</span>
        <span>TXT, MD, HTML, PDF</span>
      </div>
    </div>

    <div className="tool-first-workspace">
      <OcrWorkspace defaultMode="simple" priorityLayout />
    </div>
  </div>
</section>
```

- [ ] **Step 2: 保留首屏以下内容**

Keep the existing sections after the removed workspace section. Do not delete FAQ, related routes, blog, support email, or JSON-LD.

- [ ] **Step 3: 运行首页测试**

Run:

```bash
pnpm --dir apps/web test app/__tests__/home-page.test.tsx
```

Expected: homepage test moves closer to pass; `ToolLanding` and OCR workspace tests may still fail until later tasks.

---

### Task 3: 改工具子页共享布局

**Files:**
- Modify: `apps/web/components/tool-landing.tsx`

- [ ] **Step 1: 删除首屏 command hero**

Remove the `command-hero command-hero-compact` section. Keep JsonLd blocks and all content sections below the workspace.

- [ ] **Step 2: 把 workspaceSection 改成工具优先首屏**

Replace the current `workspaceSection` constant with:

```tsx
const workspaceSection = (
  <section id={OCR_WORKSPACE_ID} className="tool-first-landing">
    <div className="container tool-first-landing-inner">
      <div className="tool-first-intro tool-first-intro-compact">
        <p className="eyebrow">{heroEyebrow}</p>
        <h1>{page.h1}</h1>
        <p>{heroLead}</p>
        <div className="tool-first-pills" aria-label="Recursos desta ferramenta">
          {heroBullets.slice(0, 3).map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </div>
      <div className="tool-first-workspace">
        <OcrWorkspace defaultMode={page.defaultMode ?? "simple"} priorityLayout />
      </div>
    </div>
  </section>
);
```

- [ ] **Step 3: 渲染顺序保持 workspaceSection 先出现**

The component should render `{workspaceSection}` immediately after the JsonLd blocks. Existing sections beginning with “Quando usar” stay below it.

- [ ] **Step 4: 运行工具页测试**

Run:

```bash
pnpm --dir apps/web test app/__tests__/home-page.test.tsx
```

Expected: `ToolLanding` structure assertions pass after CSS-independent class names exist.

---

### Task 4: 调整 OCR 工作台 priority 展示层

**Files:**
- Modify: `apps/web/components/ocr-workspace.tsx`

- [ ] **Step 1: 给根节点加工具优先类名**

Change the root section class to:

```tsx
<section className={`workspace-shell ocr-desk-shell ocr-tool-first-shell${priorityLayout ? " workspace-shell-priority" : ""}`}>
```

- [ ] **Step 2: 缩短 priority upload 文案**

Keep non-priority text unchanged. For priority layout, keep title `Upload rapido` and change the summary to:

```tsx
<p className="upload-panel-summary">
  {priorityLayout ? "Solte arquivos aqui para iniciar." : "JPG, PNG, screenshot ou PDF no modo formatado."}
</p>
```

- [ ] **Step 3: 运行 OCR 工作台测试**

Run:

```bash
pnpm --dir apps/web test components/__tests__/ocr-workspace.test.tsx
```

Expected: all OCR workspace tests pass.

---

### Task 5: 新增干净工具优先样式

**Files:**
- Modify: `apps/web/app/globals.css`

- [ ] **Step 1: 新增首屏样式**

Add CSS near the current Scanlume hero rules:

```css
.tool-first-home,
.tool-first-landing {
  padding: 1rem 0 1.6rem;
  border-bottom: 1px solid rgba(17, 28, 24, 0.08);
  background:
    linear-gradient(90deg, rgba(15, 143, 111, 0.045) 1px, transparent 1px),
    linear-gradient(180deg, rgba(22, 138, 152, 0.035) 1px, transparent 1px),
    #f8faf5;
  background-size: 40px 40px;
}

.tool-first-home-inner,
.tool-first-landing-inner {
  display: grid;
  gap: 0.9rem;
}

.tool-first-intro {
  display: grid;
  gap: 0.55rem;
  max-width: 780px;
}

.tool-first-intro h1 {
  max-width: 18ch;
  font-size: 3rem;
  line-height: 0.98;
  letter-spacing: 0;
}

.tool-first-intro p {
  color: var(--muted);
  font-size: 1rem;
  line-height: 1.55;
}

.tool-first-intro-compact h1 {
  max-width: 24ch;
  font-size: 2.35rem;
}

.tool-first-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.tool-first-pills span {
  min-height: 32px;
  display: inline-flex;
  align-items: center;
  border: 1px solid rgba(17, 28, 24, 0.1);
  border-radius: 6px;
  padding: 0 0.7rem;
  background: rgba(255, 255, 255, 0.72);
  color: var(--ink);
  font-size: 0.84rem;
  font-weight: 800;
}

.tool-first-workspace {
  min-width: 0;
}
```

- [ ] **Step 2: 强化 priority 工作台样式**

Add:

```css
.ocr-tool-first-shell {
  padding: 0;
  border: 0;
  background: transparent;
}

.ocr-tool-first-shell .workspace-grid {
  box-shadow: 0 18px 44px rgba(17, 28, 24, 0.08);
}

.ocr-tool-first-shell .upload-panel {
  border-color: rgba(15, 143, 111, 0.22);
  background: rgba(255, 255, 255, 0.9);
}

.ocr-tool-first-shell .upload-dropzone {
  min-height: 190px;
}
```

- [ ] **Step 3: 新增移动端约束**

Inside the existing `@media (max-width: 640px)` block, add:

```css
.tool-first-home,
.tool-first-landing {
  padding-top: 0.75rem;
}

.tool-first-intro h1,
.tool-first-intro-compact h1 {
  max-width: 13ch;
  font-size: 2.2rem;
  line-height: 1;
}

.tool-first-pills {
  display: grid;
  grid-template-columns: 1fr;
}

.tool-first-pills span {
  justify-content: center;
  width: 100%;
  text-align: center;
}
```

- [ ] **Step 4: 删除无用首屏假预览依赖**

Do not delete old `.scanlume-hero-*` CSS yet, because the previous commit may still be useful during review. The new pages must not render those classes.

---

### Task 6: 全量验证与提交

**Files:**
- All modified files above

- [ ] **Step 1: 运行目标测试**

Run:

```bash
pnpm --dir apps/web test app/__tests__/home-page.test.tsx components/__tests__/ocr-workspace.test.tsx
```

Expected: 10 tests pass.

- [ ] **Step 2: 运行 lint**

Run:

```bash
pnpm --dir apps/web lint
```

Expected: exits 0 with no ESLint errors.

- [ ] **Step 3: 运行 build**

Run:

```bash
pnpm --dir apps/web build
```

Expected: Next.js production build succeeds.

- [ ] **Step 4: 本地浏览器验收**

Run a temporary server:

```bash
pnpm --dir apps/web exec next dev -p 3055
```

Check at least:

- `http://localhost:3055/`
- `http://localhost:3055/imagem-para-texto`
- `http://localhost:3055/pdf-para-texto`
- `http://localhost:3055/jpg-para-texto`

Use headless Chrome screenshots for desktop and mobile. Confirm upload area appears in the first viewport and mobile has no horizontal overflow.

- [ ] **Step 5: 关闭临时服务**

Stop the dev server with `Ctrl-C`. Confirm no port 3055 process remains:

```bash
pgrep -af "next dev.*3055" || true
```

- [ ] **Step 6: 提交实现**

Run:

```bash
git add apps/web/app/page.tsx apps/web/components/tool-landing.tsx apps/web/components/ocr-workspace.tsx apps/web/app/globals.css apps/web/app/__tests__/home-page.test.tsx apps/web/components/__tests__/ocr-workspace.test.tsx
git commit -m "Redesign Scanlume pages around the OCR workspace"
```

Expected: commit succeeds and `git status --short` is clean.
