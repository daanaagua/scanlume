import { ToolLanding } from "@/components/tool-landing";
import { buildMetadata, toolPageContent } from "@/lib/site";

export const metadata = buildMetadata({
  title: toolPageContent["ocr-online"].title,
  description: toolPageContent["ocr-online"].description,
  pathname: "/ocr-online",
});

export default function OcrOnlinePage() {
  return <ToolLanding slug="ocr-online" />;
}
