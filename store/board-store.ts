import { create } from 'zustand';
import { CanvasNode, CanvasEdge } from '@/types/canvas';

export interface Board {
  id: string;
  name: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  createdAt: string;
  updatedAt: string;
}

interface BoardStore {
  boards: Board[];
  currentBoardId: string | null;
  
  // Board operations
  setBoards: (boards: Board[]) => void;
  setCurrentBoard: (boardId: string) => void;
  createBoard: (name: string) => Promise<Board>;
  deleteBoard: (boardId: string) => Promise<void>;
  updateBoardName: (boardId: string, newName: string) => Promise<void>;
  updateBoardData: (boardId: string, nodes: CanvasNode[], edges: CanvasEdge[]) => Promise<void>;
  
  // Getters
  getCurrentBoard: () => Board | null;
  getBoard: (boardId: string) => Board | null;
  
  // Loading
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useBoardStore = create<BoardStore>((set, get) => ({
  boards: [],
  currentBoardId: null,
  isLoading: false,

  setBoards: (boards) => {
    // Ensure boards is always an array
    const boardsArray = Array.isArray(boards) ? boards : [];
    set({ boards: boardsArray });
  },

  setCurrentBoard: (boardId) => {
    set({ currentBoardId: boardId });
    // Save current board ID to localStorage for persistence
    localStorage.setItem('mindcanvas-current-board-id', boardId);
  },

  getCurrentBoard: () => {
    const { boards, currentBoardId } = get();
    if (!currentBoardId) return null;
    return boards.find((b) => b.id === currentBoardId) || null;
  },

  getBoard: (boardId) => {
    const { boards } = get();
    return boards.find((b) => b.id === boardId) || null;
  },

  createBoard: async (name) => {
    const newBoard: Board = {
      id: `board_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name || 'New Board',
      nodes: [],
      edges: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const response = await fetch('/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBoard),
      });

      if (!response.ok) {
        throw new Error('Failed to create board');
      }

      const savedBoard = await response.json();
      
      set((state) => ({
        boards: [...state.boards, savedBoard],
        currentBoardId: savedBoard.id,
      }));

      localStorage.setItem('mindcanvas-current-board-id', savedBoard.id);
      
      return savedBoard;
    } catch (error) {
      console.error('Error creating board:', error);
      throw error;
    }
  },

  deleteBoard: async (boardId) => {
    try {
      const response = await fetch(`/api/boards/${boardId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API error:', errorData);
        throw new Error(errorData.error || 'Failed to delete board');
      }

      const { boards, currentBoardId } = get();
      const updatedBoards = boards.filter((b) => b.id !== boardId);
      
      set({ boards: updatedBoards });

      // If deleted board was current, switch to first available or null
      if (currentBoardId === boardId) {
        const newCurrentId = updatedBoards.length > 0 ? updatedBoards[0].id : null;
        set({ currentBoardId: newCurrentId });
        if (newCurrentId) {
          localStorage.setItem('mindcanvas-current-board-id', newCurrentId);
        } else {
          localStorage.removeItem('mindcanvas-current-board-id');
        }
      }
    } catch (error) {
      console.error('Error deleting board:', error);
      throw error;
    }
  },

  updateBoardName: async (boardId, newName) => {
    try {
      const response = await fetch(`/api/boards/${boardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API error:', errorData);
        throw new Error(errorData.error || 'Failed to update board name');
      }

      const updatedBoard = await response.json();
      
      set((state) => ({
        boards: state.boards.map((b) =>
          b.id === boardId ? updatedBoard : b
        ),
      }));
    } catch (error) {
      console.error('Error updating board name:', error);
      throw error;
    }
  },

  updateBoardData: async (boardId, nodes, edges) => {
    try {
      const response = await fetch(`/api/boards/${boardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes, edges }),
      });

      if (!response.ok) {
        throw new Error('Failed to update board data');
      }

      const updatedBoard = await response.json();
      
      set((state) => ({
        boards: state.boards.map((b) =>
          b.id === boardId ? updatedBoard : b
        ),
      }));
    } catch (error) {
      console.error('Error updating board data:', error);
      throw error;
    }
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },
}));

