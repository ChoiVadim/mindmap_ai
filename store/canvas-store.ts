import { create } from 'zustand';
import { 
  addEdge, 
  applyNodeChanges, 
  applyEdgeChanges,
  Connection,
  NodeChange,
  EdgeChange,
} from '@xyflow/react';
import { CanvasNode, CanvasEdge, NodeData, NodeType } from '@/types/canvas';

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

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  nodes: [],
  edges: [],

  addNode: (type, position) => {
    console.log('📝 addNode called with type:', type, 'position:', position);
    const newNode: CanvasNode = {
      id: getNodeId(),
      type,
      position,
      data: createNodeData(type),
    };
    
    console.log('✅ Creating node:', newNode.id);
    set({ nodes: [...get().nodes, newNode] });
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
  },

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  onConnect: (connection) => {
    set({
      edges: addEdge(connection, get().edges),
    });
  },

  addNoteToGroup: (noteId, groupId) => {
    const nodes = get().nodes;
    const groupNode = nodes.find((n) => n.id === groupId);
    
    if (groupNode && groupNode.data.type === 'group') {
      const updatedChildNodes = [...groupNode.data.childNodes, noteId];
      
      set({
        nodes: nodes.map((node) =>
          node.id === groupId
            ? {
                ...node,
                data: {
                  ...node.data,
                  childNodes: updatedChildNodes,
                  itemCount: updatedChildNodes.length,
                } as NodeData,
              }
            : node
        ),
      });
    }
  },

  removeNoteFromGroup: (noteId, groupId) => {
    const nodes = get().nodes;
    const groupNode = nodes.find((n) => n.id === groupId);
    
    if (groupNode && groupNode.data.type === 'group') {
      const updatedChildNodes = groupNode.data.childNodes.filter((id) => id !== noteId);
      
      set({
        nodes: nodes.map((node) =>
          node.id === groupId
            ? {
                ...node,
                data: {
                  ...node.data,
                  childNodes: updatedChildNodes,
                  itemCount: updatedChildNodes.length,
                } as NodeData,
              }
            : node
        ),
      });
    }
  },

  loadCanvas: (nodes, edges) => {
    updateNodeIdCounter(nodes);
    set({ nodes, edges });
  },

  clearCanvas: () => {
    set({ nodes: [], edges: [] });
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
}));

