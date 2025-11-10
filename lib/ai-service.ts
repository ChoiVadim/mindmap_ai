import { CanvasNode, AIContext } from '@/types/canvas';

/**
 * Gather context from connected nodes
 * Traverses incoming edges to collect all connected Note and Group nodes
 */
export function gatherAIContext(
  promptNodeId: string,
  nodes: CanvasNode[],
  edges: any[]
): AIContext {
  const promptNode = nodes.find((n) => n.id === promptNodeId);
  
  if (!promptNode || promptNode.data.type !== 'prompt') {
    throw new Error('Invalid prompt node');
  }

  // Find all edges that connect TO this prompt node
  const incomingEdges = edges.filter((edge) => edge.target === promptNodeId);
  
  // Get all source nodes from incoming edges
  const sourceNodeIds = incomingEdges.map((edge) => edge.source);
  
  // Collect context from all connected nodes
  const contextNodes: CanvasNode[] = [];
  
  for (const nodeId of sourceNodeIds) {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) continue;

    // If it's a group, expand to get all child notes
    if (node.data.type === 'group') {
      const childNodes = nodes.filter((n) =>
        node.data.childNodes?.includes(n.id)
      );
      contextNodes.push(...childNodes);
    } else if (node.data.type === 'note') {
      contextNodes.push(node);
    }
  }

  return {
    promptNodeId,
    contextNodes,
    promptContent: promptNode.data.content,
  };
}

/**
 * Call the AI generation API
 */
export async function generateAIResponse(
  prompt: string,
  contextNodes: CanvasNode[]
): Promise<{ content: string; generatedAt: string }> {
  const context = contextNodes.map((node) => ({
    label: node.data.label,
    content: node.data.content,
    type: node.data.type,
  }));

  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      context,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate AI response');
  }

  return response.json();
}

/**
 * Find a note node connected as output from the prompt
 */
export function getOutputNoteNode(
  promptNodeId: string,
  nodes: CanvasNode[],
  edges: any[]
): string | null {
  // Check if there's a note node connected as output
  const outgoingEdge = edges.find(
    (edge) => edge.source === promptNodeId && 
             nodes.find(n => n.id === edge.target)?.data.type === 'note'
  );

  return outgoingEdge ? outgoingEdge.target : null;
}

