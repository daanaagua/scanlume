import { SITE_NAME, SITE_URL } from "@/lib/site";

type BlogMetric = {
  label: string;
  value: string;
  note: string;
};

type BlogSection = {
  heading: string;
  intro?: string;
  paragraphs: readonly string[];
  bullets?: readonly string[];
  metrics?: readonly BlogMetric[];
};

type BlogFaq = {
  question: string;
  answer: string;
};

type BlogLink = {
  href: string;
  label: string;
  description: string;
};

export type BlogPost = {
  slug: string;
  category: string;
  title: string;
  description: string;
  excerpt: string;
  heroLead: string;
  publishedAt: string;
  readTime: string;
  coverImage: string;
  coverAlt: string;
  coverCaption: string;
  summary: readonly string[];
  sections: readonly BlogSection[];
  faq: readonly BlogFaq[];
  relatedLinks: readonly BlogLink[];
};

export const BLOG_PATH = "/blog";

export const blogPosts = {
  "ocr-portugues-imagem-para-texto-teste-real": {
    slug: "ocr-portugues-imagem-para-texto-teste-real",
    category: "Teste real",
    title: "OCR em portugues para imagem em texto: teste real com layout misto",
    description:
      "Um benchmark simples com portugues + ingles, CTAs, badges e UI real para mostrar o que um OCR precisa preservar antes de virar texto utilizavel.",
    excerpt:
      "Usamos uma imagem de interface com microcopy, botoes e titulos grandes para entender onde o OCR entrega valor rapido e onde ainda exige revisao humana.",
    heroLead:
      "Para um produto como o Scanlume, nao basta ler frases grandes. O benchmark abaixo foi montado para avaliar o comportamento em uma tela com heading principal, CTA, chips e blocos de apoio em portugues e ingles.",
    publishedAt: "2026-03-15",
    readTime: "6 min",
    coverImage: "/blog/ocr-portuguese-benchmark-board.png",
    coverAlt: "Painel do teste OCR com benchmark misto em portugues e ingles",
    coverCaption:
      "A imagem mistura titulo grande, labels curtas, botoes e blocos auxiliares. E exatamente o tipo de entrada que costuma aparecer em screenshots de marketing, produto ou operacao.",
    summary: [
      "Headings e CTAs grandes costumam sair primeiro; labels curtas e chips exigem revisao mais cuidadosa.",
      "Mistura de portugues com ingles nao inviabiliza o OCR, mas aumenta a importancia de preservar contexto e ordem de leitura.",
      "Quando o objetivo e colar no Word, Notion ou Markdown, formato e hierarquia contam tanto quanto taxa bruta de acerto.",
    ],
    sections: [
      {
        heading: "O que este teste tenta provar",
        intro:
          "Em muitos fluxos reais o usuario nao envia um documento escaneado perfeito. Ele manda um print de landing page, um dashboard, uma arte de campanha ou uma tela de app.",
        paragraphs: [
          "Por isso o benchmark usa uma composicao com titulo principal, subtitulos, botoes coloridos, pequenos badges e texto secundario. O OCR precisa identificar quais blocos valem mais para o usuario final.",
          "No caso de imagem para texto, acertar o heading principal ajuda, mas ainda nao resolve o problema sozinho. O resultado so fica realmente util quando labels curtas, calls to action e informacoes auxiliares entram na ordem certa.",
        ],
        metrics: [
          { label: "Arquivo base", value: "PNG 1400x980", note: "Screenshot ampla com fundo claro e varios blocos de UI." },
          { label: "Idiomas", value: "PT + EN", note: "Mistura intencional para simular materiais de produto e growth." },
          { label: "Blocos visuais", value: "4 zonas", note: "Hero principal, chips, cards laterais e barra inferior." },
        ],
      },
      {
        heading: "Onde o OCR tende a acertar rapido",
        paragraphs: [
          "Titulos grandes como 'Convert screenshot em texto editavel' e botoes com contraste forte geralmente sao os trechos mais seguros. Eles ocupam mais area, usam peso tipografico maior e aparecem em regioes visuais dominantes.",
          "Outro ponto favoravel e a repeticao de padroes. Quando a interface usa cards, labels e alinhamento consistente, o motor consegue inferir melhor a ordem de leitura mesmo quando ha mistura de elementos decorativos.",
        ],
        bullets: [
          "Heading principal e subtitulo imediato.",
          "Botoes grandes como 'Baixar resultado' e 'Try sample'.",
          "Textos corridos em cards laterais com corpo maior.",
        ],
      },
      {
        heading: "Onde vale revisar antes de publicar o texto",
        paragraphs: [
          "Labels muito curtas, chips pequenos e microcopy perto das bordas continuam sendo a parte mais sensivel. Em interfaces de marketing isso inclui tags como 'today', indicadores de plano ou pequenas observacoes de suporte.",
          "Misturar portugues e ingles tambem pede revisao editorial. O OCR pode reconhecer as palavras, mas o time ainda precisa decidir se o destino final sera um texto totalmente em portugues, um rascunho tecnico ou uma exportacao fiel ao original.",
        ],
        bullets: [
          "Chips pequenos com pouco padding.",
          "Notas auxiliares abaixo dos cards principais.",
          "Palavras curtas em ingles que podem parecer icones ou decoracao.",
        ],
      },
      {
        heading: "Como transformar esse teste em conteudo util para SEO",
        paragraphs: [
          "Para ranking, o ideal nao e prometer uma taxa magica de acerto. Melhor mostrar o tipo de imagem que o produto le bem, o tipo de revisao humana que ainda faz sentido e o formato de saida mais pratico para cada caso.",
          "Esse tipo de post ajuda porque cria prova visual. Ele mostra que a pagina nao foi escrita so para a keyword 'imagem para texto': ela foi escrita a partir de um benchmark real, com contexto, limites e recomendacoes praticas.",
        ],
      },
    ],
    faq: [
      {
        question: "Esse benchmark serve para fotos tiradas no celular?",
        answer:
          "Serve como referencia de hierarquia e legibilidade, mas fotos reais costumam adicionar perspectiva, sombra e ruido. Para camera, o ideal e recortar e aumentar contraste antes do OCR.",
      },
      {
        question: "Vale mais usar OCR simples ou formatado nesse tipo de imagem?",
        answer:
          "Quando o objetivo e so capturar frases centrais, o modo simples resolve rapido. Quando o usuario quer reaproveitar blocos em Word, docs ou Markdown, o modo formatado costuma poupar mais limpeza manual.",
      },
    ],
    relatedLinks: [
      {
        href: "/imagem-para-texto",
        label: "Testar imagem para texto",
        description: "Abrir o fluxo principal para validar OCR em pt-BR com seu proprio arquivo.",
      },
      {
        href: "/ocr-em-portugues",
        label: "Ver pagina OCR em portugues",
        description: "Conectar o benchmark com a pagina focada em buscas sobre OCR em portugues.",
      },
    ],
  },
  "comparativo-jpg-png-print-ocr": {
    slug: "comparativo-jpg-png-print-ocr",
    category: "Comparativo",
    title: "JPG, PNG ou screenshot: qual formato gera OCR mais limpo?",
    description:
      "Um comparativo pratico entre JPG, PNG e prints nativos para entender quando o OCR sai pronto para uso e quando a compressao adiciona retrabalho.",
    excerpt:
      "Nem toda imagem da certo pelo mesmo motivo. Neste guia, mostramos quando JPG basta, quando PNG e superior e por que o screenshot nativo costuma vencer em UI e landing pages.",
    heroLead:
      "Formato de arquivo muda o trabalho depois do OCR. O mesmo texto pode sair quase pronto em um print nativo e exigir limpeza pesada quando passa por camera, compressao ou recorte mal feito.",
    publishedAt: "2026-03-15",
    readTime: "7 min",
    coverImage: "/blog/ocr-format-comparison.png",
    coverAlt: "Quadro comparativo entre JPG, PNG e screenshot para OCR",
    coverCaption:
      "O comparativo destaca tres cenarios comuns: imagem comprimida, PNG exportado e print nativo. Cada um muda contraste, nitidez e quantidade de limpeza depois da extracao.",
    summary: [
      "Para interfaces, dashboards e landing pages, screenshot nativo costuma gerar a melhor leitura.",
      "PNG preserva bordas e texto pequeno melhor do que JPG quando a origem ja e digital.",
      "JPG ainda funciona bem para fotos e documentos capturados por camera, desde que haja corte e contraste razoaveis.",
    ],
    sections: [
      {
        heading: "Por que o formato muda tanto o resultado",
        paragraphs: [
          "OCR depende de contraste, borda limpa e separacao visual entre texto e fundo. Quando a imagem nasce digitalmente, formatos menos agressivos na compressao tendem a manter letras pequenas mais inteiras.",
          "Quando a origem e camera, a historia muda. A imagem ja chega com ruido, distorcao e variacao de luz; nesse caso o formato importa, mas o preparo do arquivo importa ainda mais.",
        ],
        metrics: [
          { label: "Melhor para UI", value: "Screenshot", note: "Print nativo preserva nitidez e espacamento de interface." },
          { label: "Melhor para exportar", value: "PNG", note: "Boa escolha para recortes, cards e textos pequenos." },
          { label: "Melhor para camera", value: "JPG", note: "Aceitavel quando a captura original ja vem do celular." },
        ],
      },
      {
        heading: "Quando JPG ainda faz sentido",
        paragraphs: [
          "JPG e o formato que aparece com mais frequencia em fotos de recibo, quadro, menu, folder ou aviso preso na parede. Nesses casos ele continua util porque o gargalo real esta na captura, nao apenas no container do arquivo.",
          "Se o JPG vier bem iluminado, cortado e sem excesso de compressao, o OCR recupera bem titulos e frases centrais. O problema aparece em letras pequenas, cantos inclinados e fundos com textura.",
        ],
        bullets: [
          "Use JPG quando a origem for foto do celular ou camera.",
          "Evite reenviar o mesmo arquivo varias vezes em apps que recomprimem a imagem.",
          "Recorte margens vazias antes de rodar o OCR.",
        ],
      },
      {
        heading: "Quando PNG e screenshot levam vantagem",
        paragraphs: [
          "Se o texto veio de tela, card, dashboard, criativo ou landing page, PNG e print nativo tendem a manter contornos mais limpos. Isso ajuda muito em labels pequenos, numeros, chips e elementos de interface.",
          "Para times de produto, growth e marketing, esse detalhe vale ouro: menos erro em microcopy significa menos revisao antes de levar o texto para um documento, checklist ou backlog.",
        ],
        bullets: [
          "Priorize print nativo para telas e interfaces.",
          "Salve em PNG quando houver texto pequeno e contraste alto.",
          "Se for compartilhar no WhatsApp ou em algum chat, tente enviar como arquivo para evitar compressao.",
        ],
      },
      {
        heading: "Regra pratica para escolher o formato antes do OCR",
        paragraphs: [
          "Pergunte primeiro de onde a imagem veio. Se nasceu digital, mantenha digital: screenshot ou PNG. Se veio da camera, aceite JPG, mas prepare melhor o enquadramento.",
          "Esse tipo de orientacao ajuda o usuario antes mesmo do upload. E um detalhe pequeno de UX que reduz frustracao e melhora a percepcao de qualidade do OCR.",
        ],
      },
    ],
    faq: [
      {
        question: "Transformar PNG em JPG antes do OCR ajuda?",
        answer:
          "Em geral nao. Se a origem ja e digital, converter para JPG costuma perder detalhe fino e adicionar compressao sem ganhar nada em leitura.",
      },
      {
        question: "Screenshot de celular tambem entra como o melhor caso?",
        answer:
          "Na maioria dos casos sim. Desde que o print seja nativo e nao uma foto da tela, ele preserva bem letras pequenas, alinhamento e contraste.",
      },
    ],
    relatedLinks: [
      {
        href: "/jpg-para-texto",
        label: "Abrir JPG para texto",
        description: "Validar o fluxo pensado para fotos, posters e arquivos enviados pelo celular.",
      },
      {
        href: "/png-para-texto",
        label: "Abrir PNG para texto",
        description: "Testar o cenario mais favoravel para screenshots, cards e interfaces digitais.",
      },
    ],
  },
  "exportar-ocr-word-markdown-boas-praticas": {
    slug: "exportar-ocr-word-markdown-boas-praticas",
    category: "Boas praticas",
    title: "Word ou Markdown: como exportar OCR sem perder contexto",
    description:
      "Boas praticas para levar o resultado do OCR para Word, Markdown e fluxos internos sem destruir titulos, listas e ordem de leitura.",
    excerpt:
      "Nem sempre o melhor destino do OCR e um TXT cru. Este guia mostra quando usar Word, quando usar Markdown e como montar um fluxo simples que poupa retrabalho.",
    heroLead:
      "Depois que a imagem vira texto, comeca a segunda metade do trabalho: organizar o resultado para o proximo sistema. A escolha entre Word e Markdown define quanto contexto voce preserva para equipe, IA e documentacao.",
    publishedAt: "2026-03-15",
    readTime: "6 min",
    coverImage: "/blog/ocr-export-workflow.png",
    coverAlt: "Fluxo de exportacao OCR para Word, Markdown e HTML",
    coverCaption:
      "O fluxo recomendado parte da imagem, passa por uma leitura simples ou formatada e termina em um formato que combine com o uso final: Word para edicao, Markdown para estrutura, HTML para copiar com estilo.",
    summary: [
      "Word e melhor quando o destino final envolve revisao manual, comentarios e compartilhamento com areas nao tecnicas.",
      "Markdown ajuda quando o texto vai para docs internos, IA, bases de conhecimento ou versionamento.",
      "HTML pode ser a ponte mais rapida para colar um resultado com hierarquia visual em Word ou editores ricos.",
    ],
    sections: [
      {
        heading: "O erro mais comum depois do OCR",
        paragraphs: [
          "Muita gente mede o OCR so pela extracao inicial e esquece o destino. Quando o texto cai em um formato errado, a equipe perde tempo reconstruindo titulos, listas, bullets e blocos de apoio que ja estavam na imagem original.",
          "Por isso o fluxo ideal nao e apenas 'extrair texto'. O fluxo ideal e 'extrair e entregar pronto para a proxima ferramenta'.",
        ],
      },
      {
        heading: "Quando escolher Word",
        paragraphs: [
          "Word faz mais sentido quando ha revisao humana intensa, comentarios, aprovacao interna e necessidade de repaginar o conteudo. Relatorios, briefings, propostas e resumos executivos entram bem aqui.",
          "Nesses casos, vale usar a saida mais estruturada possivel. Mesmo sem gerar DOCX nativo, exportar em HTML ou copiar um texto bem hierarquizado ja reduz bastante o retrabalho dentro do Word.",
        ],
        bullets: [
          "Use Word para materiais que vao circular entre areas operacionais ou executivas.",
          "Prefira saida formatada quando houver titulos, subtitulos e paragrafos longos.",
          "Cole o HTML quando quiser preservar melhor a leitura inicial.",
        ],
      },
      {
        heading: "Quando escolher Markdown",
        paragraphs: [
          "Markdown brilha em fluxos de documentacao, bases internas, prompts, resumos para IA e ferramentas que aceitam texto estruturado sem peso visual extra. Ele e leve, facil de versionar e simples de revisar em diff.",
          "Se o time usa Notion, GitHub, Obsidian, editores MD ou automacoes, manter headings e listas em Markdown costuma ser mais valioso do que colar tudo em texto cru.",
        ],
        metrics: [
          { label: "Word", value: "Edicao final", note: "Melhor para comentarios, revisao e distribuicao interna." },
          { label: "Markdown", value: "Estrutura + IA", note: "Bom para bases de conhecimento e prompts reutilizaveis." },
          { label: "HTML", value: "Ponte rapida", note: "Ajuda a manter hierarquia ao colar em editores ricos." },
        ],
      },
      {
        heading: "Fluxo pratico recomendado para times pequenos",
        paragraphs: [
          "Use OCR simples quando a equipe so precisa capturar texto bruto para procurar algo, resumir ou colar em um chat. Suba para a saida formatada quando o proximo passo for documento, wiki, proposta ou material de marketing.",
          "A melhor rotina e: subir imagem, revisar titulos e listas, exportar no formato do uso final e guardar o original. Isso cria um processo repetivel e evita refazer limpeza toda vez.",
        ],
        bullets: [
          "Texto cru para captura rapida e busca interna.",
          "Markdown para documentacao e prompts.",
          "HTML ou Word para apresentacao e revisao final.",
        ],
      },
    ],
    faq: [
      {
        question: "Vale a pena exportar OCR em TXT?",
        answer:
          "Sim, quando o objetivo e velocidade, busca rapida ou uma limpeza posterior manual. So nao e o melhor caminho quando a estrutura visual importa para o proximo passo.",
      },
      {
        question: "Markdown ajuda mais do que Word para IA?",
        answer:
          "Na maioria dos fluxos sim, porque headings, listas e blocos ficam explicitos em texto puro. Para IA, isso costuma ser mais util do que um documento rico fechado.",
      },
    ],
    relatedLinks: [
      {
        href: "/imagem-para-word",
        label: "Abrir imagem para Word",
        description: "Testar o modo formatado pensando em colar o resultado num documento final.",
      },
      {
        href: "/imagem-para-texto",
        label: "Voltar para a ferramenta",
        description: "Executar o OCR e comparar o comportamento em TXT, Markdown e HTML.",
      },
    ],
  },
} as const satisfies Record<string, BlogPost>;

export type BlogSlug = keyof typeof blogPosts;

export const BLOG_POSTS = Object.values(blogPosts) as BlogPost[];

export function getBlogPost(slug: string) {
  return blogPosts[slug as BlogSlug];
}

export function getBlogPostUrl(slug: string) {
  return `${SITE_URL}${BLOG_PATH}/${slug}`;
}

export function getBlogBreadcrumbJsonLd(post: BlogPost) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: SITE_NAME,
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: `${SITE_URL}${BLOG_PATH}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: getBlogPostUrl(post.slug),
      },
    ],
  };
}

export function getBlogPostingJsonLd(post: BlogPost) {
  const postUrl = getBlogPostUrl(post.slug);

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    image: `${SITE_URL}${post.coverImage}`,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    inLanguage: "pt-BR",
    mainEntityOfPage: postUrl,
    author: {
      "@type": "Organization",
      name: SITE_NAME,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/icon.png`,
      },
    },
  };
}
