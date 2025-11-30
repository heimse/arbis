/**
 * Утилиты для работы со стенами
 */

import { nanoid } from 'nanoid';
import type { Point, WallNode, Wall } from '@/types/plan';
import { distance } from './geometry';

/**
 * Создать новый узел
 */
export function createNode(position: Point): WallNode {
  return {
    id: nanoid(),
    position,
    connectedWallIds: [],
  };
}

/**
 * Создать новую стену
 */
export function createWall(
  startNodeId: string,
  endNodeId: string,
  thickness: number = 200, // 200мм по умолчанию
  type: 'exterior' | 'interior' | 'partition' = 'interior',
  layerId: string = 'layer-walls'
): Wall {
  return {
    id: nanoid(),
    startNodeId,
    endNodeId,
    thickness,
    type,
    layerId,
  };
}

/**
 * Найти или создать узел в указанной позиции
 * Если узел уже существует рядом, возвращает существующий
 */
export function findOrCreateNode(
  position: Point,
  existingNodes: WallNode[],
  threshold: number = 1
): WallNode {
  // Ищем существующий узел рядом
  const existing = existingNodes.find(
    (node) => distance(node.position, position) < threshold
  );
  
  if (existing) {
    return existing;
  }
  
  // Создаём новый
  return createNode(position);
}

/**
 * Обновить связи узла со стенами
 */
export function updateNodeConnections(
  nodeId: string,
  nodes: WallNode[],
  walls: Wall[]
): WallNode[] {
  const updatedNodes = [...nodes];
  const node = updatedNodes.find((n) => n.id === nodeId);
  
  if (!node) return updatedNodes;
  
  // Найти все стены, связанные с этим узлом
  const connectedWalls = walls.filter(
    (wall) => wall.startNodeId === nodeId || wall.endNodeId === nodeId
  );
  
  node.connectedWallIds = connectedWalls.map((wall) => wall.id);
  
  return updatedNodes;
}

/**
 * Удалить стену и очистить связи
 */
export function removeWall(
  wallId: string,
  walls: Wall[],
  nodes: WallNode[]
): { walls: Wall[]; nodes: WallNode[] } {
  const wall = walls.find((w) => w.id === wallId);
  if (!wall) return { walls, nodes };
  
  // Удаляем стену
  const updatedWalls = walls.filter((w) => w.id !== wallId);
  
  // Обновляем узлы
  let updatedNodes = updateNodeConnections(wall.startNodeId, nodes, updatedWalls);
  updatedNodes = updateNodeConnections(wall.endNodeId, updatedNodes, updatedWalls);
  
  // Удаляем узлы без связей
  updatedNodes = updatedNodes.filter((node) => node.connectedWallIds.length > 0);
  
  return { walls: updatedWalls, nodes: updatedNodes };
}

/**
 * Получить точки для отрисовки стены с учётом толщины
 */
export function getWallPolygon(
  wall: Wall,
  nodes: WallNode[]
): Point[] {
  const startNode = nodes.find((n) => n.id === wall.startNodeId);
  const endNode = nodes.find((n) => n.id === wall.endNodeId);
  
  if (!startNode || !endNode) return [];
  
  const start = startNode.position;
  const end = endNode.position;
  
  // Вектор направления стены
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  
  if (length === 0) return [];
  
  // Нормализованный перпендикуляр
  const perpX = -dy / length;
  const perpY = dx / length;
  
  // Половина толщины
  const halfThickness = wall.thickness / 2;
  
  // Четыре угла прямоугольника стены
  return [
    {
      x: start.x + perpX * halfThickness,
      y: start.y + perpY * halfThickness,
    },
    {
      x: end.x + perpX * halfThickness,
      y: end.y + perpY * halfThickness,
    },
    {
      x: end.x - perpX * halfThickness,
      y: end.y - perpY * halfThickness,
    },
    {
      x: start.x - perpX * halfThickness,
      y: start.y - perpY * halfThickness,
    },
  ];
}

/**
 * Вычислить длину стены в миллиметрах
 */
export function getWallLength(wall: Wall, nodes: WallNode[]): number {
  const startNode = nodes.find((n) => n.id === wall.startNodeId);
  const endNode = nodes.find((n) => n.id === wall.endNodeId);
  
  if (!startNode || !endNode) return 0;
  
  return distance(startNode.position, endNode.position);
}

/**
 * Разделить стену на две части в указанной точке
 */
export function splitWall(
  wall: Wall,
  splitPoint: Point,
  nodes: WallNode[],
  walls: Wall[]
): {
  nodes: WallNode[];
  walls: Wall[];
  newNodeId: string;
  newWallId: string;
} {
  // Создаём новый узел в точке разделения
  const newNode = createNode(splitPoint);
  const updatedNodes = [...nodes, newNode];
  
  // Создаём новую стену от нового узла до конца исходной
  const newWall = createWall(
    newNode.id,
    wall.endNodeId,
    wall.thickness,
    wall.type,
    wall.layerId
  );
  
  // Обновляем исходную стену - теперь она заканчивается в новом узле
  const updatedWall = { ...wall, endNodeId: newNode.id };
  const updatedWalls = walls.map((w) => (w.id === wall.id ? updatedWall : w));
  updatedWalls.push(newWall);
  
  // Обновляем связи узлов
  let finalNodes = updateNodeConnections(wall.startNodeId, updatedNodes, updatedWalls);
  finalNodes = updateNodeConnections(newNode.id, finalNodes, updatedWalls);
  finalNodes = updateNodeConnections(wall.endNodeId, finalNodes, updatedWalls);
  
  return {
    nodes: finalNodes,
    walls: updatedWalls,
    newNodeId: newNode.id,
    newWallId: newWall.id,
  };
}




