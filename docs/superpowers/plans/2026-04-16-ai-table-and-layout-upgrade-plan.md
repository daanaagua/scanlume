# 2026-04-16 AI 表格识别与复杂版面恢复实施计划

## 目标

本次计划一次性落地四项能力，并同步更新站点文案：

1. 图片表格识别
2. 多图片区块处理
3. 图文归组
4. 双栏顺序恢复

同时新增“表格图片转文字”独立入口页。

## 实施顺序

### 第一阶段：先扩后端结构契约

1. 扩展 `schema.ts`
   - 把 `formattedBlockSchema` 改成联合结构
   - 新增表格单元格、行分组、记录结构
   - 保持 `blocks` 顶层不变，减少接口破坏

2. 扩展 `formatters.ts`
   - 文本块继续按现有逻辑输出
   - 表格块新增：
     - HTML table 输出
     - Markdown 简化表格输出
     - TXT 平铺输出

3. 扩展 `prompts.ts`
   - 明确说明何时判定为表格
   - 要求表格使用结构化 JSON 返回
   - 强调不要把普通多列正文误判成表格

4. 扩展 `index.ts`
   - `runFormattedOcr` 接收新 schema
   - 图片 OCR 结果直接携带表格块
   - PDF OCR 的页级与区域级调用复用同一结构

### 第二阶段：补 PDF 页面块排序能力

1. 扩展 `pdf-segmentation.ts`
   - 让 `PdfPageBlock` 支持表格块和图文归组元数据
   - `mapStructuredOcrBlocks` 遇到表格时保留为原子块
   - `orderPageBlocksForReading` 加入：
     - 双栏优先规则
     - 图文归组优先级
     - 表格块整体排序

2. 调整 PDF 文本合成逻辑
   - 页面导出不再假定所有块都能转成纯段落
   - 统一通过新 formatter 输出 `txt / md / html`

### 第三阶段：更新前端工作区与新页面

1. 修改 `ocr-workspace.tsx`
   - 增加表格摘要展示
   - 调整工作区文案，强调表格与复杂版面
   - 保持 `simple / formatted` 双模式不变

2. 修改 `site.ts`
   - 增加“表格图片转文字”新路由
   - 更新首页、主入口、相关链接与内链结构

3. 新增页面文件
   - 新建新入口页，复用 `ToolLanding`

4. 更新首页与 `imagem-para-texto` 长文案
   - 强化 AI 扫描优势
   - 明确传统 OCR 与结构化 OCR 的区别

### 第四阶段：补测试并执行验证

1. 后端单元测试
   - schema 联合结构测试
   - formatter 表格输出测试
   - PDF 表格块映射测试
   - 双栏排序测试

2. 前端组件测试
   - 工作区表格文案测试
   - 结果摘要测试
   - 新入口页和首页露出测试

3. 运行验证命令
   - 定向 vitest
   - typecheck
   - build

## 文件清单

### 预计修改

- `apps/api/src/lib/schema.ts`
- `apps/api/src/lib/formatters.ts`
- `apps/api/src/lib/prompts.ts`
- `apps/api/src/lib/pdf-segmentation.ts`
- `apps/api/src/index.ts`
- `apps/api/src/lib/__tests__/pdf-segmentation.test.ts`
- `apps/api/src/lib/__tests__/pdf-ocr.test.ts`
- `apps/web/components/ocr-workspace.tsx`
- `apps/web/components/__tests__/ocr-workspace.test.tsx`
- `apps/web/lib/site.ts`
- `apps/web/app/page.tsx`
- `apps/web/app/imagem-para-texto/page.tsx`
- 新增一个工具页入口文件
- 可能补一个首页/入口页测试

### 如有必要再新增

- 表格格式化辅助函数文件
- 表格 schema 辅助文件

## 验证标准

### 功能层面

1. 图片 `Texto formatado` 可以返回表格结构并展示。
2. HTML 预览能看到真实表格。
3. PDF mixed 页中，表格不被拆烂。
4. 双栏和多区域页面的顺序比当前稳定。
5. 新入口页可访问，且首页能露出。

### 工程层面

1. 新旧测试都通过。
2. 没有破坏普通图片 OCR。
3. 没有破坏既有 PDF 导出链路。

## 这次先不做的事

1. 不接入极端脏图压力样本。
2. 不做多表格页拆分器。
3. 不做视觉级表格样式复刻。
4. 不做独立的表格专属 API。
