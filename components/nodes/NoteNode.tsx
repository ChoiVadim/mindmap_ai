'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { Handle, Position, NodeProps, NodeResizer, useReactFlow } from '@xyflow/react';
import { StickyNote, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';
import { NoteNodeData } from '@/types/canvas';
import { useCanvasStore } from '@/store/canvas-store';  

function NoteNode({ id, data, selected, width, height }: NodeProps) {
  const typedData = data as NoteNodeData;
  const updateNodeData = useCanvasStore((state) => state.updateNodeData);
  const deleteNode = useCanvasStore((state) => state.deleteNode);
  const toggleNodeCollapse = useCanvasStore((state) => state.toggleNodeCollapse);
  const { updateNode } = useReactFlow();
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [label, setLabel] = useState(typedData.label || 'Note');
  const contentRef = useRef<HTMLDivElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
  const isManuallyResized = typedData.manuallyResized ?? false;
  const isProgrammaticResizeRef = useRef(false);
  const lastHeightRef = useRef<number | null>(null);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUpdatingSizeRef = useRef(false);
  const hasSetDefaultWidthRef = useRef(false);
  const lastWidthRef = useRef<number | null>(null);
  const currentWidthRef = useRef<number | null>(null);
  const currentHeightRef = useRef<number | null>(null);
  const DEFAULT_WIDTH = 400;
  const DEFAULT_MIN_HEIGHT = 400;

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

  // Update label when data changes
  useEffect(() => {
    if (typedData.label !== undefined) {
      setLabel(typedData.label || 'Note');
    }
  }, [typedData.label]);

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

  const isCollapsed = typedData.collapsed ?? false;

  // Update refs when width/height change
  useEffect(() => {
    currentWidthRef.current = width || DEFAULT_WIDTH;
    currentHeightRef.current = height || DEFAULT_MIN_HEIGHT;
  }, [width, height]);

  // Update height when content changes
  const updateHeightFromContent = useCallback(() => {
    if (isCollapsed || isManuallyResized || isUpdatingSizeRef.current || !contentRef.current) {
      return;
    }

    // Find the actual editor content element
    const editorElement = contentRef.current.querySelector('[data-id="editor-container"]') as HTMLElement;
    const contentElement = editorElement || contentRef.current.querySelector('.bn-container') as HTMLElement;
    
    if (!contentElement) return;

    // Use scrollHeight to get the actual content height
    const contentHeight = contentElement.scrollHeight || contentElement.offsetHeight;
    const headerHeight = 60; // Approximate header height
    const padding = 24; // 12px top + 12px bottom
    const newHeight = Math.max(DEFAULT_MIN_HEIGHT, contentHeight + headerHeight + padding);

    const currentWidth = currentWidthRef.current || DEFAULT_WIDTH;
    const currentHeight = currentHeightRef.current || DEFAULT_MIN_HEIGHT;

    // Only update if height actually changed significantly
    if (Math.abs(newHeight - currentHeight) > 5) {
      lastHeightRef.current = newHeight;
      currentHeightRef.current = newHeight;
      isProgrammaticResizeRef.current = true;
      isUpdatingSizeRef.current = true;
      
      updateNode(id, {
        width: currentWidth,
        height: newHeight,
      });

      // Reset the flag after a short delay
      setTimeout(() => {
        isUpdatingSizeRef.current = false;
      }, 200);
    }
  }, [id, isCollapsed, isManuallyResized, updateNode]); // Removed width and height from dependencies

  // Handle content changes
  const handleChange = useCallback(async () => {
    if (!editor) return;
    
    try {
      const markdown = await editor.blocksToMarkdownLossy(editor.document);
      updateNodeData(id, { content: markdown });
      
      // Update height after content change
      setTimeout(updateHeightFromContent, 50);
    } catch (error) {
      console.error('Failed to convert to markdown:', error);
    }
  }, [editor, id, updateNodeData, updateHeightFromContent]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNode(id);
  }, [id, deleteNode]);

  const handleLabelChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLabel(e.target.value);
  }, []);

  const handleLabelBlur = useCallback(() => {
    setIsEditingLabel(false);
    updateNodeData(id, { label: label || 'Note' });
  }, [id, label, updateNodeData]);

  const handleToggleCollapse = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    toggleNodeCollapse(id);
  }, [id, toggleNodeCollapse]);

  // Track if user manually resized by detecting width changes
  useEffect(() => {
    if (isManuallyResized) {
      return;
    }

    // Skip if this is a programmatic resize
    if (isProgrammaticResizeRef.current) {
      isProgrammaticResizeRef.current = false;
      lastWidthRef.current = width || DEFAULT_WIDTH;
      return;
    }

    const currentWidth = width || DEFAULT_WIDTH;
    
    // If width changed and it's different from default, and it's not the same as last width we set
    if (currentWidth !== DEFAULT_WIDTH && currentWidth !== lastWidthRef.current) {
      // This is a manual resize by user
      updateNodeData(id, { manuallyResized: true });
    }
    
    lastWidthRef.current = currentWidth;
  }, [id, width, isManuallyResized, updateNodeData]);

  // Initial height update when content is loaded
  useEffect(() => {
    if (isCollapsed || isManuallyResized || !contentRef.current) {
      return;
    }

    // Wait for editor to render
    const timeoutId = setTimeout(() => {
      // Check flags again in case they changed
      if (isManuallyResized || isUpdatingSizeRef.current || !contentRef.current) {
        return;
      }

      // Find the actual editor content element
      const editorElement = contentRef.current.querySelector('[data-id="editor-container"]') as HTMLElement;
      const contentElement = editorElement || contentRef.current.querySelector('.bn-container') as HTMLElement;
      
      if (!contentElement) return;

      // Use scrollHeight to get the actual content height
      const contentHeight = contentElement.scrollHeight || contentElement.offsetHeight;
      const headerHeight = 60;
      const padding = 24;
      const newHeight = Math.max(DEFAULT_MIN_HEIGHT, contentHeight + headerHeight + padding);

      const currentWidth = currentWidthRef.current || DEFAULT_WIDTH;
      const currentHeight = currentHeightRef.current || DEFAULT_MIN_HEIGHT;

      // Only update if height actually changed significantly
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
  }, [id, isCollapsed, isManuallyResized, updateNode]); // Use updateNode directly

  // Set default width if not set and not manually resized (only once on mount)
  useEffect(() => {
    // Only run once when component mounts
    if (hasSetDefaultWidthRef.current) {
      return;
    }

    // Use current values from props
    const currentWidth = width || DEFAULT_WIDTH;
    const currentHeight = height || DEFAULT_MIN_HEIGHT;
    
    // Initialize refs
    currentWidthRef.current = currentWidth;
    currentHeightRef.current = currentHeight;
    lastWidthRef.current = currentWidth;
    lastHeightRef.current = currentHeight;

    if (isManuallyResized) {
      hasSetDefaultWidthRef.current = true;
      return;
    }

    // Only set default width if width is different from default
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
  }, []); // Run only once on mount - eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={nodeRef}
      className={`
        relative bg-white rounded-lg shadow-md border-2
        ${selected ? 'border-blue-500 shadow-lg' : 'border-gray-200'}
        transition-all duration-200 hover:shadow-lg
        w-full h-full flex flex-col
      `}
      style={{ 
        backgroundColor: typedData.color || '#ffffff',
        minWidth: `${DEFAULT_WIDTH}px`,
        minHeight: isCollapsed ? 'auto' : `${DEFAULT_MIN_HEIGHT}px`
      }}
    >
      {/* Node Resizer */}
      <NodeResizer
        isVisible={selected}
        minWidth={DEFAULT_WIDTH}
        minHeight={DEFAULT_MIN_HEIGHT}
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
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <StickyNote className="w-4 h-4 text-blue-500 flex-shrink-0" />
          {isEditingLabel ? (
            <input
              autoFocus
              value={label}
              onChange={handleLabelChange}
              onBlur={handleLabelBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleLabelBlur();
                }
              }}
              className="nodrag nopan text-sm font-semibold text-gray-700 bg-transparent border border-blue-300 rounded px-1 focus:outline-none focus:ring-1 focus:ring-blue-500 flex-1 min-w-0"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              onClick={() => setIsEditingLabel(true)}
              className="text-sm font-semibold text-gray-700 cursor-text hover:text-gray-900 truncate"
            >
              {label || 'Note'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={handleToggleCollapse}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title={isCollapsed ? 'Развернуть' : 'Свернуть'}
          >
            {isCollapsed ? (
              <ChevronDown className="w-3 h-3 text-gray-600" />
            ) : (
              <ChevronUp className="w-3 h-3 text-gray-600" />
            )}
          </button>
          <button
            onClick={handleDelete}
            className="p-1 hover:bg-red-50 rounded transition-colors"
          >
            <Trash2 className="w-3 h-3 text-red-500" />
          </button>
        </div>
      </div>

      {/* Content - only show when not collapsed */}
      {!isCollapsed && (
        <div 
          ref={contentRef}
          className="flex-1 p-3 min-h-[200px] overflow-auto"
          style={{
            width: '100%',
            overflowY: isManuallyResized ? 'auto' : 'visible',
            overflowX: 'hidden',
          }}
        >
          <div className="nodrag nopan" style={{ width: '100%' }}>
            <BlockNoteView
              editor={editor}
              onChange={handleChange}
              theme="light"
              data-color-mode="light"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default NoteNode;

