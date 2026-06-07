import Blockquote from "@tiptap/extension-blockquote";

/**
 * Scripture / verse block. Extends the standard blockquote node so it still
 * serializes to Markdown ("> ...") for the `body_md` column and round-trips
 * cleanly, while rendering with the oxblood left border from the design
 * prototype. Use alongside `StarterKit.configure({ blockquote: false })` so the
 * node is registered only once.
 */
export const VerseBlock = Blockquote.extend({
  name: "blockquote",
}).configure({
  HTMLAttributes: {
    class: "verse-block",
  },
});
