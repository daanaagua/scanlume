export const WEB_PRICING = {
  monthly: [
    { id: "starter", name: "Starter", price: "$5 / mes", credits: "8.000 credits", annualPrice: "$48 / ano", annualCredits: "100.000 credits", usage: "8.000 OCR simples / 4.000 formatados / 4.000 paginas PDF", limits: "30 arquivos por lote - 20 MB por imagem - 40 MB por lote" },
    { id: "pro", name: "Pro", price: "$9 / mes", credits: "24.000 credits", annualPrice: "$82 / ano", annualCredits: "240.000 credits", usage: "24.000 OCR simples / 12.000 formatados / 12.000 paginas PDF", limits: "50 arquivos por lote - 20 MB por imagem - 80 MB por lote", recommended: true },
    { id: "business", name: "Business", price: "$24 / mes", credits: "60.000 credits", annualPrice: "$228 / ano", annualCredits: "800.000 credits", usage: "60.000 OCR simples / 30.000 formatados / 30.000 paginas PDF", limits: "80 arquivos por lote - 30 MB por imagem - 120 MB por lote" },
  ],
} as const;

export const API_PRICING = [
  { id: "starter", name: "API Starter", price: "$9", credits: "10.000 API credits", rpm: "60 RPM", inputs: "base64 data URL" },
  { id: "growth", name: "API Growth", price: "$29", credits: "40.000 API credits", rpm: "180 RPM", inputs: "base64 data URL", recommended: true },
  { id: "scale", name: "API Scale", price: "$79", credits: "140.000 API credits", rpm: "600 RPM", inputs: "base64 data URL" },
] as const;

export const CREDIT_EXPLAINER = [
  "Simple OCR = 1 credit / image",
  "Formatted OCR = 2 credits / image",
  "PDF OCR = 2 credits / processed page",
  "1 formatted OCR image costs only 2 credits on Scanlume.",
] as const;

export const BILLING_DISCLOSURES = [
  "Web credits nao rolam para o proximo periodo.",
  "Web credits ficam vinculados ao periodo pago ativo.",
  "API credits sao separados dos web credits.",
] as const;

export const API_INPUT_NOTE =
  "A API de imagem no v1 aceita JSON com `mode` e `base64` em formato data URL. Se voce comecar com um arquivo local, primeiro converta a imagem para data URL e depois envie o payload.";

export const API_CODE_EXAMPLES = {
  cURL: `DATA_URL=$(python -c "import base64; print('data:image/png;base64,' + base64.b64encode(open('example.png', 'rb').read()).decode())")

cat <<EOF | curl -X POST "https://api.scanlume.com/v1/api/ocr" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  --data @-
{"mode":"simple","base64":"\${DATA_URL}"}
EOF`,
  JavaScript: `import { readFile } from "node:fs/promises";

const bytes = await readFile("./example.png");
const dataUrl = \`data:image/png;base64,\${bytes.toString("base64")}\`;

const response = await fetch("https://api.scanlume.com/v1/api/ocr", {
  method: "POST",
  headers: {
    Authorization: "Bearer YOUR_API_KEY",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ mode: "formatted", base64: dataUrl }),
});

const data = await response.json();
console.log(data.result.html ?? data.result.txt);`,
  Python: `import base64
import requests

with open("example.png", "rb") as f:
    data_url = "data:image/png;base64," + base64.b64encode(f.read()).decode("utf-8")

response = requests.post(
    "https://api.scanlume.com/v1/api/ocr",
    headers={"Authorization": "Bearer YOUR_API_KEY", "Content-Type": "application/json"},
    json={"mode": "simple", "base64": data_url},
    timeout=60,
)

data = response.json()
print(data["result"]["txt"])`,
} as const;
