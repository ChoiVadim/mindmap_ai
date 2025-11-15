'use client';

import { memo, useState, useCallback, useEffect } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from '@xyflow/react';
import { Hash, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { GroupNodeData } from '@/types/canvas';
import { useCanvasStore } from '@/store/canvas-store';

const COLORS = ['#FF9F40', '#E91E63', '#3F51B5', '#4CAF50', '#9C27B0'];

function GroupNode({ id, data, selected }: NodeProps) {
  const typedData = data as GroupNodeData;
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(typedData.label || '');
  const [color] = useState(typedData.color || COLORS[Math.floor(Math.random() * COLORS.length)]);
  
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
  
  const updateNodeData = useCanvasStore((state) => state.updateNodeData);
  const deleteNode = useCanvasStore((state) => state.deleteNode);
  const toggleNodeCollapse = useCanvasStore((state) => state.toggleNodeCollapse);
  const removeNoteFromGroup = useCanvasStore((state) => state.removeNoteFromGroup);
  const nodes = useCanvasStore((state) => state.nodes);

  const childNodes = nodes.filter((node) => typedData.childNodes.includes(node.id));
  const isCollapsed = typedData.collapsed ?? false;

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

  const handleToggleCollapse = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    toggleNodeCollapse(id);
  }, [id, toggleNodeCollapse]);

  return (
    <div
      className={`
        relative rounded-xl shadow-lg border-2
        ${selected ? 'border-gray-400 shadow-xl' : isDark ? 'border-gray-700' : 'border-gray-200'}
        transition-all duration-200 hover:shadow-xl
        w-full
        ${isDark ? 'bg-gray-800' : 'bg-white'}
      `}
      style={{
        width: '560px',
        height: isCollapsed ? '80px' : '300px',
        minHeight: isCollapsed ? '80px' : '300px',
        outline: 'none',
        borderColor: selected 
          ? (isDark ? 'rgb(156 163 175)' : 'rgb(156 163 175)')
          : (isDark ? 'rgb(55 65 81)' : 'rgb(229 231 235)')
      }}
    >
      {/* Node Resizer */}
      <NodeResizer
        isVisible={selected}
        minWidth={560}
        minHeight={isCollapsed ? 80 : 300}
        handleClassName="!w-3 !h-3 !bg-gray-500 !border-2 !border-white !rounded-full"
        lineStyle={{ display: 'none' }}
      />
      
      {/* Handles for connections - Always rendered but only visible when selected */}
      {/* Left side - both source and target */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className={`!w-4 !h-4 !bg-gray-500 !border-2 !border-white !rounded-full transition-all ${selected ? 'opacity-100' : 'opacity-0'}`}
        style={{ left: '-12px' }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left-source"
        className={`!w-4 !h-4 !bg-gray-500 !border-2 !border-white !rounded-full transition-all ${selected ? 'opacity-100' : 'opacity-0'}`}
        style={{ left: '-12px' }}
      />
      
      {/* Right side - both source and target */}
      <Handle
        type="target"
        position={Position.Right}
        id="right"
        className={`!w-4 !h-4 !bg-gray-500 !border-2 !border-white !rounded-full transition-all ${selected ? 'opacity-100' : 'opacity-0'}`}
        style={{ right: '-12px' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        className={`!w-4 !h-4 !bg-gray-500 !border-2 !border-white !rounded-full transition-all ${selected ? 'opacity-100' : 'opacity-0'}`}
        style={{ right: '-12px' }}
      />
      
      {/* Top side - both source and target */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className={`!w-4 !h-4 !bg-gray-500 !border-2 !border-white !rounded-full transition-all ${selected ? 'opacity-100' : 'opacity-0'}`}
        style={{ top: '-12px' }}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top-source"
        className={`!w-4 !h-4 !bg-gray-500 !border-2 !border-white !rounded-full transition-all ${selected ? 'opacity-100' : 'opacity-0'}`}
        style={{ top: '-12px' }}
      />
      
      {/* Bottom side - both source and target */}
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom"
        className={`!w-4 !h-4 !bg-gray-500 !border-2 !border-white !rounded-full transition-all ${selected ? 'opacity-100' : 'opacity-0'}`}
        style={{ bottom: '-12px' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-source"
        className={`!w-4 !h-4 !bg-gray-500 !border-2 !border-white !rounded-full transition-all ${selected ? 'opacity-100' : 'opacity-0'}`}
        style={{ bottom: '-12px' }}
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
              className={`nodrag nopan w-full px-2 py-1 text-base font-semibold border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-800'}`}
              placeholder="Group name"
            />
          ) : (
            <h3
              onClick={() => setIsEditing(true)}
              className={`text-base font-semibold cursor-text ${isDark ? 'text-gray-200 hover:text-gray-100' : 'text-gray-800 hover:text-gray-600'}`}
            >
              {label || 'Untitled Group'}
            </h3>
          )}
          <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {typedData.itemCount} {typedData.itemCount === 1 ? 'item' : 'items'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleToggleCollapse}
            className={`p-1 rounded transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            title={isCollapsed ? 'Развернуть' : 'Свернуть'}
          >
            {isCollapsed ? (
              <ChevronDown className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
            ) : (
              <ChevronUp className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
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

      {/* Content - only show when not collapsed */}
      {!isCollapsed && childNodes.length > 0 && (
        <div className="nodrag nopan px-4 pb-4 space-y-2">
          {childNodes.map((node) => {
            const handleDragStart = (e: React.DragEvent) => {
              // Stop propagation to prevent React Flow from dragging the group node
              e.stopPropagation();
              e.dataTransfer.setData('application/reactflow-node', node.id);
              e.dataTransfer.setData('application/reactflow-group', id);
              e.dataTransfer.effectAllowed = 'move';
            };

            const handleMouseDown = (e: React.MouseEvent) => {
              // Stop propagation to prevent React Flow from selecting/dragging the group
              e.stopPropagation();
            };

            return (
            <div
              key={node.id}
                draggable
                onDragStart={handleDragStart}
                onMouseDown={handleMouseDown}
                className={`nodrag nopan flex items-center gap-2 p-2 rounded-lg text-sm cursor-move transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'}`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-gray-500' : 'bg-gray-400'}`} />
              <span className={`truncate ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {node.data.label || 'Untitled'}
              </span>
            </div>
            );
          })}
        </div>
      )}

      {/* Drop zone indicator */}
      <div className="absolute inset-0 border-2 border-dashed border-transparent pointer-events-none rounded-xl group-hover:border-blue-300" />
    </div>
  );
}

export default memo(GroupNode);

