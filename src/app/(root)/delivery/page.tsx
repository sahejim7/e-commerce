import { readFileSync } from "fs";
import { join } from "path";
import ReactMarkdown from "react-markdown";
import ContentPage from "@/components/ContentPage";

export default function DeliveryPage() {
  // Read the markdown content
  const contentPath = join(process.cwd(), "content", "delivery.md");
  const content = readFileSync(contentPath, "utf8");

  return (
    <ContentPage title="Delivery & Return Policy">
      <ReactMarkdown>{content}</ReactMarkdown>
    </ContentPage>
  );
}
