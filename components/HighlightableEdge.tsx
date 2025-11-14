'use client';

import { BaseEdge, EdgeProps, getBezierPath, Position } from '@xyflow/react';

export default function HighlightableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
}: EdgeProps) {
  // Handle offset is 8px from the edge of the block (outside)
  // We need to adjust coordinates so the arrow starts from the edge, not from the Handle
  const HANDLE_OFFSET = 12;
  
  // Calculate adjusted coordinates based on position
  const adjustCoordinate = (
    x: number,
    y: number,
    position: Position
  ): { x: number; y: number } => {
    switch (position) {
      case Position.Left:
        // Handle is 8px to the left, move 8px right to reach edge
        return { x: x + HANDLE_OFFSET, y };
      case Position.Right:
        // Handle is 8px to the right, move 8px left to reach edge
        return { x: x - HANDLE_OFFSET, y };
      case Position.Top:
        // Handle is 8px above, move 8px down to reach edge
        return { x, y: y + HANDLE_OFFSET };
      case Position.Bottom:
        // Handle is 8px below, move 8px up to reach edge
        return { x, y: y - HANDLE_OFFSET };
      default:
        return { x, y };
    }
  };

  const adjustedSource = adjustCoordinate(sourceX, sourceY, sourcePosition);
  const adjustedTarget = adjustCoordinate(targetX, targetY, targetPosition);

  const [edgePath] = getBezierPath({
    sourceX: adjustedSource.x,
    sourceY: adjustedSource.y,
    sourcePosition,
    targetX: adjustedTarget.x,
    targetY: adjustedTarget.y,
    targetPosition,
  });

  // Подсветка для выделенных связей
  const edgeStyle = selected
    ? {
        ...style,
        stroke: '#3b82f6', // Синий цвет для выделенных
        strokeWidth: 3, // Толще для выделенных
      }
    : {
        ...style,
        stroke: '#94a3b8', // Обычный серый цвет
        strokeWidth: 2,
      };

  // Подсветка маркера (стрелки) для выделенных связей
  const edgeMarkerEnd = selected && typeof markerEnd === 'object' && markerEnd !== null
    ? {
        ...(markerEnd as any),
        color: '#3b82f6', // Синий цвет для выделенных
      }
    : markerEnd;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={edgeStyle}
        markerEnd={edgeMarkerEnd}
      />
    </>
  );
}

