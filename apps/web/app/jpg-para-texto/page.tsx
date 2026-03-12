import { ToolLanding } from "@/components/tool-landing";
import { buildMetadata, toolPageContent } from "@/lib/site";

export const metadata = buildMetadata({
  title: toolPageContent["jpg-para-texto"].title,
  description: toolPageContent["jpg-para-texto"].description,
  keywords: toolPageContent["jpg-para-texto"].keywords,
  pathname: "/jpg-para-texto",
});

export default function JpgToTextPage() {
  return <ToolLanding slug="jpg-para-texto" />;
}
