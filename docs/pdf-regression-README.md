# PDF Live Regression

这是一个高价值、真实样本驱动的线上回归脚本，用来盯住 `scanlume` 的 PDF OCR 真链路，而不是只验证本地函数或合成样本。

## 目标

- 使用固定样本 `docs/pdf-mixed-pt-test-1page.pdf`
- 打开线上页面 `https://www.scanlume.com/pdf-para-texto`
- 上传 PDF，等待 OCR 完成
- 下载 `searchable PDF` 与 `reflowed PDF`
- 产出 JSON、页面截图、导出 PDF、导出 PDF 截图
- 对关键结果做最小但明确的断言：
  - 页面预览里同时有 native text 和 OCR text
  - 两个导出 PDF 都成功生成
  - 导出 PDF 重新读取后，文字层里仍能找到关键文本

## 为什么它重要

这个脚本覆盖的是最容易“看起来没坏、实际上已经退化”的路径：

- 真实站点
- 真实浏览器
- 真实样本 PDF
- 真实下载导出链路

它的价值高，但运行成本也高，所以**不纳入默认单元测试或常规 `pnpm test`**。更合适的使用场景是：

- 修改 PDF OCR、导出、上传、工作区交互后
- 发版前做人工验收补充
- 怀疑线上 mixed PDF 质量退化时

## 运行方法

在仓库根目录执行：

```bash
pnpm run verify:pdf-live
```

脚本会优先复用本地已安装的 `playwright-core`；如果仓库里没有，它会在系统临时目录下自举安装 `playwright-core`，然后优先使用本机已有的 Chrome 或 Edge，不额外下载浏览器。

## 产物位置

默认输出目录：

```text
tmp/live-pdf-regression-artifacts
```

目录内会包含：

- `browser-result.json`
- `pdf-tool-before-upload.png`
- `pdf-tool-after-upload.png`
- `pdf-tool-after-result.png`
- `pdf-mixed-pt-test-1page-searchable.pdf`
- `pdf-mixed-pt-test-1page-reflowed.pdf`
- `searchable-pdf-render.png`
- `reflowed-pdf-render.png`

## 可选环境变量

- `PDF_LIVE_INPUT`：覆盖输入 PDF 路径
- `PDF_LIVE_OUTPUT_DIR`：覆盖产物输出目录
- `PDF_LIVE_URL`：覆盖目标页面 URL
- `PDF_LIVE_BROWSER_PATH`：显式指定 Chrome/Edge 可执行文件
- `PDF_LIVE_PLAYWRIGHT_CACHE_DIR`：覆盖 `playwright-core` 临时缓存目录

## 结果判读

- `status = passed`：这次真实链路通过，样本 PDF 的上传、OCR、导出、回读都成功
- `status = failed`：看 `failure`、`consoleErrors`、`browserErrors`，再结合截图定位问题

这个脚本的定位不是“替代所有测试”，而是把一次高价值人工验收，固化成可重复执行的真实回归检查。
