# Scanlume 英文体验二期修复 Spec

## 背景

线上 `/en` 主入口和核心英文路由已经可访问，但盲测反馈显示英文体验仍混入葡语内容。问题集中在共享组件：页脚、账号面板、OCR 用量侧栏、API key 面板，以及根布局的 `html lang`。

## 目标

1. `/en` 及核心英文路径不再显示关键葡语操作文案。
2. 英文页脚不再把用户直接送到葡语 trust 页面或葡语博客标题。
3. 英文账号页可以承接定价页 checkout，不再出现 `Minha conta`、`Fluxo de compra`、`Entrar ou criar conta` 等葡语交易文案。
4. 英文 OCR 工具页的用量、credits、规则说明、登录提示全部显示英文。
5. 浏览器 DOM 中 `/en/*` 的 `document.documentElement.lang` 为 `en`。

## 非目标

1. 不重做视觉皮肤。
2. 不改 credits 规则、价格、支付流程、API 套餐。
3. 不补完整英文博客内容库；本期只保证 `/en/blog` 可访问，并且不会把英文用户误导到葡语博客标题列表。
4. 不改葡语主站内容和现有 pt-BR SEO 页面。

## 修复范围

1. 新增英文 trust/support 页面：
   - `/en/about`
   - `/en/contact`
   - `/en/privacy`
   - `/en/terms`
   - `/en/blog`
2. 调整英文页脚：
   - trust 链接改为 `/en/about`、`/en/contact`、`/en/privacy`、`/en/terms`
   - 博客区改为英文资源入口，不展示葡语文章标题
3. 调整账号相关组件：
   - `AccountPanel` 增加英文 copy 和计划标签格式化
   - `ApiKeyPanel` 支持 `locale="en"`
   - checkout handoff、购买成功、账号安全、waitlist、credits 卡片使用英文
4. 调整 OCR workspace：
   - 用量侧栏和 pricing hint 使用现有 `WORKSPACE_COPY`
   - `AuthDialog` 从英文工具页打开时传入 `locale="en"`
5. 调整根布局：
   - 增加轻量 client 组件，根据 pathname 同步 `document.documentElement.lang`
6. 更新 sitemap：
   - 收录新增英文公开页面
   - 继续排除 `/en/account`

## 验收标准

1. 单元测试覆盖英文页脚、英文账号面板、英文 API key 面板、英文 OCR 用量侧栏、`html lang` 同步、新增英文页面存在。
2. `pnpm --dir apps/web exec vitest run ...` 目标测试先失败再通过。
3. 全量 `pnpm --dir apps/web run lint`、`pnpm --dir apps/web run build`、`pnpm --dir apps/web test` 通过。
4. 部署后线上复核以下路径返回 200：
   - `https://www.scanlume.com/en`
   - `https://www.scanlume.com/en/image-to-text`
   - `https://www.scanlume.com/en/account`
   - `https://www.scanlume.com/en/blog`
   - `https://www.scanlume.com/en/about`
   - `https://www.scanlume.com/en/contact`
   - `https://www.scanlume.com/en/privacy`
   - `https://www.scanlume.com/en/terms`
5. 线上 `/en` DOM 复核 `document.documentElement.lang === "en"`。
