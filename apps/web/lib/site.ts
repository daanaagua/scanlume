import type { Metadata } from "next";

export const SITE_NAME = "Scanlume";
export const SITE_URL = "https://scanlume.com";
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8787";

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
    title: "Imagem para texto online | OCR simples e formatado | Scanlume",
    description:
      "Converta imagem em texto online com OCR simples ou formatado. Copie ou baixe em TXT, Markdown e HTML sem instalar app.",
    h1: "Imagem para texto online com OCR simples e formatado",
    eyebrow: "Principal pagina transacional para imagem para texto",
    lead:
      "Use o modo rapido para texto puro ou escolha a saida formatada para preservar titulos, paragrafos e a ordem de leitura principal.",
  },
  "imagem-para-word": {
    title: "Imagem para Word online com estrutura limpa | Scanlume",
    description:
      "Transforme imagem em texto pronto para Word. Preserve a estrutura principal e copie em TXT, Markdown ou HTML.",
    h1: "Imagem para Word com texto mais organizado",
    eyebrow: "Ideal para colar no Word sem reformatar tudo do zero",
    lead:
      "O modo Formatted Text entrega um layout mais legivel para screenshots de paginas, app screens e materiais de marketing.",
  },
  "ocr-online": {
    title: "OCR online gratis para imagens e screenshots | Scanlume",
    description:
      "OCR online para converter screenshots, posters e fotos em texto editavel. Teste gratis e baixe em TXT, Markdown ou HTML.",
    h1: "OCR online gratis para capturas, JPG e PNG",
    eyebrow: "Ferramenta OCR em pt-BR com foco em velocidade",
    lead:
      "Scanlume combina um fluxo simples para texto puro e uma opcao formatada para manter a leitura mais clara.",
  },
  "jpg-para-texto": {
    title: "JPG para texto online com OCR rapido | Scanlume",
    description:
      "Converta JPG para texto online em segundos. Extraia texto puro ou formato legivel para copiar em Word, Markdown ou HTML.",
    h1: "JPG para texto sem instalar aplicativo",
    eyebrow: "Boa opcao para posters, prints e fotos do celular",
    lead:
      "Envie arquivos JPG e receba texto puro ou uma versao com estrutura principal preservada para edicao posterior.",
  },
  "png-para-texto": {
    title: "PNG para texto online com OCR em pt-BR | Scanlume",
    description:
      "Extraia texto de arquivos PNG online. OCR simples para rapidez ou OCR formatado para preservar a leitura principal.",
    h1: "PNG para texto com leitura mais limpa",
    eyebrow: "Perfeito para screenshots de pagina, app ou landing page",
    lead:
      "O modo formatado ajuda a transformar PNG em blocos mais organizados para colar no Word, Markdown ou HTML.",
  },
} as const;

export type ToolPageSlug = keyof typeof toolPageContent;

export function buildMetadata({
  title,
  description,
  pathname,
}: {
  title: string;
  description: string;
  pathname: string;
}): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}${pathname}`,
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
