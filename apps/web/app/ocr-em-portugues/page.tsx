import { ToolLanding } from "@/components/tool-landing";
import { buildMetadata, toolPageContent } from "@/lib/site";

export const metadata = buildMetadata({
  title: toolPageContent["ocr-em-portugues"].title,
  description: toolPageContent["ocr-em-portugues"].description,
  keywords: toolPageContent["ocr-em-portugues"].keywords,
  pathname: "/ocr-em-portugues",
});

export default function OcrInPortuguesePage() {
  return <ToolLanding slug="ocr-em-portugues" />;
}
