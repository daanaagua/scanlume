# Scanlume 子页简洁皮肤改造记录

日期：2026-06-01

## 目标

把 Scanlume 首页已经确定的 tool-first 风格延伸到主要子页，减少长篇说明、重复按钮和旧 hero/card 视觉。用户进入子页时应先看到简洁说明、核心工具或核心任务，而不是大段营销文案。

## 执行方式

1. 使用 agy 分块处理视觉皮肤，不让子代理读取完整历史。
2. 第一块只处理 `ToolLanding` 共用工具页模板。
3. 第二块处理 `/sobre`、`/metodo-e-evidencia`、`/contato`、`/privacidade`、`/termos`。
4. 第三块处理 `/precos`、`/api`、`/blog` 和博客文章模板。
5. 主代理负责审查 diff、修复功能回归、恢复付款入口、补齐测试契约和线上部署。

## 关键决策

- 工具类子页继续保留第一屏 OCR 工作区。
- 工具页底部从多段长滚动内容收敛为一个紧凑辅助区：用法、场景、FAQ、相关页面和博客链接都保留，但视觉密度降低。
- 价格页必须保留月付和年付真实 checkout 按钮，不能为了减少按钮而删除购买路径。
- API 页保留代码示例和商业内链，但去掉旧的大辅助卡片和内联样式。
- 博客入口和文章页统一成短 hero，正文内容保留，顶部不再堆两个大 CTA。
- 法律页保持正文可读，不新增按钮。
- 联系页首屏直接展示联系表单。

## 主代理修复点

- 恢复 agy 删除的年付 checkout 按钮。
- 恢复价格页测试依赖的 `Plano anual:` 和 `Recursos incluidos` 文案。
- 恢复商业页测试依赖的价格支持标题。
- 给 API 页保留 `Navegador ou API?` 内链，避免商业页 SEO 契约回退。
- 修正 `pricing-shell` 失去 grid 布局的问题。
- 修正 FAQ 紧凑样式选择器，从 `strong` 改为 `summary`。
- 修正文案 typo：`entrar in` 改为 `entrar em`。
- 清理少数工具页额外追加的旧长段落和重复 CTA。
- 修复移动端 `tool-first` 容器后置覆盖规则，避免工具页、博客页在手机首屏贴边。
- 修复 API 代码示例长行横向滚动，让代码块保留换行并自动折行。

## 验收范围

- `pnpm --dir apps/web lint`
- `pnpm --dir apps/web test app/__tests__/commercial-pages.test.tsx components/__tests__/pricing-page.test.tsx app/__tests__/home-page.test.tsx components/__tests__/ocr-workspace.test.tsx`
- `pnpm --dir apps/web build`
- 浏览器抽查桌面和移动端：工具页、价格页、API 页、博客页、联系页。
- 使用 390px 真实移动视口复核 `/imagem-para-texto`、`/contato`、`/blog`，确认 `documentElement.scrollWidth` 等于视口宽度。
