'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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

import { useAdminCanvasStore } from '@/store/admin-canvas-store';
import NoteNode from '../nodes/NoteNode';
import PromptNode from '../nodes/PromptNode';
import GroupNode from '../nodes/GroupNode';
import TextLabelNode from '../nodes/TextLabelNode';
import AgentNode from '../nodes/AgentNode';
import Toolbar from '../Toolbar';
import AlignmentGuides from '../AlignmentGuides';
import HighlightableEdge from '../HighlightableEdge';

// Define custom node types
const nodeTypes: any = {
  note: NoteNode,
  prompt: PromptNode,
  group: GroupNode,
  textLabel: TextLabelNode,
  agent: AgentNode,
};

// Define custom edge types
const edgeTypes: any = {
  highlightable: HighlightableEdge,
};

interface AdminCanvasProps {
  onSave?: () => void;
  onClear?: () => void;
}

export default function AdminCanvas({ onSave, onClear }: AdminCanvasProps) {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNoteToGroup,
    removeNoteFromGroup,
    addNode,
    copySelectedNodes,
    pasteNodes,
    undo,
    redo,
  } = useAdminCanvasStore();

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useReactFlow();
  
  // Track dragging node for alignment guides
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  
  // Track dark mode
  const [isDark, setIsDark] = useState(false);
  
  useEffect(() => {
    // Check initial theme
    const checkTheme = () => {
      const isDarkMode = document.documentElement.classList.contains('dark');
      setIsDark(isDarkMode);
    };
    
    checkTheme();
    
    // Watch for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    
    return () => observer.disconnect();
  }, []);

  // Track the last drop timestamp to prevent duplicates
  const lastDropTimestamp = useRef(0);
  const lastDropType = useRef('');
  
  // Handle drop from toolbar
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const now = Date.now();
      
      // Prevent duplicate drops within 200ms with the same type
      if (now - lastDropTimestamp.current < 200 && lastDropType.current === type) {
        return;
      }

      lastDropTimestamp.current = now;
      lastDropType.current = type;
      
      // Get default node dimensions to center it on cursor
      const nodeDimensions: Record<string, { width: number; height: number }> = {
        note: { width: 400, height: 400 },
        prompt: { width: 400, height: 300 },
        group: { width: 560, height: 300 },
        textLabel: { width: 300, height: 50 },
        agent: { width: 400, height: 400 },
      };

      const dimensions = nodeDimensions[type] || { width: 400, height: 400 };

      // Get ReactFlow container element
      const reactFlowElement = reactFlowWrapper.current?.querySelector('.react-flow') as HTMLElement;
      
      if (!reactFlowElement) {
        console.error('ReactFlow element not found');
        return;
      }

      // Get ReactFlow container bounds
      const reactFlowBounds = reactFlowElement.getBoundingClientRect();
      
      // Get current viewport state
      const viewport = reactFlowInstance.getViewport();
      
      // Calculate position relative to ReactFlow container (in screen pixels)
      const screenX = event.clientX - reactFlowBounds.left;
      const screenY = event.clientY - reactFlowBounds.top;

      // Convert screen coordinates to flow coordinates
      const flowX = (screenX - viewport.x) / viewport.zoom;
      const flowY = (screenY - viewport.y) / viewport.zoom;

      // Calculate position so node center is at cursor position
      const position = {
        x: flowX - dimensions.width / 2,
        y: flowY - dimensions.height / 2,
      };

      addNode(type as any, position);
    },
    [reactFlowInstance, addNode]
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
    
    if (isEditingText) {
      return false;
    }
    
    return true;
  }, []);

  // Handle selection changes
  const onSelectionChange = useCallback((params: OnSelectionChangeParams) => {
    // React Flow automatically handles multi-selection
  }, []);

  // Get node dimensions helper
  const getNodeDimensions = useCallback((node: any) => {
    const nodeDimensions: Record<string, { width: number; height: number }> = {
      note: { width: 400, height: 400 },
      prompt: { width: 400, height: 300 },
      group: { width: 560, height: 300 },
      textLabel: { width: 300, height: 50 },
      agent: { width: 400, height: 400 },
    };
    const defaultDimensions = { width: 400, height: 400 };
    const typeDimensions = nodeDimensions[node.type || 'note'] || defaultDimensions;
    return {
      width: (node.width as number) || typeDimensions.width,
      height: (node.height as number) || typeDimensions.height,
    };
  }, []);

  // Handle node dragging
  const onNodeDrag: OnNodeDrag = useCallback(
    (event, node) => {
      // Let ReactFlow handle dragging naturally
    },
    []
  );

  // Handle node drag start
  const onNodeDragStart: OnNodeDrag = useCallback((event, node) => {
    setDraggingNodeId(node.id);
  }, []);

  // Handle dragging nodes into groups
  const onNodeDragStop: OnNodeDrag = useCallback(
    (event, node) => {
      setDraggingNodeId(null);
      
      if (node.hidden) return;

      // Find if the node was dropped on a group
      const droppedOnGroup = nodes.find((n) => {
        if (n.type !== 'group' || n.id === node.id || n.hidden) return false;

        const groupBounds = {
          x: n.position.x,
          y: n.position.y,
          width: 560,
          height: 300,
        };

        const dimensions = getNodeDimensions(node);
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
    [nodes, addNoteToGroup, getNodeDimensions]
  );

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const activeElement = document.activeElement as HTMLElement;
      const isEditingText = activeElement?.getAttribute('contenteditable') === 'true' ||
                           activeElement?.tagName === 'INPUT' ||
                           activeElement?.tagName === 'TEXTAREA';
      
      if (isEditingText) {
        if (event.key === 'z' && (event.metaKey || event.ctrlKey) && !event.shiftKey) {
          return;
        }
        if (event.key === 'y' && (event.metaKey || event.ctrlKey)) {
          return;
        }
        if ((event.key === 'c' || event.key === 'v') && (event.metaKey || event.ctrlKey)) {
          return;
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
        pasteNodes(undefined);
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
  }, [nodes, copySelectedNodes, pasteNodes, undo, redo]);

  const handleSave = useCallback(() => {
    if (onSave) {
      onSave();
    }
  }, [onSave]);

  const handleClear = useCallback(() => {
    if (onClear) {
      onClear();
    }
  }, [onClear]);

  return (
    <div 
      ref={reactFlowWrapper}
      className="w-full h-full dark:bg-black transition-colors duration-300"
      style={{ backgroundColor: isDark ? '#000000' : '#f9fafb' }}
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <AlignmentGuides nodes={nodes} draggingNodeId={draggingNodeId} />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDrag={onNodeDrag}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        onSelectionChange={onSelectionChange}
        onBeforeDelete={onBeforeDelete}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        minZoom={0.1}
        maxZoom={4}
        deleteKeyCode={["Delete", "Backspace"]}
        multiSelectionKeyCode="Meta"
        selectionOnDrag={true}
        selectNodesOnDrag={false}
        nodesDraggable={true}
        snapToGrid={false}
        snapGrid={[1, 1]}
        nodesConnectable={true}
        elementsSelectable={true}
        translateExtent={[[-15000, -15000], [15000, 15000]]}
        panOnScroll={true}
        panOnScrollSpeed={1.5}
        panOnDrag={[1, 2]}
        zoomOnScroll={true}
        zoomOnPinch={true}
        zoomOnDoubleClick={false}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          type: 'highlightable',
          animated: false,
          style: { strokeWidth: 2, stroke: '#94a3b8' },
          markerEnd: {
            type: 'arrow',  
            width: 20,
            height: 20,
            color: '#94a3b8',
          },
          interactionWidth: 20,
        }}
      >
        <Background
          variant={BackgroundVariant.Lines}
          gap={200}
          color={isDark ? "rgba(255, 255, 255, 0.08)" : "#e5e7ef"}
          bgColor={isDark ? "#000000" : "#ffffff"}
        />
        <Controls />
        <MiniMap />
        <Toolbar onSave={handleSave} onClear={handleClear} />
      </ReactFlow>
    </div>
  );
}

