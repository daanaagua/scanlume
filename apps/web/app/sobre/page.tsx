import { buildMetadata } from "@/lib/site";

export const metadata = buildMetadata({
  title: "Sobre o Scanlume",
  description:
    "Conheca o posicionamento do Scanlume: OCR simples e formatado para o mercado pt-BR, com foco em velocidade, clareza e SEO.",
  pathname: "/sobre",
});

export default function AboutPage() {
  return (
    <section className="section-band legal-band">
      <div className="container legal-copy">
        <p className="eyebrow">Sobre</p>
        <h1>Scanlume nasce para validar OCR em pt-BR com uma proposta objetiva.</h1>
        <p>
          A primeira fase foca no mercado brasileiro e no termo `imagem para texto`, com uma experiencia leve para teste anonimo, sem login obrigatorio e sem excesso de complexidade antes da validacao.
        </p>
        <p>
          O produto trabalha com dois modos: um fluxo de texto puro, rapido e barato; e um fluxo formatado para preservar a estrutura principal de leitura.
        </p>
      </div>
    </section>
  );
}
