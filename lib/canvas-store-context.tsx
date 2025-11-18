'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useCanvasStore } from '@/store/canvas-store';
import { useAdminCanvasStore } from '@/store/admin-canvas-store';
import { NodeData } from '@/types/canvas';

interface CanvasStoreContextValue {
  updateNodeData: (nodeId: string, data: Partial<NodeData>) => void;
  deleteNode: (nodeId: string) => void;
  toggleNodeCollapse?: (nodeId: string) => void;
  nodes: any[];
  edges: any[];
  setNodeRunning?: (nodeId: string, isRunning: boolean) => void;
  createNoteNode?: (sourceNodeId: string, content: string) => void;
  removeNoteFromGroup?: (noteId: string, groupId: string) => void;
}

const CanvasStoreContext = createContext<CanvasStoreContextValue | null>(null);

export function CanvasStoreProvider({ children, isAdmin }: { children: ReactNode; isAdmin?: boolean }) {
  // Use the appropriate store based on isAdmin prop
  const canvasStore = useCanvasStore();
  const adminStore = useAdminCanvasStore();
  
  const store = isAdmin ? adminStore : canvasStore;

  return (
    <CanvasStoreContext.Provider value={store}>
      {children}
    </CanvasStoreContext.Provider>
  );
}

export function useCanvasStoreContext() {
  const context = useContext(CanvasStoreContext);
  if (!context) {
    throw new Error('useCanvasStoreContext must be used within CanvasStoreProvider');
  }
  return context;
}

