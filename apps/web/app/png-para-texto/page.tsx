import { ToolLanding } from "@/components/tool-landing";
import { buildMetadata, toolPageContent } from "@/lib/site";

export const metadata = buildMetadata({
  title: toolPageContent["png-para-texto"].title,
  description: toolPageContent["png-para-texto"].description,
  keywords: toolPageContent["png-para-texto"].keywords,
  pathname: "/png-para-texto",
});

export default function PngToTextPage() {
  return <ToolLanding slug="png-para-texto" />;
}
