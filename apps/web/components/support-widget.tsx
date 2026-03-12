"use client";

import { useState } from "react";

import { SupportDesk } from "@/components/support-desk";

export function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {isOpen && (
        <div className="support-widget-panel">
          <div className="support-widget-toolbar">
            <strong>Fale conosco</strong>
            <button type="button" className="ghost-button support-widget-close" onClick={() => setIsOpen(false)}>
              Fechar
            </button>
          </div>
          <SupportDesk title="Fale conosco" description="Conte sua duvida, bug ou sugestao. Respondemos em ate 1 dia." />
        </div>
      )}

      <button type="button" className="support-widget-trigger" onClick={() => setIsOpen((current) => !current)}>
        {isOpen ? "Ocultar contato" : "Fale conosco"}
      </button>
    </>
  );
}
