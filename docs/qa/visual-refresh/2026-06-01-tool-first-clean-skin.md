# 2026-06-01 Scanlume 工具优先皮肤重做记录

## 背景

本轮目标是修正首页仍显得像旧版首页的问题。旧版虽然已经把 OCR 工作区前置，但首屏仍复用了 `scanlume-ocr-desk.png` 的扫描桌面图，视觉感受没有真正脱离旧首页。

## 视觉来源

先使用 image skill 从零生成一张工具优先首页参考图，只提供 Scanlume 的功能和简单页面要素，不提供旧截图，避免继承旧风格。

参考图保存为：

- `docs/qa/visual-refresh/scanlume-tool-first-clean-reference.png`

参考图要求：

- 首屏直接展示上传工具，不做营销 hero。
- 上传区和结果区并排成为首屏主体。
- 队列/状态区放在下方。
- 使用白色或近白底、深绿色主色、少量暖黄色点缀。
- 不使用旧扫描桌面图、库存图、3D 装饰图、过多解释文案。

## agy 分块实现

本轮按“小块任务”交给 agy 实现前端皮肤：

1. 第一轮：根据参考图重做首页和工具页工作区皮肤。
2. 第二轮：清理第一轮引入的问题，包括隐藏旧图、emoji、inline style、错误 credits 文案和不准确导航高亮。
3. 第三轮：修复桌面端结果面板排到队列下方的问题，使上传区与结果区在桌面首屏并排，队列横跨下方。
4. 第四轮：修复移动端横向裁切。该轮 agy 仍遗留移动端裁切问题，主代理只做约束性 CSS bugfix，不改视觉方向和业务逻辑。

## 验收要点

- 首屏不再引用 `/brand/scanlume-ocr-desk.png`。
- 首页桌面端：上传区与结果区在首屏并排，队列在下方。
- 移动端：上传入口在首屏可见，`document.documentElement.scrollWidth` 等于视口宽度。
- OCR 上传、模式切换、处理、下载、PDF 和鉴权逻辑不在本轮修改范围内。

## 验证命令

```bash
pnpm --dir apps/web test components/__tests__/ocr-workspace.test.tsx app/__tests__/home-page.test.tsx
pnpm --dir apps/web lint
pnpm --dir apps/web build
```
