import Link from "next/link";

import { ToolLanding } from "@/components/tool-landing";
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
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">Intencao principal</p>
            <h2>Rotas parecidas levam ao mesmo fluxo.</h2>
            <p>
              JPG, PNG, screenshot e PDF entram pela mesma ferramenta. Se o arquivo ja estiver em documento, a rota <Link href="/pdf-para-texto">PDF para texto</Link> concentra as opcoes de PDF pesquisavel e reorganizado.
            </p>
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
    </>
  );
}
