import { ToolLanding } from "@/components/tool-landing";
import { buildMetadata, toolPageContent } from "@/lib/site";

export const metadata = buildMetadata({
  title: toolPageContent["imagem-para-texto"].title,
  description: toolPageContent["imagem-para-texto"].description,
  pathname: "/imagem-para-texto",
});

export default function ImageToTextPage() {
  return <ToolLanding slug="imagem-para-texto" />;
}
