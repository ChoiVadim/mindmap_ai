'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Link2, Play, FileText, ArrowRight } from 'lucide-react';
import { loadTemplatesFromDB, BoardTemplate } from '@/lib/board-templates';
import { useBoardStore } from '@/store/board-store';
import { useCanvasStore } from '@/store/canvas-store';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  const { loadTemplate } = useBoardStore();
  const { loadCanvas } = useCanvasStore();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [templates, setTemplates] = useState<BoardTemplate[]>([]);

  // Load templates from DB when modal opens
  useEffect(() => {
    if (isOpen) {
      loadTemplatesFromDB().then(setTemplates).catch(() => {
        // Fallback to static templates on error
        setTemplates([]);
      });
    }
  }, [isOpen]);

  const handleLoadTemplate = async (templateId: string) => {
    setIsLoading(templateId);
    try {
      // Load template which creates a new board and loads it
      const newBoard = await loadTemplate(templateId);
      
      // Load the template nodes and edges into the canvas
      loadCanvas(newBoard.nodes, newBoard.edges);
      
      // Close modal after loading template
      onClose();
    } catch (error) {
      console.error('Error loading template:', error);
      alert('Failed to load template. Please try again.');
    } finally {
      setIsLoading(null);
    }
  };

  const handleGetStarted = () => {
    onClose();
  };

  const tutorialSteps = [
    {
      icon: FileText,
      title: 'Create Notes',
      description: 'Add notes to capture ideas and information',
    },
    {
      icon: Link2,
      title: 'Connect Ideas',
      description: 'Link notes together to build context',
    },
    {
      icon: Sparkles,
      title: 'Use AI Prompts',
      description: 'Connect notes to prompts for AI-powered insights',
    },
    {
      icon: Play,
      title: 'Generate Results',
      description: 'Run prompts to create AI-generated content',
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal - positioned top right */}
          <div className="fixed top-6 right-6 z-50 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              className="w-96 max-h-[85vh] overflow-hidden bg-popover border border-border rounded-lg shadow-2xl pointer-events-auto flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h1 className="text-lg font-semibold text-foreground">
                  Welcome to Strucly
                </h1>
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-secondary rounded transition-colors"
                >
                  <X className="w-4 h-4 text-foreground/70" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="overflow-y-auto flex-1 p-4 space-y-6">
                {/* Intro */}
                <div>
                  <p className="text-sm text-foreground/70 leading-relaxed">
                    A visual canvas for structuring, connecting, and reusing AI-generated knowledge.
                    Get started by exploring an example or creating your own mind map.
                  </p>
                </div>

                {/* Tutorial Steps */}
                <div>
                  <h2 className="text-sm font-semibold text-foreground mb-3">
                    How it works
                  </h2>
                  <div className="space-y-3">
                    {tutorialSteps.map((step, index) => {
                      const Icon = step.icon;
                      return (
                        <div
                          key={index}
                          className="flex items-start gap-3"
                        >
                          <div className="p-2 rounded-lg bg-secondary flex-shrink-0">
                            <Icon className="w-4 h-4 text-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-foreground">
                              {step.title}
                            </div>
                            <div className="text-xs text-foreground/60 mt-0.5">
                              {step.description}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Template Examples */}
                <div>
                  <h2 className="text-sm font-semibold text-foreground mb-3">
                    Try an example
                  </h2>
                  <div className="space-y-2">
                    {templates.map((template) => {
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
                                <div className="w-4 h-4 border-2 border-foreground/30 border-t-foreground/70 rounded-full animate-spin" />
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
                <motion.button
                  onClick={handleGetStarted}
                  disabled={isLoading !== null}
                  whileHover={{ scale: isLoading ? 1 : 1.01 }}
                  whileTap={{ scale: isLoading ? 1 : 0.99 }}
                  className="w-full px-4 py-2.5 bg-foreground text-background rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

