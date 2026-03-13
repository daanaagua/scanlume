"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";

import { SupportDesk } from "@/components/support-desk";

export function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState<CSSProperties | undefined>(undefined);

  useEffect(() => {
    if (!isOpen) {
      setPanelStyle(undefined);
      return;
    }

    function updatePanelViewport() {
      if (typeof window === "undefined") {
        return;
      }

      if (window.innerWidth > 640 || !window.visualViewport) {
        setPanelStyle(undefined);
        return;
      }

      const top = Math.max(8, Math.round(window.visualViewport.offsetTop) + 8);
      const height = Math.max(280, Math.round(window.visualViewport.height) - 52);
      setPanelStyle({
        top: `${top}px`,
        bottom: "auto",
        height: `${height}px`,
        maxHeight: `${height}px`,
      });
    }

    updatePanelViewport();
    window.addEventListener("resize", updatePanelViewport);
    window.visualViewport?.addEventListener("resize", updatePanelViewport);
    window.visualViewport?.addEventListener("scroll", updatePanelViewport);

    return () => {
      window.removeEventListener("resize", updatePanelViewport);
      window.visualViewport?.removeEventListener("resize", updatePanelViewport);
      window.visualViewport?.removeEventListener("scroll", updatePanelViewport);
    };
  }, [isOpen]);

  const triggerLabel = useMemo(() => (isOpen ? "Ocultar" : "Fale conosco"), [isOpen]);

  return (
    <>
      {isOpen && (
        <div className="support-widget-panel" style={panelStyle}>
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
        {triggerLabel}
      </button>
    </>
  );
}
