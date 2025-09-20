import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface ContentPageProps {
  title: string;
  children: ReactNode;
}

export default function ContentPage({ title, children }: ContentPageProps) {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-heading-2 mb-4 text-center">{title}</h1>
        <Separator className="mx-auto w-24" />
      </div>
      <Card className="shadow-lg">
        <CardContent className="p-8">
          <div className="prose lg:prose-xl max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-a:text-primary hover:prose-a:text-primary/80 prose-ul:text-muted-foreground prose-ol:text-muted-foreground">
            {children}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
