#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const ROOT_DIR = path.resolve(__dirname, "..");
const INPUT_PDF = path.resolve(
  process.env.PDF_LIVE_INPUT ?? path.join(ROOT_DIR, "docs", "pdf-mixed-pt-test-1page.pdf"),
);
const OUTPUT_DIR = path.resolve(
  process.env.PDF_LIVE_OUTPUT_DIR ?? path.join(ROOT_DIR, "tmp", "live-pdf-regression-artifacts"),
);
const TARGET_URL = process.env.PDF_LIVE_URL ?? "https://www.scanlume.com/pdf-para-texto";
const PDF_JS_SCRIPT_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
const PDF_JS_WORKER_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
const PLAYWRIGHT_CACHE_DIR = path.resolve(
  process.env.PDF_LIVE_PLAYWRIGHT_CACHE_DIR ??
    path.join(os.tmpdir(), "scanlume-live-pdf-regression", "playwright-core"),
);

function ensureDirectory(directoryPath) {
  fs.mkdirSync(directoryPath, { recursive: true });
}

function emptyDirectory(directoryPath) {
  fs.rmSync(directoryPath, { recursive: true, force: true });
  ensureDirectory(directoryPath);
}

function fileExists(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function getNpmExecutable() {
  return process.platform === "win32" ? "npm.cmd" : "npm";
}

function buildNpmEnv(overrides = {}) {
  const filtered = { ...process.env, ...overrides };
  for (const key of Object.keys(filtered)) {
    if (
      key.startsWith("npm_config_") ||
      key.startsWith("npm_package_") ||
      key === "npm_command" ||
      key === "npm_execpath" ||
      key === "npm_lifecycle_event" ||
      key === "npm_lifecycle_script" ||
      key === "PNPM_SCRIPT_SRC_DIR"
    ) {
      delete filtered[key];
    }
  }
  return filtered;
}

function runCommand(command, args, options = {}) {
  if (process.platform === "win32" && command.toLowerCase().endsWith(".cmd")) {
    const quotedArgs = args
      .map((value) => (/\s/.test(value) ? `"${value}"` : value))
      .join(" ");
    return execFileSync("cmd.exe", ["/d", "/s", "/c", `${command} ${quotedArgs}`], {
      stdio: options.stdio ?? "pipe",
      cwd: options.cwd ?? ROOT_DIR,
      env: options.env ?? process.env,
      encoding: "utf8",
    });
  }

  return execFileSync(command, args, {
    stdio: options.stdio ?? "pipe",
    cwd: options.cwd ?? ROOT_DIR,
    env: options.env ?? process.env,
    encoding: "utf8",
  });
}

function tryResolveFrom(basePath, request) {
  try {
    return require.resolve(request, {
      paths: [basePath],
    });
  } catch {
    return null;
  }
}

function ensurePlaywrightCore(result) {
  const localResolution =
    tryResolveFrom(ROOT_DIR, "playwright-core/package.json") ??
    tryResolveFrom(path.join(ROOT_DIR, "apps", "web"), "playwright-core/package.json");

  if (localResolution) {
    result.playwright = {
      source: "local",
      packageJsonPath: localResolution,
    };
    return createRequire(localResolution)("playwright-core");
  }

  ensureDirectory(PLAYWRIGHT_CACHE_DIR);
  const cachePackageJson = path.join(PLAYWRIGHT_CACHE_DIR, "package.json");
  if (!fileExists(cachePackageJson)) {
    fs.writeFileSync(
      cachePackageJson,
      JSON.stringify(
        {
          name: "scanlume-live-pdf-regression-tools",
          private: true,
        },
        null,
        2,
      ),
    );
  }

  const cachedResolution = tryResolveFrom(PLAYWRIGHT_CACHE_DIR, "playwright-core/package.json");
  if (!cachedResolution) {
    result.playwrightBootstrap = {
      command: `${getNpmExecutable()} install --no-save --no-package-lock playwright-core`,
      cacheDir: PLAYWRIGHT_CACHE_DIR,
    };
    runCommand(
      getNpmExecutable(),
      ["install", "--no-save", "--no-package-lock", "playwright-core"],
      {
        cwd: PLAYWRIGHT_CACHE_DIR,
        stdio: "inherit",
        env: buildNpmEnv(),
      },
    );
  }

  const resolvedPackageJson = tryResolveFrom(PLAYWRIGHT_CACHE_DIR, "playwright-core/package.json");
  if (!resolvedPackageJson) {
    throw new Error("playwright-core bootstrap succeeded but module still could not be resolved.");
  }

  result.playwright = {
    source: "bootstrap-cache",
    packageJsonPath: resolvedPackageJson,
    cacheDir: PLAYWRIGHT_CACHE_DIR,
  };
  return createRequire(resolvedPackageJson)("playwright-core");
}

function findExistingExecutable(candidates) {
  for (const candidate of candidates) {
    if (candidate && fileExists(candidate)) {
      return candidate;
    }
  }
  return null;
}

function resolveBrowserExecutable() {
  const explicitPath = process.env.PDF_LIVE_BROWSER_PATH;
  if (explicitPath) {
    if (!fileExists(explicitPath)) {
      throw new Error(`PDF_LIVE_BROWSER_PATH does not exist: ${explicitPath}`);
    }
    return explicitPath;
  }

  const commonCandidates = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ];

  const commonHit = findExistingExecutable(commonCandidates);
  if (commonHit) {
    return commonHit;
  }

  const whichCommand = process.platform === "win32" ? "where.exe" : "which";
  for (const binaryName of ["chrome", "google-chrome", "chromium", "msedge"]) {
    const lookup = spawnSync(whichCommand, [binaryName], {
      encoding: "utf8",
    });
    if (lookup.status === 0) {
      const firstLine = lookup.stdout
        .split(/\r?\n/)
        .map((line) => line.trim())
        .find(Boolean);
      if (firstLine && fileExists(firstLine)) {
        return firstLine;
      }
    }
  }

  throw new Error(
    "Could not find a local Chrome/Edge executable. Set PDF_LIVE_BROWSER_PATH to continue.",
  );
}

function normalizeForCheck(value) {
  return value
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function assertIncludes(haystack, needle, message) {
  if (!normalizeForCheck(haystack).includes(normalizeForCheck(needle))) {
    throw new Error(message);
  }
}

async function waitForEither(locatorA, locatorB, timeout) {
  await Promise.race([
    locatorA.waitFor({ state: "visible", timeout }),
    locatorB.waitFor({ state: "visible", timeout }),
  ]);
}

async function inspectPdfWithPdfJs(context, pdfPath, screenshotPath, label) {
  const page = await context.newPage();
  const pdfBase64 = fs.readFileSync(pdfPath, "base64");

  await page.setViewportSize({ width: 1400, height: 1800 });
  await page.setContent(
    `<!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>${label}</title>
          <style>
            body {
              margin: 0;
              padding: 24px;
              background: #d7d7d7;
              font-family: Arial, sans-serif;
            }
            .frame {
              width: max-content;
              margin: 0 auto;
              background: white;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.18);
            }
            .meta {
              padding: 12px 18px;
              border-bottom: 1px solid #e5e5e5;
              color: #333;
              font-size: 14px;
            }
            canvas {
              display: block;
            }
          </style>
        </head>
        <body>
          <div class="frame">
            <div class="meta">${label}</div>
            <canvas id="canvas"></canvas>
          </div>
          <script>
            window.__PDF_BASE64__ = "${pdfBase64}";
          </script>
          <script>
            function loadScript(src) {
              return new Promise((resolve, reject) => {
                const existing = document.querySelector('script[data-src="' + src + '"]');
                if (existing) {
                  if (existing.dataset.ready === "true") {
                    resolve();
                    return;
                  }
                  existing.addEventListener("load", () => resolve(), { once: true });
                  existing.addEventListener("error", () => reject(new Error("script load failed")), { once: true });
                  return;
                }

                const script = document.createElement("script");
                script.src = src;
                script.async = true;
                script.dataset.src = src;
                script.addEventListener("load", () => {
                  script.dataset.ready = "true";
                  resolve();
                }, { once: true });
                script.addEventListener("error", () => reject(new Error("script load failed")), { once: true });
                document.head.appendChild(script);
              });
            }

            async function inspectPdf() {
              try {
                await loadScript("${PDF_JS_SCRIPT_URL}");
                window.pdfjsLib.GlobalWorkerOptions.workerSrc = "${PDF_JS_WORKER_URL}";

                const raw = Uint8Array.from(atob(window.__PDF_BASE64__), (char) => char.charCodeAt(0));
                const documentHandle = await window.pdfjsLib.getDocument({ data: raw }).promise;
                const firstPage = await documentHandle.getPage(1);
                const viewport = firstPage.getViewport({ scale: 1.35 });
                const canvas = document.getElementById("canvas");
                canvas.width = Math.ceil(viewport.width);
                canvas.height = Math.ceil(viewport.height);
                const context = canvas.getContext("2d");

                await firstPage.render({
                  canvasContext: context,
                  viewport,
                  intent: "print",
                }).promise;

                const textContent = await firstPage.getTextContent();
                const lines = textContent.items
                  .map((item) => (typeof item.str === "string" ? item.str.trim() : ""))
                  .filter(Boolean);

                window.__PDF_INSPECTION__ = {
                  pageCount: documentHandle.numPages,
                  firstPageText: lines.join("\\n"),
                };
                document.body.dataset.ready = "true";
              } catch (error) {
                document.body.dataset.error = String(error && error.stack ? error.stack : error);
              }
            }

            inspectPdf();
          </script>
        </body>
      </html>`,
    { waitUntil: "domcontentloaded" },
  );

  await page.waitForFunction(() => document.body.dataset.ready === "true", null, { timeout: 120000 });
  await page.screenshot({ path: screenshotPath, fullPage: true });
  const inspection = await page.evaluate(() => window.__PDF_INSPECTION__);
  await page.close();
  return inspection;
}

async function run() {
  if (!fileExists(INPUT_PDF)) {
    throw new Error(`Input PDF does not exist: ${INPUT_PDF}`);
  }

  emptyDirectory(OUTPUT_DIR);

  const beforeUploadShot = path.join(OUTPUT_DIR, "pdf-tool-before-upload.png");
  const afterUploadShot = path.join(OUTPUT_DIR, "pdf-tool-after-upload.png");
  const afterResultShot = path.join(OUTPUT_DIR, "pdf-tool-after-result.png");
  const searchablePdfPath = path.join(OUTPUT_DIR, "pdf-mixed-pt-test-1page-searchable.pdf");
  const reflowedPdfPath = path.join(OUTPUT_DIR, "pdf-mixed-pt-test-1page-reflowed.pdf");
  const searchableViewShot = path.join(OUTPUT_DIR, "searchable-pdf-render.png");
  const reflowedViewShot = path.join(OUTPUT_DIR, "reflowed-pdf-render.png");
  const resultJsonPath = path.join(OUTPUT_DIR, "browser-result.json");

  const result = {
    status: "running",
    testedAt: new Date().toISOString(),
    inputPdf: INPUT_PDF,
    outputDirectory: OUTPUT_DIR,
    url: TARGET_URL,
    browserExecutable: "",
    queueCardText: "",
    summaryLines: [],
    txtPreview: "",
    mdPreview: "",
    htmlPreviewText: "",
    browserErrors: [],
    consoleErrors: [],
    assertions: [],
    screenshots: {
      beforeUpload: beforeUploadShot,
      afterUpload: afterUploadShot,
      afterResult: afterResultShot,
      searchableRender: searchableViewShot,
      reflowedRender: reflowedViewShot,
    },
    downloads: {
      searchablePdf: searchablePdfPath,
      reflowedPdf: reflowedPdfPath,
    },
    pdfInspection: {
      searchable: null,
      reflowed: null,
    },
    failure: null,
  };

  let browser = null;

  try {
    const { chromium } = ensurePlaywrightCore(result);
    const browserExecutable = resolveBrowserExecutable();
    result.browserExecutable = browserExecutable;

    browser = await chromium.launch({
      executablePath: browserExecutable,
      headless: true,
      args: ["--disable-dev-shm-usage"],
    });

    const context = await browser.newContext({
      acceptDownloads: true,
      viewport: { width: 1440, height: 1800 },
    });
    const page = await context.newPage();

    page.on("pageerror", (error) => {
      result.browserErrors.push(String(error && error.stack ? error.stack : error));
    });

    page.on("console", (message) => {
      if (message.type() === "error") {
        result.consoleErrors.push(message.text());
      }
    });

    await page.goto(result.url, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });

    await page.waitForSelector("h1", { timeout: 30000 });
    await page.getByRole("button", { name: "Texto formatado", exact: true }).first().click();
    await page.screenshot({ path: beforeUploadShot, fullPage: true });

    await page.locator('input[type="file"]').setInputFiles(INPUT_PDF);

    const queueCard = page.locator(".mini-file-card").first();
    await queueCard.waitFor({ state: "visible", timeout: 60000 });
    result.queueCardText = await queueCard.innerText();
    assertIncludes(
      result.queueCardText,
      path.basename(INPUT_PDF),
      "Queued file card does not mention the sample PDF.",
    );
    result.assertions.push("queued sample PDF is visible");
    await page.screenshot({ path: afterUploadShot, fullPage: true });

    const startButton = page.getByRole("button", { name: /Iniciar Texto formatado/i }).first();
    if (await startButton.isDisabled()) {
      throw new Error("Start button stayed disabled after the sample PDF upload.");
    }
    result.assertions.push("start button enabled");
    await startButton.click();

    const resultSummary = page.locator(".pdf-result-summary");
    const errorBanner = page.locator(".error-banner");
    await waitForEither(resultSummary, errorBanner, 180000);

    if (await errorBanner.isVisible().catch(() => false)) {
      throw new Error(`Live OCR run failed: ${await errorBanner.innerText()}`);
    }

    await page.getByRole("button", { name: "Baixar PDF pesquisavel" }).waitFor({
      state: "visible",
      timeout: 30000,
    });
    result.summaryLines = await resultSummary.locator("span").allInnerTexts();
    result.assertions.push("result summary rendered");

    await page.getByRole("button", { name: "TXT" }).click();
    result.txtPreview = await page.locator(".result-preview pre").innerText();
    assertIncludes(result.txtPreview, "Scanlume PDF OCR Test", "TXT preview lost native PDF text.");
    assertIncludes(result.txtPreview, "Imagem para teste de OCR", "TXT preview lost OCR image text.");
    result.assertions.push("txt preview contains native and OCR text");

    await page.getByRole("button", { name: "MD" }).click();
    result.mdPreview = await page.locator(".result-preview pre").innerText();
    assertIncludes(result.mdPreview, "Scanlume PDF OCR Test", "MD preview lost native PDF text.");
    result.assertions.push("md preview contains native text");

    await page.getByRole("button", { name: "HTML" }).click();
    result.htmlPreviewText = await page.locator(".result-preview .html-preview").innerText();
    assertIncludes(result.htmlPreviewText, "Imagem para teste de OCR", "HTML preview lost OCR image text.");
    result.assertions.push("html preview contains OCR text");

    await page.screenshot({ path: afterResultShot, fullPage: true });

    const [searchableDownload] = await Promise.all([
      page.waitForEvent("download", { timeout: 180000 }),
      page.getByRole("button", { name: "Baixar PDF pesquisavel" }).click(),
    ]);
    await searchableDownload.saveAs(searchablePdfPath);

    const [reflowedDownload] = await Promise.all([
      page.waitForEvent("download", { timeout: 180000 }),
      page.getByRole("button", { name: "Baixar PDF reorganizado" }).click(),
    ]);
    await reflowedDownload.saveAs(reflowedPdfPath);

    result.downloads.searchablePdfBytes = fs.statSync(searchablePdfPath).size;
    result.downloads.reflowedPdfBytes = fs.statSync(reflowedPdfPath).size;
    if (result.downloads.searchablePdfBytes <= 1024) {
      throw new Error(`Searchable PDF looks too small: ${result.downloads.searchablePdfBytes} bytes.`);
    }
    if (result.downloads.reflowedPdfBytes <= 1024) {
      throw new Error(`Reflowed PDF looks too small: ${result.downloads.reflowedPdfBytes} bytes.`);
    }
    result.assertions.push("downloaded PDFs are non-trivial");

    result.pdfInspection.searchable = await inspectPdfWithPdfJs(
      context,
      searchablePdfPath,
      searchableViewShot,
      "Searchable PDF render",
    );
    result.pdfInspection.reflowed = await inspectPdfWithPdfJs(
      context,
      reflowedPdfPath,
      reflowedViewShot,
      "Reflowed PDF render",
    );

    assertIncludes(
      result.pdfInspection.searchable?.firstPageText ?? "",
      "Scanlume PDF OCR Test",
      "Searchable PDF text layer lost native text.",
    );
    assertIncludes(
      result.pdfInspection.searchable?.firstPageText ?? "",
      "Imagem para teste de OCR",
      "Searchable PDF text layer lost OCR text.",
    );
    assertIncludes(
      result.pdfInspection.reflowed?.firstPageText ?? "",
      "Scanlume PDF OCR Test",
      "Reflowed PDF text layer lost native text.",
    );
    result.assertions.push("downloaded PDFs retain text layer content");

    result.status = "passed";
  } catch (error) {
    result.status = "failed";
    result.failure = String(error && error.stack ? error.stack : error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
    fs.writeFileSync(resultJsonPath, JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));
  }
}

run().catch(() => {
  process.exit(1);
});
