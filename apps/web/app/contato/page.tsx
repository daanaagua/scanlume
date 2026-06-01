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
    <section className="tool-first-home">
      <div className="container contact-page-grid">
        <div className="tool-first-intro">
          <p className="eyebrow scanlume-signal-label">Contato</p>
          <h1>Fale com o time</h1>
          <p>
            Tire duvidas de uso, relate problemas de reconhecimento ou sugira melhorias de formato diretamente para nossa equipe.
          </p>
          <div className="tool-first-pills" aria-label="Informacoes de suporte">
            <span>Retorno em ate 1 dia</span>
            <span>Bugs e sugestoes</span>
            <span>Suporte direto</span>
          </div>
        </div>

        <SupportDesk
          embedded
          title="Entre em contato"
          description="Explique sua duvida ou ideia. Responderemos o mais breve possivel."
        />
      </div>
    </section>
  );
}
