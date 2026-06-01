import { buildMetadata } from "@/lib/site";

export const metadata = buildMetadata({
  title: "Privacidade e processamento de dados",
  description:
    "Entenda como o Scanlume trata uploads de imagem, limites de uso, browser id e logs minimos de operacao.",
  pathname: "/privacidade",
});

export default function PrivacyPage() {
  return (
    <>
      <section className="tool-first-home">
        <div className="container">
          <div className="tool-first-intro">
            <p className="eyebrow scanlume-signal-label">Privacidade</p>
            <h1>Processamento minimo de dados</h1>
            <p>
              Entenda de forma clara e transparente como tratamos suas imagens, logs e informacoes de uso.
            </p>
          </div>
        </div>
      </section>

      <section className="section-band">
        <div className="container legal-copy">
          <p>
            O Scanlume processa imagens enviadas para gerar OCR. No MVP, o foco e limitar abuso e medir custo operacional, por isso o worker pode registrar hash de IP, browser id, modo usado, tokens consumidos e custo estimado.
          </p>
          <p>
            Arquivos de imagem nao sao usados para treinar modelos proprios. O armazenamento persistente de resultados em R2 esta reservado para lotes futuros; na versao inicial, a exportacao pode ser feita direto no navegador.
          </p>
          <p>
            Mecanismos adicionais de protecao podem ser ativados para verificar trafego legitimo e reforcar o controle de abuso sem mudar o fluxo principal da ferramenta.
          </p>
        </div>
      </section>
    </>
  );
}
