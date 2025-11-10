'use client';

import { memo, useState, useCallback } from 'react';
import { NodeProps } from '@xyflow/react';
import { Type, Trash2 } from 'lucide-react';
import { TextLabelData } from '@/types/canvas';
import { useCanvasStore } from '@/store/canvas-store';

function TextLabelNode({ id, data, selected }: NodeProps) {
  const typedData = data as TextLabelData;
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(typedData.label || '');
  const updateNodeData = useCanvasStore((state) => state.updateNodeData);
  const deleteNode = useCanvasStore((state) => state.deleteNode);

  const handleLabelChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLabel(e.target.value);
  }, []);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    updateNodeData(id, { label });
  }, [id, label, updateNodeData]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNode(id);
  }, [id, deleteNode]);

  return (
    <div
      className={`
        relative bg-transparent rounded-lg border-2 border-dashed
        ${selected ? 'border-gray-400' : 'border-gray-300'}
        transition-all duration-200
        min-w-[150px] group
      `}
    >
      <div className="flex items-center gap-2 p-2">
        <Type className="w-4 h-4 text-gray-400" />
        {isEditing ? (
          <input
            autoFocus
            value={label}
            onChange={handleLabelChange}
            onBlur={handleBlur}
            className="flex-1 px-2 py-1 text-base bg-white border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ fontSize: `${typedData.fontSize || 16}px` }}
            placeholder="Label text"
          />
        ) : (
          <span
            onClick={() => setIsEditing(true)}
            className="flex-1 px-2 py-1 text-gray-700 cursor-text hover:bg-gray-50 rounded"
            style={{ fontSize: `${typedData.fontSize || 16}px` }}
          >
            {label || 'Click to edit...'}
          </span>
        )}
        <button
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-all"
        >
          <Trash2 className="w-3 h-3 text-red-500" />
        </button>
      </div>
    </div>
  );
}

export default memo(TextLabelNode);

