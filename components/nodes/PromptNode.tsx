'use client';

import { memo, useCallback, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Sparkles, Play, Trash2, Loader2 } from 'lucide-react';
import { PromptNodeData } from '@/types/canvas';
import { useCanvasStore } from '@/store/canvas-store';

function PromptNode({ id, data, selected }: NodeProps) {
  const typedData = data as PromptNodeData;
  const contentRef = useRef<HTMLDivElement>(null);
  const updateNodeData = useCanvasStore((state) => state.updateNodeData);
  const deleteNode = useCanvasStore((state) => state.deleteNode);

  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    const newContent = e.currentTarget.textContent || '';
    updateNodeData(id, { content: newContent });
  }, [id, updateNodeData]);

  // Set initial content
  useEffect(() => {
    if (contentRef.current && !contentRef.current.textContent) {
      contentRef.current.textContent = typedData.content || '';
    }
  }, [typedData.content]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNode(id);
  }, [id, deleteNode]);

  const nodes = useCanvasStore((state) => state.nodes);
  const edges = useCanvasStore((state) => state.edges);
  const setNodeRunning = useCanvasStore((state) => state.setNodeRunning);
  const createNoteNode = useCanvasStore((state) => state.createNoteNode);
  
  const handleRun = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const currentContent = contentRef.current?.textContent || '';
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
      const result = await generateAIResponse(currentContent, aiContext.contextNodes);
      
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
        updateNodeData(targetNoteId, {
          content: result.content,
        });
      } else {
        // Create new note node with AI result
        createNoteNode(id, result.content);
      }
      
    } catch (error: any) {
      console.error('AI generation error:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setNodeRunning(id, false);
    }
  }, [id, nodes, edges, updateNodeData, setNodeRunning, createNoteNode]);

  return (
    <div
      className={`
        relative bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg shadow-md border-2
        ${selected ? 'border-purple-500 shadow-lg' : 'border-purple-200'}
        transition-all duration-200 hover:shadow-lg
        min-w-[200px] max-w-[300px]
      `}
    >
      {/* Handles for connections */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-4 h-4 !bg-purple-500 hover:w-5 hover:h-5 transition-all"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-4 h-4 !bg-purple-500 hover:w-5 hover:h-5 transition-all"
      />

      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-purple-100">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-500" />
          <span className="text-sm font-semibold text-purple-700">Prompt</span>
        </div>
        <div className="flex items-center gap-1">
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
            onClick={handleDelete}
            className="p-1 hover:bg-red-50 rounded transition-colors"
          >
            <Trash2 className="w-3 h-3 text-red-500" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <div
          ref={contentRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          data-placeholder="Enter your AI prompt..."
          className="nodrag nopan nowheel min-h-[80px] p-2 text-sm text-gray-700 cursor-text rounded outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-50 transition-all bg-white/30 empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
          style={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        />
      </div>
    </div>
  );
}

export default memo(PromptNode);

