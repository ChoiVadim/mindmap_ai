import { create } from 'zustand';
import { 
  addEdge, 
  applyNodeChanges, 
  applyEdgeChanges,
  Connection,
  NodeChange,
  EdgeChange,
} from '@xyflow/react';
import { CanvasNode, CanvasEdge, NodeData, NodeType, GroupNodeData } from '@/types/canvas';

interface CanvasStore {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  
  // Node operations
  addNode: (type: NodeType, position: { x: number; y: number }) => void;
  updateNodeData: (nodeId: string, data: Partial<NodeData>) => void;
  deleteNode: (nodeId: string) => void;
  
  // Edge operations
  onNodesChange: (changes: NodeChange<CanvasNode>[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  
  // Group operations
  addNoteToGroup: (noteId: string, groupId: string) => void;
  removeNoteFromGroup: (noteId: string, groupId: string) => void;
  
  // Canvas operations
  loadCanvas: (nodes: CanvasNode[], edges: CanvasEdge[]) => void;
  clearCanvas: () => void;
  
  // AI operations
  setNodeRunning: (nodeId: string, isRunning: boolean) => void;
  createNoteNode: (promptNodeId: string, content: string) => string;
  
  // Collapse operations
  toggleNodeCollapse: (nodeId: string) => void;
  
  // Copy/Paste operations
  copySelectedNodes: (selectedNodeIds: string[]) => void;
  pasteNodes: (position?: { x: number; y: number }) => void;
  
  // Undo/Redo operations
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  saveHistory: () => void;
}

const createNodeData = (type: NodeType): NodeData => {
  const baseData = {
    label: '',
    content: '',
  };

  switch (type) {
    case 'note':
      return { ...baseData, type: 'note', label: 'New Note' };
    case 'prompt':
      return { ...baseData, type: 'prompt', label: 'New Prompt', isRunning: false };
    case 'group':
      return { ...baseData, type: 'group', label: 'New Group', childNodes: [], itemCount: 0 };
    case 'textLabel':
      return { ...baseData, type: 'textLabel', label: 'Label', fontSize: 16 };
    case 'agent':
      return { ...baseData, type: 'agent', label: 'AI Agent', provider: 'openai' as const, model: 'gpt-4o', systemPrompt: '' };
    default:
      return { ...baseData, type: 'note', label: 'New Note' };
  }
};

let nodeId = 0;
const getNodeId = () => `node_${nodeId++}`;

// Helper to update nodeId counter based on existing nodes
const updateNodeIdCounter = (nodes: CanvasNode[]) => {
  if (nodes.length === 0) return;
  
  const maxId = nodes.reduce((max, node) => {
    const match = node.id.match(/^node_(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      return num > max ? num : max;
    }
    return max;
  }, -1);
  
  nodeId = maxId + 1;
};

// History management for undo/redo
interface HistoryState {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

const MAX_HISTORY_SIZE = 50;

export const useCanvasStore = create<CanvasStore>((set, get) => {
  // History state (not in Zustand store to avoid circular dependencies)
  let history: HistoryState[] = [];
  let historyIndex = -1;
  let copiedNodes: { nodes: CanvasNode[]; edges: CanvasEdge[] } | null = null;

  const saveHistory = () => {
    const currentState: HistoryState = {
      nodes: JSON.parse(JSON.stringify(get().nodes)),
      edges: JSON.parse(JSON.stringify(get().edges)),
    };

    // Remove any future history if we're not at the end
    if (historyIndex < history.length - 1) {
      history = history.slice(0, historyIndex + 1);
    }

    // Add new state to history
    history.push(currentState);

    // Limit history size
    if (history.length > MAX_HISTORY_SIZE) {
      history.shift();
    } else {
      historyIndex++;
    }
  };

  return {
    nodes: [],
    edges: [],

  addNode: (type, position) => {
    console.log('📝 addNode called with type:', type, 'position:', position);
    
    // Set default dimensions for nodes that support resizing
    const defaultDimensions: Record<string, { width: number; height: number }> = {
      note: { width: 400, height: 400 },
      prompt: { width: 400, height: 200 },
      agent: { width: 400, height: 300 },
      textLabel: { width: 300, height: 50 },
    };
    
    const dimensions = defaultDimensions[type];
    
    const newNode: CanvasNode = {
      id: getNodeId(),
      type,
      position,
      data: createNodeData(type),
      ...(dimensions && { width: dimensions.width, height: dimensions.height }),
    };
    
    console.log('✅ Creating node:', newNode.id);
    set({ nodes: [...get().nodes, newNode] });
    saveHistory();
  },

  updateNodeData: (nodeId, data) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...data } as NodeData }
          : node
      ),
    });
  },

  deleteNode: (nodeId) => {
    set({
      nodes: get().nodes.filter((node) => node.id !== nodeId),
      edges: get().edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      ),
    });
    saveHistory();
  },

  onNodesChange: (changes) => {
    // Check if any nodes are being removed
    const hasRemovals = changes.some((change) => change.type === 'remove');
    
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
    
    // Save history only when nodes are removed (not on every position change)
    if (hasRemovals) {
      saveHistory();
    }
  },

  onEdgesChange: (changes) => {
    // Check if any edges are being removed
    const hasRemovals = changes.some((change) => change.type === 'remove');
    
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
    
    // Save history when edges are removed
    if (hasRemovals) {
      saveHistory();
    }
  },

  onConnect: (connection) => {
    set({
      edges: addEdge(connection, get().edges),
    });
    saveHistory();
  },

  addNoteToGroup: (noteId, groupId) => {
    const nodes = get().nodes;
    const edges = get().edges;
    const groupNode = nodes.find((n) => n.id === groupId);
    const noteNode = nodes.find((n) => n.id === noteId);
    
    if (groupNode && groupNode.data.type === 'group' && noteNode) {
      const groupData = groupNode.data as GroupNodeData;
      
      // Don't add if already in group
      if (groupData.childNodes.includes(noteId)) {
        return;
      }
      
      const updatedChildNodes = [...groupData.childNodes, noteId];
      
      // Remove all edges connected to this note (both incoming and outgoing)
      const updatedEdges = edges.filter(
        (edge) => edge.source !== noteId && edge.target !== noteId
      );
      
      set({
        nodes: nodes.map((node) => {
          if (node.id === groupId) {
            return {
                ...node,
                data: {
                  ...node.data,
                  childNodes: updatedChildNodes,
                  itemCount: updatedChildNodes.length,
                } as NodeData,
            };
          }
          // Hide the node that's being added to the group
          if (node.id === noteId) {
            return {
              ...node,
              hidden: true,
            };
          }
          return node;
        }),
        edges: updatedEdges,
      });
    }
  },

  removeNoteFromGroup: (noteId, groupId) => {
    const nodes = get().nodes;
    const groupNode = nodes.find((n) => n.id === groupId);
    const noteNode = nodes.find((n) => n.id === noteId);
    
    if (groupNode && groupNode.data.type === 'group' && noteNode) {
      const groupData = groupNode.data as GroupNodeData;
      const updatedChildNodes = groupData.childNodes.filter((id) => id !== noteId);
      
      // Calculate position relative to group center for the dropped node
      const groupCenterX = groupNode.position.x + 280; // group width / 2
      const groupCenterY = groupNode.position.y + 150; // group height / 2
      
      set({
        nodes: nodes.map((node) => {
          if (node.id === groupId) {
            return {
                ...node,
                data: {
                  ...node.data,
                  childNodes: updatedChildNodes,
                  itemCount: updatedChildNodes.length,
                } as NodeData,
            };
          }
          // Show the node and position it near the group
          if (node.id === noteId) {
            return {
              ...node,
              hidden: false,
              position: {
                x: groupCenterX - 200, // Offset to the left of group center
                y: groupCenterY - 200, // Offset above group center
              },
            };
          }
          return node;
        }),
      });
    }
  },

  loadCanvas: (nodes, edges) => {
    updateNodeIdCounter(nodes);
    set({ nodes, edges });
    // Initialize history with loaded state
    history = [{
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    }];
    historyIndex = 0;
  },

  clearCanvas: () => {
    set({ nodes: [], edges: [] });
    // Reset history after clearing
    history = [{
      nodes: [],
      edges: [],
    }];
    historyIndex = 0;
  },

  setNodeRunning: (nodeId, isRunning) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId && node.data.type === 'prompt'
          ? { ...node, data: { ...node.data, isRunning } as NodeData }
          : node
      ),
    });
  },

  createNoteNode: (promptNodeId, content) => {
    const promptNode = get().nodes.find((n) => n.id === promptNodeId);
    if (!promptNode) return '';

    // Create note node positioned to the right of the prompt
    const noteNodeId = getNodeId();
    const newNoteNode: CanvasNode = {
      id: noteNodeId,
      type: 'note',
      position: {
        x: promptNode.position.x + 500,
        y: promptNode.position.y,
      },
      data: {
        type: 'note',
        label: 'AI Generated',
        content,
      },
      width: 400,
      height: 400,
    };

    // Create edge from prompt to note with default options
    const newEdge: CanvasEdge = {
      id: `${promptNodeId}-${noteNodeId}`,
      source: promptNodeId,
      target: noteNodeId,
      type: 'default',
      animated: false,
      style: { strokeWidth: 2, stroke: '#94a3b8' },
      markerEnd: {
        type: 'arrow' as const,
        width: 20,
        height: 20,
        color: '#94a3b8',
      },
    };

    set({
      nodes: [...get().nodes, newNoteNode],
      edges: [...get().edges, newEdge],
    });

    return noteNodeId;
  },

  toggleNodeCollapse: (nodeId) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, collapsed: !node.data.collapsed } as NodeData }
          : node
      ),
    });
  },

  copySelectedNodes: (selectedNodeIds) => {
    if (selectedNodeIds.length === 0) return;

    const nodes = get().nodes;
    const edges = get().edges;

    // Get selected nodes
    const selectedNodes = nodes.filter((node) => 
      selectedNodeIds.includes(node.id) && !node.hidden
    );

    if (selectedNodes.length === 0) return;

    // Get edges that connect selected nodes (only edges between selected nodes)
    const selectedEdges = edges.filter((edge) =>
      selectedNodeIds.includes(edge.source) && selectedNodeIds.includes(edge.target)
    );

    // Store copied nodes and edges
    copiedNodes = {
      nodes: JSON.parse(JSON.stringify(selectedNodes)),
      edges: JSON.parse(JSON.stringify(selectedEdges)),
    };
  },

  pasteNodes: (position) => {
    if (!copiedNodes || copiedNodes.nodes.length === 0) return;

    const nodes = get().nodes;
    const edges = get().edges;

    // Calculate the bounds of copied nodes
    const copiedBounds = copiedNodes.nodes.reduce(
      (bounds, node) => {
        const nodeWidth = (node.width as number) || 400;
        const nodeHeight = (node.height as number) || 400;
        return {
          minX: Math.min(bounds.minX, node.position.x),
          minY: Math.min(bounds.minY, node.position.y),
          maxX: Math.max(bounds.maxX, node.position.x + nodeWidth),
          maxY: Math.max(bounds.maxY, node.position.y + nodeHeight),
        };
      },
      {
        minX: Infinity,
        minY: Infinity,
        maxX: -Infinity,
        maxY: -Infinity,
      }
    );

    const copiedCenterX = (copiedBounds.minX + copiedBounds.maxX) / 2;
    const copiedCenterY = (copiedBounds.minY + copiedBounds.maxY) / 2;

    // If position is provided, use it; otherwise place next to original with offset
    let targetCenterX: number;
    let targetCenterY: number;

    if (position) {
      // Use provided position as the center
      targetCenterX = position.x;
      targetCenterY = position.y;
    } else {
      // Place next to original with a slight offset (100px right and down)
      targetCenterX = copiedCenterX + 100;
      targetCenterY = copiedCenterY + 100;
    }

    // Create new nodes with new IDs
    const idMap = new Map<string, string>();
    const newNodes: CanvasNode[] = copiedNodes.nodes.map((node) => {
      const newNodeId = getNodeId();
      idMap.set(node.id, newNodeId);

      // Calculate new position relative to the target center
      const nodeWidth = (node.width as number) || 400;
      const nodeHeight = (node.height as number) || 400;
      const nodeCenterX = node.position.x + nodeWidth / 2;
      const nodeCenterY = node.position.y + nodeHeight / 2;
      
      const offsetFromCenterX = nodeCenterX - copiedCenterX;
      const offsetFromCenterY = nodeCenterY - copiedCenterY;

      // Create new node with only necessary properties (exclude React Flow internal properties)
      const newNode: CanvasNode = {
        id: newNodeId,
        type: node.type,
        position: {
          x: targetCenterX + offsetFromCenterX - nodeWidth / 2,
          y: targetCenterY + offsetFromCenterY - nodeHeight / 2,
        },
        data: JSON.parse(JSON.stringify(node.data)), // Deep copy data
        selected: false, // Deselect pasted nodes
      };

      // Only include width/height if they exist
      if (node.width !== undefined) {
        newNode.width = node.width;
      }
      if (node.height !== undefined) {
        newNode.height = node.height;
      }

      return newNode;
    });

    // Create new edges with new IDs
    const newEdges: CanvasEdge[] = copiedNodes.edges.map((edge) => ({
      ...edge,
      id: `${idMap.get(edge.source)}-${idMap.get(edge.target)}`,
      source: idMap.get(edge.source)!,
      target: idMap.get(edge.target)!,
    }));

    // Add new nodes and edges
    set({
      nodes: [...nodes, ...newNodes],
      edges: [...edges, ...newEdges],
    });
    saveHistory();
  },

  undo: () => {
    if (historyIndex <= 0) return; // Can't undo if no history or at first state

    historyIndex--;
    const previousState = history[historyIndex];
    
    if (previousState) {
      updateNodeIdCounter(previousState.nodes);
      set({
        nodes: JSON.parse(JSON.stringify(previousState.nodes)),
        edges: JSON.parse(JSON.stringify(previousState.edges)),
      });
    }
  },

  redo: () => {
    if (historyIndex >= history.length - 1) return; // Can't redo if at latest state

    historyIndex++;
    const nextState = history[historyIndex];
    
    if (nextState) {
      updateNodeIdCounter(nextState.nodes);
      set({
        nodes: JSON.parse(JSON.stringify(nextState.nodes)),
        edges: JSON.parse(JSON.stringify(nextState.edges)),
      });
    }
  },

  canUndo: () => {
    return historyIndex > 0;
  },

  canRedo: () => {
    return historyIndex < history.length - 1;
  },

  saveHistory: () => {
    saveHistory();
  },
  };
});

