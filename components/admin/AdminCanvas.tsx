'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  ConnectionMode,
  OnNodeDrag,
  useReactFlow,
  OnSelectionChangeParams,
  PanOnScrollMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useAdminCanvasStore } from '@/store/admin-canvas-store';
import NoteNode from '../nodes/NoteNode';
import PromptNode from '../nodes/PromptNode';
import GroupNode from '../nodes/GroupNode';
import TextLabelNode from '../nodes/TextLabelNode';
import AgentNode from '../nodes/AgentNode';
import Toolbar from '../Toolbar';
import AlignmentGuides from '../AlignmentGuides';
import HighlightableEdge from '../HighlightableEdge';
import { CanvasStoreProvider } from '@/lib/canvas-store-context';

// Define custom node types
const nodeTypes: any = {
  note: NoteNode,
  prompt: PromptNode,
  group: GroupNode,
  textLabel: TextLabelNode,
  agent: AgentNode,
};

// Define custom edge types
const edgeTypes: any = {
  highlightable: HighlightableEdge,
};

interface AdminCanvasProps {
  onSave?: () => void;
  onClear?: () => void;
}

export default function AdminCanvas({ onSave, onClear }: AdminCanvasProps) {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNoteToGroup,
    removeNoteFromGroup,
    addNode,
    copySelectedNodes,
    pasteNodes,
    undo,
    redo,
  } = useAdminCanvasStore();

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useReactFlow();
  
  // Track dragging node for alignment guides
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  
  // Определяем, мобильное ли устройство (iPad, iPhone, Android)
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  
  useEffect(() => {
    // Проверяем по user agent и touch support
    const checkMobile = () => {
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isMobileUA = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const isTablet = /iPad|Android/i.test(navigator.userAgent) && window.innerWidth <= 1024;
      
      setIsMobileDevice(isTouchDevice && (isMobileUA || isTablet));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Кастомный обработчик wheel для умного различения мышки и тачпада
  const handleWheel = useCallback((event: WheelEvent) => {
    // Если зажат Ctrl - это pinch жест на тачпаде, пропускаем (ReactFlow обработает)
    if (event.ctrlKey) {
      return;
    }
    
    // Предотвращаем стандартное поведение браузера И всплытие события
    event.preventDefault();
    event.stopPropagation();
    
    // Определяем устройство по характеристикам события:
    // Мышка: большие дискретные значения deltaY (обычно кратные 100 или 120)
    // Тачпад: маленькие плавные значения deltaY и часто есть deltaX
    const absDeltaY = Math.abs(event.deltaY);
    const absDeltaX = Math.abs(event.deltaX);
    
    // Тачпад обычно дает deltaX при диагональном скролле или горизонтальном
    // И маленькие плавные значения deltaY
    const isTrackpad = (absDeltaX > 0) || (absDeltaY > 0 && absDeltaY < 50);
    
    const viewport = reactFlowInstance.getViewport();
    
    if (isTrackpad) {
      // ТАЧПАД - делаем панорамирование
      const panSpeed = 1.5;
      reactFlowInstance.setViewport({
        x: viewport.x - event.deltaX * panSpeed,
        y: viewport.y - event.deltaY * panSpeed,
        zoom: viewport.zoom
      }, { duration: 0 });
    } else {
      // МЫШКА - делаем зум к позиции курсора
      // Используем мультипликативный зум для плавности
      const zoomSpeed = 0.002; // Более плавный зум
      const scaleFactor = 1 - event.deltaY * zoomSpeed;
      const newZoom = Math.max(0.1, Math.min(4, viewport.zoom * scaleFactor));
      
      // Получаем позицию курсора относительно canvas
      const bounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (bounds) {
        const clientX = event.clientX - bounds.left;
        const clientY = event.clientY - bounds.top;
        
        // Вычисляем позицию в системе координат flow
        const flowX = (clientX - viewport.x) / viewport.zoom;
        const flowY = (clientY - viewport.y) / viewport.zoom;
        
        // Новая позиция viewport для зума к точке курсора
        const newX = clientX - flowX * newZoom;
        const newY = clientY - flowY * newZoom;
        
        reactFlowInstance.setViewport({
          x: newX,
          y: newY,
          zoom: newZoom
        }, { duration: 0 });
      }
    }
  }, [reactFlowInstance]);
  
  // Track dark mode
  const [isDark, setIsDark] = useState(false);
  
  useEffect(() => {
    // Check initial theme
    const checkTheme = () => {
      const isDarkMode = document.documentElement.classList.contains('dark');
      setIsDark(isDarkMode);
    };
    
    checkTheme();
    
    // Watch for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    
    return () => observer.disconnect();
  }, []);
  
  // Подключаем кастомный обработчик wheel
  useEffect(() => {
    const wrapper = reactFlowWrapper.current;
    if (!wrapper) return;
    
    // passive: false чтобы можно было делать preventDefault
    // capture: true чтобы перехватить событие раньше ReactFlow
    wrapper.addEventListener('wheel', handleWheel, { passive: false, capture: true });
    
    return () => {
      wrapper.removeEventListener('wheel', handleWheel, { capture: true });
    };
  }, [handleWheel]);

  // Track the last drop timestamp to prevent duplicates
  const lastDropTimestamp = useRef(0);
  const lastDropType = useRef('');
  
  // Handle drop from toolbar
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const now = Date.now();
      
      // Prevent duplicate drops within 200ms with the same type
      if (now - lastDropTimestamp.current < 200 && lastDropType.current === type) {
        return;
      }

      lastDropTimestamp.current = now;
      lastDropType.current = type;
      
      // Get default node dimensions to center it on cursor
      const nodeDimensions: Record<string, { width: number; height: number }> = {
        note: { width: 400, height: 400 },
        prompt: { width: 400, height: 300 },
        group: { width: 560, height: 300 },
        textLabel: { width: 300, height: 50 },
        agent: { width: 400, height: 400 },
      };

      const dimensions = nodeDimensions[type] || { width: 400, height: 400 };

      // Get ReactFlow container element
      const reactFlowElement = reactFlowWrapper.current?.querySelector('.react-flow') as HTMLElement;
      
      if (!reactFlowElement) {
        console.error('ReactFlow element not found');
        return;
      }

      // Get ReactFlow container bounds
      const reactFlowBounds = reactFlowElement.getBoundingClientRect();
      
      // Get current viewport state
      const viewport = reactFlowInstance.getViewport();
      
      // Calculate position relative to ReactFlow container (in screen pixels)
      const screenX = event.clientX - reactFlowBounds.left;
      const screenY = event.clientY - reactFlowBounds.top;

      // Convert screen coordinates to flow coordinates
      const flowX = (screenX - viewport.x) / viewport.zoom;
      const flowY = (screenY - viewport.y) / viewport.zoom;

      // Calculate position so node center is at cursor position
      const position = {
        x: flowX - dimensions.width / 2,
        y: flowY - dimensions.height / 2,
      };

      addNode(type as any, position);
    },
    [reactFlowInstance, addNode]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Prevent deletion when editing text in contentEditable
  const onBeforeDelete = useCallback(async ({ nodes: nodesToDelete, edges: edgesToDelete }: any) => {
    const activeElement = document.activeElement as HTMLElement;
    const isEditingText = activeElement?.getAttribute('contenteditable') === 'true' ||
                         activeElement?.tagName === 'INPUT' ||
                         activeElement?.tagName === 'TEXTAREA';
    
    if (isEditingText) {
      return false;
    }
    
    return true;
  }, []);

  // Handle selection changes
  const onSelectionChange = useCallback((params: OnSelectionChangeParams) => {
    // React Flow automatically handles multi-selection
  }, []);

  // Get node dimensions helper
  const getNodeDimensions = useCallback((node: any) => {
    const nodeDimensions: Record<string, { width: number; height: number }> = {
      note: { width: 400, height: 400 },
      prompt: { width: 400, height: 300 },
      group: { width: 560, height: 300 },
      textLabel: { width: 300, height: 50 },
      agent: { width: 400, height: 400 },
    };
    const defaultDimensions = { width: 400, height: 400 };
    const typeDimensions = nodeDimensions[node.type || 'note'] || defaultDimensions;
    return {
      width: (node.width as number) || typeDimensions.width,
      height: (node.height as number) || typeDimensions.height,
    };
  }, []);

  // Handle node dragging
  const onNodeDrag: OnNodeDrag = useCallback(
    (event, node) => {
      // Let ReactFlow handle dragging naturally
    },
    []
  );

  // Handle node drag start
  const onNodeDragStart: OnNodeDrag = useCallback((event, node) => {
    setDraggingNodeId(node.id);
  }, []);

  // Handle dragging nodes into groups
  const onNodeDragStop: OnNodeDrag = useCallback(
    (event, node) => {
      setDraggingNodeId(null);
      
      if (node.hidden) return;

      // Find if the node was dropped on a group
      const droppedOnGroup = nodes.find((n) => {
        if (n.type !== 'group' || n.id === node.id || n.hidden) return false;

        const groupBounds = {
          x: n.position.x,
          y: n.position.y,
          width: 560,
          height: 300,
        };

        const dimensions = getNodeDimensions(node);
        const nodeCenterX = node.position.x + dimensions.width / 2;
        const nodeCenterY = node.position.y + dimensions.height / 2;

        return (
          nodeCenterX >= groupBounds.x &&
          nodeCenterX <= groupBounds.x + groupBounds.width &&
          nodeCenterY >= groupBounds.y &&
          nodeCenterY <= groupBounds.y + groupBounds.height
        );
      });

      if (droppedOnGroup) {
        addNoteToGroup(node.id, droppedOnGroup.id);
      }
    },
    [nodes, addNoteToGroup, getNodeDimensions]
  );

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const activeElement = document.activeElement as HTMLElement;
      const isEditingText = activeElement?.getAttribute('contenteditable') === 'true' ||
                           activeElement?.tagName === 'INPUT' ||
                           activeElement?.tagName === 'TEXTAREA';
      
      if (isEditingText) {
        if (event.key === 'z' && (event.metaKey || event.ctrlKey) && !event.shiftKey) {
          return;
        }
        if (event.key === 'y' && (event.metaKey || event.ctrlKey)) {
          return;
        }
        if ((event.key === 'c' || event.key === 'v') && (event.metaKey || event.ctrlKey)) {
          return;
        }
      }

      // Ctrl+C or Cmd+C - Copy selected nodes
      if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
        event.preventDefault();
        const selectedNodes = nodes.filter((node) => node.selected && !node.hidden);
        if (selectedNodes.length > 0) {
          copySelectedNodes(selectedNodes.map((node) => node.id));
        }
        return;
      }

      // Ctrl+V or Cmd+V - Paste nodes
      if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
        event.preventDefault();
        pasteNodes(undefined);
        return;
      }

      // Ctrl+Z or Cmd+Z - Undo
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        undo();
        return;
      }

      // Ctrl+Shift+Z or Cmd+Shift+Z or Ctrl+Y or Cmd+Y - Redo
      if (
        ((event.ctrlKey || event.metaKey) && event.key === 'z' && event.shiftKey) ||
        ((event.ctrlKey || event.metaKey) && event.key === 'y')
      ) {
        event.preventDefault();
        redo();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [nodes, copySelectedNodes, pasteNodes, undo, redo]);

  const handleSave = useCallback(() => {
    if (onSave) {
      onSave();
    }
  }, [onSave]);

  const handleClear = useCallback(() => {
    if (onClear) {
      onClear();
    }
  }, [onClear]);

  return (
    <div 
      ref={reactFlowWrapper}
      className="w-full h-full dark:bg-black transition-colors duration-300"
      style={{ backgroundColor: isDark ? '#000000' : '#f9fafb' }}
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <AlignmentGuides nodes={nodes} draggingNodeId={draggingNodeId} />
      <CanvasStoreProvider isAdmin={true}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDrag={onNodeDrag}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        onSelectionChange={onSelectionChange}
        onBeforeDelete={onBeforeDelete}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        connectionRadius={100}
        fitView
        minZoom={0.1}
        maxZoom={4}
        deleteKeyCode={["Delete", "Backspace"]}
        multiSelectionKeyCode="Meta"
        // Мобильные устройства: отключаем lasso selection для панорамирования пальцем
        // Десктоп: включаем lasso selection (как Miro/Figma)
        selectionOnDrag={!isMobileDevice}
        selectNodesOnDrag={false}
        nodesDraggable={true}
        // На мобильных увеличиваем расстояние для различения клика и драга
        nodeClickDistance={isMobileDevice ? 10 : 0}
        // Расстояние для различения клика и панорамирования на канве
        paneClickDistance={isMobileDevice ? 10 : 1}
        snapToGrid={false}
        snapGrid={[1, 1]}
        nodesConnectable={true}
        elementsSelectable={true}
        translateExtent={[[-15000, -15000], [15000, 15000]]}
        // Кастомный обработчик wheel (см. handleWheel выше):
        // Мышка: колесико → зум БЕЗ Ctrl к позиции курсора
        // Тачпад: два пальца → панорамирование, pinch (Ctrl) → зум
        // iPad/Mobile: touch (левая кнопка) → панорамирование, pinch → зум
        panOnScroll={false}
        panOnScrollSpeed={1.5}
        // Мобильные: touch для панорамирования (левая кнопка)
        // Десктоп: средняя кнопка мыши для панорамирования
        panOnDrag={isMobileDevice ? [0, 1, 2] : [1, 2]}
        // Отключаем встроенный zoomOnScroll - используем кастомный handleWheel
        zoomOnScroll={false}
        // Оставляем только pinch для зума (Ctrl+scroll на тачпаде)
        zoomOnPinch={true}
        zoomOnDoubleClick={false}
        preventScrolling={true}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          type: 'highlightable',
          animated: false,
          style: { strokeWidth: 2, stroke: '#94a3b8' },
          markerEnd: {
            type: 'arrow',  
            width: 20,
            height: 20,
            color: '#94a3b8',
          },
          interactionWidth: 20,
        }}
      >
        <Background
          variant={BackgroundVariant.Lines}
          gap={200}
          color={isDark ? "rgba(255, 255, 255, 0.08)" : "#e5e7ef"}
          bgColor={isDark ? "#000000" : "#ffffff"}
        />
        <Controls />
        <MiniMap />
        <Toolbar onSave={handleSave} onClear={handleClear} />
      </ReactFlow>
      </CanvasStoreProvider>
    </div>
  );
}

