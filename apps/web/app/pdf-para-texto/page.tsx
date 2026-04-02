import { ToolLanding } from "@/components/tool-landing";
import { buildMetadata, toolPageContent } from "@/lib/site";

export const metadata = buildMetadata({
  title: toolPageContent["pdf-para-texto"].title,
  description: toolPageContent["pdf-para-texto"].description,
  keywords: toolPageContent["pdf-para-texto"].keywords,
  pathname: "/pdf-para-texto",
});

export default function PdfParaTextoPage() {
  return <ToolLanding slug="pdf-para-texto" />;
}
