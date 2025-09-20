import { readFileSync } from "fs";
import { join } from "path";
import ReactMarkdown from "react-markdown";
import ContentPage from "@/components/ContentPage";

export default function ContactPage() {
  // Read the markdown content
  const contentPath = join(process.cwd(), "content", "contact.md");
  const content = readFileSync(contentPath, "utf8");

  return (
    <ContentPage title="Contact Us">
      <ReactMarkdown>{content}</ReactMarkdown>
    </ContentPage>
  );
}
