# Scanlume 工具优先前端重塑设计

## 背景

上一版已经把 Scanlume 首页改成 OCR desk 风格，但首屏仍然像营销页：大标题、大段说明、多个按钮、视觉预览都在真实上传工具之前。用户进入站点的首要意图是上传图片或文件做 OCR，因此首屏必须直接提供真实上传区，而不是先解释产品。

这份设计覆盖首页和复用 `ToolLanding` 的工具子页。目标不是重写 OCR 功能，而是重排信息层级、删减首屏噪音，并让主要工具页形成统一风格。

## 目标

1. 首页首屏直接出现真实上传图片/文件的位置。
2. 工具子页首屏也直接出现真实 OCR 工作台，风格与首页一致。
3. 首屏文字压缩到最少：一个短 H1、一行说明、少量能力标签。
4. 删除或下移首屏里的营销式长文、重复 CTA、假预览和流程卡。
5. 保留 SEO 内容，但放在首屏以下，并用更规整、更短的模块承载。
6. 不改变 OCR 上传、模式选择、处理、复制、下载、登录弹窗和额度逻辑。

## 非目标

1. 本次不改后端 OCR API。
2. 本次不改计费、credits、登录注册流程。
3. 本次不新增图片生成资产；上一版生成的图片可继续作为工作台内部辅助图，但不再作为首页主视觉。
4. 本次不清理所有 SEO 文案，只调整首屏信息架构和共享工具页风格。

## 页面结构

### 首页

首页改为 `tool-first-home` 结构：

1. 首屏为真实工具区。
   - 顶部只保留 `Scanlume OCR online` 类短标题。
   - 副标题只说明支持 JPG、PNG、screenshot、PDF 和可复制/下载。
   - 三个以内能力标签：`Gratis para testar`、`Imagem e PDF`、`TXT, MD, HTML, PDF`。
   - 同一个首屏内直接渲染 `<OcrWorkspace defaultMode="simple" priorityLayout />`。

2. 首屏不再出现：
   - 假 scanner preview。
   - `Abrir a ferramenta`、`Ver modo formatado`、`Ver planos` 这类把用户从工具前带走的按钮。
   - 两段以上 SEO 解释文。
   - 四张流程卡。

3. 首屏以下保留必要模块：
   - “Como funciona” 保留三步，但文案更短。
   - “Escolha o fluxo” 保留相关路线入口，但视觉降噪。
   - FAQ、blog、metodo/evidencia 继续存在，避免 SEO 和信任资产丢失。

### 工具子页

所有复用 `ToolLanding` 的页面改为同类 `tool-first-landing` 结构：

1. 首屏先显示真实 OCR 工作台。
2. 工具页标题和说明放在工作台上方的紧凑工具栏区域。
3. 原来的 `command-hero`、`command-mode-row`、“Usar agora / Voltar ao upload”按钮从工具页首屏移除。
4. `ToolLanding` 仍然使用对应 `page.defaultMode`：
   - `imagem-para-word` 和 PDF 类页面继续默认进入 `formatted`。
   - 普通图片类页面继续默认进入 `simple`。
5. 首屏以下继续渲染用例、上下文链接、步骤、相关页面、blog、FAQ，但不再与首屏竞争注意力。

### 例外页面

`imagem-para-texto`、`extrair-texto-de-imagem`、`transcrever-imagem-em-texto` 当前在 `ToolLanding` 后面还有额外 SEO 区块。本次不删除这些区块，但首屏由共享 `ToolLanding` 控制，因此它们也会先展示上传工具。后续如果还显得冗余，再单独清理这些长尾区块。

## 组件设计

### `OcrWorkspace`

保持当前功能逻辑。只新增展示层能力：

1. `priorityLayout` 继续表示紧凑首屏布局。
2. 根节点保留可测试类名 `ocr-desk-shell`。
3. 新增或强化工具优先样式类，使上传区在视觉上优先级最高。
4. 移动端顺序保持：上传区、扫描状态、结果区、额度信息。

### `Home`

首页直接把 `OcrWorkspace` 放进首屏。首页自己的 hero copy 只负责说明当前工具，不再承担完整营销叙事。

### `ToolLanding`

把原先“hero -> workspace”的顺序改为“紧凑标题 -> workspace -> SEO 内容”。共享组件改一次即可覆盖主要工具子页。

## 样式原则

1. 整体更干净：减少边框层级、减少大块阴影、减少装饰网格强度。
2. 首屏容器不做卡片套卡片。工作台本身可以有面板，但页面 section 不再做重装饰框。
3. 上传 dropzone 是首屏最强视觉锚点。
4. 桌面端工作台可以保持三列，但上传列宽和标题层级需要更突出。
5. 移动端首屏不能横向溢出，文字不能被裁切。
6. 新增 CSS 不使用 viewport-width 字号，不使用负 letter-spacing。

## 测试与验收

1. 首页测试要断言首屏存在真实 `ocr-workspace`，并且不存在旧的假预览结构。
2. `ToolLanding` 测试要断言工具页首屏使用 `tool-first-landing`，并保留真实上传、扫描、结果区域。
3. OCR 工作台测试继续覆盖 upload、scan、result 三个区域和新工具优先类名。
4. 运行：
   - `pnpm --dir apps/web test app/__tests__/home-page.test.tsx components/__tests__/ocr-workspace.test.tsx`
   - `pnpm --dir apps/web lint`
   - `pnpm --dir apps/web build`
5. 本地浏览器验收：
   - 首页桌面首屏能直接看到上传区。
   - 首页 390px 移动端首屏能直接看到上传入口，且无横向滚动。
   - `/imagem-para-texto`、`/pdf-para-texto`、`/jpg-para-texto` 至少三条工具子页首屏风格一致。

## 风险与处理

1. 风险：SEO 文案减少导致关键词露出下降。
   - 处理：只减少首屏，长文模块保留在首屏以下。
2. 风险：`ToolLanding` 改动影响多个子页。
   - 处理：通过共享组件测试和抽样页面构建验证。
3. 风险：工作台首屏过高导致用户仍看不到上传按钮。
   - 处理：压缩 `OcrWorkspace` 的 priority layout 间距，并让上传区排在首列/首位。

## 明确结论

本次实施采用工具优先方案：首页和工具子页的首屏都直接展示真实 OCR 上传工作台。首屏不再展示假预览，不再放多按钮营销区，不再承载长段 SEO 说明。
