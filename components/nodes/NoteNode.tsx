'use client';

import { memo, useCallback, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { StickyNote, Trash2 } from 'lucide-react';
import { NoteNodeData } from '@/types/canvas';
import { useCanvasStore } from '@/store/canvas-store';

function NoteNode({ id, data, selected }: NodeProps) {
  const typedData = data as NoteNodeData;
  const contentRef = useRef<HTMLDivElement>(null);
  const updateNodeData = useCanvasStore((state) => state.updateNodeData);
  const deleteNode = useCanvasStore((state) => state.deleteNode);

  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    const newContent = e.currentTarget.textContent || '';
    updateNodeData(id, { content: newContent });
  }, [id, updateNodeData]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNode(id);
  }, [id, deleteNode]);

  // Set initial content
  useEffect(() => {
    if (contentRef.current && !contentRef.current.textContent) {
      contentRef.current.textContent = typedData.content || '';
    }
  }, [typedData.content]);

  return (
    <div
      className={`
        relative bg-white rounded-lg shadow-md border-2
        ${selected ? 'border-blue-500 shadow-lg' : 'border-gray-200'}
        transition-all duration-200 hover:shadow-lg
        min-w-[200px] max-w-[300px]
      `}
      style={{ backgroundColor: typedData.color || '#ffffff' }}
    >
      {/* Handles for connections */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-4 h-4 !bg-blue-500 hover:w-5 hover:h-5 transition-all"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-4 h-4 !bg-blue-500 hover:w-5 hover:h-5 transition-all"
      />

      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-100">
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
      <div className="p-3">
        <div
          ref={contentRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          data-placeholder="Type your note here..."
          className="nodrag nopan nowheel min-h-[80px] p-2 text-sm text-gray-700 cursor-text rounded outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 transition-all empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
          style={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        />
      </div>
    </div>
  );
}

export default memo(NoteNode);

