import Link from "next/link";

import { ToolLanding } from "@/components/tool-landing";
import { BLOG_PATH } from "@/lib/blog";
import { buildMetadata, toolPageContent } from "@/lib/site";

export const metadata = buildMetadata({
  title: toolPageContent["imagem-para-texto"].title,
  description: toolPageContent["imagem-para-texto"].description,
  keywords: toolPageContent["imagem-para-texto"].keywords,
  pathname: "/imagem-para-texto",
});

export default function ImageToTextPage() {
  return (
    <>
      <ToolLanding slug="imagem-para-texto" />

      <section className="section-band">
        <div className="container split-content">
          <div className="section-heading">
            <p className="eyebrow">Intencao principal</p>
            <h2>Imagem para texto, converter imagem em texto e imagem em texto levam ao mesmo fluxo.</h2>
            <p>
              Na pratica, essas buscas costumam descrever a mesma tarefa: pegar JPG, PNG ou capturas de tela e transformar o conteudo visual em texto editavel. Esta pagina concentra esse caso geral para evitar que a navegacao se espalhe entre sinonimos muito parecidos.
            </p>
            <div className="hero-actions">
              <a href="#ocr-workspace" className="solid-button large-button">
                Testar imagem para texto
              </a>
              <Link href="/ocr-online" className="ghost-button large-button">
                Ver OCR online
              </Link>
            </div>
          </div>

          <div className="check-grid">
            <article className="check-card">
              <strong>Imagem para texto</strong>
              <p>Busca mais ampla para quem quer a pagina principal do produto e um fluxo geral para diferentes formatos.</p>
            </article>
            <article className="check-card">
              <strong>Converter imagem em texto</strong>
              <p>Busca mais orientada a acao, comum quando o usuario quer resolver a tarefa no navegador sem instalar aplicativo.</p>
            </article>
            <article className="check-card">
              <strong>Imagem em texto</strong>
              <p>Variacao semantica que ainda aponta para o mesmo objetivo: transformar a imagem em texto editavel com o menor retrabalho possivel.</p>
            </article>
            <article className="check-card">
              <strong>Quando abrir outra rota</strong>
              <p>Se o problema for mais especifico, como Word, PNG ou OCR em portugues, os links complementares continuam disponiveis sem tirar o foco desta pagina principal.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section-band muted-band">
        <div className="container split-content">
          <div className="section-heading">
            <p className="eyebrow">Experiencia real</p>
            <h2>Esta pagina foi alinhada com testes publicados e com o fluxo real do produto.</h2>
            <p>
              Em vez de prometer um OCR perfeito para qualquer imagem, usamos os testes do blog e o comportamento da ferramenta para explicar onde o resultado sai limpo e onde ainda vale revisar manualmente.
            </p>
            <div className="hero-actions">
              <Link href={`${BLOG_PATH}/ocr-portugues-imagem-para-texto-teste-real`} className="solid-button large-button">
                Ver benchmark real
              </Link>
              <Link href="/sobre" className="ghost-button large-button">
                Ver como avaliamos qualidade
              </Link>
            </div>
          </div>

          <div className="check-grid">
            <article className="check-card">
              <strong>Benchmark com layout misto</strong>
              <p>Publicamos um teste com heading, CTA, chips e texto auxiliar para ver se a leitura principal se mantem util antes de falar em velocidade.</p>
            </article>
            <article className="check-card">
              <strong>Comparativo entre formatos</strong>
              <p>Tambem comparamos JPG, PNG e screenshot para explicar quando a qualidade depende mais do arquivo e quando depende mais da captura.</p>
            </article>
            <article className="check-card">
              <strong>Exportacao validada</strong>
              <p>Os fluxos de TXT, Markdown e HTML foram descritos a partir do uso pratico em Word, docs internos e bases de conhecimento.</p>
            </article>
            <article className="check-card">
              <strong>Limites declarados</strong>
              <p>Labels muito pequenas, fotos inclinadas, sombras fortes e tabelas densas continuam sendo cenarios em que recomendamos revisao humana.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section-band">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">Antes de confiar no resultado</p>
            <h2>Quatro sinais rapidos para saber se a imagem tende a sair boa no OCR.</h2>
            <p>Esses criterios ajudam a decidir quando vale usar o modo simples, quando subir um arquivo melhor e quando revisar a saida com mais calma.</p>
          </div>

          <div className="timeline-grid">
            <article className="timeline-step">
              <span>01</span>
              <strong>Texto principal legivel</strong>
              <p>Headings, paragrafos e botoes precisam ter contraste claro contra o fundo. Se voce mal consegue ler, o OCR tambem vai sofrer.</p>
            </article>
            <article className="timeline-step">
              <span>02</span>
              <strong>Arquivo com origem limpa</strong>
              <p>Para telas e interfaces, screenshot nativo ou PNG costumam preservar detalhes finos melhor que fotos ou imagens recomprimidas.</p>
            </article>
            <article className="timeline-step">
              <span>03</span>
              <strong>Escolha de saida coerente</strong>
              <p>Use OCR simples quando so importa texto puro. Use texto formatado quando a ordem dos blocos precisa chegar mais organizada.</p>
            </article>
            <article className="timeline-step">
              <span>04</span>
              <strong>Revisao nas bordas e labels curtas</strong>
              <p>Microcopy, notas pequenas e chips compactos sao os trechos que mais pedem uma revisao rapida antes de copiar ou baixar.</p>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
