import { forwardRef, useMemo } from "react";

import DOMPurify from "dompurify";
import { marked } from "marked";

type PreviewProps = {
  markdown: string;
};

export const Preview = forwardRef<HTMLDivElement, PreviewProps>(function Preview({ markdown }, ref) {
  if (!markdown.trim()) {
    return <p className="text-xs text-muted-foreground">Start writing to see markdown preview.</p>;
  }

  const rendered = useMemo(() => {
    const html = marked.parse(markdown);
    return DOMPurify.sanitize(typeof html === "string" ? html : "");
  }, [markdown]);

  return (
    <div ref={ref} id="preview-wrapper" className="rounded-md border border-input bg-background p-4">
      <div
        id="output"
        className="prose prose-sm max-w-none dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: rendered }}
      />
    </div>
  );
});
