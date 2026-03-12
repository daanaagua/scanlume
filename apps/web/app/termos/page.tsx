import { buildMetadata } from "@/lib/site";

export const metadata = buildMetadata({
  title: "Termos de uso",
  description:
    "Regras de uso do OCR online Scanlume, incluindo limites anonimos, formatos disponiveis e politica de uso justo.",
  pathname: "/termos",
});

export default function TermsPage() {
  return (
    <section className="section-band legal-band">
      <div className="container legal-copy">
        <p className="eyebrow">Termos</p>
        <h1>Uso justo para manter o OCR rapido e sustentavel.</h1>
        <p>
          O acesso anonimo existe para validar o produto e permitir testes sem login, mas cada usuario fica sujeito a limites diarios, limites por arquivo e controle de budget global.
        </p>
        <p>
          O Scanlume pode bloquear requsicoes que indiquem abuso, automacao agressiva ou tentativas de contornar limites por IP, browser id ou desafio anti-bot.
        </p>
        <p>
          A equipe pode ajustar formatos, limites e fluxos de exportacao conforme a evolucao do produto. O suporte a DOCX fica planejado para uma fase posterior.
        </p>
      </div>
    </section>
  );
}
