// Shared BlockNote helpers to handle paste operations

// Extract plain text from HTML while preserving line breaks
export function extractTextFromHTML(html: string): string {
  if (typeof window === "undefined") {
    return html;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  return doc.body?.textContent ?? "";
}

// Normalize numbered lists in Markdown/Plain text to bullet lists
export function normalizeLists(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/^\s*\d+\.\s+/gm, "- ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Check if text contains markdown formatting
export function containsMarkdown(text: string): boolean {
  const markdownPatterns = [
    /^#{1,6}\s/m,           // Headers
    /\*\*.*?\*\*/,          // Bold
    /\*.*?\*/,              // Italic
    /^\s*[-*+]\s/m,         // Unordered lists
    /^\s*\d+\.\s/m,         // Numbered lists
    /```/,                  // Code blocks
    /`[^`]+`/,              // Inline code
    /^>\s/m,                // Blockquotes
  ];
  
  return markdownPatterns.some(pattern => pattern.test(text));
}

// Create a standard pasteHandler for BlockNote that converts numbered lists to bullet lists
export function createPasteHandler() {
  return ({ event, editor, defaultPasteHandler }: any) => {
    const clipboardData = event.clipboardData;
    if (!clipboardData) {
      return defaultPasteHandler();
    }

    try {
      // Priority 1: Check if we have HTML content
      if (clipboardData.types.includes("text/html")) {
        const html = clipboardData.getData("text/html");
        
        if (html.trim()) {
          const text = extractTextFromHTML(html);
          const normalized = normalizeLists(text);
          
          // Use pasteMarkdown to insert the normalized content
          editor.pasteMarkdown(normalized);
          return true;
        }
      }
      
      // Priority 2: Check if we have plain text
      if (clipboardData.types.includes("text/plain")) {
        const text = clipboardData.getData("text/plain");
        
        if (text.trim()) {
          const normalized = normalizeLists(text);
          
          // Check if text contains markdown formatting
          if (containsMarkdown(normalized)) {
            editor.pasteMarkdown(normalized);
          } else {
            editor.pasteText(normalized);
          }
          
          return true;
        }
      }
    } catch (error) {
      console.error('Error handling paste:', error);
      return defaultPasteHandler();
    }
    
    return defaultPasteHandler();
  };
}

