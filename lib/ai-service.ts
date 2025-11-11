import { CanvasNode, AIContext, AIProvider } from '@/types/canvas';

// Model options for each provider
const MODEL_OPTIONS: Record<AIProvider, string[]> = {
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  gemini: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro'],
  claude: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229'],
};

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
  
  console.log('=== AI Context Gathering ===');
  console.log('Total incoming edges:', incomingEdges.length);
  console.log('Incoming edges details:', incomingEdges.map(e => ({
    source: e.source,
    target: e.target,
    targetHandle: e.targetHandle,
    sourceHandle: e.sourceHandle
  })));
  
  // Get all source nodes from incoming edges
  const sourceNodeIds = incomingEdges.map((edge) => edge.source);
  
  // Find connected agent node (if any)
  let agentNode: CanvasNode | undefined;
  for (const nodeId of sourceNodeIds) {
    const node = nodes.find((n) => n.id === nodeId);
    if (node && node.data.type === 'agent') {
      agentNode = node;
      
      // Collect system prompt from connected notes to agent node
      const agentIncomingEdges = edges.filter((edge) => edge.target === nodeId);
      const agentSourceNodeIds = agentIncomingEdges.map((edge) => edge.source);
      const agentConnectedNotes: string[] = [];
      
      for (const agentSourceId of agentSourceNodeIds) {
        const agentSourceNode = nodes.find((n) => n.id === agentSourceId);
        if (agentSourceNode && agentSourceNode.data.type === 'note') {
          agentConnectedNotes.push(agentSourceNode.data.content || '');
        } else if (agentSourceNode && agentSourceNode.data.type === 'group') {
          // Expand group to get child notes
          const childNodes = nodes.filter((n) =>
            agentSourceNode.data.childNodes?.includes(n.id)
          );
          agentConnectedNotes.push(...childNodes.map(n => n.data.content || ''));
        }
      }
      
      // Combine system prompt from editor and connected notes
      const editorSystemPrompt = node.data.systemPrompt || '';
      const notesSystemPrompt = agentConnectedNotes.join('\n\n');
      const combinedSystemPrompt = [editorSystemPrompt, notesSystemPrompt]
        .filter(s => s.trim())
        .join('\n\n');
      
      if (combinedSystemPrompt && combinedSystemPrompt !== editorSystemPrompt) {
        // Update agent node with combined system prompt (temporary, for this request)
        agentNode = {
          ...agentNode,
          data: {
            ...agentNode.data,
            systemPrompt: combinedSystemPrompt,
          },
        };
        console.log(`Agent node ${nodeId}: combined system prompt from editor and ${agentConnectedNotes.length} connected notes`);
      }
      
      console.log(`Found agent node ${nodeId}: provider=${node.data.provider}, model=${node.data.model}`);
      break; // Only one agent node per prompt
    }
  }
  
  // Collect context from all connected nodes (excluding agent node)
  const contextNodes: CanvasNode[] = [];
  
  for (const nodeId of sourceNodeIds) {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) continue;

    // Skip agent node (already handled above)
    if (node.data.type === 'agent') continue;

    // If it's a group, expand to get all child notes
    if (node.data.type === 'group') {
      const childNodes = nodes.filter((n) =>
        node.data.childNodes?.includes(n.id)
      );
      console.log(`Group node ${nodeId} expanded to ${childNodes.length} child notes`);
      contextNodes.push(...childNodes);
    } else if (node.data.type === 'note') {
      console.log(`Added note node ${nodeId}: "${node.data.label}"`);
      contextNodes.push(node);
    }
  }

  console.log('Total context nodes collected:', contextNodes.length);
  console.log('Context nodes:', contextNodes.map(n => ({
    id: n.id,
    label: n.data.label,
    contentLength: n.data.content?.length || 0
  })));
  if (agentNode) {
    console.log('Agent node:', {
      id: agentNode.id,
      provider: agentNode.data.provider,
      model: agentNode.data.model,
      systemPromptLength: agentNode.data.systemPrompt?.length || 0
    });
  }
  console.log('=========================');

  return {
    promptNodeId,
    contextNodes,
    promptContent: promptNode.data.content,
    agentNode,
  };
}

/**
 * Call the AI generation API
 */
export async function generateAIResponse(
  prompt: string,
  contextNodes: CanvasNode[],
  agentNode?: CanvasNode
): Promise<{ content: string; generatedAt: string }> {
  const context = contextNodes.map((node) => ({
    label: node.data.label,
    content: node.data.content,
    type: node.data.type,
  }));

  const agentConfig = agentNode && agentNode.data.type === 'agent' ? {
    provider: agentNode.data.provider,
    model: agentNode.data.model || MODEL_OPTIONS[agentNode.data.provider][0],
    systemPrompt: agentNode.data.systemPrompt || '',
  } : undefined;

  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      context,
      agent: agentConfig,
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

