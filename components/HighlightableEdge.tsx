'use client';

import { BaseEdge, EdgeProps, getBezierPath } from '@xyflow/react';

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
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
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

