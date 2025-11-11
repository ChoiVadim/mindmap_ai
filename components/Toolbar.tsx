'use client';

import { useState, useEffect } from 'react';
import { StickyNote, Sparkles, Hash, Type, Save, Trash2 } from 'lucide-react';
import { NodeType } from '@/types/canvas';

interface ToolbarProps {
  onSave?: () => void;
  onClear?: () => void;
}

export default function Toolbar({ onSave, onClear }: ToolbarProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Проверяем текущую тему
    const checkTheme = () => {
      const isDarkMode = document.documentElement.classList.contains('dark');
      setIsDark(isDarkMode);
    };
    
    checkTheme();
    
    // Слушаем изменения темы
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    
    return () => observer.disconnect();
  }, []);
  const onDragStart = (event: React.DragEvent, nodeType: NodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const tools = [
    {
      type: 'note' as NodeType,
      icon: StickyNote,
      label: 'Note',
      description: 'Add a note',
      color: 'blue',
    },
    {
      type: 'prompt' as NodeType,
      icon: Sparkles,
      label: 'Prompt',
      description: 'Add AI prompt',
      color: 'purple',
    },
    {
      type: 'group' as NodeType,
      icon: Hash,
      label: 'Group',
      description: 'Add group',
      color: 'gray',
    },
    {
      type: 'textLabel' as NodeType,
      icon: Type,
      label: 'Text',
      description: 'Add label',
      color: 'gray',
    },
  ];

  const borderColor = isDark ? '#374151' : '#e5e7eb';
  
  return (
    <div 
      className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-10 rounded-lg shadow-lg px-3 py-2"
      style={{ 
        backgroundColor: isDark ? '#1f2937' : '#f9fafb',
        border: `1px solid ${borderColor}`
      }}
    >
      <div className="flex items-center gap-2">
        {/* Node creation tools */}
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <div
              key={tool.type}
              draggable
              onDragStart={(e) => onDragStart(e, tool.type)}
              className={`
                p-3 rounded-full transition-all duration-200 cursor-grab active:cursor-grabbing
                hover:bg-${tool.color}-50 hover:scale-110 group
              `}
              title={tool.label}
            >
              <Icon className={`w-5 h-5 text-${tool.color}-500 pointer-events-none`} />
            </div>
          );
        })}

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-600 mx-1" />

        {/* Canvas actions */}
        <button
          onClick={onSave}
          className="p-3 rounded-full transition-all duration-200 hover:bg-green-50 hover:scale-110 group"
          title="Save canvas"
        >
          <Save className="w-5 h-5 text-green-500" />
        </button>

        <button
          onClick={onClear}
          className="p-3 rounded-full transition-all duration-200 hover:bg-red-50 hover:scale-110 group"
          title="Clear canvas"
        >
          <Trash2 className="w-5 h-5 text-red-500" />
        </button>
      </div>
    </div>
  );
}

