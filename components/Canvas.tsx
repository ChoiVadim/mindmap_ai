'use client';

import { useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  ConnectionMode,
  OnNodeDrag,
  useReactFlow,
  OnSelectionChangeParams,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useCanvasStore } from '@/store/canvas-store';
import NoteNode from './nodes/NoteNode';
import PromptNode from './nodes/PromptNode';
import GroupNode from './nodes/GroupNode';
import TextLabelNode from './nodes/TextLabelNode';
import AgentNode from './nodes/AgentNode';
import Toolbar from './Toolbar';
import TopLeftBar from './TopLeftBar';
import TopRightBar from './TopRightBar';

// Define custom node types
const nodeTypes: any = {
  note: NoteNode,
  prompt: PromptNode,
  group: GroupNode,
  textLabel: TextLabelNode,
  agent: AgentNode,
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
    removeNoteFromGroup,
    addNode,
    copySelectedNodes,
    pasteNodes,
    undo,
    redo,
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

  // Track the last drop timestamp to prevent duplicates
  const lastDropTimestamp = useRef(0);
  const lastDropType = useRef('');
  
  // Handle drop from toolbar or from group
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();

      // Check if this is a node being dragged from a group
      const nodeId = event.dataTransfer.getData('application/reactflow-node');
      const groupId = event.dataTransfer.getData('application/reactflow-group');
      
      if (nodeId && groupId) {
        // This is a node being dragged from a group
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });
        
        // Remove from group (this will make the node visible)
        removeNoteFromGroup(nodeId, groupId);
        
        // Update node position to drop location
        // Use requestAnimationFrame to ensure the node is visible first
        requestAnimationFrame(() => {
          onNodesChange([
            {
              id: nodeId,
              type: 'position',
              position,
            } as any,
          ]);
        });
        
        return;
      }

      // Otherwise, this is a new node from toolbar
      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const now = Date.now();
      
      // Prevent duplicate drops within 200ms with the same type
      if (now - lastDropTimestamp.current < 200 && lastDropType.current === type) {
        console.log('⚠️ Prevented duplicate drop event - too fast!', type);
        return;
      }

      // Update tracking
      lastDropTimestamp.current = now;
      lastDropType.current = type;
      
      console.log('🎯 Processing drop event for type:', type, 'at', now);

      // Get default node dimensions to center it on cursor
      const nodeDimensions: Record<string, { width: number; height: number }> = {
        note: { width: 400, height: 400 },
        prompt: { width: 400, height: 300 },
        group: { width: 560, height: 300 },
        textLabel: { width: 300, height: 50 },
        agent: { width: 400, height: 400 },
      };

      const dimensions = nodeDimensions[type] || { width: 400, height: 400 };

      // Calculate position so node center is at cursor
      const position = screenToFlowPosition({
        x: event.clientX - dimensions.width / 2,
        y: event.clientY - dimensions.height / 2,
      });

      addNode(type as any, position);
    },
    [screenToFlowPosition, addNode, removeNoteFromGroup, nodes, onNodesChange]
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

  // Handle selection changes for multi-selection
  // React Flow automatically handles multi-selection and group dragging
  const onSelectionChange = useCallback((params: OnSelectionChangeParams) => {
    // React Flow automatically handles multi-selection and group dragging
    // When multiple nodes are selected and you drag one, all selected nodes move together
  }, []);

  // Handle dragging nodes into groups
  const onNodeDragStop: OnNodeDrag = useCallback(
    (event, node) => {
      // Skip if node is hidden (already in a group)
      if (node.hidden) return;

      // Process any node type (note, prompt, agent, etc.)
      // Find if the node was dropped on a group
      const droppedOnGroup = nodes.find((n) => {
        if (n.type !== 'group' || n.id === node.id || n.hidden) return false;

        // Check if the node's center is within the group bounds
        const groupBounds = {
          x: n.position.x,
          y: n.position.y,
          width: 560, // Approximate group width
          height: 300, // Approximate group height
        };

        // Get node dimensions based on type
        const nodeDimensions: Record<string, { width: number; height: number }> = {
          note: { width: 400, height: 400 },
          prompt: { width: 400, height: 300 },
          agent: { width: 400, height: 400 },
          textLabel: { width: 300, height: 120 },
        };

        const dimensions = nodeDimensions[node.type || 'note'] || { width: 400, height: 400 };
        const nodeCenterX = node.position.x + dimensions.width / 2;
        const nodeCenterY = node.position.y + dimensions.height / 2;

        return (
          nodeCenterX >= groupBounds.x &&
          nodeCenterX <= groupBounds.x + groupBounds.width &&
          nodeCenterY >= groupBounds.y &&
          nodeCenterY <= groupBounds.y + groupBounds.height
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
      case 'agent':
        return '#0EA5E9'; // cyan/blue
      default:
        return '#9CA3AF'; // gray
    }
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't handle shortcuts when typing in input fields
      const activeElement = document.activeElement as HTMLElement;
      const isEditingText = activeElement?.getAttribute('contenteditable') === 'true' ||
                           activeElement?.tagName === 'INPUT' ||
                           activeElement?.tagName === 'TEXTAREA';
      
      if (isEditingText) {
        // Allow default behavior for text inputs (but still handle Ctrl+Z for undo in inputs)
        if (event.key === 'z' && (event.metaKey || event.ctrlKey) && !event.shiftKey) {
          return; // Let browser handle undo in text inputs
        }
        if (event.key === 'y' && (event.metaKey || event.ctrlKey)) {
          return; // Let browser handle redo in text inputs
        }
        if ((event.key === 'c' || event.key === 'v') && (event.metaKey || event.ctrlKey)) {
          return; // Let browser handle copy/paste in text inputs
        }
      }

      // Ctrl+C or Cmd+C - Copy selected nodes
      if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
        event.preventDefault();
        const selectedNodes = nodes.filter((node) => node.selected && !node.hidden);
        if (selectedNodes.length > 0) {
          copySelectedNodes(selectedNodes.map((node) => node.id));
        }
        return;
      }

      // Ctrl+V or Cmd+V - Paste nodes
      if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
        event.preventDefault();
        // Paste at viewport center
        const viewportCenter = screenToFlowPosition({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        });
        pasteNodes(viewportCenter);
        return;
      }

      // Ctrl+Z or Cmd+Z - Undo
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        undo();
        return;
      }

      // Ctrl+Shift+Z or Cmd+Shift+Z or Ctrl+Y or Cmd+Y - Redo
      if (
        ((event.ctrlKey || event.metaKey) && event.key === 'z' && event.shiftKey) ||
        ((event.ctrlKey || event.metaKey) && event.key === 'y')
      ) {
        event.preventDefault();
        redo();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [nodes, copySelectedNodes, pasteNodes, undo, redo, screenToFlowPosition]);

  return (
    <div 
      ref={reactFlowWrapper}
      className="w-full h-screen dark:bg-gray-900 transition-colors duration-300"
      style={{ backgroundColor: '#f9fafb' }}
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <TopLeftBar />
      <TopRightBar />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onSelectionChange={onSelectionChange}
        onBeforeDelete={onBeforeDelete}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        minZoom={0.1}
        maxZoom={4}
        deleteKeyCode={["Delete", "Backspace"]}
        // Multi-selection: Meta (Cmd on Mac, Ctrl on Windows/Linux) + Click to add to selection
        // React Flow automatically handles group dragging when multiple nodes are selected
        multiSelectionKeyCode="Meta"
        // Enable selection box (lasso selection) when dragging on empty canvas
        // This allows selecting multiple nodes by dragging a selection box (like Miro/Figma)
        selectionOnDrag={true}
        // Miro-like UX: instant dragging on click (don't select on drag start)
        selectNodesOnDrag={false}
        // Make all nodes draggable (default is true, but explicit for clarity)
        nodesDraggable={true}
        // Большая канва (в 3 раза больше)
        translateExtent={[[-15000, -15000], [15000, 15000]]}
        // Touchpad panning with two fingers (ускоренное передвижение)
        panOnScroll={true}
        panOnScrollSpeed={1.5}
        // Allow panning with middle mouse button or when not clicking on nodes
        panOnDrag={[1, 2]}
        zoomOnScroll={true}
        zoomOnPinch={true}
        zoomOnDoubleClick={false}
        // Hide React Flow attribution
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          type: 'default',
          animated: false,
          style: { strokeWidth: 2, stroke: '#94a3b8' },
          markerEnd: {
            type: 'arrow',  
            width: 20,
            height: 20,
            color: '#94a3b8',
          },
        }}
      >
        <Background
          variant={BackgroundVariant.Lines}
          gap={200}
          color="#e5e7ef"
          bgColor="#ffffff"
        />
  
        
        <Toolbar onSave={handleSave} onClear={handleClear} />
      </ReactFlow>
    </div>
  );
}

