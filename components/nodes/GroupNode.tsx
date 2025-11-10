'use client';

import { memo, useState, useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Hash, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { GroupNodeData } from '@/types/canvas';
import { useCanvasStore } from '@/store/canvas-store';

const COLORS = ['#FF9F40', '#E91E63', '#3F51B5', '#4CAF50', '#9C27B0'];

function GroupNode({ id, data, selected }: NodeProps) {
  const typedData = data as GroupNodeData;
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(typedData.label || '');
  const [isExpanded, setIsExpanded] = useState(true);
  const [color] = useState(typedData.color || COLORS[Math.floor(Math.random() * COLORS.length)]);
  
  const updateNodeData = useCanvasStore((state) => state.updateNodeData);
  const deleteNode = useCanvasStore((state) => state.deleteNode);
  const nodes = useCanvasStore((state) => state.nodes);

  const childNodes = nodes.filter((node) => typedData.childNodes.includes(node.id));

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
        relative bg-white rounded-xl shadow-lg border-2
        ${selected ? 'border-gray-400 shadow-xl' : 'border-gray-200'}
        transition-all duration-200 hover:shadow-xl
        min-w-[280px] max-w-[400px]
      `}
    >
      {/* Handles for connections */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-10 h-10 !bg-gray-500 hover:w-5 hover:h-5 transition-all"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-10 h-10 !bg-gray-500 hover:w-5 hover:h-5 transition-all"
      />

      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        {/* Colored hashtag icon */}
        <div
          className="flex items-center justify-center w-10 h-10 rounded-lg"
          style={{ backgroundColor: `${color}20` }}
        >
          <Hash className="w-6 h-6" style={{ color }} />
        </div>

        {/* Title and metadata */}
        <div className="flex-1">
          {isEditing ? (
            <input
              autoFocus
              value={label}
              onChange={handleLabelChange}
              onBlur={handleBlur}
              className="w-full px-2 py-1 text-base font-semibold border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Group name"
            />
          ) : (
            <h3
              onClick={() => setIsEditing(true)}
              className="text-base font-semibold text-gray-800 cursor-text hover:text-gray-600"
            >
              {label || 'Untitled Group'}
            </h3>
          )}
          <p className="text-xs text-gray-500 mt-0.5">
            {typedData.itemCount} {typedData.itemCount === 1 ? 'item' : 'items'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            )}
          </button>
          <button
            onClick={handleDelete}
            className="p-1 hover:bg-red-50 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        </div>
      </div>

      {/* Expanded content - show child notes */}
      {isExpanded && childNodes.length > 0 && (
        <div className="px-4 pb-4 space-y-2">
          {childNodes.map((node) => (
            <div
              key={node.id}
              className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg text-sm"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
              <span className="text-gray-700 truncate">
                {node.data.label || 'Untitled'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone indicator */}
      <div className="absolute inset-0 border-2 border-dashed border-transparent pointer-events-none rounded-xl group-hover:border-blue-300" />
    </div>
  );
}

export default memo(GroupNode);

