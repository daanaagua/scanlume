"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, type CSSProperties } from "react";

import { SupportDesk } from "@/components/support-desk";
import { resolveClientLocale, type ClientLocale } from "@/lib/client-locale";

const SUPPORT_WIDGET_COPY = {
  "pt-BR": {
    open: "Fale conosco",
    hide: "Ocultar",
    close: "Fechar",
    description: "Conte sua duvida, bug ou sugestao. Respondemos em ate 1 dia.",
  },
  en: {
    open: "Contact us",
    hide: "Hide",
    close: "Close",
    description: "Tell us your question, bug, or suggestion. We usually reply within 1 day.",
  },
} as const;

export function SupportWidget({ locale }: { locale?: ClientLocale } = {}) {
  const pathname = usePathname();
  const resolvedLocale = resolveClientLocale(locale, pathname);
  const copy = SUPPORT_WIDGET_COPY[resolvedLocale];
  const [isOpen, setIsOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState<CSSProperties | undefined>(undefined);

  useEffect(() => {
    if (!isOpen) {
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

  const triggerLabel = useMemo(() => (isOpen ? copy.hide : copy.open), [copy.hide, copy.open, isOpen]);

  return (
    <>
      {isOpen && (
        <div className="support-widget-panel" style={panelStyle}>
          <div className="support-widget-toolbar">
            <strong>{copy.open}</strong>
            <button type="button" className="ghost-button support-widget-close" onClick={() => setIsOpen(false)}>
              {copy.close}
            </button>
          </div>
          <SupportDesk title={copy.open} description={copy.description} locale={resolvedLocale} />
        </div>
      )}

      <button type="button" className="support-widget-trigger" onClick={() => setIsOpen((current) => !current)}>
        {triggerLabel}
      </button>
    </>
  );
}
