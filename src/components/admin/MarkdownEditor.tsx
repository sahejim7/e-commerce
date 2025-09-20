"use client";

import { useState } from "react";
import { Eye, Edit3, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MarkdownContent from "@/components/MarkdownContent";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  error?: string;
}

export default function MarkdownEditor({ 
  value, 
  onChange, 
  placeholder = "Enter markdown content...", 
  rows = 8,
  className = "",
  error 
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");

  return (
    <div className={`space-y-2 ${className}`}>
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "write" | "preview")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="write" className="flex items-center gap-2">
            <Edit3 className="h-4 w-4" />
            Write
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="write" className="space-y-2">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className={`font-mono text-sm ${error ? "border-red-300" : ""}`}
          />
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <FileText className="h-3 w-3" />
            <span>Supports Markdown formatting: **bold**, *italic*, # headers, - lists, etc.</span>
          </div>
        </TabsContent>
        
        <TabsContent value="preview" className="space-y-2">
          <Card className="min-h-[200px]">
            <CardContent className="p-4">
              {value.trim() ? (
                <MarkdownContent content={value} />
              ) : (
                <div className="flex items-center justify-center h-32 text-gray-500">
                  <div className="text-center">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No content to preview</p>
                    <p className="text-sm">Start writing in the Write tab</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

