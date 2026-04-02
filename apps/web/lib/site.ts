import type { Metadata } from "next";

export const SITE_NAME = "Scanlume";
export const SITE_URL = "https://www.scanlume.com";
export const SOCIAL_IMAGE_PATH = "/opengraph-image.png";
export const SOCIAL_IMAGE_ALT = "Previa da pagina inicial do Scanlume com OCR simples e texto formatado em pt-BR";
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8787";
export const OCR_WORKSPACE_ID = "ocr-workspace";
export const SIMPLE_MODE_LABEL = "OCR simples";
export const FORMATTED_MODE_LABEL = "Texto formatado";
export const LISTINGS_LABEL = "Onde aparecemos";

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
  "extrair texto de foto",
  "extrair texto de print",
  "imagem para texto no celular",
  "ocr em portugues",
  "transcrever imagem em texto",
];

export const TRUST_LINKS = [
  { href: "/featured-on", label: LISTINGS_LABEL },
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
    question: `Qual e a diferenca entre ${SIMPLE_MODE_LABEL} e ${FORMATTED_MODE_LABEL}?`,
    answer:
      `${SIMPLE_MODE_LABEL} entrega texto puro com mais velocidade. ${FORMATTED_MODE_LABEL} reorganiza o conteudo em blocos legiveis, preservando titulos, paragrafos e a hierarquia principal.`,
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

type ToolCard = {
  title: string;
  body: string;
};

type ToolStep = {
  title: string;
  body: string;
};

type ToolFaq = {
  question: string;
  answer: string;
};

type ToolContextualLink = {
  href: string;
  label: string;
  body: string;
};

type ToolPageEntry = {
  label: string;
  title: string;
  description: string;
  keywords: readonly string[];
  index?: boolean;
  h1: string;
  eyebrow: string;
  lead: string;
  heroBullets: readonly string[];
  workspaceFirst?: boolean;
  primaryNav?: boolean;
  defaultMode?: "simple" | "formatted";
  relatedSlugs: readonly string[];
  contextualLinks: readonly ToolContextualLink[];
  useCasesHeading: string;
  useCasesLead: string;
  useCases: readonly ToolCard[];
  stepsHeading: string;
  stepsLead: string;
  steps: readonly ToolStep[];
  faqHeading: string;
  faq: readonly ToolFaq[];
};

export const toolPageContent = {
  "imagem-para-texto": {
    label: "Imagem para texto",
    title: "Imagem para texto: converter imagem em texto com IA | Scanlume",
    description:
      "Converta imagem em texto com IA em portugues do Brasil. Use OCR no navegador para transformar JPG, PNG e capturas de tela em texto simples ou formatado e exportar em TXT, Markdown ou HTML.",
    keywords: [
      "imagem para texto",
      "converter imagem em texto",
      "imagem em texto",
      "ocr online",
      "ocr com ia",
    ],
    h1: "Imagem para texto online para converter imagem em texto com IA",
    eyebrow: "Pagina principal para imagem para texto, imagem em texto e OCR em pt-BR",
    lead:
      "Se voce procura imagem para texto, converter imagem em texto ou imagem em texto, esta e a rota principal do Scanlume para JPG, PNG e capturas de tela com saida simples ou formatada.",
    heroBullets: ["Gratis para testar", "Sem instalar aplicativo", "TXT, Markdown e HTML"],
    workspaceFirst: true,
    defaultMode: "simple",
    primaryNav: true,
    relatedSlugs: ["imagem-para-word", "png-para-texto", "jpg-para-texto", "ocr-em-portugues"],
    contextualLinks: [
      {
        href: "/png-para-texto",
        label: "PNG para texto",
        body: "Use esta rota quando o arquivo vier de screenshot, interface ou landing page em PNG e voce quiser preservar mais detalhe visual.",
      },
      {
        href: "/jpg-para-texto",
        label: "JPG para texto",
        body: "Prefira esta pagina quando a origem for foto do celular, poster ou imagem compartilhada em JPG antes do OCR.",
      },
      {
        href: "/imagem-para-word",
        label: "Imagem para Word",
        body: "Siga por aqui quando o texto precisar chegar mais organizado para Word, Google Docs ou revisao editorial.",
      },
      {
        href: "/ocr-em-portugues",
        label: "OCR em portugues",
        body: "Abra esta variacao se o ponto principal da busca for lidar com texto em pt-BR, acentos e vocabulario local.",
      },
    ],
    useCasesHeading: "Uma pagina principal para transformar imagens em texto com menos retrabalho.",
    useCasesLead:
      "Ela cobre o fluxo mais amplo do produto: capturas de tela, artes, fotos do celular e imagens soltas que precisam virar texto editavel rapido quando a busca e imagem para texto ou converter imagem em texto.",
    useCases: [
      {
        title: "Capturas de landing page",
        body: "Boa opcao para copiar titulos, bullets e blocos de texto de paginas e anuncios sem redigitar tudo.",
      },
      {
        title: "Fotos de materiais impressos",
        body: "Use quando o conteudo esta em cartazes, folders, comunicados internos ou fotos simples com texto legivel.",
      },
      {
        title: "Recortes de dashboards e tabelas leves",
        body: "O modo simples ajuda a tirar texto puro de cards, paines e componentes com leitura direta.",
      },
      {
        title: "Reaproveitamento em docs",
        body: "Depois do OCR, copie ou baixe em TXT, Markdown ou HTML para continuar no Word, Notion ou docs internos.",
      },
    ],
    stepsHeading: "Do upload ao download sem abrir outro app.",
    stepsLead:
      "O fluxo principal foi desenhado para validacao rapida: imagem entra, OCR roda no navegador e o resultado ja sai pronto para copiar.",
    steps: [
      {
        title: "Envie a imagem",
        body: "Suba um JPG, PNG, screenshot ou foto leve com texto visivel.",
      },
      {
        title: "Escolha a saida",
        body: `Use ${SIMPLE_MODE_LABEL} para texto puro ou ${FORMATTED_MODE_LABEL} para manter a estrutura principal do conteudo.`,
      },
      {
        title: "Copie ou exporte",
        body: "Revise o texto na previa e baixe em TXT, Markdown ou HTML para seguir o trabalho em outro lugar.",
      },
    ],
    faqHeading: "FAQ sobre imagem para texto online.",
    faq: [
      {
        question: "Imagem para texto funciona bem com screenshot e foto?",
        answer:
          "Sim. O produto foi pensado para screenshots, JPG, PNG e fotos simples do celular, desde que o texto esteja visivel e com contraste razoavel.",
      },
      {
        question: "Quando usar o modo simples e quando usar o modo formatado?",
        answer:
          `${SIMPLE_MODE_LABEL} e melhor para texto puro e velocidade. ${FORMATTED_MODE_LABEL} e melhor quando voce quer preservar titulos, paragrafos e uma leitura mais limpa.`,
      },
      {
        question: "Preciso instalar aplicativo para converter imagem em texto?",
        answer:
          "Nao. O fluxo roda no navegador e ja permite copiar ou baixar o resultado sem instalar app.",
      },
      {
        question: "Imagem para texto, converter imagem em texto e imagem em texto significam a mesma coisa?",
        answer:
          "Na maioria dos casos, sim. Essas buscas costumam apontar para a mesma necessidade: pegar uma imagem e transformar o conteudo visual em texto editavel. Por isso esta pagina concentra a rota principal do Scanlume para esse problema.",
      },
      {
        question: "O resultado pode ser usado em Word, Notion ou docs internos?",
        answer:
          "Sim. O texto pode ser copiado direto ou exportado em TXT, Markdown e HTML para reutilizacao rapida.",
      },
    ],
  },
  "pdf-para-texto": {
    label: "PDF para texto",
    title: "PDF para texto com OCR online e saida editavel | Scanlume",
    description:
      "Converta PDF em texto com OCR online. Extraia paginas com texto nativo ou escaneado e baixe em PDF pesquisavel, PDF reorganizado, HTML e Markdown.",
    keywords: [
      "pdf para texto",
      "converter pdf em texto",
      "ocr pdf",
      "pdf pesquisavel",
      "pdf para markdown",
    ],
    h1: "PDF para texto com OCR online e saida editavel",
    eyebrow: "OCR para PDFs com texto nativo, paginas escaneadas e layouts mistos",
    lead:
      "Use esta rota quando o arquivo ja esta em PDF e voce precisa transformar paginas em texto editavel, HTML, Markdown ou um PDF pesquisavel sem sair do navegador.",
    heroBullets: ["1 PDF por envio", "PDF pesquisavel e reorganizado", "HTML, Markdown e TXT"],
    workspaceFirst: true,
    primaryNav: true,
    defaultMode: "formatted",
    relatedSlugs: ["imagem-para-texto", "imagem-para-word", "ocr-online", "ocr-em-portugues"],
    contextualLinks: [
      {
        href: "/imagem-para-texto",
        label: "Imagem para texto",
        body: "Volte para a rota principal quando a origem for JPG, PNG ou screenshots, e nao um PDF completo.",
      },
      {
        href: "/imagem-para-word",
        label: "Imagem para Word",
        body: "Use esta pagina quando a prioridade for colar um texto mais limpo no Word ou no Google Docs depois do OCR.",
      },
      {
        href: "/ocr-online",
        label: "OCR online",
        body: "Abra a visao geral do produto para comparar o fluxo de imagens com o fluxo de PDFs dentro do mesmo workspace.",
      },
      {
        href: "/ocr-em-portugues",
        label: "OCR em portugues",
        body: "Boa rota de apoio quando o foco da busca e reconhecer texto em pt-BR com acentos, labels e documentos locais.",
      },
    ],
    useCasesHeading: "Feito para PDFs reais, nao so para imagens soltas.",
    useCasesLead:
      "Esta pagina cobre contratos leves, materiais escaneados, relatórios, apostilas e PDFs mistos em que parte do conteudo ja tem texto nativo e parte ainda precisa de OCR.",
    useCases: [
      {
        title: "PDF com texto nativo",
        body: "Aproveita o texto ja embutido quando ele existe e evita OCR desnecessario em paginas digitais limpas.",
      },
      {
        title: "PDF escaneado",
        body: "Transforma paginas que sao so imagem em texto editavel para copiar, revisar ou exportar em outros formatos.",
      },
      {
        title: "PDF com layout misto",
        body: "Mantem a leitura principal de paginas com colunas, imagens e blocos de texto combinando texto nativo com OCR por regiao.",
      },
      {
        title: "Entrega pronta para download",
        body: "Baixe em HTML, Markdown, TXT, PDF pesquisavel ou PDF reorganizado sem reconstruir tudo manualmente.",
      },
    ],
    stepsHeading: "Do PDF enviado ao arquivo final em poucos passos.",
    stepsLead:
      "A primeira versao foi desenhada para processar um PDF por vez, mostrar paginas processadas e deixar claro o que ficou bloqueado pela cota.",
    steps: [
      {
        title: "Envie um PDF",
        body: "Suba um PDF com texto nativo, paginas escaneadas ou layout misto. O workspace calcula quantas paginas entram na cota atual.",
      },
      {
        title: "Revise a previa",
        body: "Veja o total de paginas, o que foi processado, a mistura entre texto nativo e OCR e a previa HTML do documento.",
      },
      {
        title: "Baixe no formato certo",
        body: "Escolha entre HTML, Markdown, TXT, PDF pesquisavel ou PDF reorganizado para continuar o trabalho em outra ferramenta.",
      },
    ],
    faqHeading: "FAQ sobre PDF para texto.",
    faq: [
      {
        question: "Funciona com PDF escaneado e com PDF que ja tem texto nativo?",
        answer:
          "Sim. O fluxo prioriza o texto nativo quando ele existe e usa OCR nas partes que ainda sao imagem, o que ajuda especialmente em PDFs mistos.",
      },
      {
        question: "Posso baixar em PDF pesquisavel?",
        answer:
          "Sim. A rota de PDF oferece PDF pesquisavel, PDF reorganizado, HTML, Markdown e TXT para diferentes fluxos de trabalho.",
      },
      {
        question: "Quantos PDFs posso enviar por vez?",
        answer:
          "Na primeira versao, o upload aceita um PDF por envio para manter o processamento e a leitura do resultado mais previsiveis.",
      },
      {
        question: "O que acontece quando a cota nao cobre o documento inteiro?",
        answer:
          "O sistema processa o trecho permitido, mostra quantas paginas ficaram bloqueadas e deixa um CTA de upgrade pronto para a proxima fase de cobranca.",
      },
    ],
  },
  "imagem-para-word": {
    label: "Imagem para Word",
    title: "Imagem para Word com IA e estrutura limpa | Scanlume",
    description:
      "Leve OCR com estrutura mais limpa para o Word. Use esta rota quando o texto precisar chegar mais organizado em documentos, revisoes e edicao posterior.",
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
      `O modo ${FORMATTED_MODE_LABEL} usa OCR com IA para entregar um layout mais legivel em screenshots de paginas, telas de app e materiais de marketing.`,
    heroBullets: ["Foco em leitura organizada", "Melhor para colar no Word", "Exporta em HTML e Markdown"],
    workspaceFirst: true,
    primaryNav: true,
    defaultMode: "formatted",
    relatedSlugs: ["imagem-para-texto", "png-para-texto", "ocr-em-portugues", "transcrever-imagem-em-texto"],
    contextualLinks: [
      {
        href: "/imagem-para-texto",
        label: "Imagem para texto",
        body: "Volte para a pagina principal quando o caso for mais amplo e voce quiser comparar o fluxo geral antes de decidir o destino do texto.",
      },
      {
        href: "/png-para-texto",
        label: "PNG para texto",
        body: "Vale abrir esta pagina quando o arquivo veio de screenshot, interface ou layout exportado em PNG antes de ir para Word.",
      },
      {
        href: "/ocr-em-portugues",
        label: "OCR em portugues",
        body: "Use esta rota quando a revisao precisar prestar mais atencao em acentos, labels locais e textos feitos para pt-BR.",
      },
      {
        href: "/transcrever-imagem-em-texto",
        label: "Transcrever imagem em texto",
        body: "Siga por aqui se a etapa seguinte for resumir, reorganizar ou reaproveitar o texto em pautas, briefs e documentos.",
      },
    ],
    useCasesHeading: "Feito para quem quer levar a imagem para Word com menos limpeza manual.",
    useCasesLead:
      "Essa pagina puxa a intencao de usuarios que precisam de estrutura, e nao so do texto bruto, antes de continuar a edicao em documentos.",
    useCases: [
      {
        title: "Relatorios internos",
        body: "Quando a fonte original e uma imagem ou print, o modo formatado entrega uma base melhor para montar relatorios no Word.",
      },
      {
        title: "Pautas e resumos",
        body: "Boa opcao para transformar capturas de tela, blocos de texto e materiais visuais em um rascunho pronto para edicao.",
      },
      {
        title: "Criativos e materiais de marketing",
        body: "Ajuda a reaproveitar textos de anuncios, hero sections e banners em documentos compartilhados com a equipe.",
      },
      {
        title: "Documentacao leve",
        body: "Funciona bem quando voce quer copiar o conteudo central para Word sem reconstruir o layout inteiro na mao.",
      },
    ],
    stepsHeading: "OCR pensado para chegar mais limpo no Word.",
    stepsLead:
      "O objetivo aqui nao e gerar DOCX direto, e sim entregar um texto com hierarquia melhor para colar e finalizar mais rapido.",
    steps: [
      {
        title: "Envie a imagem ou print",
        body: "Funciona bem com paginas, documentos leves, slides e interfaces capturadas em JPG ou PNG.",
      },
      {
        title: "Use o modo formatado",
        body: "A saida com IA organiza melhor titulos, blocos e paragrafos para reduzir o retrabalho na hora de colar.",
      },
      {
        title: "Cole no Word",
        body: "Baixe em HTML ou Markdown, ou copie o texto direto para Word e ajuste o que for necessario.",
      },
    ],
    faqHeading: "FAQ sobre imagem para Word.",
    faq: [
      {
        question: "O Scanlume gera arquivo DOCX?",
        answer:
          "Ainda nao. Hoje a melhor rota e usar a saida formatada em HTML, Markdown ou texto copiado e colar no Word com muito menos limpeza manual.",
      },
      {
        question: "Quando vale mais a pena usar imagem para Word em vez do modo simples?",
        answer:
          "Quando voce precisa preservar a leitura principal do conteudo, com titulos e paragrafos mais organizados antes de editar no Word.",
      },
      {
        question: "Funciona para screenshots de paginas e criativos?",
        answer:
          "Sim. Essa e uma das melhores aplicacoes, porque o modo formatado ajuda a reconstruir a hierarquia principal sem voce copiar tudo do zero.",
      },
      {
        question: "Posso usar o resultado em Google Docs tambem?",
        answer:
          "Sim. O texto exportado pode ser colado em Word, Google Docs, Notion e outras ferramentas de edicao.",
      },
    ],
  },
  "ocr-online": {
    label: "OCR online",
    title: "OCR online com IA para imagens e screenshots | Scanlume",
    description:
      "Use OCR online com IA no navegador para extrair texto de capturas de tela, JPG e PNG. Uma rota leve para testar velocidade, formato e saida sem instalar nada.",
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
    heroBullets: ["OCR direto no navegador", "Sem instalacao", "Ideal para testes rapidos"],
    workspaceFirst: true,
    defaultMode: "simple",
    primaryNav: true,
    relatedSlugs: ["imagem-para-texto", "jpg-para-texto", "png-para-texto", "ocr-em-portugues"],
    contextualLinks: [
      {
        href: "/imagem-para-texto",
        label: "Imagem para texto",
        body: "Use a pagina principal quando a busca deixar de ser teste rapido e passar a pedir uma rota mais ampla para formatos e contextos diferentes.",
      },
      {
        href: "/jpg-para-texto",
        label: "JPG para texto",
        body: "Entre aqui quando o arquivo chegar de foto, camera do celular ou exportacao comprimida em JPG.",
      },
      {
        href: "/png-para-texto",
        label: "PNG para texto",
        body: "Abra esta variacao para screenshots e layouts em PNG, onde a nitidez costuma ajudar mais na leitura do OCR.",
      },
      {
        href: "/ocr-em-portugues",
        label: "OCR em portugues",
        body: "Vale seguir por esta pagina quando a busca mencionar idioma, acentos ou texto em portugues como prioridade.",
      },
    ],
    useCasesHeading: "OCR online para quem quer testar, extrair e seguir rapido.",
    useCasesLead:
      "A promessa desta pagina e velocidade: abrir o navegador, subir a imagem e ter o texto disponivel sem configurar nada.",
    useCases: [
      {
        title: "Teste imediato",
        body: "Bom para validar em minutos se a imagem tem qualidade suficiente antes de levar o fluxo para um processo maior.",
      },
      {
        title: "Sem instalar software",
        body: "Ajuda usuarios que so precisam de OCR ocasional e preferem fazer tudo no navegador.",
      },
      {
        title: "Comparar modos",
        body: "Voce pode testar texto puro e saida formatada na mesma interface para ver qual se encaixa melhor no caso.",
      },
      {
        title: "Rotina leve de equipe",
        body: "Serve para times que precisam extrair texto de prints, artes e imagens pontuais sem abrir um fluxo pesado.",
      },
    ],
    stepsHeading: "OCR online sem barreira de entrada.",
    stepsLead:
      "A interface foi montada para reduzir atrito: upload rapido, previa imediata e download em formatos simples.",
    steps: [
      {
        title: "Abra a pagina",
        body: "Nao precisa instalar extensao nem aplicativo para comecar a usar o OCR.",
      },
      {
        title: "Suba o arquivo",
        body: "Use screenshot, JPG ou PNG com texto legivel e escolha o modo que faz mais sentido para o caso.",
      },
      {
        title: "Copie o texto",
        body: "Depois do processamento, revise na previa e leve o resultado para documentos, chats internos ou sistemas de apoio.",
      },
    ],
    faqHeading: "FAQ sobre OCR online.",
    faq: [
      {
        question: "OCR online e melhor para quem nao quer instalar nada?",
        answer:
          "Sim. Essa pagina foi desenhada exatamente para esse caso: abrir no navegador, enviar a imagem e extrair o texto ali mesmo.",
      },
      {
        question: "Quais formatos entram no OCR online do Scanlume?",
        answer:
          "Hoje o fluxo principal atende screenshots, JPG e PNG, que sao os formatos mais comuns no uso diario.",
      },
      {
        question: "O OCR online do Scanlume usa IA?",
        answer:
          "Sim. Alem do modo simples, existe um modo formatado com IA para entregar uma leitura principal mais organizada.",
      },
      {
        question: "O resultado fica pronto para exportacao?",
        answer:
          "Sim. Voce pode copiar o texto ou baixar em TXT, Markdown e HTML.",
      },
    ],
  },
  "jpg-para-texto": {
    label: "JPG para texto",
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
    heroBullets: ["Aceita JPG leve", "Bom para fotos", "Saida simples ou formatada"],
    workspaceFirst: true,
    defaultMode: "simple",
    primaryNav: true,
    relatedSlugs: ["imagem-para-texto", "extrair-texto-de-foto", "imagem-para-texto-no-celular", "ocr-online"],
    contextualLinks: [
      {
        href: "/imagem-para-texto",
        label: "Imagem para texto",
        body: "Volte para a pagina principal quando o uso deixar de ser so JPG e passar a envolver varios tipos de imagem no mesmo fluxo.",
      },
      {
        href: "/extrair-texto-de-foto",
        label: "Extrair texto de foto",
        body: "Prefira esta pagina quando a origem for claramente uma foto do mundo real, com camera, perspectiva e luz variavel.",
      },
      {
        href: "/imagem-para-texto-no-celular",
        label: "Imagem para texto no celular",
        body: "Siga por aqui quando a tarefa inteira acontece no telefone, da captura ao OCR e ao compartilhamento do texto.",
      },
      {
        href: "/ocr-online",
        label: "OCR online",
        body: "Abra esta rota quando o objetivo for validar rapido o OCR sem decidir primeiro por formato, dispositivo ou destino final.",
      },
    ],
    useCasesHeading: "JPG para texto em cenarios onde a camera ou exportacao gera imagem comprimida.",
    useCasesLead:
      "Muita imagem com texto chega em JPG. Esta pagina foi criada para esse caso especifico, especialmente fotos e artes leves compartilhadas no dia a dia.",
    useCases: [
      {
        title: "Fotos da camera",
        body: "Se o celular salvou ou compartilhou a imagem em JPG, o Scanlume ja consegue entrar no fluxo sem conversao previa.",
      },
      {
        title: "Posters e avisos",
        body: "Boa rota para cartazes, flyers e pecas simples fotografadas em ambientes internos.",
      },
      {
        title: "Arquivos exportados por apps",
        body: "Varios apps e editores exportam criativos e snapshots em JPG, o que torna esse atalho util para OCR rapido.",
      },
      {
        title: "Conteudo para reaproveitar",
        body: "Depois do OCR, o texto pode seguir para Word, docs e sistemas internos sem voce reescrever tudo na mao.",
      },
    ],
    stepsHeading: "Fluxo especifico para JPG sem etapa extra.",
    stepsLead:
      "Nao e preciso converter JPG para PNG antes. Basta subir o arquivo, processar e revisar o texto no navegador.",
    steps: [
      {
        title: "Escolha o JPG",
        body: "Suba a foto, poster ou imagem exportada em JPG direto da sua maquina ou celular.",
      },
      {
        title: "Selecione o modo",
        body: "Use texto puro para velocidade ou o modo formatado quando o arquivo tiver varios blocos e titulos.",
      },
      {
        title: "Revise e baixe",
        body: "Confirme o resultado na previa e exporte no formato que faz mais sentido para o seu fluxo.",
      },
    ],
    faqHeading: "FAQ sobre JPG para texto.",
    faq: [
      {
        question: "Preciso converter JPG para outro formato antes do OCR?",
        answer:
          "Nao. O fluxo principal do Scanlume aceita JPG direto, entao voce pode enviar a imagem sem etapa intermediaria.",
      },
      {
        question: "JPG para texto funciona bem para foto tirada do celular?",
        answer:
          "Sim, principalmente quando a foto esta bem iluminada e o texto aparece com contraste suficiente.",
      },
      {
        question: "Quando usar o modo formatado em JPG?",
        answer:
          "Quando a imagem tiver varios blocos, chamadas e partes hierarquicas que voce deseja preservar melhor antes de editar.",
      },
      {
        question: "Posso baixar o resultado de um JPG em HTML ou Markdown?",
        answer:
          "Sim. Alem de copiar o texto, voce pode exportar em TXT, Markdown e HTML.",
      },
    ],
  },
  "png-para-texto": {
    label: "PNG para texto",
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
    heroBullets: ["Pensado para screenshots", "Bom para UI e layouts", "Modo formatado com IA"],
    workspaceFirst: true,
    defaultMode: "simple",
    primaryNav: true,
    relatedSlugs: ["imagem-para-texto", "extrair-texto-de-print", "imagem-para-word", "ocr-online"],
    contextualLinks: [
      {
        href: "/imagem-para-texto",
        label: "Imagem para texto",
        body: "Use a pagina principal quando voce quiser manter a busca mais ampla e navegar entre formatos sem perder a rota central.",
      },
      {
        href: "/extrair-texto-de-print",
        label: "Extrair texto de print",
        body: "Abra esta variacao quando o caso for print de tela, dashboard ou recorte digital em que o usuario quer so puxar o texto principal.",
      },
      {
        href: "/imagem-para-word",
        label: "Imagem para Word",
        body: "Siga por esta pagina quando o resultado em PNG precisar chegar com hierarquia melhor para Word, Docs ou revisao manual.",
      },
      {
        href: "/ocr-online",
        label: "OCR online",
        body: "Use este atalho se a prioridade for testar o OCR no navegador antes de escolher um fluxo mais especifico por formato.",
      },
    ],
    useCasesHeading: "PNG para texto funciona muito bem quando a origem e tela, design ou interface.",
    useCasesLead:
      "Muitos screenshots e layouts saem em PNG. Esta pagina conversa com essa intencao e com o tipo de imagem mais comum em fluxos digitais.",
    useCases: [
      {
        title: "Prints de paginas",
        body: "Ajuda a extrair titulos, descricoes e secoes de landing pages e artigos capturados da tela.",
      },
      {
        title: "App screens",
        body: "Boa opcao para copiar texto de interfaces, modais, funis e componentes exportados como PNG.",
      },
      {
        title: "Layouts de design",
        body: "Funciona para criativos e mockups em que voce quer reaproveitar o texto principal antes de editar a peca.",
      },
      {
        title: "Fluxos para Markdown",
        body: "A combinacao de PNG e saida estruturada em Markdown atende bem times que trabalham com documentacao leve.",
      },
    ],
    stepsHeading: "Um atalho direto para screenshots em PNG.",
    stepsLead:
      "Como PNG aparece muito em recortes de tela, o fluxo privilegia previa rapida e uma saida facil de revisar antes de copiar.",
    steps: [
      {
        title: "Suba o PNG",
        body: "Selecione o screenshot, layout ou imagem exportada que voce quer converter em texto.",
      },
      {
        title: "Ative o melhor modo",
        body: `${SIMPLE_MODE_LABEL} resolve casos diretos. ${FORMATTED_MODE_LABEL} ajuda quando a captura tem varios niveis visuais e blocos.`,
      },
      {
        title: "Leve para o seu fluxo",
        body: "Copie o texto ou baixe em TXT, Markdown e HTML para seguir com edicao, documentacao ou revisao interna.",
      },
    ],
    faqHeading: "FAQ sobre PNG para texto.",
    faq: [
      {
        question: "PNG para texto e uma boa pagina para screenshots?",
        answer:
          "Sim. PNG costuma ser um dos formatos mais comuns em prints de tela e layouts, por isso esta pagina foi montada com esse uso em mente.",
      },
      {
        question: "Quando o PNG para texto pede o modo formatado?",
        answer:
          "Quando a imagem tiver hierarquia visual, varios blocos ou estrutura de pagina, porque a saida formatada tende a ficar mais facil de reutilizar.",
      },
      {
        question: "Posso extrair texto de telas de app em PNG?",
        answer:
          "Sim. O Scanlume foi desenhado para telas, interfaces e capturas em que o texto principal precisa ser reaproveitado rapido.",
      },
      {
        question: "Qual a diferenca entre PNG para texto e imagem para texto?",
        answer:
          "PNG para texto fala com uma intencao mais especifica de formato, enquanto imagem para texto cobre o caso geral para varios tipos de imagem.",
      },
    ],
  },
  "extrair-texto-de-imagem": {
    label: "Extrair texto de imagem",
    title: "Extrair texto de imagem online com IA | Scanlume",
    description:
      "Extraia texto de imagem online com OCR em pt-BR. Transforme screenshots, JPG e PNG em texto editavel com modo simples ou formatado.",
    keywords: [
      "extrair texto de imagem",
      "tirar texto de imagem",
      "copiar texto de imagem",
      "ocr online",
    ],
    index: false,
    h1: "Extrair texto de imagem sem redigitar tudo do zero",
    eyebrow: "Pagina de suporte para a intencao de extrair conteudo visual",
    lead:
      "Quando a tarefa e so puxar o texto que esta preso dentro de uma imagem, o Scanlume entrega uma rota direta com OCR online e exportacao simples.",
    heroBullets: ["Foco em extracao", "Serve para print e foto", "Copiar sem retrabalho"],
    workspaceFirst: true,
    defaultMode: "simple",
    primaryNav: false,
    relatedSlugs: ["imagem-para-texto", "ocr-online", "imagem-para-word", "transcrever-imagem-em-texto"],
    contextualLinks: [
      {
        href: "/imagem-para-texto",
        label: "Imagem para texto",
        body: "Volte para a pagina principal quando a necessidade deixar de ser so extrair e passar a cobrir diferentes formatos, saidas e cenarios.",
      },
      {
        href: "/ocr-online",
        label: "OCR online",
        body: "Abra esta rota quando o contexto pedir um teste rapido no navegador sem entrar primeiro em um recorte de formato ou dispositivo.",
      },
      {
        href: "/imagem-para-word",
        label: "Imagem para Word",
        body: "Siga por esta pagina se o texto extraido precisar chegar mais limpo para colar em Word, Docs ou materiais de equipe.",
      },
      {
        href: "/transcrever-imagem-em-texto",
        label: "Transcrever imagem em texto",
        body: "Use esta variacao quando a proxima etapa for resumir, reorganizar ou reaproveitar o conteudo em documentos e briefs.",
      },
    ],
    useCasesHeading: "Feito para copiar o texto da imagem, nao para reconstruir o layout inteiro.",
    useCasesLead:
      "Essa pagina conversa com a busca de quem quer extrair conteudo rapido de uma imagem e seguir para a proxima etapa.",
    useCases: [
      {
        title: "Cards e posts",
        body: "Util para reaproveitar chamadas, legendas e textos de pecas visuais publicadas em redes ou campanhas internas.",
      },
      {
        title: "Menus e avisos",
        body: "Bom para transformar texto de placas, cardapios, comunicados e materiais simples em conteudo editavel.",
      },
      {
        title: "Recortes de documentos",
        body: "Ajuda quando voce so tem um trecho em imagem e precisa copiar o texto principal sem reescrever tudo.",
      },
      {
        title: "Pesquisa e benchmarking",
        body: "Serve para tirar texto de referencias visuais e levar trechos para docs, comparativos ou notas de analise.",
      },
    ],
    stepsHeading: "Extrair texto de imagem em tres movimentos.",
    stepsLead:
      "O fluxo e simples porque essa busca normalmente tem pressa: pegar a imagem, converter e colar o conteudo onde ele vai ser usado.",
    steps: [
      {
        title: "Suba a imagem",
        body: "Escolha o print, JPG ou PNG que contem o texto que voce quer retirar da parte visual.",
      },
      {
        title: "Rode o OCR",
        body: "Use o modo simples para copiar rapido ou o modo formatado para imagens com varios blocos de leitura.",
      },
      {
        title: "Aproveite o resultado",
        body: "Copie o texto ou baixe o arquivo para reaproveitar em docs, chats internos e materiais de trabalho.",
      },
    ],
    faqHeading: "FAQ sobre extrair texto de imagem.",
    faq: [
      {
        question: "Extrair texto de imagem e o mesmo que OCR online?",
        answer:
          "Na pratica, sim. O OCR e a tecnologia que transforma o texto visivel da imagem em conteudo editavel.",
      },
      {
        question: "Preciso redigitar depois de extrair texto de imagem?",
        answer:
          "Em geral nao. O objetivo da ferramenta e justamente eliminar a digitacao manual e reduzir ajustes para o minimo necessario.",
      },
      {
        question: "Essa pagina atende screenshot, JPG e PNG?",
        answer:
          "Sim. Ela foi montada para o fluxo geral de extracao, independentemente de a imagem ser um print de tela ou uma foto simples.",
      },
      {
        question: "Posso exportar o texto extraido em outros formatos?",
        answer:
          "Sim. Depois do OCR voce pode copiar o texto ou baixar em TXT, Markdown e HTML.",
      },
    ],
  },
  "extrair-texto-de-foto": {
    label: "Extrair texto de foto",
    title: "Extrair texto de foto online com OCR | Scanlume",
    description:
      "Extraia texto de foto online com OCR em pt-BR. Transforme fotos do celular em texto editavel com modo simples ou formatado.",
    keywords: [
      "extrair texto de foto",
      "texto de foto",
      "foto para texto",
      "ocr de foto",
      "imagem para texto no celular",
    ],
    h1: "Extrair texto de foto do celular sem instalar aplicativo",
    eyebrow: "Pagina de cenario para fotos, camera e compartilhamentos rapidos",
    lead:
      "Quando o texto esta em uma foto de quadro, aviso, folder ou cartaz, o Scanlume ajuda a transformar esse conteudo em texto editavel no navegador.",
    heroBullets: ["Bom para camera do celular", "Sem app dedicado", "Revisao rapida no navegador"],
    workspaceFirst: true,
    defaultMode: "simple",
    primaryNav: false,
    relatedSlugs: ["imagem-para-texto", "jpg-para-texto", "imagem-para-texto-no-celular", "transcrever-imagem-em-texto"],
    contextualLinks: [
      {
        href: "/imagem-para-texto",
        label: "Imagem para texto",
        body: "Volte para a pagina principal quando a foto for so um dos formatos do seu fluxo e voce quiser uma rota mais ampla para o produto.",
      },
      {
        href: "/jpg-para-texto",
        label: "JPG para texto",
        body: "Use esta pagina quando a foto ja estiver em JPG e o foco for trabalhar direto com esse formato.",
      },
      {
        href: "/imagem-para-texto-no-celular",
        label: "Imagem para texto no celular",
        body: "Abra esta variacao se a tarefa inteira acontece no telefone, da captura ao OCR e ao compartilhamento do texto.",
      },
      {
        href: "/transcrever-imagem-em-texto",
        label: "Transcrever imagem em texto",
        body: "Siga por esta pagina quando a foto for so a fonte inicial e o texto final precisar entrar em resumos, notas ou documentacao.",
      },
    ],
    useCasesHeading: "Pensado para fotos do mundo real, nao so para screenshots perfeitos.",
    useCasesLead:
      "Esta pagina organiza a intencao de quem fotografou algum texto e agora precisa copiar, resumir ou reaproveitar o conteudo.",
    useCases: [
      {
        title: "Quadro branco e anotacoes",
        body: "Boa opcao para fotos de reuniao, brainstorm e lembretes escritos que precisam virar texto compartilhavel.",
      },
      {
        title: "Cardapios e avisos",
        body: "Serve para materiais do dia a dia fotografados em restaurante, loja, recepcao ou espaco interno.",
      },
      {
        title: "Folders e impressos",
        body: "Ajuda a reaproveitar conteudo de materiais impressos capturados com a camera do celular.",
      },
      {
        title: "Fotos enviadas no chat",
        body: "Quando alguem manda uma foto com texto por WhatsApp ou outro chat, o OCR vira uma rota rapida para copiar o conteudo.",
      },
    ],
    stepsHeading: "Da foto ao texto editavel sem perder tempo.",
    stepsLead:
      "O foco aqui e praticidade para celular: abrir o navegador, mandar a foto e sair com o texto pronto para uso.",
    steps: [
      {
        title: "Escolha a foto",
        body: "Use uma imagem tirada da camera ou salva da galeria, de preferencia com boa luz e texto legivel.",
      },
      {
        title: "Aplique o modo certo",
        body: "Se a foto for direta, o modo simples resolve. Se tiver varios blocos ou ordem visual, teste o modo formatado.",
      },
      {
        title: "Compartilhe o texto",
        body: "Depois da previa, copie o conteudo ou baixe para levar para Word, documentos ou mensagens internas.",
      },
    ],
    faqHeading: "FAQ sobre extrair texto de foto.",
    faq: [
      {
        question: "Funciona com foto tirada na hora pelo celular?",
        answer:
          "Sim. Essa pagina foi pensada para fotos do celular, principalmente quando o texto aparece com iluminacao e enquadramento razoaveis.",
      },
      {
        question: "Preciso baixar app para extrair texto de foto?",
        answer:
          "Nao. O fluxo principal roda no navegador, o que deixa o processo mais leve para testes e uso pontual.",
      },
      {
        question: "Foto de quadro branco tambem entra nesse fluxo?",
        answer:
          "Sim, desde que o contraste permita a leitura do texto principal. Para fotos mais complexas, revisar a previa e sempre recomendado.",
      },
      {
        question: "Posso usar a saida da foto em docs e relatatorios?",
        answer:
          "Sim. Depois da extracao voce pode copiar ou baixar o texto para reaproveitar em Word, Notion, email ou outros fluxos.",
      },
    ],
  },
  "extrair-texto-de-print": {
    label: "Extrair texto de print",
    title: "Extrair texto de print e screenshot online | Scanlume",
    description:
      "Extraia texto de print e screenshot com OCR online em pt-BR. Converta capturas de tela em texto puro ou formatado.",
    keywords: [
      "extrair texto de print",
      "extrair texto de screenshot",
      "print para texto",
      "screenshot para texto",
      "ocr online",
    ],
    h1: "Extrair texto de print de tela em segundos",
    eyebrow: "Pagina de suporte para screenshots, interfaces e recortes digitais",
    lead:
      "Prints de landing page, app screen e dashboard costumam sair em PNG ou JPG. Aqui o foco e puxar o texto principal desses recortes com o minimo de atrito.",
    heroBullets: ["Ideal para screenshot", "Bom para interfaces", "Modo formatado ajuda na hierarquia"],
    workspaceFirst: true,
    defaultMode: "simple",
    primaryNav: false,
    relatedSlugs: ["imagem-para-texto", "png-para-texto", "ocr-online", "imagem-para-word"],
    contextualLinks: [
      {
        href: "/imagem-para-texto",
        label: "Imagem para texto",
        body: "Use a pagina principal quando o fluxo combinar prints com outros formatos e voce quiser concentrar o sinal no fluxo mais amplo do produto.",
      },
      {
        href: "/png-para-texto",
        label: "PNG para texto",
        body: "Prefira esta pagina quando o print vier em PNG e o que mais importa for manter nitidez e hierarquia visual.",
      },
      {
        href: "/ocr-online",
        label: "OCR online",
        body: "Abra este atalho quando a ideia for validar o OCR rapidamente em qualquer print sem entrar tanto no detalhe do formato.",
      },
      {
        href: "/imagem-para-word",
        label: "Imagem para Word",
        body: "Siga por aqui se o print tiver varios blocos e o resultado precisar ser colado depois em Word, Docs ou briefings.",
      },
    ],
    useCasesHeading: "Quando o texto esta preso em um print de tela.",
    useCasesLead:
      "Esta pagina cobre o cenario de capturas digitais, onde a maior dor nao e o formato do arquivo, mas o tempo perdido copiando texto da tela manualmente.",
    useCases: [
      {
        title: "Landing pages",
        body: "Capture o hero, beneficios, depoimentos e outros blocos de paginas para reaproveitar a copy com mais rapidez.",
      },
      {
        title: "App screens",
        body: "Boa opcao para extrair labels, mensagens e conteudo de fluxos de produto mostrados em capturas de interface.",
      },
      {
        title: "Dashboards internos",
        body: "Ajuda a retirar texto de cards, widgets e paines quando o recorte veio de um sistema e precisa virar nota ou resumo.",
      },
      {
        title: "Conversas e comprovantes leves",
        body: "Serve para screenshots simples em que voce quer copiar o texto central e seguir a partir dele.",
      },
    ],
    stepsHeading: "OCR para print sem mudar seu fluxo de captura.",
    stepsLead:
      "Se voce ja tirou o screenshot, nao precisa fazer mais nada alem de subir a imagem e escolher o tipo de saida.",
    steps: [
      {
        title: "Envie o print",
        body: "Selecione a captura de tela em PNG ou JPG diretamente da pasta onde ela foi salva.",
      },
      {
        title: "Escolha o nivel de estrutura",
        body: "Prints simples podem ficar no modo rapido. Capturas com varios blocos costumam melhorar com o modo formatado.",
      },
      {
        title: "Reaproveite o texto",
        body: "Copie o conteudo do print para briefing, doc, analise competitiva ou qualquer tarefa que pedia digitacao manual.",
      },
    ],
    faqHeading: "FAQ sobre extrair texto de print.",
    faq: [
      {
        question: "Print para texto e diferente de imagem para texto?",
        answer:
          "E uma variacao mais especifica da mesma necessidade. Aqui o foco esta em capturas de tela, interfaces e screenshots digitais.",
      },
      {
        question: "Modo formatado ajuda em screenshot de landing page?",
        answer:
          "Sim. Ele costuma funcionar melhor quando o print tem varios blocos e uma ordem visual que vale preservar no texto final.",
      },
      {
        question: "Funciona para prints de celular e desktop?",
        answer:
          "Sim. O importante e que o texto apareca com contraste e tamanho suficientes para o OCR.",
      },
      {
        question: "Posso baixar o texto do print depois de extrair?",
        answer:
          "Sim. O resultado pode ser copiado ou exportado em TXT, Markdown e HTML.",
      },
    ],
  },
  "imagem-para-texto-no-celular": {
    label: "Imagem para texto no celular",
    title: "Imagem para texto no celular sem app | Scanlume",
    description:
      "Converta imagem para texto no celular sem app. OCR online em pt-BR para fotos, prints e imagens salvas no telefone.",
    keywords: [
      "imagem para texto no celular",
      "ocr no celular",
      "foto para texto no celular",
      "extrair texto de imagem no celular",
      "imagem para texto online",
    ],
    h1: "Imagem para texto no celular direto do navegador",
    eyebrow: "Pagina de suporte para mobile, camera e uso sem instalacao",
    lead:
      "Se a maior parte do seu fluxo nasce no celular, esta pagina mostra um caminho simples para subir fotos e prints, rodar OCR e copiar o texto sem baixar app dedicado.",
    heroBullets: ["Pensado para mobile", "Sem instalar app", "Fotos e prints do telefone"],
    workspaceFirst: true,
    defaultMode: "simple",
    primaryNav: false,
    relatedSlugs: ["imagem-para-texto", "extrair-texto-de-foto", "jpg-para-texto", "png-para-texto"],
    contextualLinks: [
      {
        href: "/imagem-para-texto",
        label: "Imagem para texto",
        body: "Volte para a pagina principal quando voce quiser continuar o fluxo depois no desktop ou comparar formatos alem do contexto mobile.",
      },
      {
        href: "/extrair-texto-de-foto",
        label: "Extrair texto de foto",
        body: "Use esta pagina quando o caso for camera, quadro, cartaz ou foto do mundo real capturada no telefone.",
      },
      {
        href: "/jpg-para-texto",
        label: "JPG para texto",
        body: "Abra esta variacao quando o celular salvar ou compartilhar a imagem em JPG e voce quiser trabalhar direto com esse formato.",
      },
      {
        href: "/png-para-texto",
        label: "PNG para texto",
        body: "Siga por aqui para screenshots do telefone, telas de app e recortes exportados em PNG com texto mais limpo.",
      },
    ],
    useCasesHeading: "Mobile first para quem resolve tudo no telefone.",
    useCasesLead:
      "Aqui a intencao nao e apenas OCR. E conveniencia: usar a ferramenta no navegador do celular e continuar o trabalho sem sair do aparelho.",
    useCases: [
      {
        title: "Foto tirada na rua",
        body: "Quando voce fotografa um aviso, poster ou menu e precisa extrair o texto ali mesmo, sem voltar para o desktop.",
      },
      {
        title: "Screenshot do telefone",
        body: "Boa rota para copiar mensagens, telas de app e recortes de pagina salvos na galeria.",
      },
      {
        title: "Compartilhar com a equipe",
        body: "Depois do OCR, o texto pode ser colado em mensagem, email ou doc sem passar por outro software.",
      },
      {
        title: "Uso pontual sem cadastro",
        body: "Para quem so quer resolver uma tarefa rapida no mobile, o navegador ja da conta sem instalar mais um app.",
      },
    ],
    stepsHeading: "Um fluxo que comeca e termina no celular.",
    stepsLead:
      "A experiencia foi pensada para toque rapido, upload simples e uma previa que ja permita copiar o resultado do proprio telefone.",
    steps: [
      {
        title: "Abra o site no navegador",
        body: "Acesse a pagina pelo celular e selecione a imagem da galeria ou da camera.",
      },
      {
        title: "Rode o OCR",
        body: "Escolha a opcao simples para velocidade ou o modo formatado para preservar melhor a leitura principal.",
      },
      {
        title: "Copie ou baixe",
        body: "Leve o texto para notas, mensagens, docs ou exporte em um formato facil de reutilizar depois.",
      },
    ],
    faqHeading: "FAQ sobre imagem para texto no celular.",
    faq: [
      {
        question: "Preciso instalar aplicativo para usar no celular?",
        answer:
          "Nao. O Scanlume foi montado para funcionar direto no navegador, o que simplifica o uso mobile.",
      },
      {
        question: "Posso enviar foto da camera e screenshot da galeria?",
        answer:
          "Sim. O fluxo atende bem tanto fotos tiradas na hora quanto capturas ja salvas no telefone.",
      },
      {
        question: "Imagem para texto no celular perde alguma funcao?",
        answer:
          "Nao no fluxo principal. Voce continua podendo usar modo simples ou formatado e exportar em TXT, Markdown e HTML.",
      },
      {
        question: "Vale a pena para uso ocasional?",
        answer:
          "Sim. Esse e um dos melhores cenarios, porque o navegador resolve a tarefa sem exigir download de app dedicado.",
      },
    ],
  },
  "ocr-em-portugues": {
    label: "OCR em portugues",
    title: "OCR em portugues para imagens e screenshots | Scanlume",
    description:
      "Use OCR em portugues para extrair texto de imagens com pt-BR. Ideal para prints, fotos e layouts com acentos e termos locais.",
    keywords: [
      "ocr em portugues",
      "ocr portugues brasil",
      "ocr pt br",
      "extrair texto em portugues",
      "ocr com ia",
    ],
    h1: "OCR em portugues para imagens com contexto pt-BR",
    eyebrow: "Pagina de capacidade para consultas focadas em idioma e legibilidade",
    lead:
      "Esta pagina posiciona o Scanlume para buscas em que o usuario quer um OCR preparado para textos em portugues, com suporte a acentos, chamadas locais e conteudo de uso diario.",
    heroBullets: ["Foco em pt-BR", "Bom para acentos", "Serve para UI e fotos"],
    workspaceFirst: true,
    defaultMode: "simple",
    primaryNav: false,
    relatedSlugs: ["imagem-para-texto", "ocr-online", "png-para-texto", "imagem-para-word"],
    contextualLinks: [
      {
        href: "/imagem-para-texto",
        label: "Imagem para texto",
        body: "Volte para a pagina principal quando a busca misturar idioma com outros formatos e a rota central fizer mais sentido para o usuario.",
      },
      {
        href: "/ocr-online",
        label: "OCR online",
        body: "Abra esta variacao quando a prioridade for testar rapido no navegador antes de entrar no recorte especifico de idioma.",
      },
      {
        href: "/png-para-texto",
        label: "PNG para texto",
        body: "Use esta pagina para interfaces e screenshots em pt-BR, onde o formato do arquivo tambem ajuda a leitura do OCR.",
      },
      {
        href: "/imagem-para-word",
        label: "Imagem para Word",
        body: "Siga por aqui se o texto em portugues precisar chegar mais organizado para Word, Docs ou revisao editorial.",
      },
    ],
    useCasesHeading: "Quando o idioma tambem importa na hora de extrair texto.",
    useCasesLead:
      "A busca por OCR em portugues aparece quando o usuario quer mais confianca para processar textos com vocabulario local, acentos e padroes visuais do mercado brasileiro.",
    useCases: [
      {
        title: "Interfaces em pt-BR",
        body: "Ajuda a extrair texto de apps, paines e paginas com labels, mensagens e chamadas em portugues.",
      },
      {
        title: "Campanhas e criativos locais",
        body: "Boa opcao para banners, landing pages e anuncios feitos para o publico brasileiro.",
      },
      {
        title: "Documentos leves com acentos",
        body: "Serve para comunicados, recortes de relatorios e conteudos em que a leitura correta dos termos em portugues faz diferenca.",
      },
      {
        title: "Fotos do dia a dia",
        body: "Tambem atende menus, avisos e placas fotografadas quando o texto principal esta em portugues.",
      },
    ],
    stepsHeading: "OCR em portugues com o mesmo fluxo leve do produto.",
    stepsLead:
      "Voce so precisa subir a imagem e revisar a previa, com a vantagem de uma pagina criada para a intencao de idioma.",
    steps: [
      {
        title: "Suba a imagem em pt-BR",
        body: "Use screenshot, JPG ou PNG com texto em portugues e contraste razoavel.",
      },
      {
        title: "Escolha entre rapidez ou estrutura",
        body: "Textos curtos podem ir no modo simples. Capturas com varios blocos ganham mais clareza no modo formatado.",
      },
      {
        title: "Revise os detalhes",
        body: "Confirme o resultado na previa, especialmente em termos, nomes proprios e acentos, antes de copiar ou exportar.",
      },
    ],
    faqHeading: "FAQ sobre OCR em portugues.",
    faq: [
      {
        question: "OCR em portugues funciona para textos com acentos?",
        answer:
          "Sim. Esta pagina foi feita justamente para a busca de usuarios que querem trabalhar com conteudo em pt-BR e revisar o resultado com mais contexto.",
      },
      {
        question: "Posso usar OCR em portugues para interface de app?",
        answer:
          "Sim. Esse e um dos melhores casos, especialmente quando voce quer copiar labels, mensagens e blocos de texto de telas em portugues.",
      },
      {
        question: "Qual modo usar para paginas longas em portugues?",
        answer:
          "Geralmente o modo formatado ajuda mais quando a captura tem hierarquia visual e varios paragrafos.",
      },
      {
        question: "OCR em portugues tambem serve para fotos?",
        answer:
          "Sim. Fotos com boa legibilidade entram no mesmo fluxo e podem ser convertidas em texto editavel.",
      },
    ],
  },
  "transcrever-imagem-em-texto": {
    label: "Transcrever imagem em texto",
    title: "Transcrever imagem em texto com IA online | Scanlume",
    description:
      "Transcreva imagem em texto com IA e OCR online. Converta fotos, prints e imagens em texto editavel com exportacao simples.",
    keywords: [
      "transcrever imagem em texto",
      "transcrever foto em texto",
      "converter imagem em texto",
      "ocr online",
    ],
    index: false,
    h1: "Transcrever imagem em texto para editar, resumir e reaproveitar",
    eyebrow: "Pagina de suporte para buscas com foco em transcricao e reaproveitamento",
    lead:
      "Aqui a promessa e pegar um conteudo visual e transformar em texto utilizavel para docs, resumos, briefings e revisoes, com uma rota simples no navegador.",
    heroBullets: ["Foco em transcricao", "Boa para reaproveitamento", "Saida pronta para editar"],
    workspaceFirst: true,
    defaultMode: "simple",
    primaryNav: false,
    relatedSlugs: ["imagem-para-texto", "imagem-para-word", "extrair-texto-de-imagem", "ocr-em-portugues"],
    contextualLinks: [
      {
        href: "/imagem-para-texto",
        label: "Imagem para texto",
        body: "Volte para a rota principal quando a transcricao for so uma das necessidades e voce quiser concentrar o sinal no fluxo mais amplo do produto.",
      },
      {
        href: "/imagem-para-word",
        label: "Imagem para Word",
        body: "Use esta pagina quando o texto transcrito precisar seguir para Word, Docs ou revisao com estrutura melhor antes da edicao final.",
      },
      {
        href: "/extrair-texto-de-imagem",
        label: "Extrair texto de imagem",
        body: "Abra esta variacao quando o objetivo for so tirar o texto da imagem sem enfatizar tanto a etapa posterior de resumo e reaproveitamento.",
      },
      {
        href: "/ocr-em-portugues",
        label: "OCR em portugues",
        body: "Siga por esta pagina quando a transcricao envolver conteudo em pt-BR e voce quiser revisar melhor acentos e termos locais.",
      },
    ],
    useCasesHeading: "Transcrever imagem em texto faz sentido quando a proxima etapa e trabalhar o conteudo.",
    useCasesLead:
      "Essa pagina fala com quem nao quer apenas ler a imagem, mas converter o que esta nela em materia-prima para edicao, sintese e distribuicao.",
    useCases: [
      {
        title: "Slides e treinamentos",
        body: "Boa opcao para transformar telas, laminas e materiais visuais em um texto que pode ser resumido ou reorganizado.",
      },
      {
        title: "Infograficos e cards",
        body: "Ajuda a puxar o conteudo verbal de pecas visuais antes de reaproveitar em artigo, pauta ou script.",
      },
      {
        title: "Briefings e referencias",
        body: "Serve para trazer para o texto trechos de referencias visuais e materiais de benchmarking usados pela equipe.",
      },
      {
        title: "Anotacoes de trabalho",
        body: "Funciona para qualquer imagem que precise virar uma base editavel em docs, notas e sistemas internos.",
      },
    ],
    stepsHeading: "Transcrever a imagem e seguir para a proxima tarefa.",
    stepsLead:
      "A ideia desta pagina e reduzir o tempo entre enxergar o conteudo na imagem e comecar a editar o texto fora dela.",
    steps: [
      {
        title: "Suba a referencia visual",
        body: "Envie a foto, print ou imagem que contem o texto que sera transcrito para o seu fluxo.",
      },
      {
        title: "Escolha o grau de fidelidade",
        body: `${SIMPLE_MODE_LABEL} prioriza velocidade. ${FORMATTED_MODE_LABEL} ajuda quando a ordem e a separacao dos blocos importam mais.`,
      },
      {
        title: "Edite e reaproveite",
        body: "Copie o resultado para resumo, documento, briefing ou qualquer processo que dependa de texto editavel.",
      },
    ],
    faqHeading: "FAQ sobre transcrever imagem em texto.",
    faq: [
      {
        question: "Transcrever imagem em texto e diferente de extrair texto de imagem?",
        answer:
          "A intencao e muito proxima, mas aqui o foco esta no reaproveitamento do resultado em documentos, resumos e fluxos de edicao.",
      },
      {
        question: "Essa transcricao funciona para screenshot e foto?",
        answer:
          "Sim. O Scanlume atende ambos os casos, desde que o texto esteja visivel e com contraste razoavel.",
      },
      {
        question: "Posso usar o resultado para escrever um resumo ou pauta?",
        answer:
          "Sim. Essa e uma das principais utilidades: transformar a imagem em uma base textual que pode ser resumida, editada ou redistribuida.",
      },
      {
        question: "Vale usar o modo formatado para transcricao?",
        answer:
          "Vale especialmente quando a imagem tem titulos, subtitulos e varios paragrafos, porque a estrutura ajuda na etapa de edicao.",
      },
    ],
  },
} as const satisfies Record<string, ToolPageEntry>;

export type ToolPageSlug = keyof typeof toolPageContent;

export const TOOL_PAGE_SLUGS = Object.keys(toolPageContent) as ToolPageSlug[];

export const NAV_LINKS = TOOL_PAGE_SLUGS.filter((slug) => toolPageContent[slug].primaryNav).map(
  (slug) => ({ href: `/${slug}`, label: toolPageContent[slug].label }),
);

export const SEO_LINKS = TOOL_PAGE_SLUGS.map((slug) => ({
  href: `/${slug}`,
  label: toolPageContent[slug].label,
}));

export const INDEXABLE_TOOL_PAGE_SLUGS = TOOL_PAGE_SLUGS.filter((slug) => {
  const entry = toolPageContent[slug] as ToolPageEntry;

  return entry.index !== false;
});

export const INDEXABLE_SEO_LINKS = INDEXABLE_TOOL_PAGE_SLUGS.map((slug) => ({
  href: `/${slug}`,
  label: toolPageContent[slug].label,
}));

const HOME_FLOW_SLUGS = [
  "imagem-para-texto",
  "imagem-para-word",
  "ocr-online",
  "jpg-para-texto",
  "png-para-texto",
  "ocr-em-portugues",
  "extrair-texto-de-print",
  "extrair-texto-de-foto",
  "imagem-para-texto-no-celular",
] as const satisfies readonly ToolPageSlug[];

export const HOME_FLOW_LINKS = HOME_FLOW_SLUGS.map((slug) => ({
  href: `/${slug}`,
  label: toolPageContent[slug].label,
}));

const FOOTER_SUPPORT_SLUGS = [
  "extrair-texto-de-foto",
  "extrair-texto-de-print",
  "imagem-para-texto-no-celular",
] as const satisfies readonly ToolPageSlug[];

export const FOOTER_SUPPORT_LINKS = FOOTER_SUPPORT_SLUGS.map((slug) => ({
  href: `/${slug}`,
  label: toolPageContent[slug].label,
}));

export const TOOL_SUPPORT_LINKS = TOOL_PAGE_SLUGS.filter((slug) => !toolPageContent[slug].primaryNav).map(
  (slug) => ({ href: `/${slug}`, label: toolPageContent[slug].label }),
);

export function getCanonicalUrl(pathname: string) {
  return pathname === "/" ? `${SITE_URL}/` : `${SITE_URL}${pathname}`;
}

export function buildMetadata({
  title,
  description,
  keywords = DEFAULT_KEYWORDS,
  pathname,
  index = true,
}: {
  title: string;
  description: string;
  keywords?: readonly string[];
  pathname: string;
  index?: boolean;
}): Metadata {
  const canonical = getCanonicalUrl(pathname);

  return {
    title,
    description,
    keywords: [...keywords],
    applicationName: SITE_NAME,
    category: "OCR",
    alternates: {
      canonical,
      languages: {
        "pt-BR": canonical,
        "x-default": canonical,
      },
    },
    robots: {
      index,
      follow: true,
      googleBot: {
        index,
        follow: true,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      type: "website",
      locale: "pt_BR",
      images: [
        {
          url: SOCIAL_IMAGE_PATH,
          alt: SOCIAL_IMAGE_ALT,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [SOCIAL_IMAGE_PATH],
    },
  };
}
