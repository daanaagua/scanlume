import { buildMetadata } from "@/lib/site";

export const metadata = buildMetadata({
  title: "Sobre o Scanlume",
  description:
    "Conheca o Scanlume: OCR simples e formatado para o mercado pt-BR, com foco em velocidade, clareza e reaproveitamento do texto.",
  pathname: "/sobre",
});

export default function AboutPage() {
  return (
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
  );
}
