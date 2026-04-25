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

export default function ExamplePage() {
  return (
    <div className={styles.examplePage}>
      <section className={styles.hero}>
        <div className={styles.heroHeader}>
          <p className={styles.kicker}>Prototipo visual</p>
          <h1>OCR Command Desk</h1>
          <p>
            Uma direcao mais firme para o Scanlume: menos cara de landing page generica, mais sensacao de ferramenta
            pronta para upload, leitura, revisao e exportacao.
          </p>
          <div className={styles.actions}>
            <Link href="/imagem-para-texto">Abrir ferramenta real</Link>
            <a href="#live-desk">Ver console OCR</a>
          </div>
        </div>

        <div id="live-desk" className={styles.commandConsole} aria-label="Console OCR ao vivo">
          <div className={styles.consoleBar}>
            <div>
              <span className={styles.statusDot} aria-hidden="true" />
              <strong>SCANLUME OCR / LIVE DESK</strong>
            </div>
            <span>pt-BR</span>
            <span>TXT / MD / HTML / PDF</span>
          </div>

          <div className={styles.consoleBrief}>
            <div>
              <p className={styles.kicker}>Workspace proposto</p>
              <h2>Upload, OCR e resultado no mesmo campo de visao.</h2>
            </div>
            <p>
              A logica real pode continuar igual; o visual concentra entrada, leitura, fila e saida no mesmo painel,
              sem repetir uma segunda demonstracao abaixo.
            </p>
          </div>

          <div className={styles.consoleGrid}>
            <aside className={styles.intakeStack} aria-label="Entrada de arquivos">
              <div className={styles.panelHeader}>
                <p className={styles.panelLabel}>Entrada</p>
                <strong>Arraste JPG, PNG ou PDF</strong>
              </div>
              <div className={styles.miniDropzone}>
                <span className={styles.dropMark}>+</span>
                <p>Solte arquivos e escolha entre OCR simples ou Texto formatado.</p>
              </div>
              <p className={styles.panelLabel}>Fila de arquivos</p>
              <div className={styles.heroQueue}>
                {queueItems.slice(0, 2).map((item) => (
                  <div key={item.name}>
                    <strong>{item.name}</strong>
                    <span>{item.status}</span>
                  </div>
                ))}
              </div>
            </aside>

            <div className={styles.scanBay} aria-label="Area central de leitura OCR">
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
              <div className={styles.scanBadge}>
                <span>Leitura ativa</span>
                <strong>84%</strong>
              </div>
            </div>

            <aside className={styles.outputStack} aria-label="Resultado OCR">
              <div className={styles.panelHeader}>
                <p className={styles.panelLabel}>Saida</p>
                <strong>Preview estruturado</strong>
              </div>
              <div className={styles.heroResultLines} aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
              </div>
              <div className={styles.heroFormats}>
                <span>TXT</span>
                <span>MD</span>
                <span>HTML</span>
              </div>
            </aside>
          </div>

          <div className={styles.consoleMetrics} aria-label="Metricas do fluxo OCR">
            <div>
              <span>Tempo medio</span>
              <strong>12s</strong>
            </div>
            <div>
              <span>Creditos</span>
              <strong>17 / 50</strong>
            </div>
            <div>
              <span>Exportacao</span>
              <strong>4 formatos</strong>
            </div>
          </div>
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
