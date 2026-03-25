import { useEffect, useMemo, useRef } from "react";

import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import "@blocknote/mantine/style.css";
import { useTheme } from "../theme-provider";

type RichEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

export function RichEditor({ value, onChange }: RichEditorProps) {
  const editor = useCreateBlockNote();
  const { resolvedTheme } = useTheme();

  const syncingFromValue = useRef(false);
  const lastValueRef = useRef<string | null>(null);

  useEffect(() => {
    if (!editor) return;
    let cancelled = false;

    if (lastValueRef.current === value) {
      return;
    }

    syncingFromValue.current = true;

    const blocks = editor.tryParseMarkdownToBlocks(value);
    if (!cancelled) {
      editor.replaceBlocks(editor.document, blocks);
      lastValueRef.current = value;
      syncingFromValue.current = false;
    }

    return () => {
      cancelled = true;
    };
  }, [editor, value]);

  const wordCount = useMemo(() => {
    const plain = value.replace(/[#>*_`\-\[\]()]/g, " ").trim();
    return plain ? plain.split(/\s+/).length : 0;
  }, [value]);

  if (!editor) {
    return <div className="min-h-[70svh] rounded-xl border border-border/70 bg-card/60" />;
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border/70 bg-card/70 p-3 shadow-[0_18px_60px_-30px_rgba(0,0,0,0.4)] backdrop-blur">
        <div className="mb-3 flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          <span>Block editor</span>
          <span>{wordCount.toLocaleString()} words</span>
        </div>
        <div className="overflow-hidden rounded-lg border border-border/60 bg-background">
          <BlockNoteView
            editor={editor}
            onChange={() => {
              if (syncingFromValue.current) return;
              const markdown = editor.blocksToMarkdownLossy(editor.document);
              lastValueRef.current = markdown;
              onChange(markdown);
            }}
            theme={resolvedTheme === "dark" ? "dark" : "light"}
          />
        </div>
      </div>
    </div>
  );
}
