# Scanlume 盲测后小优化 Spec

## 背景

DeepSeek v4 pro 对线上 Scanlume 做了一轮盲测。核心 OCR 流程、匿名试用、公开页面和 API 基础链路均可用。本轮不做视觉大改，也不改支付、登录和 OCR 后端，只处理盲测中暴露的低风险体验细节。

## 目标

1. 消除 header 登录按钮在 DOM 和辅助技术中可能出现的 `EntrarEntrar` 重复名称。
2. 给开发者用户一个更直接的 API 文档入口，避免只能从价格页二级切换里发现 `/api`。
3. 在 OCR 处理中给用户明确的等待预期，减少 5-8 秒处理时间带来的不确定感。
4. 统一邮箱输入占位符文案，使用更自然的 `seu@email.com`。

## 非目标

1. 不重新设计首页、子页或整体视觉风格。
2. 不修改支付流程、Stripe/Creem 等商业逻辑。
3. 不修改 OCR API 的模型、计费、额度计算或请求顺序。
4. 不把 React 受控表单改成原生表单提交；当前支持表单通过组件 state 组装 JSON 是预期行为。

## 方案

### Header 登录按钮

`apps/web/components/auth-controls.tsx` 中匿名状态下的登录按钮只保留一个可见文本 `Entrar`。这比给重复 span 加 `aria-hidden` 更简单，也不会影响当前 CSS 按钮样式。

验收标准：
- 匿名 header 中只有一个 `Entrar` 文本节点。
- 登录按钮的 accessible name 是 `Entrar`。

### API 入口

在 `apps/web/components/site-footer.tsx` 的主要页面列表中加入 `API` 链接，指向 `/api`。不放入顶部主导航，避免第一屏导航重新变拥挤。

验收标准：
- 页脚能直接找到 `API` 链接。
- 现有 `/api` 页面、sitemap 和结构化数据不受影响。

### OCR 等待预期

在 `apps/web/components/ocr-workspace.tsx` 的提交按钮下方，仅在 `isSubmitting` 时显示短提示：`Pode levar alguns segundos. Mantenha esta aba aberta.`。这条提示不改变进度条逻辑，只解释等待行为。

验收标准：
- 处理开始后出现等待提示。
- 未处理时不占用界面空间。
- 文案短，不增加首屏解释噪音。

### 邮箱占位符

将支持、登录和重置密码相关组件中的 `voce@empresa.com` 统一为 `seu@email.com`。

验收标准：
- 公开页面和 auth modal 不再出现 `voce@empresa.com`。
- 表单行为不变。

## 测试计划

1. 先写失败测试：
   - `auth-controls.test.tsx` 覆盖匿名登录按钮只有一个 `Entrar` 文本。
   - `site-header.test.tsx` 或 footer 相关测试覆盖页脚 API 链接。
   - `ocr-workspace.test.tsx` 覆盖处理态等待提示。
2. 跑目标测试确认失败。
3. 实现最小代码变更。
4. 跑目标测试、lint、build。

## 风险与回滚

风险很低，都是文案、链接和局部 DOM 调整。若出现布局问题，回滚对应组件即可，不影响 API 和 OCR 后端。
