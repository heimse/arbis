/**
 * Утилиты для работы с размерными линиями
 */

import type { Point, WallNode, Wall, DimensionTarget, DimensionLine } from '@/types/plan';
import { distance, closestPointOnSegment } from './geometry';
import { getWallLength } from './walls';

/**
 * Находит узел в указанной точке
 */
export function findNodeAtPoint(
  point: Point,
  nodes: WallNode[],
  threshold: number = 10
): { node: WallNode; distance: number } | null {
  let closest: { node: WallNode; distance: number } | null = null;

  for (const node of nodes) {
    const dist = distance(point, node.position);
    if (dist <= threshold) {
      if (!closest || dist < closest.distance) {
        closest = { node, distance: dist };
      }
    }
  }

  return closest;
}

/**
 * Находит стену в указанной точке
 */
export function findWallAtPoint(
  point: Point,
  walls: Wall[],
  nodes: WallNode[],
  threshold: number = 10
): { wall: Wall; point: Point; t: number; distance: number } | null {
  let closest: { wall: Wall; point: Point; t: number; distance: number } | null = null;

  for (const wall of walls) {
    const startNode = nodes.find((n) => n.id === wall.startNodeId);
    const endNode = nodes.find((n) => n.id === wall.endNodeId);

    if (!startNode || !endNode) continue;

    const result = closestPointOnSegment(point, startNode.position, endNode.position);
    const dist = distance(point, result.point);

    if (dist <= threshold) {
      if (!closest || dist < closest.distance) {
        closest = {
          wall,
          point: result.point,
          t: result.t,
          distance: dist,
        };
      }
    }
  }

  return closest;
}

/**
 * Вычисляет фактическую точку из целевого объекта
 */
export function resolveDimensionTarget(
  target: DimensionTarget,
  nodes: WallNode[],
  walls: Wall[]
): Point {
  switch (target.type) {
    case 'point':
      return target.point;
    
    case 'node': {
      const node = nodes.find((n) => n.id === target.nodeId);
      return node ? node.position : { x: 0, y: 0 };
    }
    
    case 'wall': {
      const wall = walls.find((w) => w.id === target.wallId);
      if (!wall) return { x: 0, y: 0 };
      
      const startNode = nodes.find((n) => n.id === wall.startNodeId);
      const endNode = nodes.find((n) => n.id === wall.endNodeId);
      
      if (!startNode || !endNode) return { x: 0, y: 0 };
      
      return target.startNode ? startNode.position : endNode.position;
    }
    
    case 'wall-center': {
      const wall = walls.find((w) => w.id === target.wallId);
      if (!wall) return { x: 0, y: 0 };
      
      const startNode = nodes.find((n) => n.id === wall.startNodeId);
      const endNode = nodes.find((n) => n.id === wall.endNodeId);
      
      if (!startNode || !endNode) return { x: 0, y: 0 };
      
      return {
        x: (startNode.position.x + endNode.position.x) / 2,
        y: (startNode.position.y + endNode.position.y) / 2,
      };
    }
  }
}

/**
 * Находит лучший объект для привязки в указанной точке
 * Приоритет: узлы > стены > свободная точка
 */
export function findBestSnapTarget(
  point: Point,
  nodes: WallNode[],
  walls: Wall[],
  snapThreshold: number = 10
): DimensionTarget {
  // 1. Проверяем узлы (высший приоритет)
  const nodeResult = findNodeAtPoint(point, nodes, snapThreshold);
  if (nodeResult) {
    return { type: 'node', nodeId: nodeResult.node.id };
  }

  // 2. Проверяем стены
  const wallResult = findWallAtPoint(point, walls, nodes, snapThreshold);
  if (wallResult) {
    // Определяем, ближе к началу или концу стены
    const isNearStart = wallResult.t < 0.3;
    const isNearEnd = wallResult.t > 0.7;
    
    if (isNearStart) {
      return { type: 'wall', wallId: wallResult.wall.id, startNode: true };
    } else if (isNearEnd) {
      return { type: 'wall', wallId: wallResult.wall.id, startNode: false };
    } else {
      // В середине стены - можно использовать центр или точку на стене
      return { type: 'wall-center', wallId: wallResult.wall.id };
    }
  }

  // 3. Свободная точка
  return { type: 'point', point };
}

/**
 * Создает размерную линию для стены
 */
export function createWallDimension(
  wall: Wall,
  nodes: WallNode[],
  offset: number = 50
): DimensionLine {
  const startNode = nodes.find((n) => n.id === wall.startNodeId);
  const endNode = nodes.find((n) => n.id === wall.endNodeId);

  if (!startNode || !endNode) {
    throw new Error('Wall nodes not found');
  }

  return {
    id: '', // будет установлен в store
    dimensionType: 'wall',
    startTarget: { type: 'wall', wallId: wall.id, startNode: true },
    endTarget: { type: 'wall', wallId: wall.id, startNode: false },
    startPoint: startNode.position,
    endPoint: endNode.position,
    offset,
    layerId: 'layer-dimensions',
    autoOffset: true,
  };
}

/**
 * Вычисляет оптимальное смещение для размерной линии
 */
export function calculateOptimalOffset(
  startPoint: Point,
  endPoint: Point,
  defaultOffset: number = 50
): number {
  const dx = endPoint.x - startPoint.x;
  const dy = endPoint.y - startPoint.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  
  // Смещение зависит от длины линии (больше длина = больше смещение)
  // Минимум 30px, максимум 150px
  const calculatedOffset = Math.max(30, Math.min(150, length * 0.1 + defaultOffset));
  
  return calculatedOffset;
}

/**
 * Определяет тип размерной линии на основе точек
 */
export function determineDimensionType(
  startPoint: Point,
  endPoint: Point,
  angleThreshold: number = 0.1 // ~5.7 градусов
): 'horizontal' | 'vertical' | 'linear' {
  const dx = endPoint.x - startPoint.x;
  const dy = endPoint.y - startPoint.y;
  const angle = Math.atan2(Math.abs(dy), Math.abs(dx));
  
  // Горизонтальная линия (dy близко к 0)
  if (Math.abs(dy) < angleThreshold * Math.abs(dx) || Math.abs(dy) < 5) {
    return 'horizontal';
  }
  
  // Вертикальная линия (dx близко к 0)
  if (Math.abs(dx) < angleThreshold * Math.abs(dy) || Math.abs(dx) < 5) {
    return 'vertical';
  }
  
  // Линейная (наклонная)
  return 'linear';
}



