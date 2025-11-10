'use client';

import { useCallback, useMemo, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  ConnectionMode,
  OnNodeDrag,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useCanvasStore } from '@/store/canvas-store';
import NoteNode from './nodes/NoteNode';
import PromptNode from './nodes/PromptNode';
import GroupNode from './nodes/GroupNode';
import TextLabelNode from './nodes/TextLabelNode';
import Toolbar from './Toolbar';

// Define custom node types
const nodeTypes: any = {
  note: NoteNode,
  prompt: PromptNode,
  group: GroupNode,
  textLabel: TextLabelNode,
};

export default function Canvas() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    loadCanvas,
    clearCanvas,
    addNoteToGroup,
    addNode,
  } = useCanvasStore();

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  // Load canvas from localStorage on mount
  useEffect(() => {
    const savedCanvas = localStorage.getItem('mindcanvas-state');
    if (savedCanvas) {
      try {
        const { nodes: savedNodes, edges: savedEdges } = JSON.parse(savedCanvas);
        loadCanvas(savedNodes, savedEdges);
      } catch (error) {
        console.error('Failed to load canvas:', error);
      }
    }
  }, [loadCanvas]);

  // Handle drop from toolbar
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      addNode(type as any, position);
    },
    [screenToFlowPosition, addNode]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Prevent deletion when editing text in contentEditable
  const onBeforeDelete = useCallback(async ({ nodes: nodesToDelete, edges: edgesToDelete }: any) => {
    const activeElement = document.activeElement as HTMLElement;
    const isEditingText = activeElement?.getAttribute('contenteditable') === 'true' ||
                         activeElement?.tagName === 'INPUT' ||
                         activeElement?.tagName === 'TEXTAREA';
    
    // If currently typing in a node, don't delete the node
    if (isEditingText) {
      return false;
    }
    
    // Otherwise allow deletion
    return true;
  }, []);

  // Save canvas to localStorage
  const handleSave = useCallback(() => {
    const canvasState = { nodes, edges };
    localStorage.setItem('mindcanvas-state', JSON.stringify(canvasState));
    
    // Show success notification (you can replace this with a proper toast)
    console.log('Canvas saved!');
    alert('Canvas saved successfully!');
  }, [nodes, edges]);

  // Clear canvas with confirmation
  const handleClear = useCallback(() => {
    if (confirm('Are you sure you want to clear the entire canvas? This cannot be undone.')) {
      clearCanvas();
      localStorage.removeItem('mindcanvas-state');
    }
  }, [clearCanvas]);

  // Handle dragging notes into groups
  const onNodeDragStop: OnNodeDrag = useCallback(
    (event, node) => {
      // Only process note nodes
      if (node.type !== 'note') return;

      // Find if the note was dropped on a group
      const droppedOnGroup = nodes.find((n) => {
        if (n.type !== 'group' || n.id === node.id) return false;

        // Check if the note's center is within the group bounds
        const groupBounds = {
          x: n.position.x,
          y: n.position.y,
          width: 280, // Approximate group width
          height: 150, // Approximate group height
        };

        const noteCenterX = node.position.x + 100; // Note width / 2
        const noteCenterY = node.position.y + 75; // Note height / 2

        return (
          noteCenterX >= groupBounds.x &&
          noteCenterX <= groupBounds.x + groupBounds.width &&
          noteCenterY >= groupBounds.y &&
          noteCenterY <= groupBounds.y + groupBounds.height
        );
      });

      if (droppedOnGroup) {
        addNoteToGroup(node.id, droppedOnGroup.id);
      }
    },
    [nodes, addNoteToGroup]
  );

  // MiniMap node color based on type
  const nodeColor = useCallback((node: any) => {
    switch (node.type) {
      case 'note':
        return '#3B82F6'; // blue
      case 'prompt':
        return '#A855F7'; // purple
      case 'group':
        return '#6B7280'; // gray
      default:
        return '#9CA3AF'; // gray
    }
  }, []);

  return (
    <div 
      ref={reactFlowWrapper}
      className="w-full h-screen bg-gray-50"
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onBeforeDelete={onBeforeDelete}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        minZoom={0.2}
        maxZoom={4}
        deleteKeyCode="Delete"
        multiSelectionKeyCode="Meta"
        defaultEdgeOptions={{
          type: 'default',
          animated: true,
          style: { strokeWidth: 2, stroke: '#94a3b8' },
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#e2e8f0"
        />
        <Controls
          showInteractive={false}
          className="!shadow-lg !border-gray-200"
        />
        <MiniMap
          nodeColor={nodeColor}
          className="!bg-white !border-gray-200"
          maskColor="rgba(0, 0, 0, 0.05)"
        />
        
        <Toolbar onSave={handleSave} onClear={handleClear} />
      </ReactFlow>
    </div>
  );
}

