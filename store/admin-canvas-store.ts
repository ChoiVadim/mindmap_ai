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

interface AdminCanvasStore {
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
  
  // Collapse operations
  toggleNodeCollapse: (nodeId: string) => void;
  
  // AI operations (stub implementations for admin canvas)
  setNodeRunning: (nodeId: string, isRunning: boolean) => void;
  createNoteNode: (promptNodeId: string, content: string) => string;
  
  // Canvas operations
  loadTemplate: (nodes: CanvasNode[], edges: CanvasEdge[]) => void;
  clearCanvas: () => void;
  
  // Copy/Paste operations
  copySelectedNodes: (selectedNodeIds: string[]) => void;
  pasteNodes: (position?: { x: number; y: number }) => void;
  
  // Undo/Redo operations
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
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
const getNodeId = () => `admin_node_${nodeId++}`;

// Helper to update nodeId counter based on existing nodes
const updateNodeIdCounter = (nodes: CanvasNode[]) => {
  const maxId = nodes.reduce((max, node) => {
    const match = node.id.match(/admin_node_(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      return Math.max(max, num);
    }
    return max;
  }, -1);
  nodeId = maxId + 1;
};

interface HistoryState {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

const MAX_HISTORY_SIZE = 50;

export const useAdminCanvasStore = create<AdminCanvasStore>((set, get) => {
  // History state (not in Zustand store to avoid circular dependencies)
  let history: HistoryState[] = [];
  let historyIndex = -1;
  let copiedNodes: { nodes: CanvasNode[]; edges: CanvasEdge[] } | null = null;

  const saveHistoryState = () => {
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
      
      set({ nodes: [...get().nodes, newNode] });
      saveHistoryState();
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
      saveHistoryState();
    },

    onNodesChange: (changes) => {
      // Check if any nodes are being removed
      const hasRemovals = changes.some((change) => change.type === 'remove');
      
      set({
        nodes: applyNodeChanges(changes, get().nodes),
      });
      
      // Save history only when nodes are removed (not on every position change)
      if (hasRemovals) {
        saveHistoryState();
      }
    },

    onEdgesChange: (changes) => {
      // Check if any edges are being removed
      const hasRemovals = changes.some((change) => change.type === 'remove');
      
      set({
        edges: applyEdgeChanges(changes, get().edges),
      });
      
      // Save history only when edges are removed
      if (hasRemovals) {
        saveHistoryState();
      }
    },

    onConnect: (connection) => {
      const currentEdges = get().edges;
      
      // Check if edge already exists (prevent duplicates)
      const isDuplicate = currentEdges.some(
        (edge) =>
          edge.source === connection.source &&
          edge.target === connection.target &&
          edge.sourceHandle === connection.sourceHandle &&
          edge.targetHandle === connection.targetHandle
      );
      
      if (isDuplicate) {
        console.log('Prevented duplicate edge creation');
        return;
      }
      
      // Ensure sourceHandle and targetHandle are preserved
      const edgeWithHandles = {
        ...connection,
        type: 'highlightable',
        sourceHandle: connection.sourceHandle || null,
        targetHandle: connection.targetHandle || null,
      };
      const newEdge = addEdge(edgeWithHandles, currentEdges);
      set({ edges: newEdge });
      saveHistoryState();
    },

    addNoteToGroup: (noteId, groupId) => {
      const nodes = get().nodes;
      const noteNode = nodes.find((n) => n.id === noteId);
      const groupNode = nodes.find((n) => n.id === groupId);

      if (!noteNode || !groupNode || groupNode.type !== 'group') return;

      const groupData = groupNode.data as GroupNodeData;
      if (groupData.childNodes.includes(noteId)) return;

      // Update group data
      const updatedGroupData: GroupNodeData = {
        ...groupData,
        childNodes: [...groupData.childNodes, noteId],
        itemCount: groupData.itemCount + 1,
      };

      // Hide the note node
      set({
        nodes: nodes.map((node) => {
          if (node.id === groupId) {
            return { ...node, data: updatedGroupData };
          }
          if (node.id === noteId) {
            return { ...node, hidden: true };
          }
          return node;
        }),
      });
      saveHistoryState();
    },

    removeNoteFromGroup: (noteId, groupId) => {
      const nodes = get().nodes;
      const groupNode = nodes.find((n) => n.id === groupId);

      if (!groupNode || groupNode.type !== 'group') return;

      const groupData = groupNode.data as GroupNodeData;
      if (!groupData.childNodes.includes(noteId)) return;

      // Update group data
      const updatedGroupData: GroupNodeData = {
        ...groupData,
        childNodes: groupData.childNodes.filter((id) => id !== noteId),
        itemCount: Math.max(0, groupData.itemCount - 1),
      };

      // Show the note node
      set({
        nodes: nodes.map((node) => {
          if (node.id === groupId) {
            return { ...node, data: updatedGroupData };
          }
          if (node.id === noteId) {
            const { hidden, ...rest } = node;
            return rest;
          }
          return node;
        }),
      });
      saveHistoryState();
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
        type: 'highlightable',
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
      saveHistoryState();

      return noteNodeId;
    },

    loadTemplate: (templateNodes, templateEdges) => {
      // Update node ID counter
      updateNodeIdCounter(templateNodes);
      
      set({
        nodes: templateNodes,
        edges: templateEdges,
      });
      
      // Reset history
      history = [];
      historyIndex = -1;
      saveHistoryState();
    },

    clearCanvas: () => {
      set({
        nodes: [],
        edges: [],
      });
      history = [];
      historyIndex = -1;
    },

    copySelectedNodes: (selectedNodeIds) => {
      const nodes = get().nodes;
      const edges = get().edges;
      
      const selectedNodes = nodes.filter((node) => selectedNodeIds.includes(node.id));
      const selectedNodeIdsSet = new Set(selectedNodeIds);
      
      // Find edges that connect selected nodes
      const selectedEdges = edges.filter(
        (edge) => selectedNodeIdsSet.has(edge.source) && selectedNodeIdsSet.has(edge.target)
      );
      
      copiedNodes = {
        nodes: JSON.parse(JSON.stringify(selectedNodes)),
        edges: JSON.parse(JSON.stringify(selectedEdges)),
      };
    },

    pasteNodes: (position) => {
      if (!copiedNodes) return;

      const nodes = get().nodes;
      const edges = get().edges;

      // Calculate offset
      let offsetX = 50;
      let offsetY = 50;

      if (position) {
        // Use provided position
        const firstNode = copiedNodes.nodes[0];
        if (firstNode) {
          offsetX = position.x - firstNode.position.x;
          offsetY = position.y - firstNode.position.y;
        }
      } else {
        // Calculate offset from first copied node
        const firstNode = copiedNodes.nodes[0];
        if (firstNode) {
          // Find rightmost node in current canvas
          const rightmostNode = nodes.reduce((rightmost, node) => {
            return node.position.x > rightmost.position.x ? node : rightmost;
          }, firstNode);
          offsetX = rightmostNode.position.x + rightmostNode.width! + 50 - firstNode.position.x;
        }
      }

      // Create new nodes with updated IDs and positions
      const nodeIdMap = new Map<string, string>();
      const newNodes = copiedNodes.nodes.map((node) => {
        const newNodeId = getNodeId();
        nodeIdMap.set(node.id, newNodeId);
        return {
          ...node,
          id: newNodeId,
          position: {
            x: node.position.x + offsetX,
            y: node.position.y + offsetY,
          },
          selected: false,
        };
      });

      // Create new edges with updated source/target IDs
      const newEdges = copiedNodes.edges.map((edge) => {
        const newSource = nodeIdMap.get(edge.source);
        const newTarget = nodeIdMap.get(edge.target);
        if (!newSource || !newTarget) return null;
        return {
          ...edge,
          id: `admin_edge_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
          source: newSource,
          target: newTarget,
          selected: false,
        };
      }).filter((edge) => edge !== null) as CanvasEdge[];

      set({
        nodes: [...nodes, ...newNodes],
        edges: [...edges, ...newEdges],
      });
      saveHistoryState();
    },

    undo: () => {
      if (historyIndex <= 0) return;
      historyIndex--;
      const previousState = history[historyIndex];
      set({
        nodes: JSON.parse(JSON.stringify(previousState.nodes)),
        edges: JSON.parse(JSON.stringify(previousState.edges)),
      });
    },

    redo: () => {
      if (historyIndex >= history.length - 1) return;
      historyIndex++;
      const nextState = history[historyIndex];
      set({
        nodes: JSON.parse(JSON.stringify(nextState.nodes)),
        edges: JSON.parse(JSON.stringify(nextState.edges)),
      });
    },

    canUndo: () => {
      return historyIndex > 0;
    },

    canRedo: () => {
      return historyIndex < history.length - 1;
    },
  };
});

