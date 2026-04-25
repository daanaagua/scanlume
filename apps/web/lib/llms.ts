import { BLOG_PATH, BLOG_POSTS } from "@/lib/blog";
import { EVIDENCE_PATH, SITE_NAME, SITE_URL, toolPageContent, type ToolPageSlug } from "@/lib/site";

type LlmsEntry = {
  title: string;
  path: string;
  description: string;
};

type LlmsSection = {
  heading: string;
  entries: LlmsEntry[];
};

function absoluteUrl(path: string) {
  return path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}`;
}

function renderSection(section: LlmsSection) {
  const lines = [`## ${section.heading}`, ""];

  for (const entry of section.entries) {
    lines.push(`- [${entry.title}](${absoluteUrl(entry.path)}): ${entry.description}`);
  }

  lines.push("");

  return lines;
}

function buildToolEntry(slug: ToolPageSlug, description: string): LlmsEntry {
  return {
    title: toolPageContent[slug].label,
    path: `/${slug}`,
    description,
  };
}

const compactSections: LlmsSection[] = [
  {
    heading: "Docs",
    entries: [
      {
        title: "Homepage",
        path: "/",
        description:
          "Product overview for Scanlume, an OCR tool in pt-BR for screenshots, JPG, PNG and PDF with simple and formatted output modes.",
      },
      buildToolEntry(
        "imagem-para-texto",
        "Primary image-to-text page covering JPG, PNG and screenshot OCR with TXT, Markdown and HTML export.",
      ),
      buildToolEntry(
        "pdf-para-texto",
        "Dedicated PDF OCR page covering text-layer PDFs, scanned PDFs and mixed layouts with PDF pesquisavel, PDF reorganizado, HTML and Markdown output.",
      ),
      buildToolEntry(
        "imagem-para-word",
        "Structured OCR route for users who want cleaner output before pasting into Word or Google Docs.",
      ),
      buildToolEntry(
        "ocr-online",
        "General OCR hub explaining the browser workflow, supported files and the difference between simple and formatted extraction.",
      ),
      buildToolEntry(
        "ocr-em-portugues",
        "pt-BR focused OCR page for Portuguese text recognition, accents and local usage scenarios.",
      ),
    ],
  },
  {
    heading: "Scenarios",
    entries: [
      buildToolEntry(
        "jpg-para-texto",
        "OCR landing page for JPG photos, posters and camera captures that need quick text extraction.",
      ),
      buildToolEntry(
        "png-para-texto",
        "OCR page for PNG screenshots, interfaces and landing page captures where small text should stay cleaner.",
      ),
      buildToolEntry(
        "extrair-texto-de-foto",
        "Scenario page for extracting text from phone photos, printed materials and quick real-world captures.",
      ),
      buildToolEntry(
        "extrair-texto-de-print",
        "Scenario page for extracting text from app screens, dashboards and web page screenshots.",
      ),
      buildToolEntry(
        "imagem-para-texto-no-celular",
        "Mobile-first OCR page for users who upload photos or screenshots directly from a phone browser.",
      ),
    ],
  },
  {
    heading: "Commercial",
    entries: [
      {
        title: "Precos",
        path: "/precos",
        description:
          "Pricing page for Scanlume web plans and API credit packs, with billing rules and plan comparison.",
      },
      {
        title: "API do Scanlume",
        path: "/api",
        description:
          "Developer page for the Scanlume OCR API with API key flow, base64 data URL input and integration examples.",
      },
    ],
  },
  {
    heading: "Blog",
    entries: [
      {
        title: "Blog",
        path: BLOG_PATH,
        description:
          "Editorial hub for OCR benchmarks, format comparisons and export workflows written for real pt-BR use cases.",
      },
      ...BLOG_POSTS.map((post) => ({
        title: post.title,
        path: `${BLOG_PATH}/${post.slug}`,
        description: post.description,
      })),
    ],
  },
  {
    heading: "About",
    entries: [
      {
        title: "Sobre",
        path: "/sobre",
        description:
          "Explains product scope, quality review method, supported OCR scenarios and where human review is still recommended.",
      },
      {
        title: "Metodo e evidencia",
        path: EVIDENCE_PATH,
        description:
          "Explains how Scanlume chooses examples, reviews blog posts, marks update dates and keeps method notes visible for readers and AI systems.",
      },
      {
        title: "Contato",
        path: "/contato",
        description:
          "Contact page for OCR feedback, bug reports, support requests, product suggestions and partnerships.",
      },
    ],
  },
  {
    heading: "Legal",
    entries: [
      {
        title: "Privacidade",
        path: "/privacidade",
        description:
          "Privacy page describing image processing, browser identifiers, rate-limit logs and the current no-training stance for uploads.",
      },
      {
        title: "Termos",
        path: "/termos",
        description:
          "Terms of use covering anonymous limits, fair use, supported formats and anti-abuse controls for the OCR service.",
      },
    ],
  },
];

const fullSections: LlmsSection[] = [
  {
    heading: "Products",
    entries: [
      {
        title: "Homepage",
        path: "/",
        description:
          "Homepage for Scanlume. Summarizes the browser-based OCR workflow, the simple versus formatted modes, export formats and the main supporting routes for JPG, PNG, screenshots, PDF and pt-BR OCR.",
      },
      buildToolEntry(
        "imagem-para-texto",
        "Main product page for the broad image-to-text intent. Explains how to upload JPG, PNG and screenshots, when to choose simple OCR or formatted OCR and how to export the result to TXT, Markdown or HTML.",
      ),
      buildToolEntry(
        "imagem-para-word",
        "Product page for users who care more about preserving reading order and structure before moving OCR output into Word, Google Docs or editorial review workflows.",
      ),
      buildToolEntry(
        "ocr-online",
        "General OCR route for users looking for an online OCR tool in Portuguese. Covers supported formats, output modes and the core browser workflow without app installation.",
      ),
      buildToolEntry(
        "ocr-em-portugues",
        "Dedicated Portuguese OCR page that positions Scanlume for pt-BR language support, accents and day-to-day local text recognition scenarios.",
      ),
    ],
  },
  {
    heading: "Scenarios",
    entries: [
      buildToolEntry(
        "jpg-para-texto",
        "Scenario page for OCR on JPG files, especially phone photos, posters and compressed images where text still needs to be extracted quickly for editing or reuse.",
      ),
      buildToolEntry(
        "pdf-para-texto",
        "Scenario page for OCR on PDFs with text, scanned pages or mixed layouts where the user wants text exports plus PDF pesquisavel and PDF reorganizado outputs.",
      ),
      buildToolEntry(
        "png-para-texto",
        "Scenario page for PNG OCR, usually the best fit for screenshots, interface captures, landing pages and digital assets with small text and stronger edges.",
      ),
      buildToolEntry(
        "extrair-texto-de-foto",
        "Support page for extracting text from photos of printed materials, boards, notices and folders, with guidance on when OCR quality depends on capture conditions.",
      ),
      buildToolEntry(
        "extrair-texto-de-print",
        "Support page for extracting text from screenshots, interface recortes and dashboard captures where the source is already digital and often easier for OCR.",
      ),
      buildToolEntry(
        "imagem-para-texto-no-celular",
        "Mobile-oriented page for people who start the OCR workflow on a phone and want to upload, run OCR and copy text without installing a dedicated app.",
      ),
      buildToolEntry(
        "transcrever-imagem-em-texto",
        "Support page for users phrasing the task as transcribing an image into text rather than extracting text, while still targeting the same OCR workflow.",
      ),
      buildToolEntry(
        "extrair-texto-de-imagem",
        "Support page for the broader extract-text-from-image wording, useful for internal linking and alternative query phrasing around OCR tasks.",
      ),
    ],
  },
  {
    heading: "Commercial",
    entries: [
      {
        title: "Precos",
        path: "/precos",
        description:
          "Pricing page for choosing Scanlume web plans or API credit packs. Explains credits, billing rules, web usage, API usage and when each path fits.",
      },
      {
        title: "API do Scanlume",
        path: "/api",
        description:
          "Developer page for integrating the Scanlume OCR API with bearer API keys, JSON payloads, base64 data URL images and code examples.",
      },
    ],
  },
  {
    heading: "Resources",
    entries: [
      {
        title: "Blog",
        path: BLOG_PATH,
        description:
          "Blog hub for Scanlume's editorial content. Collects OCR benchmarks, file format comparisons and export guidance that explain where OCR performs well and where manual review is still useful.",
      },
      ...BLOG_POSTS.map((post) => ({
        title: post.title,
        path: `${BLOG_PATH}/${post.slug}`,
        description: `${post.description} ${post.excerpt}`,
      })),
    ],
  },
  {
    heading: "About",
    entries: [
      {
        title: "Sobre",
        path: "/sobre",
        description:
          "About page describing who the product is for, how Scanlume evaluates OCR quality, what the service does well and where the team prefers honest operational limits over vague marketing claims.",
      },
      {
        title: "Metodo e evidencia",
        path: EVIDENCE_PATH,
        description:
          "Method page that documents example selection, review cadence, update labeling and the difference between tested results and unsupported claims.",
      },
      {
        title: "Contato",
        path: "/contato",
        description:
          "Contact page for support, bug reports, OCR quality issues, format suggestions, partnerships and product feedback. Describes expected response time and the support flow.",
      },
    ],
  },
  {
    heading: "Legal",
    entries: [
      {
        title: "Privacidade",
        path: "/privacidade",
        description:
          "Privacy page describing how uploads are processed, what minimal operational data may be stored for abuse prevention and budgeting and the current statement that uploads are not used to train proprietary models.",
      },
      {
        title: "Termos",
        path: "/termos",
        description:
          "Terms page describing anonymous usage limits, batch and file constraints, anti-abuse controls and how product limits and export options may evolve over time.",
      },
    ],
  },
];

function renderLlmsFile(sections: LlmsSection[]) {
  const lines = [
    `# ${SITE_NAME}`,
    "",
    "> Scanlume is a pt-BR OCR web app for turning screenshots, JPG, PNG and PDF into editable text with simple or formatted output.",
    "",
  ];

  for (const section of sections) {
    lines.push(...renderSection(section));
  }

  lines.push("## Key Facts", "");
  lines.push("- Primary market: pt-BR users who need OCR in a browser without installing an app.");
  lines.push("- Core inputs: screenshots, JPG, PNG, PDF and phone photos with readable text.");
  lines.push("- Core outputs: TXT, Markdown, HTML, PDF pesquisavel and PDF reorganizado.");
  lines.push("- Main workflow: choose simple OCR for raw image text or formatted OCR for cleaner reading order and PDF handling.");
  lines.push("- Industry: OCR software / document digitization / browser productivity.");
  lines.push("");
  lines.push("## Contact", "");
  lines.push(`- Website: ${SITE_URL}`);
  lines.push("- Support email: suporte@scanlume.com");
  lines.push(`- Contact page: ${absoluteUrl("/contato")}`);

  return `${lines.join("\n")}\n`;
}

export function getLlmsTxt() {
  return renderLlmsFile(compactSections);
}

export function getLlmsFullTxt() {
  return renderLlmsFile(fullSections);
}
