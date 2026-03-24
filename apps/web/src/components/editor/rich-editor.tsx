import { useEffect, useMemo } from "react";
import type { ComponentProps } from "react";

import { Button } from "@vi-notes/ui/components/button";
import { Card, CardContent } from "@vi-notes/ui/components/card";
import { cn } from "@vi-notes/ui/lib/utils";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/react";
import Typography from "@tiptap/extension-typography";
import { Bold, ChevronDown, Heading1, Heading2, Heading3, Italic, List, Redo, Undo } from "lucide-react";
import { Markdown } from "tiptap-markdown";

type RichEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

function ToolbarButton({ active, ...props }: { active?: boolean } & ComponentProps<typeof Button>) {
  return (
    <Button
      {...props}
      variant={active ? "secondary" : "ghost"}
      size="icon-sm"
      className={cn("rounded-none border border-border/70", props.className)}
    />
  );
}

export function RichEditor({ value, onChange }: RichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Typography,
      Placeholder.configure({
        showOnlyCurrent: true,
        placeholder: ({ node }) => {
          if (node.type.name === "heading") {
            return `Heading ${node.attrs.level}`;
          }
          return "Start writing your note...";
        },
      }),
      Markdown,
    ],
    content: value,
    autofocus: "end",
    editorProps: {
      attributes: {
        class:
          "prose prose-lg dark:prose-invert max-w-none min-h-[70svh] px-7 py-6 focus:outline-none sm:px-8 sm:py-8",
      },
    },
    onUpdate: ({ editor }) => {
      const markdown = (editor.storage as { markdown?: { getMarkdown: () => string } }).markdown?.getMarkdown?.() ?? "";
      onChange(markdown);
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = (editor.storage as { markdown?: { getMarkdown: () => string } }).markdown?.getMarkdown?.() ?? "";
    if (current !== value) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
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
      <Card className="overflow-hidden border-border/70 bg-card/70 shadow-[0_18px_60px_-30px_rgba(0,0,0,0.4)] backdrop-blur">
        <div className="flex flex-wrap items-center gap-1 border-b border-border/70 bg-muted/30 px-3 py-2">
          <ToolbarButton
            aria-label="Undo"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
          >
            <Undo className="size-3.5" />
          </ToolbarButton>
          <ToolbarButton
            aria-label="Redo"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
          >
            <Redo className="size-3.5" />
          </ToolbarButton>

          <div className="mx-1 h-5 w-px bg-border" />

          <ToolbarButton
            aria-label="Heading 1"
            active={editor.isActive("heading", { level: 1 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          >
            <Heading1 className="size-3.5" />
          </ToolbarButton>
          <ToolbarButton
            aria-label="Heading 2"
            active={editor.isActive("heading", { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 className="size-3.5" />
          </ToolbarButton>
          <ToolbarButton
            aria-label="Heading 3"
            active={editor.isActive("heading", { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            <Heading3 className="size-3.5" />
          </ToolbarButton>

          <div className="mx-1 h-5 w-px bg-border" />

          <ToolbarButton
            aria-label="Bold"
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="size-3.5" />
          </ToolbarButton>
          <ToolbarButton
            aria-label="Italic"
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="size-3.5" />
          </ToolbarButton>
          <ToolbarButton
            aria-label="Bullet list"
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="size-3.5" />
          </ToolbarButton>
          <div className="ml-auto flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-none border border-border/70 px-2 py-1 uppercase tracking-[0.2em]">
              <ChevronDown className="size-3" />
              Markdown editor
            </span>
            <span>{wordCount.toLocaleString()} words</span>
          </div>
        </div>

        <CardContent className="p-0">
          <EditorContent editor={editor} />
        </CardContent>
      </Card>
    </div>
  );
}
