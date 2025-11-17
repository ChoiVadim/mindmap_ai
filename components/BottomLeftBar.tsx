'use client';

import { useState } from 'react';
import { Info, X, StickyNote, Sparkles, Hash, Type, Bot, ArrowRight, MousePointerClick, MousePointer2, Keyboard } from 'lucide-react';
import { Dock } from '@/components/ui/dock-two';
import { motion, AnimatePresence } from 'framer-motion';

export default function BottomLeftBar() {
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  const handleOpenInfo = () => {
    setIsInfoOpen(true);
  };

  const handleCloseInfo = () => {
    setIsInfoOpen(false);
  };

  const dockItems = [
    {
      icon: Info,
      label: 'About & Help',
      onClick: handleOpenInfo,
    },
  ];

  return (
    <>
      <div className="fixed bottom-6 left-6 z-10">
        <Dock 
          items={dockItems}
          variant="compact"
          tooltipPosition="right"
        />
      </div>

      {/* Info Modal */}
      <AnimatePresence>
        {isInfoOpen && (
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
              onClick={handleCloseInfo}
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed bottom-24 left-6 z-50 w-96 max-h-[80vh] rounded-lg shadow-xl bg-popover border border-border overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">
                  About Strucly
                </h3>
                <button
                  onClick={handleCloseInfo}
                  className="p-1 hover:bg-secondary rounded transition-colors"
                >
                  <X className="w-5 h-5 text-foreground/70" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="overflow-y-auto flex-1 p-6 space-y-6">
                {/* What is Strucly */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">
                    What is Strucly?
                  </h4>
                  <p className="text-sm text-foreground/70 leading-relaxed">
                    A visual canvas for structuring, connecting, and reusing AI-generated knowledge. 
                    Think of it as "Miro for AI Knowledge" — organize your ideas, prompts, and AI responses 
                    in a visual, connected way.
                  </p>
                </div>

                {/* Node Types */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3">
                    Node Types
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-secondary">
                        <StickyNote className="w-4 h-4 text-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-foreground">Note</div>
                        <div className="text-xs text-foreground/60 mt-0.5">
                          Store text, ideas, and information
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-secondary">
                        <Sparkles className="w-4 h-4 text-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-foreground">Prompt</div>
                        <div className="text-xs text-foreground/60 mt-0.5">
                          AI prompts that use connected notes as context
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-secondary">
                        <Hash className="w-4 h-4 text-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-foreground">Group</div>
                        <div className="text-xs text-foreground/60 mt-0.5">
                          Container for organizing multiple notes
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-secondary">
                        <Type className="w-4 h-4 text-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-foreground">Text Label</div>
                        <div className="text-xs text-foreground/60 mt-0.5">
                          Visual labels and comments
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-secondary">
                        <Bot className="w-4 h-4 text-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-foreground">Agent</div>
                        <div className="text-xs text-foreground/60 mt-0.5">
                          AI agent nodes for advanced workflows
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* How to Use */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3">
                    How to Use
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <MousePointerClick className="w-4 h-4 text-foreground/60" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-foreground/80">
                          Drag nodes from the toolbar to create them on the canvas
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <MousePointer2 className="w-4 h-4 text-foreground/60" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-foreground/80">
                          Click nodes to edit their content inline
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <ArrowRight className="w-4 h-4 text-foreground/60" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-foreground/80">
                          Drag from node handles to create connections between nodes
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <Sparkles className="w-4 h-4 text-foreground/60" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-foreground/80">
                          Connect notes to a Prompt node and click Run to generate AI responses
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Keyboard Shortcuts */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3">
                    Keyboard Shortcuts
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground/70">Copy selected nodes</span>
                      <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-secondary border border-border rounded">
                        Cmd/Ctrl + C
                      </kbd>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground/70">Paste nodes</span>
                      <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-secondary border border-border rounded">
                        Cmd/Ctrl + V
                      </kbd>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground/70">Undo</span>
                      <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-secondary border border-border rounded">
                        Cmd/Ctrl + Z
                      </kbd>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground/70">Redo</span>
                      <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-secondary border border-border rounded">
                        Cmd/Ctrl + Shift + Z
                      </kbd>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground/70">Delete selected</span>
                      <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-secondary border border-border rounded">
                        Delete / Backspace
                      </kbd>
                    </div>
                  </div>
                </div>

                {/* Canvas Controls */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">
                    Canvas Navigation
                  </h4>
                  <div className="text-sm text-foreground/70 space-y-1">
                    <div>• Scroll to zoom in/out</div>
                    <div>• Drag with middle mouse button to pan</div>
                    <div>• Two-finger scroll on trackpad to pan</div>
                    <div>• Drag selection box to select multiple nodes</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

