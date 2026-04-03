export const WEB_PRICING = {
  monthly: [
    { id: "starter", name: "Starter", price: "$5 / mes", credits: "8.000 credits", annualPrice: "$48 / ano", annualCredits: "100.000 credits", usage: "8.000 OCR simples / 4.000 formatados / 4.000 paginas PDF", limits: "30 arquivos por lote • 20 MB por imagem • 40 MB por lote" },
    { id: "pro", name: "Pro", price: "$9 / mes", credits: "24.000 credits", annualPrice: "$82 / ano", annualCredits: "240.000 credits", usage: "24.000 OCR simples / 12.000 formatados / 12.000 paginas PDF", limits: "50 arquivos por lote • 20 MB por imagem • 80 MB por lote", recommended: true },
    { id: "business", name: "Business", price: "$24 / mes", credits: "60.000 credits", annualPrice: "$228 / ano", annualCredits: "800.000 credits", usage: "60.000 OCR simples / 30.000 formatados / 30.000 paginas PDF", limits: "80 arquivos por lote • 30 MB por imagem • 120 MB por lote" },
  ],
} as const;

export const API_PRICING = [
  { id: "starter", name: "API Starter", price: "$9", credits: "10.000 API credits", rpm: "60 RPM", inputs: "file upload, image URL, base64" },
  { id: "growth", name: "API Growth", price: "$29", credits: "40.000 API credits", rpm: "180 RPM", inputs: "file upload, image URL, base64", recommended: true },
  { id: "scale", name: "API Scale", price: "$79", credits: "140.000 API credits", rpm: "600 RPM", inputs: "file upload, image URL, base64" },
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

export const API_CODE_EXAMPLES = {
  cURL: `curl -X POST "https://api.scanlume.com/v1/api/ocr" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"mode":"simple","base64":"data:image/png;base64,..."}'`,
  JavaScript: `const response = await fetch("https://api.scanlume.com/v1/api/ocr", {
  method: "POST",
  headers: {
    Authorization: "Bearer YOUR_API_KEY",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ mode: "formatted", base64: dataUrl }),
});

const data = await response.json();`,
  Python: `import requests

response = requests.post(
    "https://api.scanlume.com/v1/api/ocr",
    headers={"Authorization": "Bearer YOUR_API_KEY"},
    json={"mode": "simple", "base64": data_url},
    timeout=60,
)

print(response.json())`,
} as const;
