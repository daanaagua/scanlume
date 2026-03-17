const INDEXNOW_ENDPOINT = process.env.INDEXNOW_ENDPOINT ?? "https://api.indexnow.org/indexnow";
const INDEXNOW_HOST = process.env.INDEXNOW_HOST ?? "www.scanlume.com";
const INDEXNOW_SCHEME = process.env.INDEXNOW_SCHEME ?? "https";
const INDEXNOW_KEY = process.env.INDEXNOW_KEY ?? "a8632e6f-8469-44ff-8028-401c969d43c2";
const INDEXNOW_KEY_LOCATION =
  process.env.INDEXNOW_KEY_LOCATION ?? `${INDEXNOW_SCHEME}://${INDEXNOW_HOST}/${INDEXNOW_KEY}.txt`;

const DEFAULT_URLS = [
  `${INDEXNOW_SCHEME}://${INDEXNOW_HOST}/`,
  `${INDEXNOW_SCHEME}://${INDEXNOW_HOST}/imagem-para-texto`,
  `${INDEXNOW_SCHEME}://${INDEXNOW_HOST}/sobre`,
  `${INDEXNOW_SCHEME}://${INDEXNOW_HOST}/blog`,
  `${INDEXNOW_SCHEME}://${INDEXNOW_HOST}/blog/ocr-portugues-imagem-para-texto-teste-real`,
  `${INDEXNOW_SCHEME}://${INDEXNOW_HOST}/blog/comparativo-jpg-png-print-ocr`,
  `${INDEXNOW_SCHEME}://${INDEXNOW_HOST}/blog/exportar-ocr-word-markdown-boas-praticas`,
];

function printHelp() {
  console.log(`Usage: node scripts/submit-indexnow.mjs [options] [url-or-path ...]

Options:
  --dry-run   Print the payload without submitting it
  --help      Show this help message

Examples:
  pnpm submit:indexnow
  pnpm submit:indexnow -- --dry-run
  pnpm submit:indexnow -- /imagem-para-texto /sobre
  pnpm submit:indexnow -- https://www.scanlume.com/blog`);
}

function normalizeUrl(input) {
  if (!input) {
    return null;
  }

  if (input.startsWith("http://") || input.startsWith("https://")) {
    return input;
  }

  if (input.startsWith("/")) {
    return `${INDEXNOW_SCHEME}://${INDEXNOW_HOST}${input}`;
  }

  return `${INDEXNOW_SCHEME}://${INDEXNOW_HOST}/${input}`;
}

function unique(values) {
  return [...new Set(values)];
}

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const help = args.includes("--help");

if (help) {
  printHelp();
  process.exit(0);
}

const inputUrls = args.filter((arg) => arg !== "--" && arg !== "--dry-run" && arg !== "--help");
const urlList = unique((inputUrls.length ? inputUrls : DEFAULT_URLS).map(normalizeUrl).filter(Boolean));

if (!urlList.length) {
  console.error("No URLs to submit.");
  process.exit(1);
}

for (const url of urlList) {
  let parsed;

  try {
    parsed = new URL(url);
  } catch {
    console.error(`Invalid URL: ${url}`);
    process.exit(1);
  }

  if (parsed.host !== INDEXNOW_HOST) {
    console.error(`URL host mismatch: ${url} does not belong to ${INDEXNOW_HOST}`);
    process.exit(1);
  }
}

const payload = {
  host: INDEXNOW_HOST,
  key: INDEXNOW_KEY,
  keyLocation: INDEXNOW_KEY_LOCATION,
  urlList,
};

if (dryRun) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(0);
}

const response = await fetch(INDEXNOW_ENDPOINT, {
  method: "POST",
  headers: {
    "content-type": "application/json; charset=utf-8",
  },
  body: JSON.stringify(payload),
});

const body = await response.text();

console.log(`IndexNow endpoint: ${INDEXNOW_ENDPOINT}`);
console.log(`HTTP ${response.status}`);

if (body.trim()) {
  console.log(body);
}

if (!response.ok && response.status !== 202) {
  process.exit(1);
}
