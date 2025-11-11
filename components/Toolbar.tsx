'use client';

import { StickyNote, Sparkles, Hash, Type, Save, Trash2, Bot } from 'lucide-react';
import { NodeType } from '@/types/canvas';
import { Dock } from '@/components/ui/dock-two';

interface ToolbarProps {
  onSave?: () => void;
  onClear?: () => void;
}

export default function Toolbar({ onSave, onClear }: ToolbarProps) {
  const onDragStart = (event: React.DragEvent, nodeType: NodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const tools = [
    {
      type: 'note' as NodeType,
      icon: StickyNote,
      label: 'Note',
    },
    {
      type: 'prompt' as NodeType,
      icon: Sparkles,
      label: 'Prompt',
    },
    {
      type: 'group' as NodeType,
      icon: Hash,
      label: 'Group',
    },
    {
      type: 'textLabel' as NodeType,
      icon: Type,
      label: 'Text',
    },
    {
      type: 'agent' as NodeType,
      icon: Bot,
      label: 'Agent',
    },
  ];

  const dockItems = [
    ...tools.map((tool) => ({
      icon: tool.icon,
      label: tool.label,
      onClick: undefined as (() => void) | undefined,
      onDragStart: (e: React.DragEvent) => onDragStart(e, tool.type),
      draggable: true,
    })),
    {
      icon: Save,
      label: 'Save',
      onClick: onSave,
      draggable: false,
    },
    {
      icon: Trash2,
      label: 'Clear',
      onClick: onClear,
      draggable: false,
    },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-10">
      <Dock 
        items={dockItems}
        variant="compact"
      />
    </div>
  );
}

