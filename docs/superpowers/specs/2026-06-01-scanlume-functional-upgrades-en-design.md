# Scanlume 功能性升级与 `/en` 轻量国际化 Spec

## 背景

Scanlume 当前核心 OCR 流程已经可用：匿名用户能上传图片或 PDF，选择 `OCR simples` 或 `Texto formatado`，得到 TXT、Markdown、HTML、PDF 等结果，并通过价格页和 API 页理解商业路径。下一阶段不应继续优先换皮，而应提升真实用户完成任务后的“可用性闭环”，同时用一个轻量 `/en` 版本验证英文市场入口。

本 spec 覆盖两条线：

1. 功能性升级：让用户更容易处理 OCR 结果、修正失败、选择识别语言。
2. 简单 `/en`：先覆盖核心英文入口，不做全站多语言翻译。

## 总目标

1. 让用户在站内完成“上传 -> OCR -> 轻量修正 -> 下载/复制”的闭环。
2. 给多语言图片一个明确 OCR 语言选择，不要求用户切换整站语言。
3. 提供可索引、可体验的英文核心路径：`/en`、`/en/image-to-text`、`/en/pricing`、`/en/api`。
4. 保持现有 Scanlume 视觉风格，不做第二次大规模前端换皮。
5. 新增可见页面或复杂组件时，先用 image skill 生成同风格参考图，再让 agy 的 Gemini 3.5 Flash high 小块搓皮；主代理负责接入、修 bug、测试和部署。

## 非目标

1. 第一轮不做完整多语言平台，不翻译全部 blog、全部 SEO 长尾页、隐私页和条款页。
2. 第一轮不做自动翻译 OCR 结果；OCR 语言选择只影响“识别与保留原文”，不把结果翻译成另一种语言。
3. 第一轮不做付费套餐调整，不改 credits 单价，不改支付流程。
4. 第一轮不存储用户上传的原始图片/PDF。
5. 第一轮不做移动 App，也不做真机相机裁剪器；移动端拍照入口可以进入后续路线。

## 第一轮实施范围

### 1. OCR 语言选择器

在 `OcrWorkspace` 上传区中加入一个轻量语言选择控件。

可选项：

- `Auto`
- `Portuguese`
- `English`
- `Spanish`

行为：

1. 默认值为 `Auto`。
2. 该选择与 UI 语言独立。用户即使在 `/en` 页面，也可以选择 `Portuguese` 来识别葡语截图。
3. 前端向 `/v1/ocr` 和 `/v1/pdf/ocr` 传递 `ocrLanguage` 字段。
4. 后端 schema 增加 `ocrLanguage`，取值为 `auto | pt | en | es`。
5. OCR prompt 明确：
   - 不翻译原文。
   - 保留图片中真实可见文字。
   - 如果选择具体语言，优先按该语言的标点、大小写和常见词形处理。
   - 如果选择 `auto`，自动判断图片主要语言。

验收标准：

- 前端能选择语言并随请求发送。
- 后端接受新字段，旧请求不传该字段时仍按 `auto` 处理。
- 简单 OCR 和格式化 OCR 都支持该字段。
- PDF OCR 使用同一语言策略。

### 2. 结果可编辑

在结果面板中把 OCR 输出从“只读结果”升级为“可编辑结果”。

第一轮只做文本层编辑，不做富文本编辑器：

1. `TXT` 和 `MD` 使用 textarea 编辑。
2. `HTML` 保留预览，同时提供“编辑 HTML 源码”入口或在 textarea 中编辑 HTML 字符串。
3. 用户编辑后，复制和下载使用编辑后的内容。
4. 增加 `Restaurar OCR original` 操作，用于恢复模型原始结果。
5. 如果用户切换文件，编辑状态按文件保存。

验收标准：

- 用户能直接改 OCR 结果。
- 改完后下载 TXT/MD/HTML 得到编辑后的内容。
- 恢复按钮能回到 OCR 原始结果。
- 批量下载 ZIP 使用每个文件当前编辑后的内容。

### 3. 失败单文件重试

当前批量场景中单个文件失败后，用户需要重新操作整批，摩擦较大。第一轮在失败行增加 `Tentar novamente`。

行为：

1. 只有 `error` 状态行显示重试按钮。
2. 点击后只重新处理该文件，不清空其他成功结果。
3. 重试使用当前选择的 OCR 模式和语言。
4. 成功后该行状态变为 `success`，结果进入同一结果面板和批量下载逻辑。

验收标准：

- 单文件失败后可重试。
- 成功结果不会被重试操作覆盖。
- 重试失败时错误文案更新，但文件仍留在队列中。

### 4. `/en` 核心英文入口

第一轮只做四条英文路径：

- `/en`
- `/en/image-to-text`
- `/en/pricing`
- `/en/api`

内容策略：

1. `/en` 是英文首页，首屏仍然直接展示真实 `OcrWorkspace`。
2. `/en/image-to-text` 是英文工具页，只覆盖核心 image-to-text 搜索意图。
3. `/en/pricing` 复用现有价格逻辑，文案改英文，价格和 checkout product id 不变。
4. `/en/api` 复用 API 示例，但代码说明和 FAQ 改英文。
5. 不翻译 blog 列表，不翻译全部 SEO 长尾页。
6. 英文页都放语言切换链接：
   - 英文页链接到对应 pt-BR 主路径。
   - pt-BR 首页、工具页、价格页、API 页链接到对应 `/en` 路径。

技术策略：

1. 新增 `apps/web/lib/i18n.ts`，定义：
   - `type Locale = "pt-BR" | "en"`
   - 路由映射
   - header/footer/nav 文案
   - home/tool/pricing/api 的英文 copy
2. 将 `SiteHeader`、`SiteFooter`、`OcrWorkspace`、`PricingPage` 和 `CodeExampleTabs` 的可见文案逐步参数化。
3. 为英文页面创建轻量 wrapper，不复制整套业务逻辑。
4. metadata 使用英文 title、description、OpenGraph locale `en_US`。
5. sitemap 加入四条 `/en` 路由。
6. metadata alternates 增加 `pt-BR`、`en`、`x-default`。

`html lang` 处理：

当前 `app/layout.tsx` 固定 `<html lang="pt-BR">`。英文页不能长期以错误 lang 上线。第一轮有两个可选实现，优先选 A：

- A：新增 middleware，把 pathname 对应的 locale 写入 request header；RootLayout 读取该 header 设置 `<html lang="en">` 或 `<html lang="pt-BR">`。实现后必须确认 `pnpm build` 不破坏静态生成。
- B：如果 A 导致构建或缓存问题，英文页面局部容器先加 `lang="en"`，并在 spec 后续任务中单独处理 root lang；此时 `/en` 先不做大规模 SEO 推广。

验收标准：

- 四条 `/en` 路由返回 200。
- 英文页首屏不出现 pt-BR 主 CTA 文案。
- `/en` 页面仍可匿名上传和 OCR。
- `/en/api` 示例可读，endpoint 与现有 API 保持一致。
- sitemap 包含四条英文核心路径。

## 后续功能路线，不进入第一轮

### A. DOCX 导出

价值高，但实现要谨慎。建议第二轮做。

方案：

1. 对 `Texto formatado` 结果增加 `DOCX` 下载。
2. 优先使用成熟库生成真实 `.docx`，不要只把 HTML 改扩展名伪装成 Word。
3. DOCX 来源使用当前编辑后的 Markdown/blocks，而不是模型原始结果。
4. `Imagem para Word` 页面在 DOCX 上线后更新文案。

验收标准：

- Word 打开无安全警告或乱码。
- 标题、段落、换行基本保留。
- 编辑后的结果能导出 DOCX。

### B. 登录用户历史记录

价值高，但涉及隐私、D1 schema 和账户页 UI，建议第三轮做。

原则：

1. 不保存原始图片/PDF。
2. 只保存 OCR 文本结果、文件名、模式、语言、创建时间、credits 消耗和结果格式。
3. 用户可删除历史记录。
4. 账户页显示最近 OCR 任务，可重新复制/下载文本。

验收标准：

- 登录用户 OCR 成功后生成历史记录。
- 账户页可看到最近任务。
- 删除记录后无法再查看该结果。

### C. API Playground

价值偏开发者转化，建议在 `/en/api` 和 pt-BR `/api` 稳定后做。

功能：

1. 上传一张小图片。
2. 自动生成 cURL / JS / Python 示例。
3. 展示响应结构示例。
4. 不触发真实付款，不暴露用户 API key。

### D. 移动端拍照入口

可以在第一轮之后单独做。

功能：

1. 在移动端上传按钮旁增加拍照入口。
2. 使用 `<input accept="image/*" capture="environment">`。
3. 必须真机或移动浏览器复核 iOS/Android 行为。

## agy / image skill 使用规则

本项目不让 agy 承担大任务。凡涉及新页面或新可见组件，按以下流程：

1. 主代理先明确组件范围，最多一页或一个组件。
2. 如需视觉设计，先用 image skill 生成一张符合当前 Scanlume 工具优先风格的参考图。
3. 给 agy 的 Gemini 3.5 Flash high prompt 只包含：
   - 参考图或视觉要求。
   - 当前组件目标。
   - 允许修改的文件路径。
   - 禁止重构业务逻辑。
   - 禁止读取整段历史对话。
4. agy 只负责搓皮和局部样式。
5. 主代理负责：
   - 接入真实数据和业务逻辑。
   - 修 TypeScript、测试、lint、build。
   - 浏览器复核。

第一轮预计需要 agy 的地方：

- 如果语言选择器只是现有控件风格的小 segmented/select，不需要 agy。
- 如果结果编辑器需要明显新交互面板，可让 agy 只处理 `Result editor` 的视觉结构。
- `/en` 四页应复用现有页面结构，不需要 agy 新设计。

## 文件影响范围

预计新增：

- `apps/web/lib/i18n.ts`
- `apps/web/app/en/page.tsx`
- `apps/web/app/en/image-to-text/page.tsx`
- `apps/web/app/en/pricing/page.tsx`
- `apps/web/app/en/api/page.tsx`
- 可能新增 `apps/web/middleware.ts`

预计修改：

- `apps/web/app/layout.tsx`
- `apps/web/app/sitemap.ts`
- `apps/web/components/site-header.tsx`
- `apps/web/components/site-footer.tsx`
- `apps/web/components/ocr-workspace.tsx`
- `apps/web/components/pricing-page.tsx`
- `apps/web/components/code-example-tabs.tsx`
- `apps/api/src/lib/schema.ts`
- `apps/api/src/lib/prompts.ts`
- `apps/api/src/index.ts`
- 相关测试文件

## 测试计划

第一轮必须先写失败测试，再实现。

### Web 测试

1. `OcrWorkspace`：
   - 默认语言为 `Auto`。
   - 切换 `English` 后 OCR 请求包含 `ocrLanguage: "en"`。
   - 处理成功后可编辑 TXT，并下载编辑后的 TXT。
   - error 行显示 `Tentar novamente`，点击后只重试该文件。
2. `/en` 页面：
   - `/en` 渲染英文 H1 和真实 workspace。
   - `/en/image-to-text` 渲染英文工具页。
   - `/en/pricing` 渲染英文价格页和不变的产品按钮逻辑。
   - `/en/api` 渲染英文 API 文档和 code tabs。
3. sitemap：
   - 包含四条 `/en` 路由。
4. metadata：
   - 英文页有英文 title/description。
   - alternates 包含 `pt-BR` 与 `en`。

### API 测试

1. `/v1/ocr` 接受 `ocrLanguage`。
2. 不传 `ocrLanguage` 时等价于 `auto`。
3. 非法语言值返回 400。
4. prompt 构造函数包含“不翻译，只识别”的约束。
5. `/v1/pdf/ocr` 与图片 OCR 保持同一语言字段。

### 验证命令

必须运行：

```bash
pnpm --dir apps/web test
pnpm --dir apps/api test
pnpm lint
pnpm build
```

如果新增 middleware 或影响路由，还要本地浏览器验证：

```bash
pnpm dev
```

人工检查：

- `/en`
- `/en/image-to-text`
- `/en/pricing`
- `/en/api`
- `/`
- `/imagem-para-texto`

## 部署后复核

部署后必须用真实线上 URL 验证：

1. `https://www.scanlume.com/en` 返回 200。
2. `https://www.scanlume.com/en/image-to-text` 返回 200。
3. 英文首页上传一张小测试图能完成 OCR。
4. 语言选择 `English` 和 `Auto` 都能成功。
5. `/sitemap.xml` 包含 `/en` 核心路由。
6. Chrome 控制台无 hydration error。
7. 移动端 390px 下英文页面无横向溢出。

## 风险与控制

1. 风险：`OcrWorkspace` 文案参数化过大，影响 pt-BR 主站。
   - 控制：先抽最小字典，只覆盖实际显示文本；测试 pt-BR 原路径。
2. 风险：`html lang` 动态化影响静态构建或缓存。
   - 控制：先 spike middleware；如果 build 不稳定，第一轮只用局部 `lang="en"` 并暂缓 SEO 推广。
3. 风险：结果编辑器与批量下载状态复杂。
   - 控制：编辑状态按 `fileId + format` 存储；下载统一从 `getEditablePayload(fileId)` 读取。
4. 风险：历史记录和 DOCX 把第一轮拖重。
   - 控制：明确放到后续，不进入第一轮。
5. 风险：多语种 OCR 被误理解为翻译。
   - 控制：UI 文案写清楚 `Recognition language`，不使用 `Translate`。

## 明确结论

第一轮实施应聚焦四件事：

1. OCR 语言选择器。
2. OCR 结果可编辑并下载编辑后结果。
3. 单文件失败重试。
4. `/en`、`/en/image-to-text`、`/en/pricing`、`/en/api` 四条英文核心路径。

DOCX、登录历史记录、API playground 和移动拍照入口都值得做，但不应塞进第一轮。

## 实施备注

本轮实际实现时对 `html lang` 采用了 B 路径的保守策略：不让根 `layout.tsx` 读取 request header，因为验证中发现这会让所有 App Router 页面从静态预渲染变成动态渲染，影响打开速度。英文页内容、metadata、OpenGraph、sitemap 与 header/footer 导航已完成英文化，四个英文页面的主体容器设置了 `lang="en"`；根 `<html lang>` 的完全分区可在后续用多 root layout 或更细的路由结构单独处理。

本轮没有新增独立视觉皮肤，`/en` 四页复用现有 Scanlume 工具优先结构，语言选择器和结果编辑器也沿用现有控件风格，因此没有调用 agy 搓新皮。
