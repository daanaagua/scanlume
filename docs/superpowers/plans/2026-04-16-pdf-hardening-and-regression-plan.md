# PDF OCR 加固与回归实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 提升 mixed PDF 质量、补齐后端校验、增加真实样本回归、统一 API 文档、并改进 PDF 结果页表达。

**Architecture:** 保留“前端 PDF.js 预处理 + 后端 OCR/导出”的现有架构。前端负责把单区域截图升级为多区域预处理，后端负责读取真实页数并重建 mixed 页阅读顺序，同时补充真实样本回归和文档一致性修复。

**Tech Stack:** Next.js App Router、React 19、TypeScript、Vitest、pdf.js、pdf-lib、Playwright 脚本。

---

## 文件映射

- 修改：`apps/web/lib/pdf-renderer.ts`
- 修改：`apps/web/lib/__tests__/pdf-client.test.ts`
- 修改：`apps/web/components/ocr-workspace.tsx`
- 修改：`apps/web/components/__tests__/ocr-workspace.test.tsx`
- 修改：`apps/api/src/lib/pdf-ingest.ts`
- 修改：`apps/api/src/lib/__tests__/pdf-ingest.test.ts`
- 修改：`apps/api/src/lib/pdf-segmentation.ts`
- 修改：`apps/api/src/lib/__tests__/pdf-segmentation.test.ts`
- 修改：`apps/api/src/index.ts`
- 修改：`apps/api/src/lib/__tests__/pdf-ocr.test.ts`
- 修改：`apps/api/src/lib/pdf-prompts.ts`
- 修改：`apps/web/lib/pricing.ts`
- 修改：`apps/web/app/api/page.tsx`
- 新增：`scripts/run-live-pdf-regression.mjs`
- 新增：`docs/pdf-regression-README.md`（如需要，说明脚本用法）

### Task 1：锁定后端真实页数校验缺口

**Files:**
- Modify: `apps/api/src/lib/pdf-ingest.ts`
- Modify: `apps/api/src/lib/__tests__/pdf-ingest.test.ts`
- Modify: `apps/api/src/index.ts`
- Modify: `apps/api/src/lib/__tests__/pdf-ocr.test.ts`

- [ ] **Step 1: 先写失败测试**

补测试覆盖：

- 样本 PDF 真实页数读取为 `1`
- `totalPages` 与真实页数不一致时拒绝
- `preparedPages` 页码重复或越界时拒绝

- [ ] **Step 2: 运行定向测试，确认先失败**

Run: `pnpm --dir apps/api test -- --run src/lib/__tests__/pdf-ingest.test.ts src/lib/__tests__/pdf-ocr.test.ts`

Expected:

- 至少出现与 `totalPages` 校验、prepared page 校验相关失败

- [ ] **Step 3: 写最小实现**

实现内容：

- 在 `pdf-ingest.ts` 中用 `pdf-lib` 读取真实页数
- 新增 prepared pages 校验函数
- `/v1/pdf/ocr` 以服务端页数为准做一致性检查

- [ ] **Step 4: 重跑定向测试，确认通过**

Run: `pnpm --dir apps/api test -- --run src/lib/__tests__/pdf-ingest.test.ts src/lib/__tests__/pdf-ocr.test.ts`

Expected:

- PASS

### Task 2：先用测试锁住 mixed PDF 多区域切分

**Files:**
- Modify: `apps/web/lib/pdf-renderer.ts`
- Modify: `apps/web/lib/__tests__/pdf-client.test.ts`

- [ ] **Step 1: 先写失败测试**

补测试覆盖：

- 一个页面有两个离散 raster 块时，应生成两个 `ocrRegions`
- 有 native text 时，只对非 native 区域生成 OCR regions
- mixed 页仍保持 `source = "mixed"`

- [ ] **Step 2: 运行定向测试，确认先失败**

Run: `pnpm --dir apps/web test -- --run lib/__tests__/pdf-client.test.ts`

Expected:

- 与 `ocrRegions` 数量或多区域检测相关失败

- [ ] **Step 3: 写最小实现**

实现内容：

- 把单一 `detectRasterRegion` 升级为 `detectRasterRegions`
- 引入简化占用网格、连通区域检测、噪声过滤、相邻区域合并
- `buildPreparedPdfPages` 输出多个 OCR regions

- [ ] **Step 4: 重跑定向测试，确认通过**

Run: `pnpm --dir apps/web test -- --run lib/__tests__/pdf-client.test.ts`

Expected:

- PASS

### Task 3：重建 mixed 页阅读顺序

**Files:**
- Modify: `apps/api/src/lib/pdf-segmentation.ts`
- Modify: `apps/api/src/lib/__tests__/pdf-segmentation.test.ts`
- Modify: `apps/api/src/index.ts`
- Modify: `apps/api/src/lib/pdf-prompts.ts`
- Modify: `apps/api/src/lib/__tests__/pdf-ocr.test.ts`

- [ ] **Step 1: 先写失败测试**

补测试覆盖：

- 多区域 OCR blocks 与 native text blocks 按 bbox 顺序交错合并
- mixed 页不会再固定“native 全在前，OCR 全在后”
- PDF region prompt 明确要求保留葡语重音与边缘文本

- [ ] **Step 2: 运行定向测试，确认先失败**

Run: `pnpm --dir apps/api test -- --run src/lib/__tests__/pdf-segmentation.test.ts src/lib/__tests__/pdf-ocr.test.ts`

Expected:

- 与顺序重建或 prompt 预期相关失败

- [ ] **Step 3: 写最小实现**

实现内容：

- 在 `pdf-segmentation.ts` 增加统一 block 排序 helper
- native/OCR block 统一 lane 与 reading-order 逻辑
- `index.ts` mixed 页组装改为按统一排序输出
- `pdf-prompts.ts` 增加葡语 / 重音 / edge text 明确约束

- [ ] **Step 4: 重跑定向测试，确认通过**

Run: `pnpm --dir apps/api test -- --run src/lib/__tests__/pdf-segmentation.test.ts src/lib/__tests__/pdf-ocr.test.ts`

Expected:

- PASS

### Task 4：统一 API 文档与结果页文案

**Files:**
- Modify: `apps/web/lib/pricing.ts`
- Modify: `apps/web/app/api/page.tsx`
- Modify: `apps/web/components/ocr-workspace.tsx`
- Modify: `apps/web/components/__tests__/ocr-workspace.test.tsx`

- [ ] **Step 1: 先写失败测试**

补测试覆盖：

- API 页面只宣传 `base64 data URL`
- PDF 结果页显示更明确的 mixed 页说明
- 下载按钮附近有更清晰导出语义说明

- [ ] **Step 2: 运行定向测试，确认先失败**

Run: `pnpm --dir apps/web test -- --run components/__tests__/ocr-workspace.test.tsx`

Expected:

- 与 mixed 页说明或 API 文案相关失败

- [ ] **Step 3: 写最小实现**

实现内容：

- pricing/API 页面统一成真实契约
- PDF 结果摘要改为更直观的 mixed 页说明
- 保留现有结构，避免大范围 UI 重构

- [ ] **Step 4: 重跑定向测试，确认通过**

Run: `pnpm --dir apps/web test -- --run components/__tests__/ocr-workspace.test.tsx`

Expected:

- PASS

### Task 5：把真实样本回归工具正式化

**Files:**
- Create: `scripts/run-live-pdf-regression.mjs`
- Modify: `package.json`
- 可选 Create: `docs/pdf-regression-README.md`

- [ ] **Step 1: 先写脚本接口与结果契约**

脚本输入固定样本：

- `docs/pdf-mixed-pt-test-1page.pdf`

脚本输出固定产物：

- JSON 结果
- 页面截图
- 两个导出 PDF
- 两个导出 PDF 的渲染截图

- [ ] **Step 2: 本地执行脚本，确认它先能暴露问题或完成最小闭环**

Run: `node scripts/run-live-pdf-regression.mjs`

Expected:

- 若依赖不齐，应明确报错
- 若运行成功，应产出 JSON 与截图

- [ ] **Step 3: 固化到仓库脚本**

实现内容：

- 脚本进入 `scripts/`
- `package.json` 暴露一个明确命令，例如 `pnpm verify:pdf-live`
- 文档说明这是高价值真实样本回归，不纳入默认单元测试

- [ ] **Step 4: 重新运行正式命令，确认产物稳定**

Run: `pnpm verify:pdf-live`

Expected:

- 退出码 `0`
- 生成固定 JSON 与截图产物

### Task 6：全量验证

**Files:**
- No additional production files expected

- [ ] **Step 1: 跑 API 定向测试**

Run: `pnpm --dir apps/api test -- --run src/lib/__tests__/pdf-ingest.test.ts src/lib/__tests__/pdf-segmentation.test.ts src/lib/__tests__/pdf-ocr.test.ts src/lib/__tests__/pdf-export.test.ts`

Expected:

- PASS

- [ ] **Step 2: 跑 Web 定向测试**

Run: `pnpm --dir apps/web test -- --run lib/__tests__/pdf-client.test.ts components/__tests__/ocr-workspace.test.tsx`

Expected:

- PASS

- [ ] **Step 3: 跑真实样本回归脚本**

Run: `pnpm verify:pdf-live`

Expected:

- PASS
- 产出 JSON、截图、导出 PDF

- [ ] **Step 4: 人工 spot check**

检查：

- 结果 JSON 中有关键文本
- `searchable PDF` 与 `reflowed PDF` 都可打开
- PDF 结果页 mixed 说明已更新
