"use client"; // this registers <Editor> as a Client Component
import "@blocknote/core/fonts/inter.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useEffect, useRef } from "react";
import { createPasteHandler } from "@/lib/blocknote-helpers";

// Our <Editor> component we can reuse later
export default function Editor() {
  // Creates a new editor instance with custom pasteHandler
  const editor = useCreateBlockNote({
    pasteHandler: createPasteHandler(),
  });

  // Expose editor to window for testing (optional, for development)
  const editorRef = useRef(editor);
  useEffect(() => {
    editorRef.current = editor;
    if (typeof window !== "undefined") {
      (window as any).blockNoteEditor = editor;
    }
    return () => {
      if (typeof window !== "undefined") {
        delete (window as any).blockNoteEditor;
      }
    };
  }, [editor]);

  // Renders the editor instance using a React component.
  return <BlockNoteView editor={editor} />;
}
