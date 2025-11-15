'use client';

import { useState, useEffect } from 'react';
import { LayoutDashboard, Plus, Trash2, Edit2, X, Check, LogOut, User } from 'lucide-react';
import Image from 'next/image';
import { Dock } from '@/components/ui/dock-two';
import { motion, AnimatePresence } from 'framer-motion';
import { useBoardStore } from '@/store/board-store';
import { useCanvasStore } from '@/store/canvas-store';
import { useAuth } from '@/components/auth/AuthProvider';

export default function TopLeftBar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [deletingBoardId, setDeletingBoardId] = useState<string | null>(null);

  const {
    boards,
    currentBoardId,
    setCurrentBoard,
    createBoard,
    deleteBoard,
    updateBoardName,
    getCurrentBoard,
    setBoards,
    setLoading,
    isLoading,
  } = useBoardStore();

  const { loadCanvas } = useCanvasStore();
  const { user, signOut, loading: authLoading } = useAuth();

  const currentBoard = getCurrentBoard();

  // Load boards on mount - load only metadata first, then load first board's data
  useEffect(() => {
    const loadBoards = async () => {
      setLoading(true);
      try {
        // First, load only board metadata (fast)
        const response = await fetch('/api/boards');
        if (response.ok) {
          const boardsMetadata = await response.json();
          
          // Ensure boardsMetadata is an array
          const boardsArray = Array.isArray(boardsMetadata) ? boardsMetadata : [];
          
          // Set boards list immediately (without data)
          setBoards(boardsArray);
          
          // Use first board or create default if none exist
          if (boardsArray.length > 0) {
            const firstBoardId = boardsArray[0].id;
            setCurrentBoard(firstBoardId);
            
            // Load first board's data on demand
            const boardResponse = await fetch(`/api/boards/${firstBoardId}`);
            if (boardResponse.ok) {
              const firstBoard = await boardResponse.json();
              loadCanvas(firstBoard.nodes || [], firstBoard.edges || []);
              
              // Update the board in store with loaded data
              setBoards(boardsArray.map(b => 
                b.id === firstBoardId ? firstBoard : b
              ));
            }
          } else {
            // Create default board if none exist
            const defaultBoard = await createBoard('Main Board');
            loadCanvas(defaultBoard.nodes || [], defaultBoard.edges || []);
            setBoards([defaultBoard]);
          }
        } else {
          setBoards([]);
        }
      } catch (error) {
        console.error('Error loading boards:', error);
        // Set empty array on error to prevent crashes
        setBoards([]);
      } finally {
        setLoading(false);
      }
    };

    loadBoards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  const handleBoardChange = async (boardId: string) => {
    const board = boards.find((b) => b.id === boardId);
    if (!board) return;
    
    setCurrentBoard(boardId);
    setIsDropdownOpen(false);
    
    // If board data is already loaded (has nodes or edges), use it
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
        
        // Update the board in store with loaded data
        setBoards(boards.map(b => 
          b.id === boardId ? loadedBoard : b
        ));
      }
    } catch (error) {
      console.error('Error loading board data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async () => {
    if (!newBoardName.trim()) return;

    try {
      const newBoard = await createBoard(newBoardName.trim());
      loadCanvas(newBoard.nodes || [], newBoard.edges || []);
      setNewBoardName('');
      setIsCreating(false);
      setIsDropdownOpen(true); // Keep dropdown open to show new board
    } catch (error) {
      console.error('Error creating board:', error);
      alert('Failed to create board');
    }
  };

  const handleDeleteClick = (boardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (boards.length === 1) {
      alert('Cannot delete the last board. Create another board first.');
      return;
    }

    setDeletingBoardId(boardId);
  };

  const handleConfirmDelete = async () => {
    if (!deletingBoardId) return;

    try {
      console.log('Calling deleteBoard for:', deletingBoardId);
      await deleteBoard(deletingBoardId);
      console.log('Board deleted successfully');
      
      // If we deleted the current board, the store will switch to another one
      const newCurrentBoard = getCurrentBoard();
      console.log('New current board:', newCurrentBoard?.id);
      if (newCurrentBoard) {
        loadCanvas(newCurrentBoard.nodes || [], newCurrentBoard.edges || []);
      } else {
        // If no boards left, clear canvas
        console.log('No boards left, clearing canvas');
        loadCanvas([], []);
      }
      
      setDeletingBoardId(null);
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Error deleting board:', error);
      alert('Failed to delete board: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setDeletingBoardId(null);
    }
  };

  const handleCancelDelete = () => {
    setDeletingBoardId(null);
  };

  const handleStartEdit = (boardId: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingBoardId(boardId);
    setEditName(currentName);
  };

  const handleSaveEdit = async (boardId: string) => {
    if (!editName.trim()) {
      setEditingBoardId(null);
      return;
    }

    try {
      await updateBoardName(boardId, editName.trim());
      setEditingBoardId(null);
      setEditName('');
    } catch (error) {
      console.error('Error updating board name:', error);
      alert('Failed to update board name');
    }
  };

  const handleCancelEdit = () => {
    setEditingBoardId(null);
    setEditName('');
  };

  const dockItems = [
    {
      icon: LayoutDashboard,
      label: currentBoard?.name || 'Loading...',
      onClick: () => setIsDropdownOpen(!isDropdownOpen),
    },
  ];

  return (
    <div className="fixed top-6 left-6 z-10">
      <div className="relative">
        <Dock 
          items={dockItems}
          variant="compact"
          tooltipPosition="right"
          prefix={
            <>
              <Image
                src="/icon.png"
                alt="MindCanvas Logo"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <span className="font-bold text-lg text-foreground">
                MindCanvas
              </span>
            </>
          }
        />

        {/* Dropdown */}
        <AnimatePresence>
          {isDropdownOpen && (
            <>
              {/* Overlay to close dropdown */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => {
                  setIsDropdownOpen(false);
                  setIsCreating(false);
                  setEditingBoardId(null);
                  setDeletingBoardId(null);
                }}
              />
              
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 mt-2 w-72 rounded-lg shadow-xl py-1 z-20 bg-popover border border-border"
              >
                {/* User info and logout */}
                {!authLoading && user && (
                  <div className="px-4 py-2 border-b border-border">
                    <div className="flex items-center gap-2 text-sm text-foreground/70 mb-2">
                      <User className="w-4 h-4" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    <button
                      onClick={signOut}
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-foreground/70 hover:bg-secondary/50 rounded transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign out</span>
                    </button>
                  </div>
                )}

                {/* Board list */}
                {Array.isArray(boards) && boards.map((board) => (
                  <div
                    key={board.id}
                    className="group"
                  >
                    {editingBoardId === board.id ? (
                      <div className="px-4 py-2 flex items-center gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveEdit(board.id);
                            } else if (e.key === 'Escape') {
                              handleCancelEdit();
                            }
                          }}
                          className="flex-1 px-2 py-1 text-sm bg-background border border-border rounded"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveEdit(board.id);
                          }}
                          className="p-1 hover:bg-secondary rounded"
                        >
                          <Check className="w-4 h-4 text-green-500" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelEdit();
                          }}
                          className="p-1 hover:bg-secondary rounded"
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    ) : (
                      <div
                        className={`w-full px-4 py-2 text-sm transition-colors flex items-center gap-2 ${
                          board.id === currentBoardId
                            ? 'bg-secondary font-medium text-foreground'
                            : 'text-foreground/70 hover:bg-secondary/50'
                        }`}
                      >
                        <button
                          onClick={() => handleBoardChange(board.id)}
                          className="flex-1 truncate min-w-0 text-left"
                          type="button"
                        >
                          {board.name}
                        </button>
                        <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handleStartEdit(board.id, board.name, e);
                            }}
                            className="p-1.5 hover:bg-secondary/50 rounded transition-colors"
                            title="Rename board"
                            type="button"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {boards.length > 1 && deletingBoardId !== board.id && (
                            <button
                              onClick={(e) => handleDeleteClick(board.id, e)}
                              className="p-1.5 hover:bg-destructive/20 rounded transition-colors"
                              title="Delete board"
                              type="button"
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </button>
                          )}
                          {deletingBoardId === board.id && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={handleConfirmDelete}
                                className="p-1.5 hover:bg-green-500/20 rounded transition-colors"
                                title="Confirm delete"
                                type="button"
                              >
                                <Check className="w-4 h-4 text-green-600" />
                              </button>
                              <button
                                onClick={handleCancelDelete}
                                className="p-1.5 hover:bg-secondary/50 rounded transition-colors"
                                title="Cancel"
                                type="button"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Create new board */}
                {isCreating ? (
                  <div className="px-4 py-2 border-t border-border mt-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newBoardName}
                        onChange={(e) => setNewBoardName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleCreateBoard();
                          } else if (e.key === 'Escape') {
                            setIsCreating(false);
                            setNewBoardName('');
                          }
                        }}
                        placeholder="Board name..."
                        className="flex-1 px-2 py-1 text-sm bg-background border border-border rounded"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreateBoard();
                        }}
                        className="p-1 hover:bg-secondary rounded"
                      >
                        <Check className="w-4 h-4 text-green-500" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsCreating(false);
                          setNewBoardName('');
                        }}
                        className="p-1 hover:bg-secondary rounded"
                      >
                        <X className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsCreating(true);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-foreground/70 hover:bg-secondary/50 border-t border-border mt-1 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create new board</span>
                  </button>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

