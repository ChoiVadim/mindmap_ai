import { CanvasNode, CanvasEdge } from '@/types/canvas';

export interface BoardTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

// Helper to generate unique node IDs
let templateNodeId = 1000;
const getTemplateNodeId = () => `template_node_${templateNodeId++}`;



// Reset node ID counter for each template load
export const resetTemplateNodeIds = () => {
  templateNodeId = 1000;
};



// Load templates from database
export async function loadTemplatesFromDB(includeInactive = false): Promise<BoardTemplate[]> {
  try {
    const url = includeInactive ? '/api/templates?admin=true' : '/api/templates';
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('Failed to load templates from DB:', response.statusText);
      // Fallback to static templates
      return [];
    }
    
    const data = await response.json();
    return data.templates || [];
  } catch (error) {
    console.error('Error loading templates from DB:', error);
    // Fallback to static templates
    return [];
  }
}

// Get template by ID from database
export async function getTemplateByIdFromDB(id: string): Promise<BoardTemplate | null> {
  try {
    const response = await fetch(`/api/templates/${id}`);
    
    if (!response.ok) {
      // Fallback to static templates
      return null;
    }
    
    const data = await response.json();
    return data.template || null;
  } catch (error) {
    console.error('Error loading template from DB:', error);
    // Fallback to static templates
    return null;
  }
}

