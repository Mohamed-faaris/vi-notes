import ReactMarkdown from "react-markdown";

type PreviewProps = {
  markdown: string;
};

export function Preview({ markdown }: PreviewProps) {
  if (!markdown.trim()) {
    return <p className="text-xs text-muted-foreground">Start writing to see markdown preview.</p>;
  }

  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  );
}
