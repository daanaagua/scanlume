import { EVIDENCE_PATH, SITE_NAME, SITE_URL } from "@/lib/site";

export const BLOG_EDITORIAL_NAME = "Equipe editorial Scanlume";
export const BLOG_REVIEW_NAME = "Revisao editorial Scanlume";
export const BLOG_METHOD_URL = `${SITE_URL}${EVIDENCE_PATH}`;

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
  lastReviewedAt: string;
  readTime: string;
  coverImage: string;
  coverAlt: string;
  coverCaption: string;
  summary: readonly string[];
  editorialMethod: readonly string[];
  sections: readonly BlogSection[];
  faq: readonly BlogFaq[];
  relatedPosts: readonly string[];
  relatedLinks: readonly BlogLink[];
};

export const BLOG_PATH = "/blog";

export const blogPosts = {
  "perfis-e-links-publicos-database-optimization-tool": {
    slug: "perfis-e-links-publicos-database-optimization-tool",
    category: "Atualizacao editorial",
    title: "Links publicos que apontam para Database Optimization Tool",
    description:
      "Inventario publico de perfis, diretorios e paginas externas rechecadas onde Database Optimization Tool ja aparece com link publico e crawlavel.",
    excerpt:
      "Esta pagina registra os perfis publicos mais estaveis que hoje apontam para Database Optimization Tool e foi publicada para facilitar recrawl, verificacao manual e atualizacao editorial.",
    heroLead:
      "Nem toda referencia externa continua publica, limpa e rastreavel ao longo do tempo. Por isso abrimos este inventario dentro do blog: para reunir as paginas externas rechecadas nesta rodada e deixar um ponto unico, claro e crawlavel para quem precisa validar onde o projeto ja esta publicado.",
    publishedAt: "2026-05-31",
    lastReviewedAt: "2026-05-31",
    readTime: "5 min",
    coverImage: "/blog/ocr-portuguese-benchmark-board.png",
    coverAlt: "Quadro editorial usado para revisar links publicos e inventarios de paginas externas",
    coverCaption:
      "Em vez de depender de memoria ou planilhas soltas, esta rodada reuniu apenas paginas externas rechecadas e ainda publicas em um inventario editorial simples.",
    summary: [
      "O artigo concentra apenas paginas externas rechecadas na rodada atual e que continuam publicas sem login obrigatorio.",
      "A prioridade foi manter `anchors` simples para perfis, bio pages e listings onde `Database Optimization Tool` ja aparece com URL publica.",
      "Paginas com bloqueio pesado, 404, output fraco ou dominio duplicado ficaram fora desta lista para nao diluir o recrawl.",
    ],
    editorialMethod: [
      "Cada link abaixo foi revisto manualmente antes da publicacao desta pagina, com foco em disponibilidade publica e presenca visivel do projeto atual.",
      "A lista evita repetir o mesmo dominio varias vezes e prioriza paginas owner-controlled, perfis publicos e listagens que continuam carregando sem depender de sessao ativa.",
      "Quando uma pagina caiu, ficou atras de bloqueio forte ou deixou de mostrar o projeto com clareza, ela foi removida deste inventario em vez de ser mantida por inercia.",
    ],
    sections: [
      {
        heading: "Por que este inventario foi para o blog",
        paragraphs: [
          "A ideia aqui nao e inflar navegacao nem repetir um diretorio de backlinks dentro do dominio principal. O objetivo e mais especifico: deixar uma pagina editorial, simples e publica que concentre referencias externas rechecadas para facilitar revisita humana e recrawl.",
          "Como varias dessas paginas mudam ao longo do tempo, um post do blog funciona melhor do que depender apenas de memoria operacional. Ele preserva contexto, data da revisao e uma lista curta das URLs que continuam de pe nesta rodada.",
        ],
      },
      {
        heading: "O que entrou nesta rodada",
        paragraphs: [
          "Entraram apenas paginas publicas com bom sinal de controle editorial ou de perfil publico: agenda, bio page, landing de perfil, review page e author page. Em todos os casos, a meta foi manter links simples, com URL absoluta e sem depender de interacao para aparecer.",
          "Quando havia varios enderecos do mesmo dominio, mantivemos so a melhor pagina publica daquela familia. Isso evita repeticao desnecessaria e ajuda a deixar o inventario mais enxuto para leitura e rastreamento.",
        ],
        bullets: [
          "Cal.com",
          "Calendly",
          "Magic.ly",
          "ProvenExpert",
          "Fazier",
          "Pinterest",
          "Tools AI App",
        ],
      },
      {
        heading: "O que ficou de fora",
        paragraphs: [
          "Nem todo link historico vale a pena reaparecer aqui. Paginas com 404, respostas inconsistentes, bloqueio agressivo por rate limit ou publicacao fraca demais ficaram fora desta lista mesmo que tenham sido tocadas em rodadas anteriores.",
          "Isso vale tambem para paginas onde o dominio se repetia com pouco ganho adicional. Em vez de empilhar variacoes do mesmo site, mantivemos apenas a rota publica que hoje comunica melhor a existencia do projeto atual.",
        ],
      },
      {
        heading: "Como usar esta pagina",
        paragraphs: [
          "Os cards abaixo funcionam como um inventario publico de referencia. Cada um abre uma pagina externa que hoje exibe `Database Optimization Tool` de forma publica, seja em bio, descricao, website field ou author page.",
          "Se algum desses destinos mudar, o ideal e atualizar esta pagina junto com a revisao da propria publicacao externa. Assim o blog continua servindo como trilha editorial das referencias que ainda valem a pena recrawlear.",
        ],
      },
    ],
    faq: [
      {
        question: "Por que nem todo backlink historico entrou neste artigo?",
        answer:
          "Porque a meta desta pagina nao e volume bruto. Ela existe para listar apenas paginas publicas, rechecadas e estaveis nesta rodada. Links com 404, bloqueio forte, dominio repetido ou presenca fraca do projeto ficaram de fora.",
      },
      {
        question: "Esses links substituem a pagina Featured On?",
        answer:
          "Nao. A ideia e complementar. `Featured On` continua sendo a pagina mais direta de listagem, enquanto este post registra a rodada editorial em formato de artigo para facilitar contexto, recrawl e manutencao futura.",
      },
    ],
    relatedPosts: ["quando-usar-ocr-no-navegador-vs-api", "pdf-layout-reconstruction-update"],
    relatedLinks: [
      {
        href: "https://cal.com/danagua",
        label: "Cal.com",
        description: "Perfil publico com quatro links oficiais, incluindo Database Optimization Tool.",
      },
      {
        href: "https://calendly.com/pony17620",
        label: "Calendly",
        description: "Pagina publica de agendamento cujo texto descritivo ja inclui o projeto atual.",
      },
      {
        href: "https://magic.ly/danagua",
        label: "Magic.ly",
        description: "Link page publica com entrada dedicada para databaseoptimizationtool.com.",
      },
      {
        href: "https://www.provenexpert.com/pt-pt/danagua/",
        label: "ProvenExpert",
        description: "Perfil publico com website atual e bio revisada para o projeto novo.",
      },
      {
        href: "https://fazier.com/launches/www.myreadingspeed.top",
        label: "Fazier launch",
        description: "Launch page publica onde a rodada mais recente passou a citar Database Optimization Tool.",
      },
      {
        href: "https://www.pinterest.com/pony17620/",
        label: "Pinterest",
        description: "Perfil publico com website field apontando para databaseoptimizationtool.com.",
      },
      {
        href: "https://toolsaiapp.com/author/pony17620/",
        label: "Tools AI App",
        description: "Author page publica com bio e website atualizados para o projeto.",
      },
    ],
  },
  "pdf-layout-reconstruction-update": {
    slug: "pdf-layout-reconstruction-update",
    category: "Atualizacao",
    title: "PDF OCR atualizado: layout reconstruido e limites corrigidos",
    description:
      "Nova fase do PDF OCR do Scanlume: texto reconstruido em regioes do PDF, diferenca entre PDF pesquisavel e reorganizado, e limites corrigidos.",
    excerpt:
      "O PDF OCR do Scanlume agora trata regioes em imagem como areas de layout, em vez de apenas anexar uma camada de texto solta em cima do documento.",
    heroLead:
      "Esta atualizacao fecha tres lacunas importantes do fluxo PDF: melhor reconstrução visual dentro das regioes em imagem, uma separacao mais clara entre PDF pesquisavel e PDF reorganizado, e contadores de uso que finalmente refletem o consumo real de usuarios autenticados.",
    publishedAt: "2026-04-03",
    lastReviewedAt: "2026-04-03",
    readTime: "7 min",
    coverImage: "/blog/ocr-export-workflow.png",
    coverAlt: "Fluxo atualizado de OCR para PDF com reconstrução de layout",
    coverCaption:
      "O novo fluxo de PDF parte do OCR por regiao e tenta devolver texto reconstruido dentro do espaco original, em vez de depender apenas de uma camada escondida de busca.",
    summary: [
      "`PDF pesquisavel` agora passa a reconstruir texto OCR dentro da propria regiao do PDF, e nao apenas anexar uma camada escondida pouco alinhada.",
      "`PDF reorganizado` deixa de parecer um dump linear e passa a preservar agrupamentos por regiao e pagina com foco em leitura.",
      "Usuarios logados passam a ver limites e creditos atualizados de forma consistente depois de cada OCR bem-sucedido.",
    ],
    editorialMethod: [
      "Tomamos como base os PDFs mistos usados nas validacoes do produto e os sintomas reportados pelos primeiros testes manuais.",
      "A atualizacao foi definida comparando o comportamento de `PDF pesquisavel` e `PDF reorganizado` em relacao ao mesmo arquivo base.",
      "A explicacao desta pagina foi escrita para ajudar usuarios a entender o que mudou na pratica, nao apenas os detalhes internos da implementacao.",
    ],
    sections: [
      {
        heading: "O que mudou no PDF pesquisavel",
        paragraphs: [
          "Antes, o PDF pesquisavel podia parecer apenas um arquivo com texto escondido anexado sobre a pagina. Isso ajudava na busca, mas nao explicava bem onde o OCR realmente encaixava dentro da imagem original.",
          "Agora o fluxo trata cada regiao em imagem como uma area de layout. O OCR estruturado gera blocos formatados e o export tenta reencaixar esse texto dentro do mesmo espaco visual, mantendo o documento mais proximo do PDF original.",
        ],
      },
      {
        heading: "Como `PDF reorganizado` ficou diferente",
        paragraphs: [
          "O objetivo do PDF reorganizado continua sendo leitura melhor, mas ele deixa de ser um simples texto corrido. Em vez disso, passa a preservar agrupamentos por pagina e regiao, reconstruindo blocos com mais contexto visual.",
          "Na pratica, isso significa que o arquivo continua mais limpo do que o original, mas sem perder tanto a nocao de onde cada bloco fazia parte do layout do PDF base.",
        ],
      },
      {
        heading: "Por que PDF continua no modo Texto formatado",
        paragraphs: [
          "PDF exige muito mais do que extrair texto puro. Mesmo quando ha texto nativo, o produto ainda precisa decidir quais paginas usar direto, quais regioes enviar para OCR e como devolver isso em um formato utilizavel depois.",
          "Por isso PDFs ficam restritos a `Texto formatado`. `OCR simples` continua reservado para imagens, onde a proposta e velocidade e texto bruto, sem reconstruir estrutura e layout.",
        ],
        bullets: [
          "OCR simples: imagens apenas.",
          "Texto formatado: imagens e PDF.",
          "PDF pesquisavel e PDF reorganizado saem do fluxo PDF formatado.",
        ],
      },
      {
        heading: "O que corrigimos nos limites para usuarios logados",
        paragraphs: [
          "Outra mudanca importante foi na experiencia de conta. O workspace e os componentes de conta agora voltam a buscar os limites depois de um OCR bem-sucedido, reduzindo a chance de mostrar creditos antigos na tela apos o consumo real ter mudado.",
          "Isso vale especialmente para quem testa repetidamente OCR em imagem e PDF no mesmo dia e precisa confiar nos contadores para entender quanto ainda resta no plano atual.",
        ],
      },
    ],
    faq: [
      {
        question: "O PDF pesquisavel agora fica identico ao original?",
        answer:
          "Nao de forma absoluta. A nova versao tenta reconstruir melhor o texto dentro das regioes em imagem, mas ainda trabalha com heuristicas e prioriza caber no espaco original antes de buscar fidelidade tipografica perfeita.",
      },
      {
        question: "Quando usar PDF reorganizado em vez de PDF pesquisavel?",
        answer:
          "Use PDF pesquisavel quando quiser manter a pagina mais proxima do original. Use PDF reorganizado quando a prioridade for leitura e reaproveitamento, mesmo que o arquivo final fique mais editorial do que o PDF base.",
      },
    ],
    relatedPosts: [
      "ocr-imagem-vs-pdf-diferencas-praticas",
      "exportar-ocr-word-markdown-boas-praticas",
      "comparativo-jpg-png-print-ocr",
    ],
    relatedLinks: [
      {
        href: "/pdf-para-texto",
        label: "Abrir PDF para texto",
        description: "Testar o fluxo de PDF com texto nativo, paginas escaneadas e downloads em PDF pesquisavel ou reorganizado.",
      },
      {
        href: "/imagem-para-texto",
        label: "Voltar para a ferramenta principal",
        description: "Comparar o fluxo PDF com o fluxo geral de OCR para imagens no mesmo workspace.",
      },
    ],
  },
  "ocr-simples-vs-texto-formatado": {
    slug: "ocr-simples-vs-texto-formatado",
    category: "Guia de decisao",
    title: "OCR simples ou texto formatado: quando usar cada modo?",
    description:
      "Guia direto para decidir entre OCR simples e texto formatado no Scanlume, com foco em velocidade, estrutura, revisao e destino final do texto.",
    excerpt:
      "Nem todo arquivo pede o mesmo tipo de OCR. Este guia mostra quando vale priorizar rapidez e quando vale preservar blocos, titulos e ordem de leitura.",
    heroLead:
      "A escolha entre OCR simples e texto formatado muda o retrabalho depois da extracao. Em muitos casos, o modo certo economiza mais tempo do que qualquer limpeza feita depois.",
    publishedAt: "2026-04-08",
    lastReviewedAt: "2026-04-08",
    readTime: "6 min",
    coverImage: "/blog/ocr-export-workflow.png",
    coverAlt: "Comparacao entre OCR simples e texto formatado no fluxo do Scanlume",
    coverCaption:
      "Os dois modos atendem intencoes diferentes: um prioriza velocidade e texto bruto, o outro tenta devolver estrutura suficiente para uso imediato em docs, wikis e revisao.",
    summary: [
      "OCR simples combina melhor com captura rapida, busca interna e casos em que o usuario aceita limpar o texto depois.",
      "Texto formatado vale mais quando titulos, listas, paragrafos e ordem de leitura importam para o proximo passo.",
      "A melhor escolha depende menos do arquivo e mais do destino final: busca, resumo, Word, Markdown, wiki ou proposta.",
    ],
    editorialMethod: [
      "Partimos dos dois modos que o produto oferece hoje para imagem e dos usos mais comuns vistos em screenshots, cards e materiais editoriais.",
      "A comparacao desta pagina privilegia impacto pratico no fluxo de trabalho: revisao, exportacao e reaproveitamento do texto.",
      "Os exemplos foram escritos sem expor detalhes internos do stack e focam no que o usuario percebe no resultado final.",
    ],
    sections: [
      {
        heading: "Resposta curta: velocidade ou estrutura",
        paragraphs: [
          "OCR simples foi pensado para quem quer capturar texto rapido e seguir adiante. Ele faz mais sentido quando a equipe so precisa localizar frases, colar o resultado em um chat ou montar um rascunho sem se preocupar tanto com hierarquia.",
          "Texto formatado entra quando o arquivo precisa sair com mais nocao de titulos, paragrafos, listas e blocos. Nesses casos, o ganho nao esta so na leitura inicial, mas no tempo poupado antes de mandar o texto para Word, Markdown ou documentacao interna.",
        ],
      },
      {
        heading: "Quando OCR simples costuma vencer",
        paragraphs: [
          "Prints de tela, cards, anuncios, avisos e recortes curtos entram bem no modo simples quando a meta e copiar o conteudo principal e seguir para busca, triagem ou resumo. O beneficio aqui e velocidade com menos expectativa de acabamento.",
          "Ele tambem funciona bem quando o usuario ainda nao sabe se vai aproveitar o texto por completo. Primeiro extrai, depois decide se vale reorganizar em outro formato.",
        ],
        bullets: [
          "Captura rapida de frases, headlines e blocos curtos.",
          "Busca interna, resumo, triagem e comparacao manual.",
          "Casos em que o texto final pode ser limpo depois sem problema.",
        ],
      },
      {
        heading: "Quando texto formatado poupa mais retrabalho",
        paragraphs: [
          "Texto formatado faz mais diferenca quando a imagem tem secao, subtitulo, lista, card ou blocos que precisam continuar separados no resultado final. Sem isso, o time perde tempo remontando a estrutura manualmente no proximo editor.",
          "Se o destino do OCR for um documento compartilhado, uma wiki, uma base de prompts ou um material que precisa circular entre pessoas, preservar leitura e blocos costuma valer mais do que economizar alguns segundos no processamento inicial.",
        ],
        metrics: [
          { label: "OCR simples", value: "Texto bruto", note: "Melhor para captura rapida e leitura direta sem muita estrutura." },
          { label: "Texto formatado", value: "Blocos + ordem", note: "Melhor para Word, Markdown, docs e conteudo com hierarquia." },
          { label: "Melhor pergunta", value: "Para onde vai depois?", note: "Destino final ajuda mais na decisao do que o nome do arquivo." },
        ],
      },
      {
        heading: "Regra pratica antes do upload",
        paragraphs: [
          "Se a pergunta for 'preciso do texto agora?', comece por OCR simples. Se a pergunta for 'preciso usar isso num documento sem desmontar tudo?', comece por texto formatado.",
          "Uma regra segura para times pequenos e escolher o modo pelo proximo sistema. Busca e chat pedem simplicidade; documentos, conhecimento interno e materiais de apoio pedem estrutura.",
        ],
      },
    ],
    faq: [
      {
        question: "Vale usar texto formatado em toda imagem?",
        answer:
          "Nem sempre. Se o usuario so quer capturar poucas frases ou verificar um trecho rapidamente, o modo simples costuma ser suficiente e mais direto.",
      },
      {
        question: "OCR simples perde completamente a estrutura?",
        answer:
          "Ele pode manter parte da leitura principal, mas nao e o modo pensado para devolver hierarquia confiavel entre titulos, listas e blocos separados.",
      },
    ],
    relatedPosts: ["exportar-ocr-word-markdown-boas-praticas", "comparativo-jpg-png-print-ocr"],
    relatedLinks: [
      {
        href: "/imagem-para-texto",
        label: "Abrir imagem para texto",
        description: "Comparar os dois modos no fluxo principal com JPG, PNG e screenshot.",
      },
      {
        href: "/imagem-para-word",
        label: "Abrir imagem para Word",
        description: "Testar o caso em que preservar blocos e leitura importa antes de colar em um documento.",
      },
    ],
  },
  "ocr-imagem-vs-pdf-diferencas-praticas": {
    slug: "ocr-imagem-vs-pdf-diferencas-praticas",
    category: "Guia de decisao",
    title: "OCR em imagem ou PDF: o que muda na pratica?",
    description:
      "Entenda a diferenca pratica entre OCR em imagem e OCR em PDF no Scanlume, incluindo velocidade, estrutura, camada de texto e tipos de exportacao.",
    excerpt:
      "Imagem e PDF parecem a mesma tarefa so de longe. Na pratica, cada um pede um fluxo diferente e gera expectativas diferentes para revisao, layout e download.",
    heroLead:
      "O erro mais comum e tratar PDF e imagem como se fossem o mesmo input. PDF pode ter texto nativo, pagina escaneada ou mistura dos dois. Isso muda bastante a forma como o resultado precisa ser montado.",
    publishedAt: "2026-04-08",
    lastReviewedAt: "2026-04-08",
    readTime: "7 min",
    coverImage: "/blog/ocr-format-comparison.png",
    coverAlt: "Diferencas praticas entre OCR em imagem e OCR em PDF",
    coverCaption:
      "Imagem tende a ser um caso mais direto. PDF pode combinar texto nativo, regioes escaneadas e layout multipagina, exigindo uma estrategia diferente para leitura e exportacao.",
    summary: [
      "Imagem costuma ser caminho mais rapido para extrair texto puro ou estruturado quando a origem e um JPG, PNG ou screenshot.",
      "PDF exige leitura mais cuidadosa porque pode trazer texto nativo, pagina escaneada ou layout misto na mesma entrada.",
      "No fluxo PDF, o valor maior nao esta so em extrair texto, mas em decidir como devolver busca, leitura e download em formatos reutilizaveis.",
    ],
    editorialMethod: [
      "Usamos como referencia o comportamento atual do produto para imagens e PDFs, incluindo casos com texto nativo e paginas escaneadas.",
      "A comparacao foi escrita para orientar escolha de rota e expectativa de saida, nao para discutir detalhes internos de implementacao.",
      "Priorizamos diferencas observaveis por quem faz upload, revisa o resultado e precisa baixar ou reaproveitar o arquivo depois.",
    ],
    sections: [
      {
        heading: "Imagem: fluxo mais direto para texto",
        paragraphs: [
          "Quando a entrada e JPG, PNG ou screenshot, o trabalho principal e ler o que esta visivel e devolver texto com mais ou menos estrutura, dependendo do modo escolhido. Em geral, a decisao mais importante aqui e entre rapidez e organizacao.",
          "Isso faz do OCR em imagem um caminho bom para cards, telas, avisos, anuncios, dashboards e recortes unicos. O usuario costuma pensar mais no texto final do que no arquivo em si.",
        ],
      },
      {
        heading: "PDF: fluxo mais variavel e mais editorial",
        paragraphs: [
          "PDF muda o jogo porque nem toda pagina precisa da mesma coisa. Algumas ja trazem texto utilizavel, outras sao apenas imagem, e muitas combinam os dois cenarios no mesmo arquivo.",
          "Por isso o fluxo PDF tende a priorizar leitura estruturada e saidas que ajudem depois, como PDF pesquisavel, PDF reorganizado, HTML ou Markdown. O desafio nao e apenas extrair, mas devolver algo que faca sentido em multiplas paginas.",
        ],
        bullets: [
          "Imagem: mais direta para OCR simples ou formatado.",
          "PDF: mais forte quando leitura e exportacao contam tanto quanto extracao.",
          "PDF pode alternar entre texto existente e OCR na mesma entrada.",
        ],
      },
      {
        heading: "Onde a diferenca aparece para o usuario",
        paragraphs: [
          "Na imagem, a pergunta frequente e 'o texto saiu limpo o bastante?'. No PDF, a pergunta muda para 'o arquivo final continua pesquisavel, legivel e reaproveitavel?'. Isso explica por que o fluxo PDF costuma parecer mais rico e menos imediato.",
          "Tambem por isso o PDF fica no caminho estruturado. Em documentos multipagina, preservar a ideia de regiao, pagina e leitura importa mais do que correr para despejar texto bruto.",
        ],
        metrics: [
          { label: "Imagem", value: "Rapidez", note: "Boa para captura unica, screenshot e arquivos visuais menores." },
          { label: "PDF", value: "Contexto", note: "Boa para documentos com varias paginas, texto nativo e downloads reutilizaveis." },
          { label: "Decisao", value: "Tipo de saida", note: "O melhor fluxo depende do que voce quer fazer depois do OCR." },
        ],
      },
      {
        heading: "Regra pratica para escolher rota",
        paragraphs: [
          "Se o arquivo nasceu como tela, foto ou imagem isolada, comeca pela rota de imagem. Se o material ja e um documento com paginas, texto interno ou necessidade de download preservado, use a rota de PDF.",
          "A vantagem dessa separacao e evitar expectativa errada. Quem entra no fluxo certo tende a revisar menos, entender melhor os limites e escolher uma saida mais alinhada ao trabalho real.",
        ],
      },
    ],
    faq: [
      {
        question: "Por que PDF nao fica no modo OCR simples?",
        answer:
          "Porque PDF costuma exigir mais do que texto cru. O fluxo precisa considerar pagina, leitura, possivel texto existente e formatos de download mais completos.",
      },
      {
        question: "Se o PDF ja tem texto, ainda vale usar a rota PDF?",
        answer:
          "Sim. Quando o documento mistura texto nativo e partes em imagem, a rota PDF ajuda a lidar com os dois lados sem obrigar o usuario a tratar tudo manualmente.",
      },
    ],
    relatedPosts: ["pdf-layout-reconstruction-update", "ocr-simples-vs-texto-formatado"],
    relatedLinks: [
      {
        href: "/pdf-para-texto",
        label: "Abrir PDF para texto",
        description: "Testar PDF pesquisavel, PDF reorganizado e exportacoes pensadas para documentos multipagina.",
      },
      {
        href: "/imagem-para-texto",
        label: "Abrir imagem para texto",
        description: "Comparar o fluxo de imagem com JPG, PNG e screenshot num caso mais direto.",
      },
    ],
  },
  "ocr-portugues-imagem-para-texto-teste-real": {
    slug: "ocr-portugues-imagem-para-texto-teste-real",
    category: "Teste real",
    title: "OCR em portugues: teste real de imagem para texto",
    description:
      "Um benchmark simples com portugues + ingles, CTAs, badges e UI real para mostrar o que um OCR precisa preservar antes de virar texto utilizavel.",
    excerpt:
      "Usamos uma imagem de interface com microcopy, botoes e titulos grandes para entender onde o OCR entrega valor rapido e onde ainda exige revisao humana.",
    heroLead:
      "Para um produto como o Scanlume, nao basta ler frases grandes. O benchmark abaixo foi montado para avaliar o comportamento em uma tela com heading principal, CTA, chips e blocos de apoio em portugues e ingles.",
    publishedAt: "2026-03-15",
    lastReviewedAt: "2026-03-17",
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
    editorialMethod: [
      "Usamos uma imagem de interface com heading, CTA, chips e texto auxiliar em PT + EN.",
      "Avaliamos leitura principal, ordem dos blocos e recuperacao de labels curtas antes de olhar velocidade.",
      "As conclusoes desta pagina priorizam reaproveitamento pratico em Word, docs e Markdown, nao promessas genericas.",
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
        heading: "Como transformar esse teste em um fluxo util no mundo real",
        paragraphs: [
          "Em vez de prometer uma taxa magica de acerto, vale mostrar que tipo de imagem o produto le bem, que revisao humana ainda faz sentido e qual formato de saida combina com cada tarefa.",
          "Esse tipo de benchmark cria prova visual. Ele ajuda o usuario a entender limites, contexto e recomendacoes praticas antes de subir um arquivo proprio para OCR.",
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
    relatedPosts: [
      "ocr-simples-vs-texto-formatado",
      "comparativo-jpg-png-print-ocr",
      "exportar-ocr-word-markdown-boas-praticas",
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
    lastReviewedAt: "2026-03-17",
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
    editorialMethod: [
      "Comparamos tres origens comuns: foto em JPG, exportacao em PNG e screenshot nativo.",
      "Observamos contraste, nitidez, letras pequenas e quantidade de limpeza manual apos a extracao.",
      "As recomendacoes foram escritas para orientar a escolha do arquivo antes do upload, nao apenas depois do OCR.",
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
    relatedPosts: [
      "ocr-simples-vs-texto-formatado",
      "ocr-portugues-imagem-para-texto-teste-real",
      "exportar-ocr-word-markdown-boas-praticas",
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
    lastReviewedAt: "2026-03-17",
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
    editorialMethod: [
      "Partimos do texto extraido e avaliamos quanto contexto se preserva em Word, Markdown e HTML.",
      "O criterio principal foi reduzir retrabalho humano em titulacao, listas e ordem de leitura.",
      "As conclusoes assumem uso real em documentos internos, editores ricos e fluxos de conhecimento.",
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
          "Se o time usa Notion, GitHub, Obsidian, editores MD ou automacoes, manter titulos e listas em Markdown costuma ser mais valioso do que colar tudo em texto cru.",
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
          "Na maioria dos fluxos sim, porque titulos, listas e blocos ficam explicitos em texto puro. Para IA, isso costuma ser mais util do que um documento rico fechado.",
      },
    ],
    relatedPosts: [
      "quando-usar-ocr-no-navegador-vs-api",
      "ocr-portugues-imagem-para-texto-teste-real",
      "comparativo-jpg-png-print-ocr",
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
  "quando-usar-ocr-no-navegador-vs-api": {
    slug: "quando-usar-ocr-no-navegador-vs-api",
    category: "Integracao",
    title: "Quando usar OCR no navegador e quando migrar para API",
    description:
      "Guia pratico para decidir entre usar o OCR do Scanlume no navegador ou integrar a API, com foco em volume, revisao humana e automacoes.",
    excerpt:
      "Nem todo time precisa ir para API no primeiro dia. Este guia mostra quando o navegador basta e quais sinais indicam que a automacao ja vai poupar mais tempo.",
    heroLead:
      "Browser e API nao disputam o mesmo papel. Um ajuda na revisao manual e na validacao de uso. O outro entra quando o fluxo precisa repetir sem depender de upload humano toda vez.",
    publishedAt: "2026-04-08",
    lastReviewedAt: "2026-04-08",
    readTime: "6 min",
    coverImage: "/blog/ocr-portuguese-benchmark-board.png",
    coverAlt: "Guia para escolher entre OCR no navegador e API",
    coverCaption:
      "A escolha certa depende mais do processo do time do que do tamanho da empresa: validacao manual, volume de arquivos, frequencia e necessidade de integrar o OCR a outros sistemas.",
    summary: [
      "Navegador faz mais sentido para upload manual, revisao visual, comparacao de modos e uso ocasional.",
      "API vale quando OCR vira etapa repetida de produto, operacao, automacao interna ou pipeline de conteudo.",
      "Muita equipe comeca no navegador para validar qualidade e so depois move o fluxo estavel para API.",
    ],
    editorialMethod: [
      "Tomamos como base a diferenca atual entre uso web e uso por API, incluindo separacao de credits e necessidade de chave.",
      "O objetivo desta pagina e orientar decisao operacional: quando seguir manualmente e quando automatizar com seguranca.",
      "Os exemplos foram escritos para times pequenos e medios que alternam entre validacao visual e integracao recorrente.",
    ],
    sections: [
      {
        heading: "Quando o navegador ja resolve muito bem",
        paragraphs: [
          "Se a equipe ainda esta entendendo o tipo de arquivo que chega, comparando modos ou revisando o texto antes de reutilizar, o navegador costuma ser o melhor primeiro passo. Ele facilita upload manual, copia do resultado e validacao visual sem setup tecnico.",
          "Esse caminho tambem ajuda quando o volume e baixo ou irregular. Em vez de automatizar cedo demais, o time aprende primeiro onde o OCR entrega valor e onde a revisao humana continua importante.",
        ],
      },
      {
        heading: "Quando a API comeca a fazer mais sentido",
        paragraphs: [
          "A API entra quando OCR deixa de ser um experimento e vira etapa repetida de um processo maior. Isso inclui filas internas, capturas de sistemas, onboarding de documentos, pipelines de conteudo ou integracoes com ferramentas da propria equipe.",
          "Nesse ponto, faz diferenca usar chave propria, montar chamada programatica e tratar o OCR como parte da infraestrutura. A vantagem nao e apenas volume, mas previsibilidade e menos trabalho manual por arquivo.",
        ],
        bullets: [
          "Use navegador para validacao, revisao e uso ocasional.",
          "Use API para repeticao, escala e integracao com outros sistemas.",
          "Separe credits de web e API conforme o tipo de uso do time.",
        ],
      },
      {
        heading: "Sinais de que chegou hora de migrar",
        paragraphs: [
          "Alguns sinais aparecem rapido: mesma tarefa repetida toda semana, arquivos chegando por outro sistema, necessidade de distribuir resultado para mais de um destino e tempo gasto demais em upload manual. Quando isso vira rotina, a API passa a economizar mais do que custa configurar.",
          "Outra pista forte e quando o time ja sabe qual formato de entrada funciona melhor e qual saida quer consumir. Quando a duvida principal deixa de ser qualidade e passa a ser eficiencia operacional, a API vira passo natural.",
        ],
        metrics: [
          { label: "Navegador", value: "Validar e revisar", note: "Melhor para uso humano direto e volume menor." },
          { label: "API", value: "Automatizar", note: "Melhor para processos recorrentes e integracao com app ou backoffice." },
          { label: "Ponto de virada", value: "Repeticao", note: "Se o mesmo OCR acontece sempre, automatizar tende a compensar." },
        ],
      },
      {
        heading: "Fluxo hibrido costuma ser o mais inteligente",
        paragraphs: [
          "Nao existe obrigacao de escolher um lado para sempre. Um padrao comum e validar arquivos e modos no navegador, documentar o que funciona melhor e depois levar o caso estavel para API.",
          "Esse caminho reduz risco. O time aprende com exemplos reais, alinha expectativa de qualidade e so automatiza quando o processo ja esta suficientemente claro.",
        ],
      },
    ],
    faq: [
      {
        question: "Preciso abandonar o navegador depois de integrar a API?",
        answer:
          "Nao. Muitas equipes mantem o navegador para testes pontuais, revisao visual e comparacao rapida mesmo depois de automatizar o fluxo principal.",
      },
      {
        question: "API e web usam o mesmo saldo?",
        answer:
          "Nao. O uso por API fica separado do uso web, o que ajuda a controlar melhor custo e operacao de cada frente.",
      },
    ],
    relatedPosts: ["exportar-ocr-word-markdown-boas-praticas", "ocr-simples-vs-texto-formatado"],
    relatedLinks: [
      {
        href: "/api",
        label: "Abrir pagina da API",
        description: "Ver exemplos de chamada, API key e notas de entrada antes de integrar.",
      },
      {
        href: "/ocr-online",
        label: "Abrir OCR online",
        description: "Comparar com o fluxo no navegador quando o uso ainda e manual ou exploratorio.",
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
    dateModified: post.lastReviewedAt,
    inLanguage: "pt-BR",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": postUrl,
    },
    author: {
      "@type": "Organization",
      name: BLOG_EDITORIAL_NAME,
      url: BLOG_METHOD_URL,
    },
    editor: BLOG_REVIEW_NAME,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/icon.png`,
      },
    },
    isPartOf: {
      "@type": "Blog",
      name: "Blog Scanlume",
      url: `${SITE_URL}${BLOG_PATH}`,
    },
    citation: BLOG_METHOD_URL,
    about: [
      {
        "@type": "Thing",
        name: "OCR em pt-BR",
      },
      {
        "@type": "Thing",
        name: "Metodo editorial e revisao humana",
      },
    ],
  };
}

export function getBlogFaqJsonLd(post: BlogPost) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: post.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
