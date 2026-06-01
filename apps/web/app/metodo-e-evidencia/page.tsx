import Link from "next/link";

import { JsonLd } from "@/components/json-ld";
import { buildMetadata, EVIDENCE_PATH, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata = buildMetadata({
  title: "Metodo e evidencia | Scanlume",
  description:
    "Como o Scanlume escolhe exemplos, revisa conteudo, marca atualizacoes e sinaliza onde a revisao humana continua importante.",
  pathname: EVIDENCE_PATH,
});

export default function EvidencePage() {
  const faq = [
    {
      question: "O que o Scanlume considera um OCR util?",
      answer:
        "Um OCR util nao e so o que recupera palavras. Ele precisa manter leitura principal, reduzir retrabalho e continuar aproveitavel em TXT, Markdown, HTML ou PDF.",
    },
    {
      question: "Como voces lidam com incerteza editorial?",
      answer:
        "Quando um fluxo ainda depende de revisao humana, o texto diz isso de forma explicita. O objetivo e evitar claim inflado e facilitar leitura critica.",
    },
  ];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          name: "Metodo e evidencia",
          description:
            "Pagina curta que explica como o Scanlume valida exemplos, atualiza conteudo e evita claims sem suporte nos guias e rotas de produto.",
          url: `${SITE_URL}${EVIDENCE_PATH}`,
          inLanguage: "pt-BR",
          mainEntity: {
            "@type": "Organization",
            name: SITE_NAME,
            url: SITE_URL,
          },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: SITE_URL,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Metodo e evidencia",
              item: `${SITE_URL}${EVIDENCE_PATH}`,
            },
          ],
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faq.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.answer,
            },
          })),
        }}
      />

      <section className="tool-first-home">
        <div className="container">
          <div className="tool-first-intro">
            <p className="eyebrow scanlume-signal-label">Metodo e evidencia</p>
            <h1>Qualidade baseada em fatos reais</h1>
            <p>
              Explicamos de forma direta o que validamos, o que revisamos e onde a revisao humana continua sendo fundamental.
            </p>
            <div className="tool-first-pills" aria-label="Recursos principais">
              <span>Testes reais</span>
              <span>Limites honestos</span>
              <span>Sinais claros</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section-band muted-band">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">Sinais editoriais</p>
            <h2>Quatro pilares de transparencia no nosso conteudo.</h2>
          </div>

          <div className="check-grid">
            <article className="check-card">
              <strong>Exemplo identificado</strong>
              <p>Cada artigo tenta deixar claro qual imagem, PDF ou fluxo foi usado como base do teste.</p>
            </article>
            <article className="check-card">
              <strong>Autor e revisao</strong>
              <p>O blog mostra autor editorial, revisao e data de ultima checagem para reduzir ambiguidade.</p>
            </article>
            <article className="check-card">
              <strong>Atualizacao explicita</strong>
              <p>Quando o produto muda de comportamento, o texto deve dizer o que mudou e quando foi revisado.</p>
            </article>
            <article className="check-card">
              <strong>Limite honesto</strong>
              <p>Se o resultado ainda depende de revisao humana, isso entra no texto sem promessa inflada.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section-band">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">Como validamos</p>
            <h2>O processo de validacao do produto.</h2>
          </div>

          <div className="timeline-grid">
            <article className="timeline-step">
              <span>01</span>
              <strong>Escolha de exemplo</strong>
              <p>Preferimos casos que o usuario realmente encontra: screenshot, JPG, PNG ou PDF com estrutura real.</p>
            </article>
            <article className="timeline-step">
              <span>02</span>
              <strong>Leitura e revisao</strong>
              <p>Observamos hierarquia, ordem de leitura, labels curtas e o quanto ainda faz sentido revisar manualmente.</p>
            </article>
            <article className="timeline-step">
              <span>03</span>
              <strong>Atualizacao do texto</strong>
              <p>Quando um fluxo muda, a pagina de blog ou apoio recebe a nota de atualizacao e o sinal de revisao.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section-band muted-band">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">FAQ</p>
            <h2>Perguntas curtas sobre metodo editorial e evidencia.</h2>
          </div>
          <div className="faq-list">
            {faq.map((item) => (
              <article key={item.question} className="faq-item">
                <strong>{item.question}</strong>
                <p>{item.answer}</p>
              </article>
            ))}
          </div>

          <div className="hero-actions">
            <Link href="/" className="solid-button large-button">
              Testar OCR agora
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
