'use client';

import { useCallback, useState, useEffect } from 'react';
import { Node, useReactFlow } from '@xyflow/react';

interface AlignmentLine {
  id: string;
  x?: number;
  y?: number;
  type: 'horizontal' | 'vertical';
}

interface AlignmentGuidesProps {
  nodes: Node[];
  draggingNodeId: string | null;
}

// Threshold for snapping (in flow coordinates)
// This threshold works well at zoom level 1.0
// At different zoom levels, the visual threshold will scale accordingly
const SNAP_THRESHOLD = 5;

export default function AlignmentGuides({ nodes, draggingNodeId }: AlignmentGuidesProps) {
  const [alignmentLines, setAlignmentLines] = useState<AlignmentLine[]>([]);
  const { getViewport } = useReactFlow();

  // Get node dimensions
  const getNodeDimensions = useCallback((node: Node) => {
    const width = (node.width as number) || 400;
    const height = (node.height as number) || 400;
    return { width, height };
  }, []);

  // Calculate alignment points for a node
  const getAlignmentPoints = useCallback((node: Node) => {
    const { width, height } = getNodeDimensions(node);
    // Use position (React Flow updates this during drag)
    const pos = node.position;
    return {
      left: pos.x,
      centerX: pos.x + width / 2,
      right: pos.x + width,
      top: pos.y,
      centerY: pos.y + height / 2,
      bottom: pos.y + height,
    };
  }, [getNodeDimensions]);

  // Find alignment lines
  const findAlignmentLines = useCallback(
    (draggingNode: Node): AlignmentLine[] => {
      if (!draggingNode) {
        return [];
      }

      const draggingPoints = getAlignmentPoints(draggingNode);
      const lines: AlignmentLine[] = [];

      // Get all other nodes (not dragging and not hidden)
      const otherNodes = nodes.filter(
        (n) => n.id !== draggingNode.id && !n.hidden
      );

      // Collect all alignment points from other nodes
      const verticalLines = new Set<number>(); // X positions
      const horizontalLines = new Set<number>(); // Y positions

      otherNodes.forEach((node) => {
        const points = getAlignmentPoints(node);
        // Add all alignment points
        verticalLines.add(points.left);
        verticalLines.add(points.centerX);
        verticalLines.add(points.right);
        horizontalLines.add(points.top);
        horizontalLines.add(points.centerY);
        horizontalLines.add(points.bottom);
      });

      // Check for vertical alignment (X axis)
      let minVerticalDistance = Infinity;
      let closestVerticalLine: number | null = null;

      // Check all three vertical alignment points
      for (const lineX of verticalLines) {
        const leftDist = Math.abs(draggingPoints.left - lineX);
        const centerDist = Math.abs(draggingPoints.centerX - lineX);
        const rightDist = Math.abs(draggingPoints.right - lineX);
        const minDist = Math.min(leftDist, centerDist, rightDist);
        
        if (minDist < SNAP_THRESHOLD && minDist < minVerticalDistance) {
          minVerticalDistance = minDist;
          closestVerticalLine = lineX;
        }
      }

      if (closestVerticalLine !== null) {
        lines.push({ id: 'vertical', x: closestVerticalLine, type: 'vertical' });
      }

      // Check for horizontal alignment (Y axis)
      let minHorizontalDistance = Infinity;
      let closestHorizontalLine: number | null = null;

      // Check all three horizontal alignment points
      for (const lineY of horizontalLines) {
        const topDist = Math.abs(draggingPoints.top - lineY);
        const centerDist = Math.abs(draggingPoints.centerY - lineY);
        const bottomDist = Math.abs(draggingPoints.bottom - lineY);
        const minDist = Math.min(topDist, centerDist, bottomDist);
        
        if (minDist < SNAP_THRESHOLD && minDist < minHorizontalDistance) {
          minHorizontalDistance = minDist;
          closestHorizontalLine = lineY;
        }
      }

      if (closestHorizontalLine !== null) {
        lines.push({ id: 'horizontal', y: closestHorizontalLine, type: 'horizontal' });
      }

      return lines;
    },
    [nodes, getAlignmentPoints]
  );

  // Calculate snapped position
  const calculateSnappedPosition = useCallback(
    (draggingNode: Node): { x: number; y: number } | null => {
      if (!draggingNode) {
        return null;
      }

      const draggingPoints = getAlignmentPoints(draggingNode);
      let snappedX = draggingNode.position.x;
      let snappedY = draggingNode.position.y;
      const { width: draggingWidth, height: draggingHeight } = getNodeDimensions(draggingNode);

      // Get all other nodes (not dragging and not hidden)
      const otherNodes = nodes.filter(
        (n) => n.id !== draggingNode.id && !n.hidden
      );

      // Collect all alignment points from other nodes
      const verticalLines = new Set<number>();
      const horizontalLines = new Set<number>();

      otherNodes.forEach((node) => {
        const points = getAlignmentPoints(node);
        verticalLines.add(points.left);
        verticalLines.add(points.centerX);
        verticalLines.add(points.right);
        horizontalLines.add(points.top);
        horizontalLines.add(points.centerY);
        horizontalLines.add(points.bottom);
      });

      let hasSnap = false;

      // Check for vertical alignment (X axis)
      let minVerticalDistance = Infinity;
      let closestVerticalLine: number | null = null;
      let verticalSnapType: 'left' | 'center' | 'right' | null = null;

      for (const lineX of verticalLines) {
        const leftDist = Math.abs(draggingPoints.left - lineX);
        const centerDist = Math.abs(draggingPoints.centerX - lineX);
        const rightDist = Math.abs(draggingPoints.right - lineX);
        const minDist = Math.min(leftDist, centerDist, rightDist);
        
        if (minDist < SNAP_THRESHOLD && minDist < minVerticalDistance) {
          minVerticalDistance = minDist;
          closestVerticalLine = lineX;
          if (minDist === leftDist) verticalSnapType = 'left';
          else if (minDist === centerDist) verticalSnapType = 'center';
          else verticalSnapType = 'right';
        }
      }

      if (closestVerticalLine !== null && verticalSnapType) {
        hasSnap = true;
        if (verticalSnapType === 'left') {
          snappedX = closestVerticalLine;
        } else if (verticalSnapType === 'center') {
          snappedX = closestVerticalLine - draggingWidth / 2;
        } else {
          snappedX = closestVerticalLine - draggingWidth;
        }
      }

      // Check for horizontal alignment (Y axis)
      let minHorizontalDistance = Infinity;
      let closestHorizontalLine: number | null = null;
      let horizontalSnapType: 'top' | 'center' | 'bottom' | null = null;

      for (const lineY of horizontalLines) {
        const topDist = Math.abs(draggingPoints.top - lineY);
        const centerDist = Math.abs(draggingPoints.centerY - lineY);
        const bottomDist = Math.abs(draggingPoints.bottom - lineY);
        const minDist = Math.min(topDist, centerDist, bottomDist);
        
        if (minDist < SNAP_THRESHOLD && minDist < minHorizontalDistance) {
          minHorizontalDistance = minDist;
          closestHorizontalLine = lineY;
          if (minDist === topDist) horizontalSnapType = 'top';
          else if (minDist === centerDist) horizontalSnapType = 'center';
          else horizontalSnapType = 'bottom';
        }
      }

      if (closestHorizontalLine !== null && horizontalSnapType) {
        hasSnap = true;
        if (horizontalSnapType === 'top') {
          snappedY = closestHorizontalLine;
        } else if (horizontalSnapType === 'center') {
          snappedY = closestHorizontalLine - draggingHeight / 2;
        } else {
          snappedY = closestHorizontalLine - draggingHeight;
        }
      }

      return hasSnap ? { x: snappedX, y: snappedY } : null;
    },
    [nodes, getAlignmentPoints, getNodeDimensions]
  );

  // Update alignment lines when dragging
  useEffect(() => {
    if (!draggingNodeId) {
      setAlignmentLines([]);
      return;
    }

    const draggingNode = nodes.find((n) => n.id === draggingNodeId);
    if (!draggingNode) {
      setAlignmentLines([]);
      return;
    }

    const lines = findAlignmentLines(draggingNode);
    setAlignmentLines(lines);
  }, [draggingNodeId, nodes, findAlignmentLines]);

  // Export function to calculate snapped position (will be used in Canvas)
  useEffect(() => {
    // Store the function in a way that Canvas can access it
    // We'll pass it via a different approach
  }, []);

  // Don't render if no lines
  if (alignmentLines.length === 0) {
    return null;
  }

  const viewport = getViewport();
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0;

  // Helper to convert flow coordinates to screen coordinates
  const flowToScreen = (flowX: number, flowY: number) => {
    // React Flow viewport: x and y are in screen coordinates, zoom is the scale
    // Formula: screen = (flow * zoom) + viewportOffset
    // But viewport.x and viewport.y are already the screen offset
    const screenX = flowX * viewport.zoom + viewport.x;
    const screenY = flowY * viewport.zoom + viewport.y;
    return { x: screenX, y: screenY };
  };

  return (
    <svg
      className="pointer-events-none fixed inset-0 z-50"
      style={{ width: '100%', height: '100%' }}
    >
      {alignmentLines.map((line) => {
        if (line.type === 'vertical' && line.x !== undefined) {
          // Convert flow coordinates to screen coordinates
          const screenPos = flowToScreen(line.x, 0);
          return (
            <line
              key={line.id}
              x1={screenPos.x}
              y1={0}
              x2={screenPos.x}
              y2={viewportHeight}
              stroke="#3B82F6"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              opacity={0.7}
            />
          );
        } else if (line.type === 'horizontal' && line.y !== undefined) {
          // Convert flow coordinates to screen coordinates
          const screenPos = flowToScreen(0, line.y);
          return (
            <line
              key={line.id}
              x1={0}
              y1={screenPos.y}
              x2={viewportWidth}
              y2={screenPos.y}
              stroke="#3B82F6"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              opacity={0.7}
            />
          );
        }
        return null;
      })}
    </svg>
  );
}

// Export helper function for snapping calculation
export function calculateSnappedPosition(
  draggingNode: Node,
  allNodes: Node[],
  getNodeDimensions: (node: Node) => { width: number; height: number },
  snapThreshold: number = SNAP_THRESHOLD
): { x: number; y: number } | null {
  if (!draggingNode) {
    return null;
  }

  const getAlignmentPoints = (node: Node) => {
    const { width, height } = getNodeDimensions(node);
    const pos = node.position;
    return {
      left: pos.x,
      centerX: pos.x + width / 2,
      right: pos.x + width,
      top: pos.y,
      centerY: pos.y + height / 2,
      bottom: pos.y + height,
    };
  };

  const draggingPoints = getAlignmentPoints(draggingNode);
  let snappedX = draggingNode.position.x;
  let snappedY = draggingNode.position.y;
  const { width: draggingWidth, height: draggingHeight } = getNodeDimensions(draggingNode);

  // Get all other nodes (not dragging and not hidden)
  const otherNodes = allNodes.filter(
    (n) => n.id !== draggingNode.id && !n.hidden
  );

  // Collect all alignment points from other nodes
  const verticalLines = new Set<number>();
  const horizontalLines = new Set<number>();

  otherNodes.forEach((node) => {
    const points = getAlignmentPoints(node);
    verticalLines.add(points.left);
    verticalLines.add(points.centerX);
    verticalLines.add(points.right);
    horizontalLines.add(points.top);
    horizontalLines.add(points.centerY);
    horizontalLines.add(points.bottom);
  });

  let hasSnap = false;

  // Check for vertical alignment (X axis)
  let minVerticalDistance = Infinity;
  let closestVerticalLine: number | null = null;
  let verticalSnapType: 'left' | 'center' | 'right' | null = null;

  for (const lineX of verticalLines) {
    const leftDist = Math.abs(draggingPoints.left - lineX);
    const centerDist = Math.abs(draggingPoints.centerX - lineX);
    const rightDist = Math.abs(draggingPoints.right - lineX);
    const minDist = Math.min(leftDist, centerDist, rightDist);
    
    if (minDist < snapThreshold && minDist < minVerticalDistance) {
      minVerticalDistance = minDist;
      closestVerticalLine = lineX;
      if (minDist === leftDist) verticalSnapType = 'left';
      else if (minDist === centerDist) verticalSnapType = 'center';
      else verticalSnapType = 'right';
    }
  }

  if (closestVerticalLine !== null && verticalSnapType) {
    hasSnap = true;
    if (verticalSnapType === 'left') {
      snappedX = closestVerticalLine;
    } else if (verticalSnapType === 'center') {
      snappedX = closestVerticalLine - draggingWidth / 2;
    } else {
      snappedX = closestVerticalLine - draggingWidth;
    }
  }

  // Check for horizontal alignment (Y axis)
  let minHorizontalDistance = Infinity;
  let closestHorizontalLine: number | null = null;
  let horizontalSnapType: 'top' | 'center' | 'bottom' | null = null;

  for (const lineY of horizontalLines) {
    const topDist = Math.abs(draggingPoints.top - lineY);
    const centerDist = Math.abs(draggingPoints.centerY - lineY);
    const bottomDist = Math.abs(draggingPoints.bottom - lineY);
    const minDist = Math.min(topDist, centerDist, bottomDist);
    
    if (minDist < snapThreshold && minDist < minHorizontalDistance) {
      minHorizontalDistance = minDist;
      closestHorizontalLine = lineY;
      if (minDist === topDist) horizontalSnapType = 'top';
      else if (minDist === centerDist) horizontalSnapType = 'center';
      else horizontalSnapType = 'bottom';
    }
  }

  if (closestHorizontalLine !== null && horizontalSnapType) {
    hasSnap = true;
    if (horizontalSnapType === 'top') {
      snappedY = closestHorizontalLine;
    } else if (horizontalSnapType === 'center') {
      snappedY = closestHorizontalLine - draggingHeight / 2;
    } else {
      snappedY = closestHorizontalLine - draggingHeight;
    }
  }

  return hasSnap ? { x: snappedX, y: snappedY } : null;
}

