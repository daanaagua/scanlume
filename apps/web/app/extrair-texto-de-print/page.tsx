import { ToolLanding } from "@/components/tool-landing";
import { buildMetadata, toolPageContent } from "@/lib/site";

export const metadata = buildMetadata({
  title: toolPageContent["extrair-texto-de-print"].title,
  description: toolPageContent["extrair-texto-de-print"].description,
  keywords: toolPageContent["extrair-texto-de-print"].keywords,
  pathname: "/extrair-texto-de-print",
});

export default function ExtractTextFromScreenshotPage() {
  return <ToolLanding slug="extrair-texto-de-print" />;
}
