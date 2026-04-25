import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Scanlume example | OCR Command Desk",
  description: "Pagina de exemplo visual para validar uma direcao de interface OCR mais forte para o Scanlume.",
  robots: {
    index: false,
    follow: false,
  },
};

const queueItems = [
  { name: "nota-fiscal.png", kind: "Imagem", status: "Pronto" },
  { name: "contrato-digitalizado.pdf", kind: "PDF", status: "OCR em curso" },
  { name: "print-whatsapp.jpg", kind: "Imagem", status: "Na fila" },
];

const formats = ["TXT", "Markdown", "HTML", "PDF pesquisavel"];

export default function ExamplePage() {
  return (
    <div className={styles.examplePage}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>Prototipo visual</p>
          <h1>OCR Command Desk</h1>
          <p>
            Uma direcao mais firme para o Scanlume: menos cara de landing page generica, mais sensacao de ferramenta
            pronta para upload, leitura, revisao e exportacao.
          </p>
          <div className={styles.actions}>
            <Link href="/imagem-para-texto">Abrir ferramenta real</Link>
            <a href="#workspace-preview">Ver layout do workspace</a>
          </div>
        </div>

        <div className={styles.heroVisual} aria-label="Preview visual de documentos processados">
          <div className={styles.visualTop}>
            <span>SCANLUME OCR</span>
            <strong>Leitura ativa</strong>
          </div>
          <div className={styles.documentFrame}>
            <Image
              src="/blog/ocr-export-workflow.png"
              alt="Fluxo de exportacao OCR do Scanlume"
              width={1200}
              height={630}
              priority
            />
            <span className={styles.scanLine} aria-hidden="true" />
          </div>
          <div className={styles.visualFooter}>
            <span>pt-BR</span>
            <span>TXT / MD / HTML / PDF</span>
            <span>Preview estruturado</span>
          </div>
        </div>
      </section>

      <section id="workspace-preview" className={styles.workspacePreview} aria-label="Layout OCR proposto">
        <div className={styles.workspaceHeader}>
          <div>
            <p className={styles.kicker}>Workspace proposto</p>
            <h2>Upload, OCR e resultado no mesmo campo de visao.</h2>
          </div>
          <p>
            A pagina real pode manter a logica atual, mas mudar a hierarquia: upload e preview viram os dois polos
            principais, com status e fila como suporte.
          </p>
        </div>

        <div className={styles.deskGrid}>
          <section className={styles.uploadDeck} aria-labelledby="upload-title">
            <div className={styles.panelHeader}>
              <p className={styles.panelLabel}>Entrada</p>
              <strong id="upload-title">Arraste JPG, PNG ou PDF</strong>
            </div>
            <div className={styles.dropTarget}>
              <span className={styles.dropMark}>+</span>
              <strong>Solte arquivos aqui</strong>
              <p>Limites e creditos ficam visiveis sem roubar o foco da acao principal.</p>
            </div>
            <div className={styles.modeRow} aria-label="Modos OCR">
              <span>OCR simples</span>
              <span>Texto formatado</span>
            </div>
          </section>

          <section className={styles.resultDeck} aria-labelledby="result-title">
            <div className={styles.panelHeader}>
              <p className={styles.panelLabel}>Saida</p>
              <strong id="result-title">Preview estruturado</strong>
            </div>
            <div className={styles.resultSheet}>
              <span className={styles.lineWide} />
              <span className={styles.lineMedium} />
              <span className={styles.lineShort} />
              <div className={styles.resultColumns}>
                <span />
                <span />
              </div>
              <p>
                O texto reconhecido aparece em uma area de leitura limpa, com abas de formato e acoes proximas ao
                resultado.
              </p>
            </div>
            <div className={styles.formatRow}>
              {formats.map((format) => (
                <span key={format}>{format}</span>
              ))}
            </div>
          </section>

          <aside className={styles.sideRail} aria-label="Status da fila">
            <section className={styles.metricBlock}>
              <p className={styles.panelLabel}>Hoje</p>
              <strong>17 / 50</strong>
              <span>creditos restantes</span>
            </section>
            <section className={styles.queueBlock}>
              <p className={styles.panelLabel}>Fila de arquivos</p>
              {queueItems.map((item) => (
                <div className={styles.queueItem} key={item.name}>
                  <strong>{item.name}</strong>
                  <span>
                    {item.kind} / {item.status}
                  </span>
                </div>
              ))}
            </section>
          </aside>
        </div>
      </section>

      <section className={styles.notes}>
        <div>
          <p className={styles.kicker}>O que muda na sensacao</p>
          <h2>Menos cartao decorativo, mais produto operavel.</h2>
        </div>
        <div className={styles.noteGrid}>
          <article>
            <strong>Primeira dobra mais util</strong>
            <p>O usuario entende a promessa e ja visualiza o tipo de workspace que vai usar.</p>
          </article>
          <article>
            <strong>Hierarquia mais clara</strong>
            <p>Upload, status, fila e resultado deixam de competir como blocos iguais.</p>
          </article>
          <article>
            <strong>Visual mais proprio</strong>
            <p>A interface usa linguagem de scanner e documentos, sem virar tema escuro pesado.</p>
          </article>
        </div>
      </section>
    </div>
  );
}
