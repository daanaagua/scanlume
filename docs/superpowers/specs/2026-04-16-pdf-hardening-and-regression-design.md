# PDF OCR 加固与回归设计

日期：2026-04-16
状态：已按当前对话范围确认，进入实现
负责人：Codex

## 目标

围绕 `scanlume` 当前 PDF OCR 链路，完成 5 个优先级改进：

1. 提升 `mixed PDF` 的前端区域切分与后端阅读顺序重建能力。
2. 让后端自己读取并验证 PDF 元数据，不再信任前端上报的 `totalPages`。
3. 为真实样本 `docs/pdf-mixed-pt-test-1page.pdf` 建立可重复执行的自动回归验证。
4. 统一 API 文档与实际能力描述，消除“文档说支持 file upload / image URL，但代码只支持 base64”的漂移。
5. 优化 PDF 结果区与状态文案，让 mixed 页统计、导出能力、限制说明更清晰。

## 当前问题

### 1. mixed PDF 区域切分过粗

- `apps/web/lib/pdf-renderer.ts` 目前只会找到一个 `rasterRegion`。
- 当页面存在多个图片块、双栏图片、图注或分散扫描区时，这个策略会把不相关内容裁进一个大图块。
- 后果是 OCR 输入噪声变大，阅读顺序更容易错。

### 2. 后端对 PDF 元数据校验不足

- `apps/api/src/lib/pdf-ingest.ts` 目前只校验 MIME、大小、hash，不读取真实页数。
- `/v1/pdf/ocr` 实际使用前端传来的 `totalPages` 和 `preparedPages`。
- 这意味着前端预处理一旦偏离原始 PDF，后端缺少最后一道兜底。

### 3. 缺真实样本回归

- 当前测试主要覆盖 schema、额度、导出字节合法性、基础 UI。
- 缺少围绕真实 fixture 的回归验证，尤其缺少“样本 PDF 经过预处理、OCR、导出后，关键结果仍可观察到”的自动检查。

### 4. API 文档与实现不一致

- 设计文档里提到 API 输入有 file upload / image URL / base64。
- 实际 `POST /v1/api/ocr` 只接受 JSON `mode + base64(data URL)`。
- 这会误导接入方，也会让 pricing / API 页面代码示例和服务端契约脱节。

### 5. PDF 结果页表达不够清晰

- 当前结果页展示 `Texto nativo / OCR / Misto` 页级统计，但对 mixed 页会出现“`Misto: 1`，同时 `Texto nativo: 0`、`OCR: 0`”。
- 对用户而言，这容易被理解成“既不是 native，也不是 OCR”，语义不直观。
- 当前预览与下载说明没有明确强调“mixed 页是混合来源重建结果”。

## 设计原则

### 原则 1：优先修正真实质量风险，不做无关重构

本次只改和 PDF OCR 质量、契约一致性、回归可靠性直接相关的部分，不顺手重写整个 OCR 架构。

### 原则 2：前端做预处理，后端做最终校验

前端继续承担浏览器内 PDF.js 渲染与局部截图职责；后端新增真实页数读取与 prepared data 校验，避免单边信任。

### 原则 3：自动回归分成“确定性测试”和“真实链路脚本”两层

- 确定性测试：进入 Vitest，保证本地和 CI 可重复。
- 真实链路脚本：保留真实上传和下载验证，用于高价值样本复验，不强行并入默认单元测试。

### 原则 4：文档必须服从真实实现

如果本次不扩 API 能力，就把所有文档、FAQ、示例统一成“base64 data URL only”。不保留模糊说法。

## 方案

## 方案一：前端多区域切分 + 后端按 bbox 合并阅读顺序

这是本次推荐方案，也是实现方案。

### 前端预处理

在 `apps/web/lib/pdf-renderer.ts` 中，把单一 `detectRasterRegion()` 升级为多区域检测：

- 先在 canvas 像素层构建简化占用网格。
- 排除已被 native text bbox 覆盖的区域。
- 对剩余非白色像素做连通区域聚类，得到多个候选图片区域。
- 对过小、过薄、纯噪声区域做过滤。
- 对相邻且重叠明显的区域做合并。
- 最终为每页生成 `ocrRegions[]`，而不是最多 1 个区域。

这样 mixed 页不再被强制压成一个大 crop。

### 后端阅读顺序

在 `apps/api/src/lib/pdf-segmentation.ts` 中新增统一排序逻辑：

- native text blocks 和 OCR blocks 都转成带 bbox 的统一结构。
- 使用页宽、块宽、块左边距推导 `lane`：`full / left / right`。
- 先构造“区域顺序”，再在区域内保留原始 block 顺序。
- mixed 页最终输出时，不再简单地“native 全在前、OCR 全在后”，而是按空间顺序交错合并。

这样能更贴近页面真实阅读顺序，避免图文错位。

## 方案二：后端读取真实页数并验证 preparedPages

在 `apps/api/src/lib/pdf-ingest.ts` 中，用现有依赖 `pdf-lib` 读取：

- `totalPages`
- 基础 PDF 可读性

新增校验规则：

- 前端传入的 `totalPages` 与后端读取值不一致时，拒绝请求。
- `preparedPages` 中的页码必须为正整数、不能重复、不能超出真实页数。
- `preparedPages.length` 不能大于真实页数。
- 若 `preparedPages` 与真实页数/页码关系异常，返回结构化 `pdf_invalid` 或新增更精确错误码。

这样后端对 PDF 元数据拥有最终解释权。

## 方案三：回归测试双层化

### 确定性测试

加入真实 fixture 参与的本地自动测试：

- `pdf-ingest`：验证样本 PDF 的真实页数读取为 `1`。
- `pdf-renderer`：验证样本 PDF 的预处理结果至少能产出一个 mixed 页和至少一个 OCR region。
- `pdf-segmentation`：验证多区域排序和 mixed 合并顺序。
- `pdf-export`：验证导出 PDF 仍可打开、仍含关键文本层。
- `ocr-workspace`：验证 UI 对 mixed 页统计说明和 PDF 下载区文案。

### 真实链路脚本

把当前临时脚本正式化：

- 输入固定样本 `docs/pdf-mixed-pt-test-1page.pdf`
- 打开线上 `/pdf-para-texto`
- 上传、等待 OCR、抓取预览文本
- 下载 `searchable PDF` 与 `reflowed PDF`
- 重新打开导出件并抽取文字层
- 产出 JSON 和截图证据

脚本不作为默认 `pnpm test` 的一部分，但作为仓库内正式回归工具保存。

## 方案四：API 文档与示例统一

本次不扩展 API 输入能力，只统一文档到真实实现：

- `/api` 页面
- `apps/web/lib/pricing.ts`
- FAQ / code examples / metadata / 页面描述

统一表述为：

- v1 图片 API 只接受 JSON `mode + base64(data URL)`
- 如果用户有本地文件，需要先转成 data URL
- PDF API 仍为 beta / waitlist，不宣传同步文件上传契约

这样能立刻消除用户误解，也避免先承诺后补实现。

## 方案五：结果页信息重写

在 `ocr-workspace.tsx` 中重写 PDF 结果摘要：

- 把页级来源统计与文本来源说明拆开。
- 保留总页数、处理页数。
- 对 mixed 页显示更清晰的说明，例如：
  - `Paginas mistas: N`
  - `Texto reconstruido com texto nativo + OCR por regiao`
- 对下载区增加一句说明：
  - `PDF pesquisavel preserva视觉页面并叠加可搜索文本`
  - `PDF reorganizado按恢复后的阅读顺序重排`

目标不是换皮，而是减少用户误判。

## 非目标

- 不引入异步 PDF job 架构。
- 不在本次实现 file upload / image URL 版图片 API。
- 不重写整个定价模型。
- 不做通用表格 / 杂志 / 学术论文级别版面恢复。

## 验收标准

- mixed PDF 前端可生成多个 OCR region，而不是固定最多一个。
- 后端能从原始 PDF 读取真实页数，并拒绝元数据不一致请求。
- 样本 `pdf-mixed-pt-test-1page.pdf` 有正式自动回归覆盖。
- API 页面、pricing 文案、示例代码全部与真实实现一致。
- PDF 结果页的 mixed 统计与导出说明更清晰。
- 相关 web / api 测试通过；真实链路脚本可成功产出 JSON 与截图证据。
