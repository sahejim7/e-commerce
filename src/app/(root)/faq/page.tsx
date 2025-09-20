import { readFileSync } from "fs";
import { join } from "path";
import ReactMarkdown from "react-markdown";
import ContentPage from "@/components/ContentPage";

export default function FAQPage() {
  // Read the markdown content
  const contentPath = join(process.cwd(), "content", "faq.md");
  const content = readFileSync(contentPath, "utf8");

  return (
    <ContentPage title="Frequently Asked Questions">
      <ReactMarkdown>{content}</ReactMarkdown>
    </ContentPage>
  );
}
