'use client';

import { useState, useEffect } from 'react';
import { 
  Menu, X, Moon, Sun, HelpCircle, Info, MessageSquare, Send, Check, LayoutDashboard, ChevronRight,
  Brain, StickyNote, Sparkles, Bot, Hash, FileText, Link2, Play, 
  MousePointerClick, ArrowRight, MousePointer2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useBoardStore } from '@/store/board-store';
import { useCanvasStore } from '@/store/canvas-store';

export default function MobileMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBoardsOpen, setIsBoardsOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    boards,
    currentBoardId,
    setCurrentBoard,
    getCurrentBoard,
    setLoading,
  } = useBoardStore();

  const { loadCanvas } = useCanvasStore();

  const currentBoard = getCurrentBoard();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const shouldBeDark = savedTheme === 'dark';
    setIsDark(shouldBeDark);
    
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    setIsMenuOpen(false);
  };

  const showWelcomeModal = () => {
    localStorage.removeItem('strucly_welcome_shown');
    window.dispatchEvent(new CustomEvent('showWelcomeModal'));
    setIsMenuOpen(false);
  };

  const handleOpenInfo = () => {
    setIsInfoOpen(true);
    setIsMenuOpen(false);
  };

  const handleCloseInfo = () => {
    setIsInfoOpen(false);
  };

  const handleOpenFeedback = () => {
    setIsFeedbackOpen(true);
    setIsMenuOpen(false);
    setIsSubmitted(false);
    setFeedback('');
    setEmail('');
  };

  const handleCloseFeedback = () => {
    setIsFeedbackOpen(false);
    setIsSubmitted(false);
    setFeedback('');
    setEmail('');
  };

  const handleOpenBoards = () => {
    setIsBoardsOpen(true);
    setIsMenuOpen(false);
  };

  const handleCloseBoards = () => {
    setIsBoardsOpen(false);
  };

  const handleBoardChange = async (boardId: string) => {
    const board = boards.find((b) => b.id === boardId);
    if (!board) return;
    
    setCurrentBoard(boardId);
    setIsBoardsOpen(false);
    
    // If board data is already loaded, use it
    if (board.nodes.length > 0 || board.edges.length > 0) {
      loadCanvas(board.nodes || [], board.edges || []);
      return;
    }
    
    // Otherwise, load board data on demand
    setLoading(true);
    try {
      const boardResponse = await fetch(`/api/boards/${boardId}`);
      if (boardResponse.ok) {
        const loadedBoard = await boardResponse.json();
        loadCanvas(loadedBoard.nodes || [], loadedBoard.edges || []);
      }
    } catch (error) {
      console.error('Error loading board data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedback.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedback: feedback.trim(),
          email: email.trim() || undefined,
        }),
      });

      if (response.ok) {
        setIsSubmitted(true);
        setFeedback('');
        setEmail('');
        
        setTimeout(() => {
          setIsFeedbackOpen(false);
          setIsSubmitted(false);
        }, 2000);
      } else {
        throw new Error('Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: 'Switch board',
      onClick: handleOpenBoards,
    },
    {
      icon: HelpCircle,
      label: 'Show welcome guide',
      onClick: showWelcomeModal,
    },
    {
      icon: isDark ? Sun : Moon,
      label: isDark ? 'Switch to light mode' : 'Switch to dark mode',
      onClick: toggleTheme,
    },
    {
      icon: Info,
      label: 'About & Help',
      onClick: handleOpenInfo,
    },
    {
      icon: MessageSquare,
      label: 'Leave feedback',
      onClick: handleOpenFeedback,
    },
  ];

  return (
    <>
      {/* Mobile Header with Logo, Board and Menu Button */}
      <div className="fixed top-4 left-10 right-10 z-50 md:hidden flex items-center justify-between gap-4">
        {/* Logo and Board */}
        <button
          onClick={handleOpenBoards}
          className="flex items-center gap-2 bg-background/90 backdrop-blur-lg border border-border rounded-2xl p-3 shadow-lg hover:bg-secondary transition-colors flex-1 min-w-0"
        >
          <Image
            src="/icon.png"
            alt="Strucly Logo"
            width={24}
            height={24}
            className="rounded-lg flex-shrink-0"
          />
          <div className="flex flex-col items-start min-w-0 flex-1">
            <span className="font-bold text-sm text-foreground">
              Strucly
            </span>
            {currentBoard && (
              <span className="text-xs text-foreground/60 truncate max-w-full">
                {currentBoard.name}
              </span>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-foreground/50 flex-shrink-0" />
        </button>
        
        {/* Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-5 bg-background/90 backdrop-blur-lg border border-border rounded-2xl shadow-lg hover:bg-secondary transition-colors flex-shrink-0"
          aria-label="Menu"
        >
          {isMenuOpen ? (
            <X className="w-5 h-5 text-foreground" />
          ) : (
            <Menu className="w-5 h-5 text-foreground" />
          )}
        </button>
      </div>

      {/* Menu Dropdown */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
              onClick={() => setIsMenuOpen(false)}
            />
            
            {/* Menu Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="fixed top-20 right-4 z-50 w-64 rounded-2xl shadow-xl bg-popover border border-border overflow-hidden md:hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-2">
                {menuItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={index}
                      onClick={item.onClick}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary rounded-xl transition-colors"
                    >
                      <Icon className="w-5 h-5 text-foreground/70" />
                      <span className="text-sm font-medium text-foreground">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Info Modal (from BottomLeftBar) */}
      <AnimatePresence>
        {isInfoOpen && (
          <>
            <div
              className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm"
              onClick={handleCloseInfo}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-4 z-[70] md:w-[600px] md:max-w-[90vw] md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 max-h-[90vh] rounded-2xl shadow-xl bg-popover border border-border overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
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

              {/* Scrollable Content - Full content from BottomLeftBar */}
              <div className="overflow-y-auto flex-1 p-6 space-y-6 overscroll-contain touch-pan-y" style={{ WebkitOverflowScrolling: 'touch' }}>
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

      {/* Feedback Modal (from BottomRightBar) */}
      <AnimatePresence>
        {isFeedbackOpen && (
          <>
            <div
              className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm"
              onClick={handleCloseFeedback}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-[90vw] max-w-md rounded-2xl shadow-xl bg-popover border border-border p-6"
              onClick={(e) => e.stopPropagation()}
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
            >
              {isSubmitted ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                    <Check className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Thank you for your feedback!
                  </h3>
                  <p className="text-sm text-foreground/70 text-center">
                    Your message has been sent
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-foreground">
                      Leave feedback
                    </h3>
                    <button
                      onClick={handleCloseFeedback}
                      className="p-1 hover:bg-secondary rounded transition-colors"
                    >
                      <X className="w-5 h-5 text-foreground/70" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label
                        htmlFor="feedback"
                        className="block text-sm font-medium text-foreground mb-2"
                      >
                        Your feedback *
                      </label>
                      <textarea
                        id="feedback"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Share your thoughts, suggest new features, or report any issues..."
                        className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-foreground placeholder:text-foreground/50"
                        rows={5}
                        required
                        disabled={isSubmitting}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-foreground mb-2"
                      >
                        Email (optional)
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-foreground placeholder:text-foreground/50"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handleCloseFeedback}
                        className="flex-1 px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-secondary rounded-xl transition-colors"
                        disabled={isSubmitting}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!feedback.trim() || isSubmitting}
                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-950 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Send
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Boards Modal */}
      <AnimatePresence>
        {isBoardsOpen && (
          <>
            <div
              className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm"
              onClick={handleCloseBoards}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-4 z-[70] md:w-[600px] md:max-w-[90vw] md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 max-h-[90vh] rounded-2xl shadow-xl bg-popover border border-border overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">
                  Switch Board
                </h3>
                <button
                  onClick={handleCloseBoards}
                  className="p-1 hover:bg-secondary rounded transition-colors"
                >
                  <X className="w-5 h-5 text-foreground/70" />
                </button>
              </div>

              {/* Boards List */}
              <div className="overflow-y-auto flex-1 p-2 overscroll-contain touch-pan-y" style={{ WebkitOverflowScrolling: 'touch' }}>
                {Array.isArray(boards) && boards.length > 0 ? (
                  boards.map((board) => (
                    <button
                      key={board.id}
                      onClick={() => handleBoardChange(board.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 text-left rounded-xl transition-colors ${
                        board.id === currentBoardId
                          ? 'bg-secondary font-medium text-foreground'
                          : 'text-foreground/70 hover:bg-secondary/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <LayoutDashboard className="w-5 h-5" />
                        <span className="text-sm">{board.name}</span>
                      </div>
                      {board.id === currentBoardId && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-foreground/50 text-sm">
                    No boards available
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

