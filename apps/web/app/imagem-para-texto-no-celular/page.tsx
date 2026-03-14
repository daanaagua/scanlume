import { ToolLanding } from "@/components/tool-landing";
import { buildMetadata, toolPageContent } from "@/lib/site";

export const metadata = buildMetadata({
  title: toolPageContent["imagem-para-texto-no-celular"].title,
  description: toolPageContent["imagem-para-texto-no-celular"].description,
  keywords: toolPageContent["imagem-para-texto-no-celular"].keywords,
  pathname: "/imagem-para-texto-no-celular",
});

export default function ImageToTextOnMobilePage() {
  return <ToolLanding slug="imagem-para-texto-no-celular" />;
}
