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

export const boardTemplates: BoardTemplate[] = [
  {
    id: 'system-prompt',
    name: 'System Prompt Creation',
    description: 'Create a system prompt by connecting requirements and context',
    icon: '✨',
    nodes: [
      {
        id: getTemplateNodeId(),
        type: 'note',
        position: { x: 100, y: 200 },
        data: {
          type: 'note',
          label: 'Prompt Style',
          content: 'The prompt should be:\n- Clear and concise\n- Action-oriented\n- Include examples when helpful',
          collapsed: false,
        },
        width: 400,
        height: 300,
      },
      {
        id: getTemplateNodeId(),
        type: 'note',
        position: { x: 100, y: 600 },
        data: {
          type: 'note',
          label: 'User Goal',
          content: 'The AI should help users:\n- Understand complex topics\n- Generate creative ideas\n- Solve problems step by step',
          collapsed: false,
        },
        width: 400,
        height: 300,
      },
      {
        id: getTemplateNodeId(),
        type: 'note',
        position: { x: 100, y: 1000 },
        data: {
          type: 'note',
          label: 'Format Requirements',
          content: 'Output format:\n- Use markdown for structure\n- Include code blocks when needed\n- Provide clear sections',
          collapsed: false,
        },
        width: 400,
        height: 300,
      },
      {
        id: getTemplateNodeId(),
        type: 'prompt',
        position: { x: 700, y: 500 },
        data: {
          type: 'prompt',
          label: 'Create System Prompt',
          content: 'Create a comprehensive system prompt based on the connected requirements. Combine all the context to form a clear, actionable prompt.',
          isRunning: false,
          collapsed: false,
        },
        width: 400,
        height: 300,
      },
    ],
    edges: [
      {
        id: 'edge_1',
        source: 'template_node_1000',
        target: 'template_node_1003',
        type: 'highlightable',
        animated: false,
        style: { strokeWidth: 2, stroke: '#94a3b8' },
        markerEnd: {
          type: 'arrow',
          width: 20,
          height: 20,
          color: '#94a3b8',
        },
      },
      {
        id: 'edge_2',
        source: 'template_node_1001',
        target: 'template_node_1003',
        type: 'highlightable',
        animated: false,
        style: { strokeWidth: 2, stroke: '#94a3b8' },
        markerEnd: {
          type: 'arrow',
          width: 20,
          height: 20,
          color: '#94a3b8',
        },
      },
      {
        id: 'edge_3',
        source: 'template_node_1002',
        target: 'template_node_1003',
        type: 'highlightable',
        animated: false,
        style: { strokeWidth: 2, stroke: '#94a3b8' },
        markerEnd: {
          type: 'arrow',
          width: 20,
          height: 20,
          color: '#94a3b8',
        },
      },
    ],
  },
  {
    id: 'research-project',
    name: 'Research Project',
    description: 'Organize research ideas and connect them with AI assistance',
    icon: '🔬',
    nodes: [
      {
        id: getTemplateNodeId(),
        type: 'note',
        position: { x: 200, y: 200 },
        data: {
          type: 'note',
          label: 'Research Question',
          content: 'How can AI improve productivity in knowledge work?\n\nKey areas to explore:\n- Task automation\n- Information synthesis\n- Decision support',
          collapsed: false,
        },
        width: 400,
        height: 350,
      },
      {
        id: getTemplateNodeId(),
        type: 'note',
        position: { x: 800, y: 200 },
        data: {
          type: 'note',
          label: 'Key Findings',
          content: 'Initial research shows:\n- 40% time saved on routine tasks\n- Better information organization\n- Enhanced creativity through AI collaboration',
          collapsed: false,
        },
        width: 400,
        height: 350,
      },
      {
        id: getTemplateNodeId(),
        type: 'note',
        position: { x: 200, y: 700 },
        data: {
          type: 'note',
          label: 'Sources',
          content: 'References:\n- Study A (2024)\n- Research Paper B\n- Industry Report C',
          collapsed: false,
        },
        width: 400,
        height: 250,
      },
      {
        id: getTemplateNodeId(),
        type: 'prompt',
        position: { x: 800, y: 700 },
        data: {
          type: 'prompt',
          label: 'Synthesize Research',
          content: 'Based on the research question and findings, create a comprehensive summary that connects all the information and identifies key insights.',
          isRunning: false,
          collapsed: false,
        },
        width: 400,
        height: 250,
      },
      {
        id: getTemplateNodeId(),
        type: 'group',
        position: { x: 500, y: 1100 },
        data: {
          type: 'group',
          label: 'Next Steps',
          content: '',
          childNodes: [],
          itemCount: 0,
        },
        width: 560,
        height: 300,
      },
    ],
    edges: [
      {
        id: 'edge_4',
        source: 'template_node_1004',
        target: 'template_node_1005',
        type: 'highlightable',
        animated: false,
        style: { strokeWidth: 2, stroke: '#94a3b8' },
        markerEnd: {
          type: 'arrow',
          width: 20,
          height: 20,
          color: '#94a3b8',
        },
      },
      {
        id: 'edge_5',
        source: 'template_node_1004',
        target: 'template_node_1006',
        type: 'highlightable',
        animated: false,
        style: { strokeWidth: 2, stroke: '#94a3b8' },
        markerEnd: {
          type: 'arrow',
          width: 20,
          height: 20,
          color: '#94a3b8',
        },
      },
      {
        id: 'edge_6',
        source: 'template_node_1005',
        target: 'template_node_1007',
        type: 'highlightable',
        animated: false,
        style: { strokeWidth: 2, stroke: '#94a3b8' },
        markerEnd: {
          type: 'arrow',
          width: 20,
          height: 20,
          color: '#94a3b8',
        },
      },
      {
        id: 'edge_7',
        source: 'template_node_1006',
        target: 'template_node_1007',
        type: 'highlightable',
        animated: false,
        style: { strokeWidth: 2, stroke: '#94a3b8' },
        markerEnd: {
          type: 'arrow',
          width: 20,
          height: 20,
          color: '#94a3b8',
        },
      },
    ],
  },
  {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    description: 'Structure meeting discussions and generate action items',
    icon: '📝',
    nodes: [
      {
        id: getTemplateNodeId(),
        type: 'note',
        position: { x: 150, y: 200 },
        data: {
          type: 'note',
          label: 'Discussion Points',
          content: 'Topics covered:\n- Project timeline\n- Resource allocation\n- Technical challenges\n- Team feedback',
          collapsed: false,
        },
        width: 400,
        height: 300,
      },
      {
        id: getTemplateNodeId(),
        type: 'note',
        position: { x: 700, y: 200 },
        data: {
          type: 'note',
          label: 'Decisions Made',
          content: 'Key decisions:\n- Approve new feature set\n- Extend deadline by 2 weeks\n- Add 2 more team members',
          collapsed: false,
        },
        width: 400,
        height: 300,
      },
      {
        id: getTemplateNodeId(),
        type: 'prompt',
        position: { x: 400, y: 650 },
        data: {
          type: 'prompt',
          label: 'Generate Summary',
          content: 'Create a concise meeting summary with action items, decisions, and next steps based on the discussion points and decisions.',
          isRunning: false,
          collapsed: false,
        },
        width: 400,
        height: 250,
      },
      {
        id: getTemplateNodeId(),
        type: 'textLabel',
        position: { x: 400, y: 1000 },
        data: {
          type: 'textLabel',
          label: 'Action Items',
          content: 'Action Items',
          fontSize: 24,
        },
        width: 300,
        height: 50,
      },
    ],
    edges: [
      {
        id: 'edge_8',
        source: 'template_node_1009',
        target: 'template_node_1011',
        type: 'highlightable',
        animated: false,
        style: { strokeWidth: 2, stroke: '#94a3b8' },
        markerEnd: {
          type: 'arrow',
          width: 20,
          height: 20,
          color: '#94a3b8',
        },
      },
      {
        id: 'edge_9',
        source: 'template_node_1010',
        target: 'template_node_1011',
        type: 'highlightable',
        animated: false,
        style: { strokeWidth: 2, stroke: '#94a3b8' },
        markerEnd: {
          type: 'arrow',
          width: 20,
          height: 20,
          color: '#94a3b8',
        },
      },
    ],
  },
];

// Reset node ID counter for each template load
export const resetTemplateNodeIds = () => {
  templateNodeId = 1000;
};

// Get template by ID
export const getTemplateById = (id: string): BoardTemplate | undefined => {
  return boardTemplates.find((template) => template.id === id);
};

