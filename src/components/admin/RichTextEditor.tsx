"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Typography from "@tiptap/extension-typography";
import { Markdown } from "tiptap-markdown";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo2,
  Redo2,
  type LucideIcon,
} from "lucide-react";
import { VerseBlock } from "@/components/admin/extensions/verse-block";
import { cn } from "@/utils/cn";

type ToolButton = {
  icon: LucideIcon;
  label: string;
  run: (e: Editor) => void;
  active?: (e: Editor) => boolean;
};

const TOOLS: ToolButton[] = [
  {
    icon: Bold,
    label: "Bold",
    run: (e) => e.chain().focus().toggleBold().run(),
    active: (e) => e.isActive("bold"),
  },
  {
    icon: Italic,
    label: "Italic",
    run: (e) => e.chain().focus().toggleItalic().run(),
    active: (e) => e.isActive("italic"),
  },
  {
    icon: Heading2,
    label: "Heading",
    run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
    active: (e) => e.isActive("heading", { level: 2 }),
  },
  {
    icon: Heading3,
    label: "Subheading",
    run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
    active: (e) => e.isActive("heading", { level: 3 }),
  },
  {
    icon: List,
    label: "Bullet list",
    run: (e) => e.chain().focus().toggleBulletList().run(),
    active: (e) => e.isActive("bulletList"),
  },
  {
    icon: ListOrdered,
    label: "Numbered list",
    run: (e) => e.chain().focus().toggleOrderedList().run(),
    active: (e) => e.isActive("orderedList"),
  },
  {
    icon: Quote,
    label: "Scripture block",
    run: (e) => e.chain().focus().toggleBlockquote().run(),
    active: (e) => e.isActive("blockquote"),
  },
];

export function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (markdown: string) => void;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ blockquote: false }),
      VerseBlock,
      Typography,
      Markdown.configure({ html: false, transformPastedText: true }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          "prose-editor min-h-[320px] px-4 py-3 focus:outline-none font-scripture text-ink",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.storage.markdown.getMarkdown());
    },
  });

  if (!editor) {
    return (
      <div className="min-h-[380px] rounded-xl border border-border bg-white" />
    );
  }

  return (
    <div className="rounded-xl border border-border bg-white">
      <div className="flex flex-wrap items-center gap-1 border-b border-border px-2 py-1.5">
        {TOOLS.map(({ icon: Icon, label, run, active }) => (
          <button
            key={label}
            type="button"
            title={label}
            aria-label={label}
            onClick={() => run(editor)}
            className={cn(
              "rounded-md p-2 text-ink/70 transition hover:bg-parchment",
              active?.(editor) && "bg-copper/15 text-copper"
            )}
          >
            <Icon size={16} />
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-border" />
        <button
          type="button"
          title="Undo"
          aria-label="Undo"
          onClick={() => editor.chain().focus().undo().run()}
          className="rounded-md p-2 text-ink/70 transition hover:bg-parchment"
        >
          <Undo2 size={16} />
        </button>
        <button
          type="button"
          title="Redo"
          aria-label="Redo"
          onClick={() => editor.chain().focus().redo().run()}
          className="rounded-md p-2 text-ink/70 transition hover:bg-parchment"
        >
          <Redo2 size={16} />
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
