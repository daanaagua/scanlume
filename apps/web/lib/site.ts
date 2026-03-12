import type { Metadata } from "next";

export const SITE_NAME = "Scanlume";
export const SITE_URL = "https://www.scanlume.com";
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8787";
export const OCR_WORKSPACE_ID = "ocr-workspace";

export const DEFAULT_KEYWORDS = [
  "imagem para texto",
  "converter imagem em texto",
  "imagem em texto",
  "ocr online",
  "ocr com ia",
  "imagem para word",
  "jpg para texto",
  "png para texto",
  "extrair texto de imagem",
  "imagem para texto online",
];

export const NAV_LINKS = [
  { href: "/imagem-para-texto", label: "Imagem para texto" },
  { href: "/imagem-para-word", label: "Imagem para Word" },
  { href: "/ocr-online", label: "OCR online" },
  { href: "/jpg-para-texto", label: "JPG para texto" },
  { href: "/png-para-texto", label: "PNG para texto" },
];

export const TRUST_LINKS = [
  { href: "/sobre", label: "Sobre" },
  { href: "/contato", label: "Contato" },
  { href: "/privacidade", label: "Privacidade" },
  { href: "/termos", label: "Termos" },
];

export const homeFaqs = [
  {
    question: "O Scanlume funciona com JPG, PNG e screenshots?",
    answer:
      "Sim. O fluxo principal foi pensado para screenshots, artes, fotos do celular e imagens JPG ou PNG com texto visivel.",
  },
  {
    question: "Qual e a diferenca entre Simple OCR e Formatted Text?",
    answer:
      "Simple OCR entrega texto puro com mais velocidade. Formatted Text reorganiza o conteudo em blocos legiveis, preservando titulos, paragrafos e a hierarquia principal.",
  },
  {
    question: "Posso baixar em Word?",
    answer:
      "No lancamento, o modo formatado exporta TXT, Markdown e HTML. Isso ja permite copiar para Word com uma estrutura muito mais limpa. O export para DOCX fica para a v1.1.",
  },
  {
    question: "Preciso instalar aplicativo ou criar conta?",
    answer:
      "Nao. A proposta do MVP e testar gratis, online e sem login obrigatorio.",
  },
  {
    question: "Existe limite diario?",
    answer:
      "Sim. Usuarios anonimos comecam com limite diario para manter a operacao rapida e sustentavel. O worker aplica limite por IP e browser id.",
  },
];

export const toolPageContent = {
  "imagem-para-texto": {
    title: "Imagem para texto online com IA | OCR simples e formatado | Scanlume",
    description:
      "Converta imagem para texto com IA em pt-BR. Use OCR online para transformar JPG, PNG e screenshots em texto puro ou formatado e baixar em TXT, Markdown ou HTML.",
    keywords: [
      "imagem para texto",
      "converter imagem em texto",
      "imagem em texto",
      "ocr online",
      "ocr com ia",
    ],
    h1: "Imagem para texto online com OCR simples, formatado e IA",
    eyebrow: "Principal pagina transacional para imagem para texto",
    lead:
      "Use o modo rapido para texto puro ou escolha a saida formatada com IA para preservar titulos, paragrafos e a ordem de leitura principal.",
  },
  "imagem-para-word": {
    title: "Imagem para Word com IA e estrutura limpa | Scanlume",
    description:
      "Transforme imagem em texto com IA e leve para o Word com menos retrabalho. OCR online para JPG, PNG e screenshots com saida em TXT, Markdown e HTML.",
    keywords: [
      "imagem para word",
      "converter imagem em texto",
      "imagem em texto",
      "ocr online",
      "ocr com ia",
    ],
    h1: "Imagem para Word com texto mais organizado e OCR com IA",
    eyebrow: "Ideal para colar no Word sem reformatar tudo do zero",
    lead:
      "O modo Formatted Text usa OCR com IA para entregar um layout mais legivel em screenshots de paginas, app screens e materiais de marketing.",
  },
  "ocr-online": {
    title: "OCR online com IA para imagens e screenshots | Scanlume",
    description:
      "OCR online com IA para converter imagem em texto em pt-BR. Extraia texto de screenshots, JPG e PNG com modo simples ou formatado.",
    keywords: [
      "ocr online",
      "imagem para texto",
      "converter imagem em texto",
      "imagem em texto",
      "ocr com ia",
    ],
    h1: "OCR online com IA para capturas, JPG e PNG",
    eyebrow: "Ferramenta OCR em pt-BR com foco em velocidade",
    lead:
      "Scanlume combina um fluxo simples para texto puro e uma opcao formatada com IA para manter a leitura mais clara.",
  },
  "jpg-para-texto": {
    title: "JPG para texto com IA e OCR rapido | Scanlume",
    description:
      "Converta JPG para texto com IA em segundos. OCR online em pt-BR para extrair texto puro ou estruturado de posters, prints e fotos.",
    keywords: [
      "jpg para texto",
      "imagem para texto",
      "converter imagem em texto",
      "ocr online",
      "ocr com ia",
    ],
    h1: "JPG para texto sem instalar aplicativo e com IA",
    eyebrow: "Boa opcao para posters, prints e fotos do celular",
    lead:
      "Envie arquivos JPG e receba texto puro ou uma versao com estrutura principal preservada por IA para edicao posterior.",
  },
  "png-para-texto": {
    title: "PNG para texto com IA em pt-BR | Scanlume",
    description:
      "Extraia texto de arquivos PNG com IA. OCR online em pt-BR para converter screenshots e layouts em texto puro ou com leitura mais limpa.",
    keywords: [
      "png para texto",
      "imagem para texto",
      "imagem em texto",
      "ocr online",
      "ocr com ia",
    ],
    h1: "PNG para texto com leitura mais limpa e IA",
    eyebrow: "Perfeito para screenshots de pagina, app ou landing page",
    lead:
      "O modo formatado usa IA para transformar PNG em blocos mais organizados para colar no Word, Markdown ou HTML.",
  },
} as const;

export type ToolPageSlug = keyof typeof toolPageContent;

export function buildMetadata({
  title,
  description,
  keywords = DEFAULT_KEYWORDS,
  pathname,
}: {
  title: string;
  description: string;
  keywords?: readonly string[];
  pathname: string;
}): Metadata {
  return {
    title,
    description,
    keywords: [...keywords],
    applicationName: SITE_NAME,
    category: "OCR",
    alternates: {
      canonical: `${SITE_URL}${pathname}`,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}${pathname}`,
      siteName: SITE_NAME,
      type: "website",
      locale: "pt_BR",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
