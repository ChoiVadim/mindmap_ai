'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { Handle, Position, NodeProps, NodeResizer, useReactFlow } from '@xyflow/react';
import { Bot, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';
import { AgentNodeData, AIProvider } from '@/types/canvas';
import { useCanvasStoreContext } from '@/lib/canvas-store-context';
import { createPasteHandler } from '@/lib/blocknote-helpers';

// Model options for each provider
const MODEL_OPTIONS: Record<AIProvider, string[]> = {
  openai: ['gpt-4o', 'gpt-4o-mini'],
  gemini: ['gemini-2.5-flash', 'gemini-2.0-flash-lite'],
  claude: ['claude-sonnet-4-5'],
};

function AgentNode({ id, data, selected, width, height }: NodeProps) {
  const typedData = data as AgentNodeData;
  const { updateNodeData, deleteNode, toggleNodeCollapse } = useCanvasStoreContext();
  const { updateNode } = useReactFlow();
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [label, setLabel] = useState(typedData.label || 'AI Agent');
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
  const DEFAULT_MIN_HEIGHT = 300;
  const COLLAPSED_HEIGHT = 60; // Height when collapsed (header only)

  // Create editor instance for system prompt
  const editor = useCreateBlockNote({
    initialContent: typedData.systemPrompt && typedData.systemPrompt.trim() !== '' 
      ? undefined
      : undefined,
    pasteHandler: createPasteHandler(),
  });

  // Update label when data changes
  useEffect(() => {
    if (typedData.label !== undefined) {
      setLabel(typedData.label || 'AI Agent');
    }
  }, [typedData.label]);

  // Load initial markdown content
  useEffect(() => {
    if (!editor || !typedData.systemPrompt || typedData.systemPrompt.trim() === '') {
      return;
    }

    const loadContent = async () => {
      try {
        let processedContent = typedData.systemPrompt;
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
              content: typedData.systemPrompt,
            },
          ] as any);
        } catch (e) {
          console.error('Failed to insert as plain text:', e);
        }
      }
    };
    
    loadContent();
  }, [editor, typedData.systemPrompt]);

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
    const selectorHeight = 120; // Approximate height for provider/model selectors
    const padding = 48; // 24px top + 24px bottom
    const newHeight = Math.max(DEFAULT_MIN_HEIGHT, contentHeight + headerHeight + selectorHeight + padding);

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

  // Handle system prompt changes
  const handleSystemPromptChange = useCallback(async () => {
    if (!editor) return;
    
    try {
      const markdown = await editor.blocksToMarkdownLossy(editor.document);
      updateNodeData(id, { systemPrompt: markdown });
      
      // Update height after content change with multiple attempts to ensure it works
      setTimeout(updateHeightFromContent, 50);
      setTimeout(updateHeightFromContent, 150);
      setTimeout(updateHeightFromContent, 300);
    } catch (error) {
      console.error('Failed to convert to markdown:', error);
    }
  }, [editor, id, updateNodeData, updateHeightFromContent]);

  const handleProviderChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvider = e.target.value as AIProvider;
    const defaultModel = MODEL_OPTIONS[newProvider][0];
    updateNodeData(id, { 
      provider: newProvider,
      model: defaultModel,
    });
  }, [id, updateNodeData]);

  const handleModelChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    updateNodeData(id, { model: e.target.value });
  }, [id, updateNodeData]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNode(id);
  }, [id, deleteNode]);

  const handleLabelChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLabel(e.target.value);
  }, []);

  const handleLabelBlur = useCallback(() => {
    setIsEditingLabel(false);
    updateNodeData(id, { label: label || 'AI Agent' });
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

  // Initial height update when content is loaded and observe content changes
  useEffect(() => {
    if (isCollapsed || isManuallyResized || !contentRef.current) {
      return;
    }

    // Function to update height
    const performHeightUpdate = () => {
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
      const selectorHeight = 120;
      const padding = 48;
      const newHeight = Math.max(DEFAULT_MIN_HEIGHT, contentHeight + headerHeight + selectorHeight + padding);

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
    };

    // Wait for editor to render
    const timeoutId1 = setTimeout(performHeightUpdate, 200);
    const timeoutId2 = setTimeout(performHeightUpdate, 500);
    const timeoutId3 = setTimeout(performHeightUpdate, 1000);

    // Set up MutationObserver to watch for content changes with debounce
    let debounceTimeout: NodeJS.Timeout | null = null;
    const observer = new MutationObserver(() => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      debounceTimeout = setTimeout(() => {
        performHeightUpdate();
      }, 100);
    });

    // Observe changes in the content container
    if (contentRef.current) {
      observer.observe(contentRef.current, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ['style', 'class'],
      });
    }

    return () => {
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);
      clearTimeout(timeoutId3);
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      observer.disconnect();
    };
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

  return (
    <div
      className={`
        relative rounded-lg shadow-md border-2
        ${selected ? 'border-blue-500 shadow-lg' : isDark ? 'border-blue-800' : 'border-blue-200'}
        transition-all duration-200 hover:shadow-lg
        w-full h-full
        ${isDark ? 'bg-gradient-to-br from-blue-900/40 to-cyan-900/40' : 'bg-gradient-to-br from-blue-50 to-cyan-50'}
      `}
      style={{
        minWidth: '400px',
        minHeight: isCollapsed ? 'auto' : '300px'
      }}
    >
      {/* Node Resizer */}
      <NodeResizer
        isVisible={selected}
        minWidth={400}
        minHeight={300}
        handleClassName="!w-3 !h-3 !bg-blue-500 !border-2 !border-white !rounded-full"
      />
      
      {/* Handles for connections */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className={`!w-4 !h-4 !bg-blue-500 !border-2 !border-white !rounded-full transition-all ${selected ? 'opacity-100' : 'opacity-0'}`}
        style={{ left: '-12px' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className={`!w-4 !h-4 !bg-blue-500 !border-2 !border-white !rounded-full transition-all ${selected ? 'opacity-100' : 'opacity-0'}`}
        style={{ right: '-12px' }}
      />

      {/* Header */}
      <div className={`flex items-center justify-between p-3 border-b ${isDark ? 'border-blue-800' : 'border-blue-100'}`}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Bot className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
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
              className={`nodrag nopan text-sm font-semibold bg-transparent border rounded px-1 focus:outline-none focus:ring-1 flex-1 min-w-0 ${isDark ? 'text-blue-200 border-blue-600 focus:ring-blue-500' : 'text-blue-700 border-blue-300 focus:ring-blue-500'}`}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              onClick={() => setIsEditingLabel(true)}
              className={`text-sm font-semibold cursor-text truncate ${isDark ? 'text-blue-200 hover:text-blue-100' : 'text-blue-700 hover:text-blue-900'}`}
            >
              {label || 'AI Agent'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={handleToggleCollapse}
            className={`p-1 rounded transition-colors ${isDark ? 'hover:bg-blue-800' : 'hover:bg-blue-100'}`}
            title={isCollapsed ? 'Развернуть' : 'Свернуть'}
          >
            {isCollapsed ? (
              <ChevronDown className={`w-3 h-3 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            ) : (
              <ChevronUp className={`w-3 h-3 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
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
        <>
          {/* Provider and Model Selection */}
          <div className={`p-3 border-b space-y-2 ${isDark ? 'border-blue-800' : 'border-blue-100'}`}>
            <div>
              <label className={`text-xs font-medium mb-1 block ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Provider</label>
              <select
                value={typedData.provider}
                onChange={handleProviderChange}
                className={`w-full px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-gray-700 border-blue-800 text-gray-200' : 'bg-white border-blue-200 text-gray-900'}`}
              >
                <option value="openai">OpenAI</option>
                <option value="gemini">Google Gemini</option>
                <option value="claude">Anthropic Claude</option>
              </select>
            </div>
            <div>
              <label className={`text-xs font-medium mb-1 block ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Model</label>
              <select
                value={typedData.model || MODEL_OPTIONS[typedData.provider][0]}
                onChange={handleModelChange}
                className={`w-full px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-gray-700 border-blue-800 text-gray-200' : 'bg-white border-blue-200 text-gray-900'}`}
              >
                {MODEL_OPTIONS[typedData.provider].map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* System Prompt Editor */}
          <div 
            ref={contentRef}
            className="px-12 py-6 flex-1 min-h-[200px] overflow-auto"
            style={{
              width: '100%',
              overflowY: isManuallyResized ? 'auto' : 'visible',
              overflowX: 'hidden',
            }}
          >
            <label className={`text-xs font-medium mb-2 block ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>System Prompt</label>
            <div className="nodrag nopan" style={{ width: '100%' }}>
              <BlockNoteView
                editor={editor}
                onChange={handleSystemPromptChange}
                theme="light"
                data-color-mode="light"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AgentNode;

