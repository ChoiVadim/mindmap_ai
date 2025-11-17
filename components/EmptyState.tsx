'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, FileText, Lightbulb, Loader2 } from 'lucide-react';
import { useBoardStore } from '@/store/board-store';
import { useCanvasStore } from '@/store/canvas-store';
import { loadTemplatesFromDB, BoardTemplate } from '@/lib/board-templates';

interface EmptyStateProps {
  onDismiss?: () => void;
}

export default function EmptyState({ onDismiss }: EmptyStateProps) {
  const { loadTemplate } = useBoardStore();
  const { loadCanvas } = useCanvasStore();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [templates, setTemplates] = useState<BoardTemplate[]>([]);

  // Load templates from DB on mount
  useEffect(() => {
    loadTemplatesFromDB().then(setTemplates).catch(() => {
      // Fallback to static templates on error
      setTemplates([]);
    });
  }, []);

  const handleLoadTemplate = async (templateId: string) => {
    setIsLoading(templateId);
    try {
      // Load template which creates a new board and loads it
      const newBoard = await loadTemplate(templateId);
      
      // Load the template nodes and edges into the canvas
      loadCanvas(newBoard.nodes, newBoard.edges);
    } catch (error) {
      console.error('Error loading template:', error);
      alert('Failed to load template. Please try again.');
    } finally {
      setIsLoading(null);
    }
  };

  const handleStartFromScratch = () => {
    if (onDismiss) {
      onDismiss();
    }
  };

  const templateIcons: Record<string, typeof Sparkles> = {
    'system-prompt': Sparkles,
    'research-project': FileText,
    'meeting-notes': Lightbulb,
  };

  return (
    <div className="fixed bottom-24 left-6 z-30 pointer-events-none">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="w-96 max-h-[75vh] overflow-hidden bg-popover border border-border rounded-lg shadow-2xl pointer-events-auto flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            Start creating
          </h2>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          <p className="text-sm text-foreground/70 leading-relaxed">
            Connect ideas, organize knowledge, and use AI to generate insights. 
            Choose a template to get started or begin with a blank canvas.
          </p>

          {/* Templates List */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Templates
            </h3>
            <div className="space-y-2">
              {templates.map((template) => {
                const Icon = templateIcons[template.id] || Sparkles;
                const isTemplateLoading = isLoading === template.id;
                return (
                  <motion.button
                    key={template.id}
                    onClick={() => handleLoadTemplate(template.id)}
                    disabled={isLoading !== null}
                    whileHover={{ scale: isLoading ? 1 : 1.01 }}
                    whileTap={{ scale: isLoading ? 1 : 0.99 }}
                    className="w-full p-3 rounded-lg border border-border bg-background hover:bg-secondary/50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed relative"
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-xl flex-shrink-0">{template.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground mb-0.5">
                          {template.name}
                        </div>
                        <div className="text-xs text-foreground/60">
                          {template.description}
                        </div>
                      </div>
                    </div>
                    {isTemplateLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/90 rounded-lg">
                        <div className="flex flex-col items-center gap-1.5">
                          <Loader2 className="w-4 h-4 text-foreground animate-spin" />
                          <span className="text-xs text-foreground/70">Loading...</span>
                        </div>
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <button
            onClick={handleStartFromScratch}
            className="w-full px-4 py-2.5 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-secondary/50 rounded-lg transition-colors"
          >
            Start from scratch
          </button>
        </div>
      </motion.div>
    </div>
  );
}

