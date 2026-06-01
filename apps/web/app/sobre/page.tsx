import Link from "next/link";

import { buildMetadata } from "@/lib/site";

export const metadata = buildMetadata({
  title: "Sobre o Scanlume",
  description:
    "Conheca o Scanlume: OCR simples e formatado para o mercado pt-BR, com foco em velocidade, clareza e reaproveitamento do texto.",
  pathname: "/sobre",
});

export default function AboutPage() {
  return (
    <>
      <section className="tool-first-home">
        <div className="container">
          <div className="tool-first-intro">
            <p className="eyebrow scanlume-signal-label">Sobre o Scanlume</p>
            <h1>OCR simples e objetivo</h1>
            <p>
              Criado para facilitar a extracao de texto em pt-BR com um fluxo focado no usuario e livre de friccoes.
            </p>
            <div className="tool-first-pills" aria-label="Recursos principais">
              <span>Sem login</span>
              <span>Modos simplificado e formatado</span>
              <span>Foco em screenshots e PDF</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section-band muted-band">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">Quem responde pelo produto</p>
            <h2>Escopo claro e compromisso com a transparencia.</h2>
            <p>
              O Scanlume foi desenhado para resolver tarefas cotidianas de OCR de forma direta, sem etapas desnecessarias e sem promessas exageradas.
            </p>
          </div>

          <div className="check-grid">
            <article className="check-card">
              <strong>Mercado definido</strong>
              <p>O produto foi desenhado primeiro para uso em pt-BR, com foco em screenshots, JPG, PNG e reaproveitamento rapido do texto.</p>
            </article>
            <article className="check-card">
              <strong>Contato visivel</strong>
              <p>Paginas de contato, privacidade e termos ficam abertas para que o usuario saiba como falar com o time e quais regras se aplicam.</p>
            </article>
            <article className="check-card">
              <strong>Escopo honesto</strong>
              <p>O site nao promete OCR perfeito em qualquer arquivo. Cenarios com ruido, sombra, perspectiva ou microcopy continuam exigindo revisao.</p>
            </article>
            <article className="check-card">
              <strong>Produto acessivel</strong>
              <p>Voce pode testar no navegador sem instalar app nem entrar em um fluxo pesado antes de validar se o resultado serve para o seu caso.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section-band">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">Como avaliamos qualidade</p>
            <h2>Qualidade baseada em testes e revisao manual.</h2>
            <p>
              Antes de sugerir copy de produto, avaliamos o comportamento real do OCR sob diferentes condicoes e formatos.
            </p>
          </div>

          <div className="timeline-grid">
            <article className="timeline-step">
              <span>01</span>
              <strong>Testamos tipos diferentes de imagem</strong>
              <p>Screenshot, layout com microcopy, JPG de camera e PNG exportado entram em comparacoes separadas para evitar promessa generica.</p>
            </article>
            <article className="timeline-step">
              <span>02</span>
              <strong>Olhamos mais que acerto bruto</strong>
              <p>Hierarquia, ordem de leitura, labels curtas e clareza para reutilizacao importam tanto quanto capturar palavras isoladas.</p>
            </article>
            <article className="timeline-step">
              <span>03</span>
              <strong>Registramos limites</strong>
              <p>Quando um caso pede revisao humana, a orientacao entra na pagina e no blog em vez de ser escondida atras de claims vagos.</p>
            </article>
            <article className="timeline-step">
              <span>04</span>
              <strong>Ligamos conteudo ao uso final</strong>
              <p>As explicacoes de exportacao e formato foram escritas pensando em Word, Markdown, docs internos e outras tarefas reais depois do OCR.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section-band muted-band">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">O que fazemos e o que nao prometemos</p>
            <h2>Clareza operacional acima de tudo.</h2>
            <p>
              Prezamos pela transparencia para que voce saiba exatamente quando o Scanlume e a ferramenta certa para sua tarefa.
            </p>
          </div>

          <div className="check-grid">
            <article className="check-card">
              <strong>Faz bem</strong>
              <p>Extrair texto de screenshots, JPG e PNG comuns com fluxo rapido, copia direta e exportacao em TXT, Markdown e HTML.</p>
            </article>
            <article className="check-card">
              <strong>Faz melhor ainda</strong>
              <p>Quando a origem e digital, o contraste esta limpo e a saida precisa ser reaproveitada em documentos e ferramentas do time.</p>
            </article>
            <article className="check-card">
              <strong>Nao promete</strong>
              <p>Reconstrucao perfeita de tabelas densas, textos inclinados, imagens muito comprimidas ou microcopy minuscula sem nenhuma revisao humana.</p>
            </article>
            <article className="check-card">
              <strong>Como tirar melhor proveito</strong>
              <p>Recorte melhor a imagem, prefira screenshot ou PNG quando a origem for digital e use o modo formatado quando a estrutura visual importa.</p>
            </article>
          </div>

          <div className="hero-actions">
            <Link href="/" className="solid-button large-button">
              Comecar a usar o OCR
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
