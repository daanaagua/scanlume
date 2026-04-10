# Web 体验版与账户页修正 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 Scanlume 增加 `$1` 的一次性 Web 体验版，支持每账号限购一次、1600 credits 发放与消费，并把账户页从“预热态”修正为“已开售态”。

**Architecture:** 保持现有 Creem checkout、正式 Web 订阅与 API pack 主路径不变；新增一层轻量的一次性 `web_credit_packs` 数据模型，用来承载体验版购买、余额解析与消费。前端在定价页增加体验版入口，在账户页移除等待名单与未开售文案，并展示体验版状态与购买结果。

**Tech Stack:** Cloudflare Workers, D1, Hono, Next.js App Router, React client components, Vitest, Testing Library。

---

### Task 1: 先用失败测试锁定体验版后端规则

**Files:**
- Modify: `apps/api/src/lib/__tests__/billing-webhook.test.ts`
- Create: `apps/api/src/lib/__tests__/web-credit-packs.test.ts`
- Modify: `apps/api/src/lib/__tests__/account-snapshot.test.ts`

- [ ] 为 `web_experience_onetime` 新增 checkout 创建测试，预期它会走新的内部产品 id。
- [ ] 为“同一账号不可重复购买体验版”新增失败测试，先断言当前实现尚未拦截。
- [ ] 为体验版 webhook 发放一次性 Web credits 新增失败测试。
- [ ] 为账户快照中的体验版状态表达新增失败测试。
- [ ] Run: `pnpm --dir apps/api test -- src/lib/__tests__/billing-webhook.test.ts src/lib/__tests__/web-credit-packs.test.ts src/lib/__tests__/account-snapshot.test.ts`
- [ ] 确认新增断言先失败，且失败原因与体验版缺失一致。

### Task 2: 增加一次性 Web credit 包模型与读取能力

**Files:**
- Modify: `apps/api/src/lib/store.ts`
- Modify: `apps/api/src/lib/billing.ts`
- Create or Modify: `apps/api/migrations/0011_web_experience_pack.sql`

- [ ] 在存储层增加 `web_credit_packs` 的读写方法与内存回退实现。
- [ ] 支持按 `user_id` 列出体验版包、读取当前有效体验版包、标记过期或耗尽状态。
- [ ] 在账单产品配置中加入 `web_experience_onetime`，价格发放语义定义为一次性 Web pack，而不是订阅。
- [ ] 实现“是否已经买过体验版”的服务端判断方法，供 checkout 创建前校验使用。
- [ ] Run: `pnpm --dir apps/api test -- src/lib/__tests__/web-credit-packs.test.ts src/lib/__tests__/billing-webhook.test.ts`
- [ ] 确认新增模型测试转绿。

### Task 3: 改造登录用户 Web 余额解析与扣费顺序

**Files:**
- Modify: `apps/api/src/index.ts`
- Modify: `apps/api/src/lib/web-subscriptions.ts`
- Create or Modify: `apps/api/src/lib/web-credits.ts`
- Create or Modify: `apps/api/src/lib/__tests__/web-credit-packs.test.ts`
- Create or Modify: `apps/api/src/lib/__tests__/ocr-route-credits.test.ts`

- [ ] 抽出统一的“登录用户 Web 可用余额”解析函数，顺序为：正式订阅 > 体验版 > 免费账户。
- [ ] 把现有 OCR 与 PDF OCR 的登录用户扣费逻辑改为同一顺序。
- [ ] 明确体验版与正式订阅并存时，正式订阅优先消费，体验版不混入订阅总余额。
- [ ] 为登录用户余额优先级与实际扣费优先级分别补失败测试，再实现到通过。
- [ ] Run: `pnpm --dir apps/api test -- src/lib/__tests__/web-credit-packs.test.ts src/lib/__tests__/ocr-route-credits.test.ts`
- [ ] 确认余额与扣费测试全部通过。

### Task 4: 接通体验版 checkout、webhook 与账户快照

**Files:**
- Modify: `apps/api/src/lib/billing.ts`
- Modify: `apps/api/src/index.ts`
- Modify: `apps/api/src/lib/account.ts`
- Modify: `apps/api/src/lib/__tests__/billing-webhook.test.ts`
- Modify: `apps/api/src/lib/__tests__/account-snapshot.test.ts`

- [ ] 在 checkout 创建前加入体验版购买资格校验，不符合资格时返回明确错误。
- [ ] 在 webhook 解析与发放中接通 `web_experience_onetime` 的一次性 Web pack 发放。
- [ ] 在账户快照中补充体验版状态字段，至少包含已购买、是否有效、剩余额度、是否允许购买。
- [ ] 保持现有 API pack 与正式 Web 订阅测试继续通过。
- [ ] Run: `pnpm --dir apps/api test -- src/lib/__tests__/billing-webhook.test.ts src/lib/__tests__/account-snapshot.test.ts`
- [ ] 确认体验版与既有支付快照测试一起通过。

### Task 5: 用失败测试锁定前端体验版与账户页修正

**Files:**
- Modify: `apps/web/components/__tests__/pricing-page.test.tsx`
- Modify: `apps/web/components/__tests__/account-panel.test.tsx`
- Modify: `apps/web/lib/account.ts`
- Modify: `apps/web/components/pricing-page.tsx`
- Modify: `apps/web/components/account-panel.tsx`

- [ ] 在定价页测试中新增体验版卡片、限购一次文案、已购买状态、正式订阅不适用状态的失败断言。
- [ ] 在账户页测试中新增“移除等待名单与未开售文案”的失败断言。
- [ ] 在账户页测试中新增“体验版购买成功态、已购买态、不可重复购买态”的失败断言。
- [ ] Run: `pnpm --dir apps/web test -- components/__tests__/pricing-page.test.tsx components/__tests__/account-panel.test.tsx`
- [ ] 确认前端新增断言先失败。

### Task 6: 实现前端页面并完成全链路验证

**Files:**
- Modify: `apps/web/lib/account.ts`
- Modify: `apps/web/components/pricing-page.tsx`
- Modify: `apps/web/components/account-panel.tsx`
- Modify: `apps/web/app/globals.css`

- [ ] 给前端账户类型补充体验版状态字段类型。
- [ ] 在定价页新增 `$1` 体验版卡片，并接通 `web_experience_onetime` 购买入口。
- [ ] 在账户页移除等待名单与“尚未开售”过渡期文案，改为已开售状态展示。
- [ ] 在账户页增加体验版购买结果、剩余额度、不可重复购买提示与去 OCR 的 CTA。
- [ ] 保持现有购买意图恢复逻辑可继续工作。
- [ ] Run: `pnpm --dir apps/web test -- components/__tests__/pricing-page.test.tsx components/__tests__/account-panel.test.tsx`
- [ ] Run: `pnpm --dir apps/api test`
- [ ] Run: `pnpm --dir apps/web test`
- [ ] Run: `pnpm build`
- [ ] 手工核对：
  - 未登录点击体验版后，登录/注册可继续付款
  - 体验版支付成功后账户页显示到账
  - 体验版已购账号不可重复购买
  - 正式订阅账号不受体验版逻辑干扰
- [ ] 完成后分两次提交：先后端与数据层，再前端与文案层；最后 push 当前分支。
