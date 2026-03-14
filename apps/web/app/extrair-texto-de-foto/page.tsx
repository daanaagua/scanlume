import { ToolLanding } from "@/components/tool-landing";
import { buildMetadata, toolPageContent } from "@/lib/site";

export const metadata = buildMetadata({
  title: toolPageContent["extrair-texto-de-foto"].title,
  description: toolPageContent["extrair-texto-de-foto"].description,
  keywords: toolPageContent["extrair-texto-de-foto"].keywords,
  pathname: "/extrair-texto-de-foto",
});

export default function ExtractTextFromPhotoPage() {
  return <ToolLanding slug="extrair-texto-de-foto" />;
}
