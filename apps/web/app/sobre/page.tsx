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
      <section className="section-band legal-band">
        <div className="container legal-copy">
          <p className="eyebrow">Sobre</p>
          <h1>Scanlume foi criado para facilitar OCR em pt-BR com um fluxo objetivo.</h1>
          <p>
            A primeira fase foca no mercado brasileiro e em transformar screenshots, JPG e PNG em texto editavel com uma experiencia leve, sem login obrigatorio e sem etapas desnecessarias.
          </p>
          <p>
            O produto trabalha com dois modos: um fluxo de texto puro, rapido e barato; e um fluxo formatado para preservar a estrutura principal de leitura.
          </p>
        </div>
      </section>

      <section className="section-band muted-band">
        <div className="container split-content">
          <div className="section-heading">
            <p className="eyebrow">Quem responde pelo produto</p>
            <h2>Um produto pequeno, com escopo claro e paginas de confianca abertas.</h2>
            <p>
              Scanlume ainda esta em fase inicial, mas a operacao ja deixa claro o publico-alvo, as rotas de contato e os documentos que sustentam a relacao com o usuario.
            </p>
            <div className="hero-actions">
              <Link href="/contato" className="solid-button large-button">
                Falar com o time
              </Link>
              <Link href="/privacidade" className="ghost-button large-button">
                Ler privacidade
              </Link>
            </div>
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
            <h2>As promessas do site saem de testes, comparativos e revisao manual.</h2>
            <p>
              Antes de transformar um aprendizado em copy de produto, olhamos para o comportamento do OCR em benchmark real, diferentes formatos de arquivo e destinos de exportacao.
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
        <div className="container split-content">
          <div className="section-heading">
            <p className="eyebrow">O que o produto faz e o que nao promete</p>
            <h2>Preferimos clareza operacional a exagero de marketing.</h2>
            <p>
              Isso ajuda o usuario a saber quando Scanlume e uma boa escolha e quando faz mais sentido melhorar o arquivo antes de rodar o OCR.
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
        </div>
      </section>
    </>
  );
}
