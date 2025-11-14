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

import { useCanvasStore } from '@/store/canvas-store';
import { useBoardStore } from '@/store/board-store';
import NoteNode from './nodes/NoteNode';
import PromptNode from './nodes/PromptNode';
import GroupNode from './nodes/GroupNode';
import TextLabelNode from './nodes/TextLabelNode';
import AgentNode from './nodes/AgentNode';
import Toolbar from './Toolbar';
import TopLeftBar from './TopLeftBar';
import TopRightBar from './TopRightBar';
import AlignmentGuides, { calculateSnappedPosition } from './AlignmentGuides';

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

  const { currentBoardId, updateBoardData } = useBoardStore();

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useReactFlow();
  
  // Track dragging node for alignment guides
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  
  // Track if we're currently loading to prevent saves during load
  const isLoadingRef = useRef(false);
  const previousNodesRef = useRef<string>('');
  const previousEdgesRef = useRef<string>('');

  // Save canvas to current board whenever nodes or edges change
  useEffect(() => {
    if (!currentBoardId || isLoadingRef.current) {
      return;
    }

    // Serialize nodes and edges to compare
    const nodesString = JSON.stringify(nodes);
    const edgesString = JSON.stringify(edges);

    // Only save if nodes or edges actually changed
    if (nodesString === previousNodesRef.current && edgesString === previousEdgesRef.current) {
      return;
    }

    // Update refs
    previousNodesRef.current = nodesString;
    previousEdgesRef.current = edgesString;

    // Debounce saves to avoid too many API calls
    const timeoutId = setTimeout(() => {
      updateBoardData(currentBoardId, nodes, edges).catch((error) => {
        console.error('Error saving board data:', error);
      });
    }, 1000); // Save 1 second after last change

    return () => clearTimeout(timeoutId);
  }, [nodes, edges, currentBoardId, updateBoardData]);

  // Track loading state from board store
  const { isLoading } = useBoardStore();
  const prevLoadingRef = useRef(isLoading);
  const nodesEdgesRef = useRef({ nodes, edges });
  
  // Keep refs in sync with current nodes/edges
  useEffect(() => {
    nodesEdgesRef.current = { nodes, edges };
  }, [nodes, edges]);
  
  useEffect(() => {
    const wasLoading = prevLoadingRef.current;
    isLoadingRef.current = isLoading;
    
    if (isLoading) {
      // Reset previous refs when loading starts
      previousNodesRef.current = '';
      previousEdgesRef.current = '';
    } else if (wasLoading && !isLoading) {
      // When loading finishes (transition from true to false), update refs to current state
      // This prevents immediate save after loading
      // Use a small timeout to ensure nodes/edges are fully updated
      setTimeout(() => {
        previousNodesRef.current = JSON.stringify(nodesEdgesRef.current.nodes);
        previousEdgesRef.current = JSON.stringify(nodesEdgesRef.current.edges);
      }, 100);
    }
    
    prevLoadingRef.current = isLoading;
  }, [isLoading]);

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
        // Get ReactFlow container element (the actual .react-flow div)
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
        // Formula: flow = (screen - viewportOffset) / zoom
        const flowX = (screenX - viewport.x) / viewport.zoom;
        const flowY = (screenY - viewport.y) / viewport.zoom;
        
        const position = {
          x: flowX,
          y: flowY,
        };
        
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

      // Get ReactFlow container element (the actual .react-flow div)
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

      // Convert screen coordinates to flow coordinates using the correct formula
      // Formula from AlignmentGuides: screen = flow * zoom + viewportOffset
      // Reverse: flow = (screen - viewportOffset) / zoom
      // viewport.x and viewport.y represent where flow point (0,0) appears in screen coordinates
      const flowX = (screenX - viewport.x) / viewport.zoom;
      const flowY = (screenY - viewport.y) / viewport.zoom;

      // Debug logging
      console.log('Drop coordinates:', {
        clientX: event.clientX,
        clientY: event.clientY,
        reactFlowBounds: { left: reactFlowBounds.left, top: reactFlowBounds.top },
        screenX,
        screenY,
        viewport: { x: viewport.x, y: viewport.y, zoom: viewport.zoom },
        flowX,
        flowY,
        calculatedPosition: {
          x: flowX - dimensions.width / 2,
          y: flowY - dimensions.height / 2,
        },
      });

      // Calculate position so node center is at cursor position
      // Subtract half the node dimensions to center it on the cursor
      const position = {
        x: flowX - dimensions.width / 2,
        y: flowY - dimensions.height / 2,
      };

      addNode(type as any, position);
    },
    [reactFlowInstance, addNode, removeNoteFromGroup, nodes, onNodesChange]
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

  // Save canvas to current board
  const handleSave = useCallback(async () => {
    if (!currentBoardId) {
      alert('No board selected');
      return;
    }

    try {
      await updateBoardData(currentBoardId, nodes, edges);
      console.log('Canvas saved!');
      alert('Canvas saved successfully!');
    } catch (error) {
      console.error('Error saving canvas:', error);
      alert('Failed to save canvas');
    }
  }, [nodes, edges, currentBoardId, updateBoardData]);

  // Clear canvas with confirmation
  const handleClear = useCallback(async () => {
    if (!currentBoardId) {
      alert('No board selected');
      return;
    }

    if (confirm('Are you sure you want to clear the entire canvas? This cannot be undone.')) {
      clearCanvas();
      // Update board with empty canvas
      try {
        await updateBoardData(currentBoardId, [], []);
      } catch (error) {
        console.error('Error clearing board:', error);
      }
    }
  }, [clearCanvas, currentBoardId, updateBoardData]);

  // Handle selection changes for multi-selection
  // React Flow automatically handles multi-selection and group dragging
  const onSelectionChange = useCallback((params: OnSelectionChangeParams) => {
    // React Flow automatically handles multi-selection and group dragging
    // When multiple nodes are selected and you drag one, all selected nodes move together
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

  // Track original positions to prevent unwanted snapping
  const originalPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  // Handle node dragging - prevent any snapping by preserving original position
  const onNodeDrag: OnNodeDrag = useCallback(
    (event, node) => {
      // DEBUG: Log to see if this is being called when nodes are added
      console.log('🔍 onNodeDrag called for node:', node.id, 'position:', node.position);
      
      // Store original position on first drag
      if (!originalPositionsRef.current.has(node.id)) {
        originalPositionsRef.current.set(node.id, { x: node.position.x, y: node.position.y });
      }
      
      // Do nothing - let ReactFlow handle dragging naturally without any position adjustments
      // This prevents any snapping behavior
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
      // Clear dragging state
      setDraggingNodeId(null);
      
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
        // Paste next to original with offset (pass undefined to use default offset logic)
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
      {/* <AlignmentGuides nodes={nodes} draggingNodeId={draggingNodeId} /> */}
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
        // Disable snap to grid - nodes should appear exactly where dropped
        snapToGrid={false}
        snapGrid={[1, 1]}
        // Explicitly disable any automatic node positioning
        nodesConnectable={true}
        elementsSelectable={true}
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

