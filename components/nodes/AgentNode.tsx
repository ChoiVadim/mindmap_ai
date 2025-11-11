'use client';

import { useCallback, useEffect, useState } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from '@xyflow/react';
import { Bot, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';
import { AgentNodeData, AIProvider } from '@/types/canvas';
import { useCanvasStore } from '@/store/canvas-store';

// Model options for each provider
const MODEL_OPTIONS: Record<AIProvider, string[]> = {
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  gemini: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro'],
  claude: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229'],
};

function AgentNode({ id, data, selected }: NodeProps) {
  const typedData = data as AgentNodeData;
  const updateNodeData = useCanvasStore((state) => state.updateNodeData);
  const deleteNode = useCanvasStore((state) => state.deleteNode);
  const toggleNodeCollapse = useCanvasStore((state) => state.toggleNodeCollapse);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [label, setLabel] = useState(typedData.label || 'AI Agent');

  // Create editor instance for system prompt
  const editor = useCreateBlockNote({
    initialContent: typedData.systemPrompt && typedData.systemPrompt.trim() !== '' 
      ? undefined
      : undefined,
    _tiptapOptions: {
      editorProps: {
        transformPastedHTML(html) {
          return html.replace(/<ol(\s|>)/g, (match, after) => {
            if (match.includes('start=')) {
              return match;
            }
            return `<ol start="1"${after}`;
          });
        },
        transformPastedText(text) {
          return text;
        },
      },
    },
  });

  // Update label when data changes
  useEffect(() => {
    if (typedData.label !== undefined) {
      setLabel(typedData.label || 'AI Agent');
    }
  }, [typedData.label]);

  // Load initial markdown content
  useEffect(() => {
    if (!editor || !typedData.systemPrompt || typedData.systemPrompt.trim() === '') {
      return;
    }

    const loadContent = async () => {
      try {
        let processedContent = typedData.systemPrompt;
        processedContent = processedContent.replace(/^\s*\d+\.\s/gm, (match) => {
          const num = match.trim().split('.')[0];
          return `${num}. `;
        });
        
        const blocks = await editor.tryParseMarkdownToBlocks(processedContent);
        const currentMarkdown = await editor.blocksToMarkdownLossy(editor.document);
        if (currentMarkdown.trim() !== processedContent.trim()) {
          editor.replaceBlocks(editor.document, blocks);
        }
      } catch (error) {
        console.error('Failed to parse markdown:', error);
        try {
          editor.replaceBlocks(editor.document, [
            {
              type: "paragraph",
              content: typedData.systemPrompt,
            },
          ] as any);
        } catch (e) {
          console.error('Failed to insert as plain text:', e);
        }
      }
    };
    
    loadContent();
  }, [editor, typedData.systemPrompt]);

  // Handle system prompt changes
  const handleSystemPromptChange = useCallback(async () => {
    if (!editor) return;
    
    try {
      const markdown = await editor.blocksToMarkdownLossy(editor.document);
      updateNodeData(id, { systemPrompt: markdown });
    } catch (error) {
      console.error('Failed to convert to markdown:', error);
    }
  }, [editor, id, updateNodeData]);

  const handleProviderChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvider = e.target.value as AIProvider;
    const defaultModel = MODEL_OPTIONS[newProvider][0];
    updateNodeData(id, { 
      provider: newProvider,
      model: defaultModel,
    });
  }, [id, updateNodeData]);

  const handleModelChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    updateNodeData(id, { model: e.target.value });
  }, [id, updateNodeData]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNode(id);
  }, [id, deleteNode]);

  const handleLabelChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLabel(e.target.value);
  }, []);

  const handleLabelBlur = useCallback(() => {
    setIsEditingLabel(false);
    updateNodeData(id, { label: label || 'AI Agent' });
  }, [id, label, updateNodeData]);

  const handleToggleCollapse = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    toggleNodeCollapse(id);
  }, [id, toggleNodeCollapse]);

  const isCollapsed = typedData.collapsed ?? false;

  return (
    <div
      className={`
        relative bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg shadow-md border-2
        ${selected ? 'border-blue-500 shadow-lg' : 'border-blue-200'}
        transition-all duration-200 hover:shadow-lg
        w-full h-full
      `}
      style={{
        minWidth: '400px',
        minHeight: isCollapsed ? 'auto' : '300px'
      }}
    >
      {/* Node Resizer */}
      <NodeResizer
        isVisible={selected}
        minWidth={400}
        minHeight={300}
        handleClassName="!w-3 !h-3 !bg-blue-500 !border-2 !border-white !rounded-full"
      />
      
      {/* Handles for connections */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className={`!w-4 !h-4 !bg-blue-500 !border-2 !border-white !rounded-full transition-all ${selected ? 'opacity-100' : 'opacity-0'}`}
        style={{ left: '-5px' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className={`!w-4 !h-4 !bg-blue-500 !border-2 !border-white !rounded-full transition-all ${selected ? 'opacity-100' : 'opacity-0'}`}
        style={{ right: '-5px' }}
      />

      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-blue-100">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Bot className="w-4 h-4 text-blue-500 flex-shrink-0" />
          {isEditingLabel ? (
            <input
              autoFocus
              value={label}
              onChange={handleLabelChange}
              onBlur={handleLabelBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleLabelBlur();
                }
              }}
              className="nodrag nopan text-sm font-semibold text-blue-700 bg-transparent border border-blue-300 rounded px-1 focus:outline-none focus:ring-1 focus:ring-blue-500 flex-1 min-w-0"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              onClick={() => setIsEditingLabel(true)}
              className="text-sm font-semibold text-blue-700 cursor-text hover:text-blue-900 truncate"
            >
              {label || 'AI Agent'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={handleToggleCollapse}
            className="p-1 hover:bg-blue-100 rounded transition-colors"
            title={isCollapsed ? 'Развернуть' : 'Свернуть'}
          >
            {isCollapsed ? (
              <ChevronDown className="w-3 h-3 text-blue-600" />
            ) : (
              <ChevronUp className="w-3 h-3 text-blue-600" />
            )}
          </button>
          <button
            onClick={handleDelete}
            className="p-1 hover:bg-red-50 rounded transition-colors"
          >
            <Trash2 className="w-3 h-3 text-red-500" />
          </button>
        </div>
      </div>

      {/* Content - only show when not collapsed */}
      {!isCollapsed && (
        <>
          {/* Provider and Model Selection */}
          <div className="p-3 border-b border-blue-100 space-y-2">
            <div>
              <label className="text-xs font-medium text-blue-600 mb-1 block">Provider</label>
              <select
                value={typedData.provider}
                onChange={handleProviderChange}
                className="w-full px-2 py-1.5 text-sm border border-blue-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="openai">OpenAI</option>
                <option value="gemini">Google Gemini</option>
                <option value="claude">Anthropic Claude</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-blue-600 mb-1 block">Model</label>
              <select
                value={typedData.model || MODEL_OPTIONS[typedData.provider][0]}
                onChange={handleModelChange}
                className="w-full px-2 py-1.5 text-sm border border-blue-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {MODEL_OPTIONS[typedData.provider].map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* System Prompt Editor */}
          <div className="p-3 flex-1 overflow-auto">
            <label className="text-xs font-medium text-blue-600 mb-2 block">System Prompt</label>
            <div className="h-48 nodrag nopan border border-blue-200 rounded-md overflow-hidden">
              <BlockNoteView
                editor={editor}
                onChange={handleSystemPromptChange}
                theme="light"
                data-color-mode="light"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AgentNode;

