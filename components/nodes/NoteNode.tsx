'use client';

import { useCallback, useEffect } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from '@xyflow/react';
import { StickyNote, Trash2 } from 'lucide-react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';
import { NoteNodeData } from '@/types/canvas';
import { useCanvasStore } from '@/store/canvas-store';  

function NoteNode({ id, data, selected }: NodeProps) {
  const typedData = data as NoteNodeData;
  const updateNodeData = useCanvasStore((state) => state.updateNodeData);
  const deleteNode = useCanvasStore((state) => state.deleteNode);

  // Create editor instance with markdown support
  const editor = useCreateBlockNote({
    initialContent: typedData.content && typedData.content.trim() !== '' 
      ? undefined  // Will be loaded in useEffect
      : undefined,
    // Fix for numbered lists without start attribute
    _tiptapOptions: {
      editorProps: {
        transformPastedHTML(html) {
          // Fix ordered lists that don't have start attribute
          // Handle both <ol> and <ol with attributes>
          return html.replace(/<ol(\s|>)/g, (match, after) => {
            // If there's already a start attribute, leave it
            if (match.includes('start=')) {
              return match;
            }
            // Otherwise add start="1"
            return `<ol start="1"${after}`;
          });
        },
        transformPastedText(text) {
          // Also handle plain text paste - ensure no issues with special characters
          return text;
        },
      },
    },
  });

  // Load initial markdown content and update when content changes
  useEffect(() => {
    if (!editor || !typedData.content || typedData.content.trim() === '') {
      return;
    }

    const loadContent = async () => {
      try {
        // Preprocess markdown to fix common issues
        let processedContent = typedData.content;
        
        // Fix numbered lists: ensure they start with 1. 2. 3. etc
        processedContent = processedContent.replace(/^\s*\d+\.\s/gm, (match) => {
          const num = match.trim().split('.')[0];
          return `${num}. `;
        });
        
        const blocks = await editor.tryParseMarkdownToBlocks(processedContent);
        // Only update if blocks are different
        const currentMarkdown = await editor.blocksToMarkdownLossy(editor.document);
        if (currentMarkdown.trim() !== processedContent.trim()) {
          editor.replaceBlocks(editor.document, blocks);
        }
      } catch (error) {
        console.error('Failed to parse markdown:', error);
        // If parsing fails, try to insert as plain text
        try {
          editor.replaceBlocks(editor.document, [
            {
              type: "paragraph",
              content: typedData.content,
            },
          ] as any);
        } catch (e) {
          console.error('Failed to insert as plain text:', e);
        }
      }
    };
    
    loadContent();
  }, [editor, typedData.content]); // Update when content changes

  // Handle content changes
  const handleChange = useCallback(async () => {
    if (!editor) return;
    
    try {
      const markdown = await editor.blocksToMarkdownLossy(editor.document);
      updateNodeData(id, { content: markdown });
    } catch (error) {
      console.error('Failed to convert to markdown:', error);
    }
  }, [editor, id, updateNodeData]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNode(id);
  }, [id, deleteNode]);

  return (
    <div
      className={`
        relative bg-white rounded-lg shadow-md border-2
        ${selected ? 'border-blue-500 shadow-lg' : 'border-gray-200'}
        transition-all duration-200 hover:shadow-lg
        w-full h-full flex flex-col
      `}
      style={{ 
        backgroundColor: typedData.color || '#ffffff',
        minWidth: '400px',
        minHeight: '400px'
      }}
    >
      {/* Node Resizer */}
      <NodeResizer
        isVisible={selected}
        minWidth={400}
        minHeight={400}
        handleClassName="!w-3 !h-3 !bg-blue-500 !border-2 !border-white !rounded-full"
      />
      
      {/* Handles for connections - Only visible when selected */}
      {/* Left side - both source and target */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className={`!w-4 !h-4 !bg-blue-500 !border-2 !border-white !rounded-full transition-all ${selected ? 'opacity-100' : 'opacity-0'}`}
        style={{ left: '-5px' }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left-source"
        className={`!w-4 !h-4 !bg-blue-500 !border-2 !border-white !rounded-full transition-all ${selected ? 'opacity-100' : 'opacity-0'}`}
        style={{ left: '-5px' }}
      />
      
      {/* Right side - both source and target */}
      <Handle
        type="target"
        position={Position.Right}
        id="right"
        className={`!w-4 !h-4 !bg-blue-500 !border-2 !border-white !rounded-full transition-all ${selected ? 'opacity-100' : 'opacity-0'}`}
        style={{ right: '-5px' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        className={`!w-4 !h-4 !bg-blue-500 !border-2 !border-white !rounded-full transition-all ${selected ? 'opacity-100' : 'opacity-0'}`}
        style={{ right: '-5px' }}
      />
      
      {/* Top side - both source and target */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className={`!w-4 !h-4 !bg-blue-500 !border-2 !border-white !rounded-full transition-all ${selected ? 'opacity-100' : 'opacity-0'}`}
        style={{ top: '-5px' }}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top-source"
        className={`!w-4 !h-4 !bg-blue-500 !border-2 !border-white !rounded-full transition-all ${selected ? 'opacity-100' : 'opacity-0'}`}
        style={{ top: '-5px' }}
      />
      
      {/* Bottom side - both source and target */}
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom"
        className={`!w-4 !h-4 !bg-blue-500 !border-2 !border-white !rounded-full transition-all ${selected ? 'opacity-100' : 'opacity-0'}`}
        style={{ bottom: '-5px' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-source"
        className={`!w-4 !h-4 !bg-blue-500 !border-2 !border-white !rounded-full transition-all ${selected ? 'opacity-100' : 'opacity-0'}`}
        style={{ bottom: '-5px' }}
      />

      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-semibold text-gray-700">Note</span>
        </div>
        <button
          onClick={handleDelete}
          className="p-1 hover:bg-red-50 rounded transition-colors"
        >
          <Trash2 className="w-3 h-3 text-red-500" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-3 min-h-[200px] overflow-auto">
        <div className="h-full nodrag nopan">
          <BlockNoteView
            editor={editor}
            onChange={handleChange}
            theme="light"
            data-color-mode="light"
          />
        </div>
      </div>
    </div>
  );
}

export default NoteNode;

