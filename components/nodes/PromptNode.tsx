'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { Handle, Position, NodeProps, NodeResizer, useReactFlow } from '@xyflow/react';
import { Sparkles, Play, Trash2, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';
import { PromptNodeData } from '@/types/canvas';
import { useCanvasStoreContext } from '@/lib/canvas-store-context';
import { createPasteHandler } from '@/lib/blocknote-helpers';

function PromptNode({ id, data, selected, width, height }: NodeProps) {
  const typedData = data as PromptNodeData;
  const { updateNodeData, deleteNode, toggleNodeCollapse } = useCanvasStoreContext();
  const { updateNode } = useReactFlow();
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [label, setLabel] = useState(typedData.label || 'Prompt');
  const contentRef = useRef<HTMLDivElement>(null);
  const isManuallyResized = typedData.manuallyResized ?? false;
  const isProgrammaticResizeRef = useRef(false);
  const lastHeightRef = useRef<number | null>(null);
  const isUpdatingSizeRef = useRef(false);
  const hasSetDefaultWidthRef = useRef(false);
  const lastWidthRef = useRef<number | null>(null);
  const currentWidthRef = useRef<number | null>(null);
  const currentHeightRef = useRef<number | null>(null);
  const savedHeightRef = useRef<number | null>(null);
  const DEFAULT_WIDTH = 400;
  const DEFAULT_MIN_HEIGHT = 200;
  const COLLAPSED_HEIGHT = 60; // Height when collapsed (header only)

  // Create editor instance with markdown support
  const editor = useCreateBlockNote({
    initialContent: typedData.content && typedData.content.trim() !== '' 
      ? undefined  // Will be loaded in useEffect
      : undefined,
    pasteHandler: createPasteHandler(),
  });

  // Update label when data changes
  useEffect(() => {
    if (typedData.label !== undefined) {
      setLabel(typedData.label || 'Prompt');
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

  // Track dark mode
  const [isDark, setIsDark] = useState(false);
  
  useEffect(() => {
    const checkTheme = () => {
      const isDarkMode = document.documentElement.classList.contains('dark');
      setIsDark(isDarkMode);
    };
    
    checkTheme();
    
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    
    return () => observer.disconnect();
  }, []);

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
  }, [id, isCollapsed, isManuallyResized, updateNode]);

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
    updateNodeData(id, { label: label || 'Prompt' });
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
  }, [id, isCollapsed, isManuallyResized, updateNode]);

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

  // Handle collapse/expand state changes
  useEffect(() => {
    if (isUpdatingSizeRef.current) {
      return;
    }

    const currentWidth = currentWidthRef.current || DEFAULT_WIDTH;
    const currentHeight = currentHeightRef.current || DEFAULT_MIN_HEIGHT;

    if (isCollapsed) {
      // Save current height before collapsing (if not already saved or if height changed)
      if (savedHeightRef.current === null || currentHeight > COLLAPSED_HEIGHT) {
        savedHeightRef.current = currentHeight;
      }
      
      // Only update if height is not already collapsed
      if (Math.abs(currentHeight - COLLAPSED_HEIGHT) > 5) {
        isProgrammaticResizeRef.current = true;
        isUpdatingSizeRef.current = true;
        
        updateNode(id, {
          width: currentWidth,
          height: COLLAPSED_HEIGHT,
        });

        setTimeout(() => {
          isUpdatingSizeRef.current = false;
        }, 200);
      }
    } else {
      // Restore saved height or calculate from content
      const heightToRestore = savedHeightRef.current || DEFAULT_MIN_HEIGHT;
      
      // Only update if height is different from what we want to restore
      if (Math.abs(currentHeight - heightToRestore) > 5) {
        isProgrammaticResizeRef.current = true;
        isUpdatingSizeRef.current = true;
        
        updateNode(id, {
          width: currentWidth,
          height: heightToRestore,
        });

        // After restoring, update height from content if needed
        setTimeout(() => {
          isUpdatingSizeRef.current = false;
          // Trigger height update from content after a short delay to allow content to render
          setTimeout(() => {
            updateHeightFromContent();
          }, 100);
        }, 200);
      } else {
        // Height is already correct, but still trigger content update in case content changed
        setTimeout(() => {
          updateHeightFromContent();
        }, 100);
      }
    }
  }, [isCollapsed, id, updateNode, updateHeightFromContent]);

  const { nodes, edges, setNodeRunning, createNoteNode } = useCanvasStoreContext();
  
  const handleRun = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!editor) return;
    
    // Get content from BlockNote editor
    const currentContent = await editor.blocksToMarkdownLossy(editor.document);
    if (!currentContent.trim()) {
      alert('Please enter a prompt first');
      return;
    }

    try {
      setNodeRunning(id, true);
      
      // Dynamic import to avoid SSR issues
      const { gatherAIContext, generateAIResponse } = await import('@/lib/ai-service');
      
      // Gather context from connected nodes
      const aiContext = gatherAIContext(id, nodes, edges);
      
      // Generate AI response
      const result = await generateAIResponse(currentContent, aiContext.contextNodes, aiContext.agentNode);
      
      // Check if there's a note connected as output (target from this prompt)
      const outgoingEdges = edges.filter((edge) => edge.source === id);
      let targetNoteId = '';
      
      for (const edge of outgoingEdges) {
        const targetNode = nodes.find((n) => n.id === edge.target);
        if (targetNode?.data.type === 'note') {
          targetNoteId = targetNode.id;
          break;
        }
      }
      
      if (targetNoteId) {
        // Update existing connected note
        console.log('Updating note node:', targetNoteId, 'with content length:', result.content.length);
        updateNodeData(targetNoteId, {
          content: result.content,
        });
      } else {
        // Create new note node with AI result
        console.log('Creating new note node with content length:', result.content.length);
        createNoteNode(id, result.content);
      }
      
    } catch (error: any) {
      console.error('AI generation error:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setNodeRunning(id, false);
    }
  }, [id, nodes, edges, updateNodeData, setNodeRunning, createNoteNode, editor]);

  return (
    <div
      className={`
        relative rounded-lg shadow-md border-2
        ${selected ? 'border-purple-500 shadow-lg' : isDark ? 'border-purple-800' : 'border-purple-200'}
        transition-all duration-200 hover:shadow-lg
        w-full h-full
        ${isDark ? 'bg-gradient-to-br from-purple-900/40 to-pink-900/40' : 'bg-gradient-to-br from-purple-50 to-pink-50'}
      `}
      style={{
        minWidth: '400px',
        minHeight: isCollapsed ? 'auto' : '200px'
      }}
    >
      {/* Node Resizer */}
      <NodeResizer
        isVisible={selected}
        minWidth={400}
        minHeight={200}
        handleClassName="!w-3 !h-3 !bg-purple-500 !border-2 !border-white !rounded-full"
      />
      
      {/* Handles for connections - Only visible when selected */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className={`!w-4 !h-4 !bg-purple-500 !border-2 !border-white !rounded-full transition-all ${selected ? 'opacity-100' : 'opacity-0'}`}
        style={{ left: '-12px' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className={`!w-4 !h-4 !bg-purple-500 !border-2 !border-white !rounded-full transition-all ${selected ? 'opacity-100' : 'opacity-0'}`}
        style={{ right: '-12px' }}
      />

      {/* Header */}
      <div className={`flex items-center justify-between p-3 border-b ${isDark ? 'border-purple-800' : 'border-purple-100'}`}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Sparkles className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-purple-400' : 'text-purple-500'}`} />
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
              className={`nodrag nopan text-sm font-semibold bg-transparent border rounded px-1 focus:outline-none focus:ring-1 flex-1 min-w-0 ${isDark ? 'text-purple-200 border-purple-600 focus:ring-purple-500' : 'text-purple-700 border-purple-300 focus:ring-purple-500'}`}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              onClick={() => setIsEditingLabel(true)}
              className={`text-sm font-semibold cursor-text truncate ${isDark ? 'text-purple-200 hover:text-purple-100' : 'text-purple-700 hover:text-purple-900'}`}
            >
              {label || 'Prompt'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={handleRun}
            disabled={typedData.isRunning}
            className={`p-1 rounded transition-colors disabled:opacity-50 ${isDark ? 'hover:bg-purple-800' : 'hover:bg-purple-100'}`}
          >
            {typedData.isRunning ? (
              <Loader2 className={`w-3 h-3 animate-spin ${isDark ? 'text-purple-400' : 'text-purple-500'}`} />
            ) : (
              <Play className={`w-3 h-3 ${isDark ? 'text-purple-400' : 'text-purple-500'}`} />
            )}
          </button>
          <button
            onClick={handleToggleCollapse}
            className={`p-1 rounded transition-colors ${isDark ? 'hover:bg-purple-800' : 'hover:bg-purple-100'}`}
            title={isCollapsed ? 'Развернуть' : 'Свернуть'}
          >
            {isCollapsed ? (
              <ChevronDown className={`w-3 h-3 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
            ) : (
              <ChevronUp className={`w-3 h-3 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
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
          className="px-12 py-6 flex-1 overflow-auto"
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

export default PromptNode;

