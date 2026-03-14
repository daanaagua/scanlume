import { ToolLanding } from "@/components/tool-landing";
import { buildMetadata, toolPageContent } from "@/lib/site";

export const metadata = buildMetadata({
  title: toolPageContent["transcrever-imagem-em-texto"].title,
  description: toolPageContent["transcrever-imagem-em-texto"].description,
  keywords: toolPageContent["transcrever-imagem-em-texto"].keywords,
  pathname: "/transcrever-imagem-em-texto",
});

export default function TranscribeImageToTextPage() {
  return <ToolLanding slug="transcrever-imagem-em-texto" />;
}
