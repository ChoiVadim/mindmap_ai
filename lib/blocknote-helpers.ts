// Shared BlockNote helpers to handle paste operations

// Convert HTML to Markdown while preserving formatting
export function convertHTMLToMarkdown(html: string): string {
  if (typeof window === "undefined") {
    return html;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  
  // Process a DOM node and convert to Markdown
  function processNode(node: Node): string {
    // Text node - return content
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }
    
    // Element node - convert based on tag
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      const tagName = element.tagName.toLowerCase();
      
      // Get content of child nodes
      const childrenContent = Array.from(element.childNodes)
        .map(child => processNode(child))
        .join('');
      
      switch (tagName) {
        // Headers
        case 'h1':
          return `# ${childrenContent}\n\n`;
        case 'h2':
          return `## ${childrenContent}\n\n`;
        case 'h3':
          return `### ${childrenContent}\n\n`;
        case 'h4':
          return `#### ${childrenContent}\n\n`;
        case 'h5':
          return `##### ${childrenContent}\n\n`;
        case 'h6':
          return `###### ${childrenContent}\n\n`;
        
        // Bold
        case 'strong':
        case 'b':
          return `**${childrenContent}**`;
        
        // Italic
        case 'em':
        case 'i':
          return `*${childrenContent}*`;
        
        // Code
        case 'code':
          // Check if it's a code block or inline code
          if (element.parentElement?.tagName.toLowerCase() === 'pre') {
            return childrenContent;
          }
          return `\`${childrenContent}\``;
        
        case 'pre':
          return `\`\`\`\n${childrenContent}\n\`\`\`\n\n`;
        
        // Lists - convert ordered lists to unordered
        case 'ol':
        case 'ul':
          const listItems = Array.from(element.children)
            .filter(child => child.tagName.toLowerCase() === 'li')
            .map((li) => {
              // Process each child node to preserve formatting
              const liContent = Array.from(li.childNodes)
                .map(child => processNode(child))
                .join('')
                .trim()
                .replace(/\n\n/g, '\n'); // Remove paragraph breaks inside list items
              return `- ${liContent}`;
            })
            .join('\n');
          return '\n' + listItems + '\n\n';
        
        case 'li':
          // Process children but don't add list marker (handled by ol/ul)
          return Array.from(element.childNodes)
            .map(child => processNode(child))
            .join('');
        
        // Paragraphs
        case 'p':
          // Check if paragraph is inside a list item
          let parent = element.parentElement;
          while (parent) {
            if (parent.tagName.toLowerCase() === 'li') {
              // Inside list item - don't add extra newlines
              return childrenContent;
            }
            parent = parent.parentElement;
          }
          return `${childrenContent}\n\n`;
        
        // Line breaks
        case 'br':
          return '\n';
        
        // Blockquote
        case 'blockquote':
          return childrenContent.split('\n')
            .map(line => line.trim() ? `> ${line}` : '>')
            .join('\n') + '\n\n';
        
        // Links
        case 'a':
          const href = element.getAttribute('href');
          if (href) {
            return `[${childrenContent}](${href})`;
          }
          return childrenContent;
        
        // Divs and other containers - just return content
        case 'div':
        case 'span':
        case 'article':
        case 'section':
          return childrenContent;
        
        default:
          return childrenContent;
      }
    }
    
    return '';
  }
  
  const markdown = processNode(doc.body);
  
  // Clean up excessive newlines
  return markdown
    .replace(/\n{3,}/g, '\n\n')
    .trim();
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
          // Try using pasteHTML directly - BlockNote should handle HTML conversion
          try {
            editor.pasteHTML(html);
            return true;
          } catch (htmlError) {
            // If pasteHTML fails, fall back to Markdown conversion
            console.warn('pasteHTML failed, falling back to Markdown conversion:', htmlError);
            const markdown = convertHTMLToMarkdown(html);
            const normalized = normalizeLists(markdown);
            editor.pasteMarkdown(normalized);
            return true;
          }
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

