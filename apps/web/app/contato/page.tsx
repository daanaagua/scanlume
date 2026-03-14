import { buildMetadata } from "@/lib/site";
import { SupportDesk } from "@/components/support-desk";

export const metadata = buildMetadata({
  title: "Contato",
  description:
    "Envie feedback sobre OCR, limites de uso, bugs de layout ou sugestoes para a evolucao do Scanlume.",
  pathname: "/contato",
});

export default function ContactPage() {
  return (
    <section className="section-band legal-band">
      <div className="container contact-page-grid">
        <div className="legal-copy">
          <p className="eyebrow">Contato</p>
          <h1>Fale com o time sobre OCR, bugs, sugestoes e parceria.</h1>
          <p>
            Use este canal para tirar duvidas de uso, relatar problemas de reconhecimento, sugerir melhorias de formato ou iniciar conversas comerciais.
          </p>
          <p>
            Se voce estiver logado com email ou Google, nome e email sao preenchidos automaticamente. Para esta fase, respondemos em ate 1 dia.
          </p>
        </div>

        <SupportDesk
          embedded
          title="Entre em contato"
          description="Explique sua duvida, bug ou ideia. O time responde em ate 1 dia e registra tudo para acompanhamento."
        />
      </div>
    </section>
  );
}
