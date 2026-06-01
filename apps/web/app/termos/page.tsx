import { buildMetadata } from "@/lib/site";

export const metadata = buildMetadata({
  title: "Termos de uso",
  description:
    "Regras de uso do OCR online Scanlume, incluindo limites anonimos, formatos disponiveis e politica de uso justo.",
  pathname: "/termos",
});

export default function TermsPage() {
  return (
    <>
      <section className="tool-first-home">
        <div className="container">
          <div className="tool-first-intro">
            <p className="eyebrow scanlume-signal-label">Termos</p>
            <h1>Uso justo e sustentabilidade</h1>
            <p>
              Nossos termos foram desenhados para garantir um servico estavel, rapido e acessivel para todos.
            </p>
          </div>
        </div>
      </section>

      <section className="section-band">
        <div className="container legal-copy">
          <p>
            O acesso anonimo existe para validar o produto e permitir testes sem login, mas cada usuario fica sujeito a limites diarios, limites por arquivo e controle de budget global.
          </p>
          <p>
            O Scanlume pode bloquear requisicoes que indiquem abuso, automacao agressiva ou tentativas de contornar limites por IP, browser id ou desafio anti-bot.
          </p>
          <p>
            A equipe pode ajustar formatos, limites e fluxos de exportacao conforme a evolucao do produto. O suporte a DOCX fica planejado para uma fase posterior.
          </p>
        </div>
      </section>
    </>
  );
}
