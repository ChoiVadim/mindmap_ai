'use client';

import { useState } from 'react';
import { StickyNote, Sparkles, Hash, Type, Save, Trash2, Bot, Loader2 } from 'lucide-react';
import { NodeType } from '@/types/canvas';
import { Dock } from '@/components/ui/dock-two';

interface ToolbarProps {
  onSave?: () => void | Promise<void>;
  onClear?: () => void;
}

export default function Toolbar({ onSave, onClear }: ToolbarProps) {
  const [isSaving, setIsSaving] = useState(false);

  const onDragStart = (event: React.DragEvent, nodeType: NodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleSave = async () => {
    if (!onSave || isSaving) return;
    
    setIsSaving(true);
    try {
      await onSave();
    } finally {
      setIsSaving(false);
    }
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
      icon: isSaving ? Loader2 : Save,
      label: 'Save',
      onClick: handleSave,
      draggable: false,
      isLoading: isSaving,
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

