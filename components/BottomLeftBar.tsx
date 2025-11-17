'use client';

import { useState } from 'react';
import { Info, X, StickyNote, Sparkles, Hash, Type, Bot, ArrowRight, MousePointerClick, MousePointer2, Keyboard, Brain, Plug, Zap, Play, FileText, Link2 } from 'lucide-react';
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
                  How to Use Strucly
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
                {/* Quick Intro */}
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-start gap-2">
                    <Brain className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-semibold text-foreground mb-1">
                        Plug-and-Think Architecture
                      </div>
                      <div className="text-xs text-foreground/70">
                        Connect knowledge blocks to AI → Generate → Get perfect answers. Zero copy-paste.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Node Types - Quick Reference */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3">
                    Node Types (Quick Reference)
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 p-2 rounded bg-secondary/50">
                      <StickyNote className="w-3.5 h-3.5 text-foreground/70" />
                      <div>
                        <div className="text-xs font-medium text-foreground">Note</div>
                        <div className="text-[10px] text-foreground/50">Knowledge</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded bg-primary/5 border border-primary/20">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      <div>
                        <div className="text-xs font-medium text-foreground">Prompt</div>
                        <div className="text-[10px] text-foreground/50">Simple AI</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded bg-secondary/50 border border-border">
                      <Bot className="w-3.5 h-3.5 text-foreground/70" />
                      <div>
                        <div className="text-xs font-medium text-foreground">AI Agent</div>
                        <div className="text-[10px] text-foreground/50">Advanced</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded bg-secondary/50">
                      <Hash className="w-3.5 h-3.5 text-foreground/70" />
                      <div>
                        <div className="text-xs font-medium text-foreground">Group</div>
                        <div className="text-[10px] text-foreground/50">Organize</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step-by-Step Guide */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3">
                    Step-by-Step: Your First AI Workflow
                  </h4>
                  <div className="space-y-4">
                    {/* Step 1 */}
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <span className="text-xs font-semibold text-primary">1</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="w-4 h-4 text-foreground/60" />
                          <div className="text-sm font-medium text-foreground">Create Knowledge Blocks</div>
                        </div>
                        <div className="text-xs text-foreground/70">
                          Drag <strong>Note</strong> nodes from the toolbar onto the canvas. Add your information: 
                          instructions, examples, rules, or any context you want AI to use.
                        </div>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <span className="text-xs font-semibold text-primary">2</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Sparkles className="w-4 h-4 text-primary" />
                          <div className="text-sm font-medium text-foreground">Add a Prompt Block</div>
                        </div>
                        <div className="text-xs text-foreground/70">
                          Drag a <strong>Prompt Block</strong> onto the canvas. This is where you'll get AI responses. 
                          Simple and ready to use!
                        </div>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <span className="text-xs font-semibold text-primary">3</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Link2 className="w-4 h-4 text-foreground/60" />
                          <div className="text-sm font-medium text-foreground">Connect Notes to Prompt</div>
                        </div>
                        <div className="text-xs text-foreground/70">
                          Drag from the <strong>handle</strong> (small circle) on your Note nodes to the Prompt Block. 
                          This connects your knowledge as context for AI.
                        </div>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <span className="text-xs font-semibold text-primary">4</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Play className="w-4 h-4 text-primary" />
                          <div className="text-sm font-medium text-foreground">Click Run</div>
                        </div>
                        <div className="text-xs text-foreground/70">
                          Click the <strong>Run button</strong> on the Prompt Block. AI uses only the connected context 
                          to generate accurate answers. No copy-paste needed!
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Advanced: AI Agent Blocks */}
                <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                  <div className="flex items-start gap-2">
                    <Bot className="w-4 h-4 text-foreground/70 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-semibold text-foreground mb-1">
                        Advanced: AI Agent Blocks
                      </div>
                      <div className="text-xs text-foreground/70 mb-2">
                        For advanced users: Create an <strong>AI Agent Block</strong> to configure system prompts, 
                        choose models, and set up custom behavior. Then connect the Agent to a Prompt Block for 
                        sophisticated workflows.
                      </div>
                      <div className="text-[10px] text-foreground/60 space-y-1">
                        <div>• Configure system prompts in Agent settings</div>
                        <div>• Choose AI models (GPT-4, Claude, etc.)</div>
                        <div>• Connect Agent → Prompt Block for advanced control</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Basic Canvas Operations */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3">
                    Basic Operations
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <MousePointerClick className="w-3.5 h-3.5 text-foreground/50 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-foreground/70">
                        <strong>Click nodes</strong> to edit their content inline
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <ArrowRight className="w-3.5 h-3.5 text-foreground/50 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-foreground/70">
                        <strong>Drag from handles</strong> (small circles on nodes) to create connections
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MousePointer2 className="w-3.5 h-3.5 text-foreground/50 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-foreground/70">
                        <strong>Select multiple nodes</strong> by dragging a selection box
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

                {/* Canvas Navigation */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">
                    Canvas Navigation
                  </h4>
                  <div className="text-xs text-foreground/70 space-y-1">
                    <div>• <strong>Scroll</strong> to zoom in/out</div>
                    <div>• <strong>Drag</strong> with middle mouse or two-finger scroll to pan</div>
                    <div>• <strong>Drag selection box</strong> to select multiple nodes</div>
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

