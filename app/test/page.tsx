"use client";

import Editor from "@/components/DynamicEditor";
import { useState } from "react";

export default function Test() {
  const [markdownInput, setMarkdownInput] = useState(`# Hello World

This is **bold** text and this is *italic* text.

## Features

- List item 1
- List item 2
- List item 3

### Code Example

\`\`\`javascript
const example = "This is code";
\`\`\`

> This is a blockquote

1. Numbered item 1
2. Numbered item 2
3. Numbered item 3`);

  const handlePasteMarkdown = async () => {
    if (typeof window !== "undefined" && (window as any).blockNoteEditor) {
      const editor = (window as any).blockNoteEditor;
      try {
        // Use pasteMarkdown - inserts at the current cursor position
        editor.pasteMarkdown(markdownInput);
      } catch (error) {
        console.error("Error with pasteMarkdown:", error);
        // Fallback: parse markdown to blocks and replace entire document
        try {
          const blocks = await editor.tryParseMarkdownToBlocks(markdownInput);
          editor.replaceBlocks(editor.document, blocks);
        } catch (fallbackError) {
          console.error("Error with fallback method:", fallbackError);
          alert("Error pasting markdown. Check console for details.");
        }
      }
    }
  };

  const handleClearEditor = () => {
    if (typeof window !== "undefined" && (window as any).blockNoteEditor) {
      const editor = (window as any).blockNoteEditor;
      editor.replaceBlocks(editor.document, []);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-6">BlockNote Editor Test</h1>
      
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Controls */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <h2 className="text-xl font-semibold mb-4">Test pasteMarkdown Method</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Markdown Input (edit this to test different markdown):
              </label>
              <textarea
                value={markdownInput}
                onChange={(e) => setMarkdownInput(e.target.value)}
                className="w-full h-48 p-3 border rounded-md font-mono text-sm"
                placeholder="Enter markdown here..."
              />
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={handlePasteMarkdown}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Paste Markdown into Editor
              </button>
              <button
                onClick={handleClearEditor}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Clear Editor
              </button>
            </div>
            
            <div className="text-sm text-gray-600">
              <p className="font-semibold mb-1">Usage:</p>
              <code className="bg-gray-200 px-2 py-1 rounded">
                editor.pasteMarkdown(markdownString)
              </code>
              <p className="mt-2">
                You can also test this in the browser console: <code className="bg-gray-200 px-2 py-1 rounded">window.blockNoteEditor.pasteMarkdown("# Test")</code>
              </p>
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">BlockNote Editor</h2>
          <Editor />
        </div>
      </div>
    </div>
  );
}