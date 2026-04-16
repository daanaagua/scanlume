import { ToolLanding } from "@/components/tool-landing";
import { buildMetadata, toolPageContent } from "@/lib/site";

export const metadata = buildMetadata({
  title: toolPageContent["tabela-de-imagem-para-texto"].title,
  description: toolPageContent["tabela-de-imagem-para-texto"].description,
  keywords: toolPageContent["tabela-de-imagem-para-texto"].keywords,
  pathname: "/tabela-de-imagem-para-texto",
});

export default function TableImageToTextPage() {
  return <ToolLanding slug="tabela-de-imagem-para-texto" />;
}
