'use client';

import { memo, useCallback, useEffect, useRef } from 'react';
import { NodeProps, NodeResizer, useReactFlow } from '@xyflow/react';
import { Type, Trash2 } from 'lucide-react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';
import { TextLabelData } from '@/types/canvas';
import { useCanvasStore } from '@/store/canvas-store';
import { createPasteHandler } from '@/lib/blocknote-helpers';

function TextLabelNode({ id, data, selected, width, height }: NodeProps) {
  const typedData = data as TextLabelData;
  const updateNodeData = useCanvasStore((state) => state.updateNodeData);
  const deleteNode = useCanvasStore((state) => state.deleteNode);
  const { updateNode } = useReactFlow();
  const contentRef = useRef<HTMLDivElement>(null);
  const isManuallyResized = typedData.manuallyResized ?? false;
  const isProgrammaticResizeRef = useRef(false);
  const isUpdatingSizeRef = useRef(false);
  const lastHeightRef = useRef<number | null>(null);
  const currentWidthRef = useRef<number | null>(null);
  const currentHeightRef = useRef<number | null>(null);
  const hasSetDefaultWidthRef = useRef(false);
  const lastWidthRef = useRef<number | null>(null);
  const DEFAULT_WIDTH = 300;
  const DEFAULT_MIN_HEIGHT = 100;

  // Create editor instance
  const editor = useCreateBlockNote({
    initialContent: typedData.content && typedData.content.trim() !== '' 
      ? undefined
      : undefined,
    pasteHandler: createPasteHandler(),
  });

  // Load initial markdown content
  useEffect(() => {
    if (!editor || !typedData.content || typedData.content.trim() === '') {
      return;
    }

    const loadContent = async () => {
      try {
        let processedContent = typedData.content;
        processedContent = processedContent.replace(/^\s*\d+\.\s/gm, (match) => {
          const num = match.trim().split('.')[0];
          return `${num}. `;
        });
        
        const blocks = await editor.tryParseMarkdownToBlocks(processedContent);
        const currentMarkdown = await editor.blocksToMarkdownLossy(editor.document);
        if (currentMarkdown.trim() !== processedContent.trim()) {
          editor.replaceBlocks(editor.document, blocks);
        }
      } catch (error) {
        console.error('Failed to parse markdown:', error);
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
  }, [editor, typedData.content]);

  // Update refs when width/height change
  useEffect(() => {
    currentWidthRef.current = width || DEFAULT_WIDTH;
    currentHeightRef.current = height || DEFAULT_MIN_HEIGHT;
  }, [width, height]);

  // Update height when content changes
  const updateHeightFromContent = useCallback(() => {
    if (isManuallyResized || isUpdatingSizeRef.current || !contentRef.current) {
      return;
    }

    const editorElement = contentRef.current.querySelector('[data-id="editor-container"]') as HTMLElement;
    const contentElement = editorElement || contentRef.current.querySelector('.bn-container') as HTMLElement;
    
    if (!contentElement) return;

    const contentHeight = contentElement.scrollHeight || contentElement.offsetHeight;
    const padding = 24; // 12px top + 12px bottom
    const iconHeight = 40; // Icon and button area
    const newHeight = Math.max(DEFAULT_MIN_HEIGHT, contentHeight + padding + iconHeight);

    const currentWidth = currentWidthRef.current || DEFAULT_WIDTH;
    const currentHeight = currentHeightRef.current || DEFAULT_MIN_HEIGHT;

    if (Math.abs(newHeight - currentHeight) > 5) {
      lastHeightRef.current = newHeight;
      currentHeightRef.current = newHeight;
      isProgrammaticResizeRef.current = true;
      isUpdatingSizeRef.current = true;
      
      updateNode(id, {
        width: currentWidth,
        height: newHeight,
      });

      setTimeout(() => {
        isUpdatingSizeRef.current = false;
      }, 200);
    }
  }, [id, isManuallyResized, updateNode]);

  // Handle content changes
  const handleContentChange = useCallback(async () => {
    if (!editor) return;
    
    try {
      const markdown = await editor.blocksToMarkdownLossy(editor.document);
      updateNodeData(id, { content: markdown });
      
      setTimeout(updateHeightFromContent, 50);
    } catch (error) {
      console.error('Failed to convert to markdown:', error);
    }
  }, [editor, id, updateNodeData, updateHeightFromContent]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNode(id);
  }, [id, deleteNode]);

  // Track if user manually resized by detecting width changes
  useEffect(() => {
    if (isManuallyResized) {
      return;
    }

    if (isProgrammaticResizeRef.current) {
      isProgrammaticResizeRef.current = false;
      lastWidthRef.current = width || DEFAULT_WIDTH;
      return;
    }

    const currentWidth = width || DEFAULT_WIDTH;
    
    if (currentWidth !== DEFAULT_WIDTH && currentWidth !== lastWidthRef.current) {
      updateNodeData(id, { manuallyResized: true });
    }
    
    lastWidthRef.current = currentWidth;
  }, [id, width, isManuallyResized, updateNodeData]);

  // Initial height update when content is loaded
  useEffect(() => {
    if (isManuallyResized || !contentRef.current) {
      return;
    }

    const timeoutId = setTimeout(() => {
      if (isManuallyResized || isUpdatingSizeRef.current || !contentRef.current) {
        return;
      }

      const editorElement = contentRef.current.querySelector('[data-id="editor-container"]') as HTMLElement;
      const contentElement = editorElement || contentRef.current.querySelector('.bn-container') as HTMLElement;
      
      if (!contentElement) return;

      const contentHeight = contentElement.scrollHeight || contentElement.offsetHeight;
      const padding = 24;
      const iconHeight = 40;
      const newHeight = Math.max(DEFAULT_MIN_HEIGHT, contentHeight + padding + iconHeight);

      const currentWidth = currentWidthRef.current || DEFAULT_WIDTH;
      const currentHeight = currentHeightRef.current || DEFAULT_MIN_HEIGHT;

      if (Math.abs(newHeight - currentHeight) > 5) {
        lastHeightRef.current = newHeight;
        currentHeightRef.current = newHeight;
        isProgrammaticResizeRef.current = true;
        isUpdatingSizeRef.current = true;
        
        updateNode(id, {
          width: currentWidth,
          height: newHeight,
        });

        setTimeout(() => {
          isUpdatingSizeRef.current = false;
        }, 200);
      }
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [id, isManuallyResized, updateNode]);

  // Set default width if not set and not manually resized (only once on mount)
  useEffect(() => {
    if (hasSetDefaultWidthRef.current) {
      return;
    }

    const currentWidth = width || DEFAULT_WIDTH;
    const currentHeight = height || DEFAULT_MIN_HEIGHT;
    
    currentWidthRef.current = currentWidth;
    currentHeightRef.current = currentHeight;
    lastWidthRef.current = currentWidth;
    lastHeightRef.current = currentHeight;

    if (isManuallyResized) {
      hasSetDefaultWidthRef.current = true;
      return;
    }

    if (currentWidth !== DEFAULT_WIDTH) {
      hasSetDefaultWidthRef.current = true;
      isProgrammaticResizeRef.current = true;
      currentWidthRef.current = DEFAULT_WIDTH;
      lastWidthRef.current = DEFAULT_WIDTH;
      
      updateNode(id, {
        width: DEFAULT_WIDTH,
        height: currentHeight,
      });
    } else {
      hasSetDefaultWidthRef.current = true;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className={`
        relative bg-transparent rounded-lg border-2 border-dashed
        ${selected ? 'border-gray-400' : 'border-gray-300'}
        transition-all duration-200
        w-full h-full group
      `}
      style={{
        minWidth: DEFAULT_WIDTH,
        minHeight: DEFAULT_MIN_HEIGHT,
      }}
    >
      {/* Node Resizer */}
      <NodeResizer
        isVisible={selected}
        minWidth={DEFAULT_WIDTH}
        minHeight={DEFAULT_MIN_HEIGHT}
        handleClassName="!w-3 !h-3 !bg-gray-400 !border-2 !border-white !rounded-full"
        lineStyle={{ display: 'none' }}
      />

      <div className="flex items-start gap-2 px-12 py-6 h-full">
        <div 
          ref={contentRef}
          className="flex-1 min-h-[60px] overflow-auto"
          style={{
            width: '100%',
            overflowY: isManuallyResized ? 'auto' : 'visible',
            overflowX: 'hidden',
          }}
        >
          <div className="nodrag nopan" style={{ width: '100%' }}>
            <BlockNoteView
              editor={editor}
              onChange={handleContentChange}
              theme="light"
              data-color-mode="light"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(TextLabelNode);

