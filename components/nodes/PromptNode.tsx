'use client';

import { useCallback, useEffect, useState } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from '@xyflow/react';
import { Sparkles, Play, Trash2, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';
import { PromptNodeData } from '@/types/canvas';
import { useCanvasStore } from '@/store/canvas-store';

function PromptNode({ id, data, selected }: NodeProps) {
  const typedData = data as PromptNodeData;
  const updateNodeData = useCanvasStore((state) => state.updateNodeData);
  const deleteNode = useCanvasStore((state) => state.deleteNode);
  const toggleNodeCollapse = useCanvasStore((state) => state.toggleNodeCollapse);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [label, setLabel] = useState(typedData.label || 'Prompt');

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

  const isCollapsed = typedData.collapsed ?? false;

  const nodes = useCanvasStore((state) => state.nodes);
  const edges = useCanvasStore((state) => state.edges);
  const setNodeRunning = useCanvasStore((state) => state.setNodeRunning);
  const createNoteNode = useCanvasStore((state) => state.createNoteNode);
  
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
        relative bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg shadow-md border-2
        ${selected ? 'border-purple-500 shadow-lg' : 'border-purple-200'}
        transition-all duration-200 hover:shadow-lg
        w-full h-full
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
        style={{ left: '-5px' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className={`!w-4 !h-4 !bg-purple-500 !border-2 !border-white !rounded-full transition-all ${selected ? 'opacity-100' : 'opacity-0'}`}
        style={{ right: '-5px' }}
      />

      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-purple-100">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Sparkles className="w-4 h-4 text-purple-500 flex-shrink-0" />
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
              className="nodrag nopan text-sm font-semibold text-purple-700 bg-transparent border border-purple-300 rounded px-1 focus:outline-none focus:ring-1 focus:ring-purple-500 flex-1 min-w-0"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              onClick={() => setIsEditingLabel(true)}
              className="text-sm font-semibold text-purple-700 cursor-text hover:text-purple-900 truncate"
            >
              {label || 'Prompt'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={handleRun}
            disabled={typedData.isRunning}
            className="p-1 hover:bg-purple-100 rounded transition-colors disabled:opacity-50"
          >
            {typedData.isRunning ? (
              <Loader2 className="w-3 h-3 text-purple-500 animate-spin" />
            ) : (
              <Play className="w-3 h-3 text-purple-500" />
            )}
          </button>
          <button
            onClick={handleToggleCollapse}
            className="p-1 hover:bg-purple-100 rounded transition-colors"
            title={isCollapsed ? 'Развернуть' : 'Свернуть'}
          >
            {isCollapsed ? (
              <ChevronDown className="w-3 h-3 text-purple-600" />
            ) : (
              <ChevronUp className="w-3 h-3 text-purple-600" />
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
        <div className="p-3 flex-1 overflow-auto">
          <div className="h-full nodrag nopan">
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

