# Scanlume 前端重塑设计 Spec

## 背景

Scanlume 现在已经不是单页小工具，而是一个 pt-BR OCR 产品站：前端在 `apps/web`，后端在 `apps/api`，核心入口是 `https://www.scanlume.com/imagem-para-texto`。当前前端已经具备 OCR、PDF OCR、账号、价格、API、Blog、SEO 长尾页和信任页，但视觉层仍偏“逐步叠加后的工具站”状态。

本轮目标不是重写业务，而是用我们现在在其他项目里验证过的流程重塑前端：

1. 先用 image skill 生成统一风格参考图。
2. 再让 AGY 的 Gemini 3.5 Flash High 按“一次一页或一个页面族”的粒度搓出皮肤代码。
3. 主代理负责把皮肤接入真实组件、修复功能 bug、补测试、做浏览器验收和线上复核。

本 spec 只定义设计和执行边界，不直接实施代码改动。

## 当前架构事实

### 仓库结构

- `apps/web`：Next.js App Router 前端，包含公开站点、OCR 工作台、账号、价格、API、Blog 和 SEO 页面。
- `apps/api`：Cloudflare Worker + Hono 后端，负责 OCR、PDF OCR、账号、限额、计费和 API key。
- `docs`：架构说明、Cloudflare 绑定说明、历史 spec/plan。

### 前端关键文件

- `apps/web/app/page.tsx`：首页，直接挂载 `OcrWorkspace`。
- `apps/web/components/tool-landing.tsx`：大多数 SEO 工具页共用的页面骨架。
- `apps/web/components/ocr-workspace.tsx`：核心 OCR 工作台，约 1000 行，包含文件选择、模式切换、OCR 请求、PDF 结果、下载和登录提示。
- `apps/web/app/globals.css`：全局样式，约 3000 行，承担了几乎所有页面和组件皮肤。
- `apps/web/lib/site.ts`：站点常量、导航、ToolLanding 内容和大量页面 copy。
- `apps/web/lib/blog.ts`：Blog 数据和文章内容。
- `apps/web/components/pricing-page.tsx`：价格和 API 商业页的核心组件。
- `apps/web/public/brand/scanlume-ocr-desk.png`：当前唯一强产品视觉资产，尺寸 `1672 x 941`。

### 测试形态

- Web 使用 `vitest`、Testing Library 和 jsdom。
- 已有测试覆盖首页、SEO 基础、商业页、OCR 工作台、账号、价格和站点 header。
- 设计重塑不能只靠截图验收；必须保留源码测试，并新增视觉/结构守卫测试。

## 产品定位

Scanlume 应该被重塑成一个“轻量但可信的 OCR 操作台”，而不是泛泛的 AI 营销页。

用户进入站点后应立即理解三件事：

- 这是一个 pt-BR 优先的 OCR 工具。
- 可以直接上传 JPG、PNG、screenshot 或 PDF。
- 输出可以复制或导出到 TXT、Markdown、HTML、PDF 搜索版/重排版，部分场景可以继续走 API。

视觉气质应偏“扫描台 / 文档工作流 / 审阅控制台”，避免紫蓝渐变、抽象 AI 图、过度圆角卡片和泛 SaaS hero。主色可以继续以绿色扫描光为识别点，但需要增加纸张白、墨色、浅灰网格、少量琥珀/蓝色状态色，避免整站只剩绿色一种调性。

## 目标

1. 建立统一视觉系统，让首页、工具页、OCR 工作台、价格/API、Blog 和信任页看起来属于同一个产品。
2. 让第一屏更产品化：用户能直接看到上传、扫描、结果或与它等价的真实工作台信号，而不是只看到解释性文案。
3. 保留现有功能链路：OCR、PDF OCR、复制、下载、账号、价格、API、Blog、SEO 路由、sitemap、llms。
4. 降低视觉实现风险：AGY 只处理皮肤和布局，主代理接入真实状态和事件。
5. 为每个页面族留下可复用的验收标准，避免后续继续靠主观“好不好看”判断。

## 非目标

- 不重写 `apps/api` 的 OCR、账号、计费和 API key 逻辑。
- 不改 pt-BR 核心 SEO 文案、metadata、canonical、sitemap 策略，除非视觉结构需要拆分显示。
- 不在本轮新增 DOCX、批量后台任务、R2 异步队列或新计费功能。
- 不让 AGY 处理后端请求、认证、下载、PDF 解析或任何真实业务状态。
- 不一次性把整个仓库丢给 AGY。

## 页面分组

### A. 核心产品入口

范围：

- `/`
- `/imagem-para-texto`
- `/pdf-para-texto`

设计要求：

- 第一屏必须出现产品名、OCR 上传入口或高保真的工作台视觉。
- 首页和主工具页都应把真实 OCR 入口放在首屏或首屏紧邻位置。
- `/imagem-para-texto` 和 `/pdf-para-texto` 可以共用同一套 ToolLanding 皮肤，但需要通过文案、模式默认值和状态提示体现差异。
- 不做传统营销 split hero；如果使用 hero 图，应使用全宽或沉浸式“扫描台”背景，文字不放在浮动大卡里。

### B. OCR 工作台

范围：

- `apps/web/components/ocr-workspace.tsx`
- 与其相关的样式和测试

设计要求：

- 将视觉分成三个稳定区域：上传队列、扫描进度、结果预览。
- 当前业务状态必须完整保留：模式切换、文件校验、PDF 限制、进度条、错误、结果 tab、复制、下载、登录弹窗。
- 页面文案应减少“说明书式”堆叠，复杂规则放到 popover、drawer 或紧凑 status rail。
- 上传、处理、成功、失败、空状态都要有明确视觉状态。
- 移动端应先保证可操作：上传按钮、开始 OCR、结果复制/下载不能被视觉元素挤出第一任务路径。

### C. SEO 工具页模板

范围：

- `ToolLanding` 驱动的所有工具页：
  - `/ocr-online`
  - `/imagem-para-word`
  - `/jpg-para-texto`
  - `/png-para-texto`
  - `/ocr-em-portugues`
  - `/extrair-texto-de-imagem`
  - `/extrair-texto-de-foto`
  - `/extrair-texto-de-print`
  - `/imagem-para-texto-no-celular`
  - `/transcrever-imagem-em-texto`

设计要求：

- 这些页面不应每页独立重画皮肤；应共用一个可参数化模板。
- 页面差异主要来自 `site.ts` 内容、默认模式、上下文链接和 CTA 文案。
- 需要避免多个长尾页看起来像重复 doorway page；可以通过轻量场景标签、文件类型符号和相关路径 rail 做差异化。
- AGY 一次只处理一个模板样例页，再由主代理推广到整个 `ToolLanding`。

### D. 商业页

范围：

- `/precos`
- `/api`
- `PricingPage`
- `CodeExampleTabs`
- `ApiKeyPanel`

设计要求：

- 价格页和 API 页应从“内容堆叠”升级成“购买/集成决策面板”。
- Web OCR 与 API OCR 的差异要视觉上清楚：浏览器适合人工上传和审阅，API 适合自动化和批量流程。
- 价格卡必须紧凑、可比较，移动端不能变成长滚动混乱卡片。
- 代码示例保持可复制、可读，不让装饰遮挡。

### E. Blog 和内容页

范围：

- `/blog`
- `/blog/[slug]`
- `blog-article-page.tsx`
- `blog.ts`

设计要求：

- Blog 应成为“测试、方法、导出实践”的知识库，而不是普通文章列表。
- 文章页需要保留作者、review date、method/evidence 信号。
- 图片可以沿用现有 blog PNG，也可以在后续用 image skill 重新生成同一风格封面。
- 内容页要有清晰阅读宽度，不使用卡片套卡片。

### F. 信任、法务、账号和支持页

范围：

- `/sobre`
- `/metodo-e-evidencia`
- `/featured-on`
- `/contato`
- `/privacidade`
- `/termos`
- `/conta`
- `/esqueci-a-senha`
- `/redefinir-senha`
- `/verificar-email`

设计要求：

- 信任页偏“方法透明”和“边界清晰”，不需要重营销化。
- 账号和认证页要与主工作台视觉一致，但不能牺牲表单可用性。
- 法务页保持朴素、可读、低装饰。

## 统一视觉方向

### 风格关键词

- Optical desk
- Document scanner
- Editorial proofing
- Quiet operational tool
- pt-BR workplace utility

### 视觉元素

- 纸张、扫描光、文档边缘、识别框、文件队列、输出通道、状态 rail。
- 可以使用轻网格、细线、淡纸纹和真实产品截图感。
- 禁止使用抽象 orb、紫蓝渐变、无意义 3D 球、过度毛玻璃、营销风大 hero 卡片。

### 色彩

- 保留扫描绿色作为主识别色。
- 增加墨黑、纸白、浅灰网格、琥珀警告、蓝色信息状态。
- 控制绿色面积，避免整站单一绿色调。

### 组件规则

- 卡片圆角默认不超过 8px；只有弹窗、重复项目卡、上传 dropzone 可按需要略大，但必须统一。
- 按钮使用清晰命令文案；工具动作优先使用图标 + tooltip，若没有图标库再用文字。
- 固定格式元素必须有稳定尺寸：上传队列、格式 tab、价格卡、结果预览、代码块、header nav。
- 移动端必须避免文字竖排、按钮文字溢出、卡片之间重叠、横向不可控溢出。

## Image Skill 输出规范

每个页面族在交给 AGY 前，先生成一张参考图。参考图不是最终代码，只用于统一视觉方向。

### 通用 prompt 模板

```text
Create a production-grade web UI reference image for Scanlume, a Brazilian Portuguese OCR product.
Visual direction: optical document scanner desk, white paper, subtle grid, green scanning light, document queue, output channels, quiet operational SaaS tool.
Avoid purple gradients, abstract AI orbs, stock-photo people, oversized marketing hero cards, rounded card-heavy generic SaaS layout.
The UI should feel like a usable OCR workspace, not a landing-page mockup.
Use Portuguese labels where visible, but keep text short and realistic.
Desktop 1440px composition, responsive-safe spacing, stable toolbar and command controls.
```

### 页面族补充

- 首页/主工具页：展示上传、扫描、结果三段式工作台，首屏能看见实际工具。
- OCR 工作台：展示空状态、上传队列、处理中和结果预览的同屏布局。
- 价格/API：展示 Web OCR 与 API OCR 的决策表、额度、价格和代码示例。
- Blog：展示文章索引和一篇测试文章的阅读页，不做杂志式大封面堆叠。
- 信任/账号：展示方法透明、支持表单、账号余额和认证表单。

## AGY 协作规范

AGY 每次只接收一个明确任务，不能让它读取完整仓库历史。

### 给 AGY 的输入

每次任务只包含：

- 当前页面族目标。
- 参考图路径或截图说明。
- 相关文件片段，通常不超过 2-4 个文件。
- 明确禁止事项。
- 需要返回的文件 diff 或完整组件/CSS 片段。

### 给 AGY 的禁止事项

- 不改 API 调用。
- 不改 OCR 处理逻辑。
- 不改账号、计费、下载、PDF export 行为。
- 不改 metadata、canonical、sitemap、llms，除非任务明确要求。
- 不新增无用依赖。
- 不一次性重构 `ocr-workspace.tsx` 的业务状态。
- 不把页面改成纯静态 mock。

### AGY 任务粒度

推荐顺序：

1. 首页视觉皮肤。
2. OCR 工作台视觉皮肤。
3. ToolLanding 模板视觉皮肤。
4. 价格/API 商业页视觉皮肤。
5. Blog index + article 视觉皮肤。
6. 信任/账号/法务轻量统一。

如果某个页面族太重，继续拆成“一页一个 AGY 任务”。

## 主代理接入职责

主代理负责所有真实工程整合：

- 把 AGY 输出收敛成项目现有 Next.js/React/CSS 结构。
- 处理 `globals.css` 膨胀问题，必要时抽出路由级 CSS 文件，但不得破坏 Next 构建。
- 保留并验证现有 OCR、PDF、账号、价格、API、Blog 功能。
- 为新视觉结构补源码测试和浏览器验收脚本。
- 对桌面和移动端截图做人工复核。
- 部署后线上复核核心路径。

## 技术设计

### 样式组织

当前 `globals.css` 已经过大。重塑时采用渐进拆分：

- 全局 token、基础 typography、header/footer 基础样式继续放在 `globals.css`。
- OCR 工作台样式建议迁到 `apps/web/components/ocr-workspace.css` 或组件邻近样式文件，再由全局入口引入。
- Blog、Pricing、ToolLanding 如样式明显独立，可按页面族拆分。
- 拆分必须先有测试保护，避免生产构建缺样式。

### 组件边界

优先保持业务组件接口稳定：

- `OcrWorkspace({ defaultMode, priorityLayout })` 的外部 API 不变。
- `ToolLanding({ slug })` 的外部 API 不变。
- `PricingPage` 的商业数据读取和操作行为不变。
- `SiteHeader`、`SiteFooter` 保持站点级职责，不塞入页面专属状态。

可以新增纯展示子组件，但不要把业务逻辑拆到 AGY 无法理解的状态。

### OCR 工作台拆分候选

如果后续实施时需要降低 `ocr-workspace.tsx` 复杂度，可按以下边界拆分：

- `WorkspaceUploadPanel`：模式、文件选择、队列入口、开始按钮。
- `WorkspaceScanPanel`：扫描图、进度、队列卡片。
- `WorkspaceResultPanel`：格式 tab、复制、下载、预览。
- `WorkspaceStatusRail`：额度、登录提示、成本规则。

第一轮可以只改皮肤，不强制拆分；如果出现上下文难以维护，再拆。

## SEO 和内容约束

- `site.ts` 中的 title、description、keywords、FAQ 不因视觉重塑随意改写。
- 所有 indexable 页面继续出现在 sitemap。
- `llms.txt` 和 `llms-full.txt` 的核心描述继续覆盖 OCR、PDF、价格和 API。
- Blog 的 review date、evidence/method 信号不能被移除。
- 长尾页可以压缩首屏文案，但正文内容和内链结构必须保留。

## 验收标准

### 源码测试

每个页面族至少保留或新增一组测试：

- 首页：首屏包含品牌、主 CTA、OCR workspace 入口，不恢复旧 split hero。
- ToolLanding：共享模板仍按 slug 渲染不同 H1、默认模式和相关链接。
- OCR 工作台：文件 accept、模式切换、PDF 限制、上传队列、结果 tab、下载按钮仍可被测试定位。
- Pricing/API：Web/API 切换、价格、代码 tab、购买按钮状态不回退。
- Blog：文章列表、文章页结构化数据、review/method 信号不丢失。
- SEO：sitemap、metadata、llms 保持核心路径。

### 浏览器视觉验收

每轮至少检查：

- Desktop：`1440 x 1100`
- Mobile：`390 x 900`

核心路径：

- `/`
- `/imagem-para-texto`
- `/pdf-para-texto`
- `/precos`
- `/api`
- `/blog`
- 一篇 `/blog/[slug]`
- `/sobre`
- `/conta`

检查项：

- 无文字重叠。
- 无非预期横向溢出。
- 按钮文字完整。
- header/footer 不遮挡主内容。
- OCR 工作台首屏可完成上传/启动/看结果的主路径。
- 移动端无竖排标题、超窄文本列或卡片挤压。
- 图片资源全部加载。

### 功能 smoke

如果环境允许，实施后做：

- 匿名用户打开 `/imagem-para-texto`。
- 切换 `OCR simples` 和 `Texto formatado`。
- 选择图片文件，确认队列显示。
- 在 mock 或测试环境中确认结果预览、复制、下载按钮存在。
- 访问 `/precos` 并切换 Web/API。
- 打开 Blog 文章和信任页。

真实 OCR 调用不应在视觉验收中无限制消耗额度；需要用 mock、测试 fixture 或小样本控制成本。

## 实施顺序建议

1. 生成统一视觉参考图和核心页面族参考图。
2. 写首页样板皮肤，并由主代理接入。
3. 验收首页后，再处理 OCR 工作台。
4. OCR 工作台稳定后，推广到 ToolLanding 模板。
5. 处理价格/API。
6. 处理 Blog。
7. 处理信任、法务、账号页。
8. 做全站视觉扫描、源码测试、构建、部署、线上复核。

这个顺序的原因是：首页确定产品气质，OCR 工作台确定真实可用性，ToolLanding 复用收益最大，商业页和内容页最后统一即可。

## 风险和控制

### 风险：AGY 改坏业务逻辑

控制：AGY 只做视觉输出，主代理负责接入。每次给 AGY 的上下文不包含后端逻辑和完整历史。

### 风险：全局 CSS 修改引发全站回归

控制：先为页面族加源码测试和浏览器截图扫描，再拆分或覆盖样式。避免一次性重排全站 CSS。

### 风险：SEO 页面被视觉重塑削弱

控制：保留 `site.ts` 内容结构、FAQ、内链、metadata 和 sitemap；视觉只改变布局和信息密度。

### 风险：OCR 工作台首屏变漂亮但不好用

控制：验收以用户任务为准，不以静态图为准。上传、开始、结果、复制、下载必须保持可见或易达。

### 风险：移动端被桌面视觉牺牲

控制：每个页面族在 AGY 阶段就要求移动端布局；主代理用 Playwright 做移动截图和 DOM 溢出扫描。

## 完成定义

本轮前端重塑完成时，应满足以下条件：

- 所有主要页面族采用统一 Scanlume OCR 操作台视觉。
- 核心 OCR 工作流没有功能回退。
- 样式组织比当前更可维护，至少新增页面族边界或组件级样式边界。
- `pnpm lint`、`pnpm build`、`pnpm test` 通过。
- 核心路径桌面和移动端浏览器复核通过。
- 线上部署后复核通过。
