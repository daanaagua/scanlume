import { ToolLanding } from "@/components/tool-landing";
import { buildMetadata, toolPageContent } from "@/lib/site";

export const metadata = buildMetadata({
  title: toolPageContent["extrair-texto-de-imagem"].title,
  description: toolPageContent["extrair-texto-de-imagem"].description,
  keywords: toolPageContent["extrair-texto-de-imagem"].keywords,
  pathname: "/extrair-texto-de-imagem",
});

export default function ExtractTextFromImagePage() {
  return <ToolLanding slug="extrair-texto-de-imagem" />;
}
