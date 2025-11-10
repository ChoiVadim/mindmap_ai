import { Node, Edge } from '@xyflow/react';

// Node types for the canvas
export type NodeType = 'note' | 'prompt' | 'group' | 'textLabel';

// Base node data interface
export interface BaseNodeData {
  label: string;
  content: string;
  color?: string;
  [key: string]: any; // Allow additional properties
}

// Note node - stores text, ideas, fragments
export interface NoteNodeData extends BaseNodeData {
  type: 'note';
}

// Prompt node - stores AI prompts (empty or saved)
export interface PromptNodeData extends BaseNodeData {
  type: 'prompt';
  isRunning?: boolean;
}

// Group node - container for other notes
export interface GroupNodeData extends BaseNodeData {
  type: 'group';
  childNodes: string[]; // IDs of contained notes
  itemCount: number;
}

// Text label node - visual element only, no connections
export interface TextLabelData extends BaseNodeData {
  type: 'textLabel';
  fontSize?: number;
}

// Union type for all node data
export type NodeData = 
  | NoteNodeData 
  | PromptNodeData 
  | GroupNodeData 
  | TextLabelData;

// Custom node type extending React Flow's Node
export type CanvasNode = Node<NodeData>;

// Custom edge type
export type CanvasEdge = Edge;

// Canvas state
export interface CanvasState {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

// AI Context for generation
export interface AIContext {
  promptNodeId: string;
  contextNodes: CanvasNode[];
  promptContent: string;
}

