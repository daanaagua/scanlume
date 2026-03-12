import { buildMetadata } from "@/lib/site";

export const metadata = buildMetadata({
  title: "Contato",
  description:
    "Envie feedback sobre OCR, limites de uso, bugs de layout ou sugestoes para a evolucao do Scanlume.",
  pathname: "/contato",
});

export default function ContactPage() {
  return (
    <section className="section-band legal-band">
      <div className="container legal-copy">
        <p className="eyebrow">Contato</p>
        <h1>Feedback de OCR, bugs e pedidos de formato.</h1>
        <p>
          Para esta fase do MVP, use `hello@scanlume.com` como ponto de contato principal. O ideal e enviar o tipo de imagem, o modo usado e o resultado esperado.
        </p>
        <p>
          Se voce estiver avaliando o modo formatado, inclua exemplos do layout final desejado para Word, Markdown ou HTML. Isso ajuda a priorizar as proximas melhorias.
        </p>
      </div>
    </section>
  );
}
