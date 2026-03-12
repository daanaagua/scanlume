import { ToolLanding } from "@/components/tool-landing";
import { buildMetadata, toolPageContent } from "@/lib/site";

export const metadata = buildMetadata({
  title: toolPageContent["imagem-para-word"].title,
  description: toolPageContent["imagem-para-word"].description,
  keywords: toolPageContent["imagem-para-word"].keywords,
  pathname: "/imagem-para-word",
});

export default function ImageToWordPage() {
  return <ToolLanding slug="imagem-para-word" />;
}
