/**
 * Утилиты для работы с комнатами
 */

import { nanoid } from 'nanoid';
import type { Point, WallNode, Wall, Room, RoomType, FloorMaterial } from '@/types/plan';
import { distance, polygonArea } from './geometry';

/**
 * Предустановленные материалы пола
 */
export const defaultFloorMaterials: FloorMaterial[] = [
  { id: 'laminate-oak', name: 'Ламинат дуб', color: '#d4a574' },
  { id: 'parquet-oak', name: 'Паркет дуб', color: '#c9a961' },
  { id: 'tile-600x600', name: 'Плитка 600×600', color: '#e5e5e5' },
  { id: 'tile-300x300', name: 'Плитка 300×300', color: '#f0f0f0' },
  { id: 'linoleum', name: 'Линолеум', color: '#d3d3d3' },
  { id: 'carpet', name: 'Ковролин', color: '#8b7355' },
  { id: 'concrete', name: 'Бетон', color: '#9e9e9e' },
];

/**
 * Находит внутреннюю грань стены (смещённую внутрь на половину толщины)
 */
function getWallInnerEdge(
  wall: Wall,
  nodes: WallNode[],
  insideDirection: { x: number; y: number }
): { start: Point; end: Point } {
  const startNode = nodes.find((n) => n.id === wall.startNodeId);
  const endNode = nodes.find((n) => n.id === wall.endNodeId);
  
  if (!startNode || !endNode) {
    throw new Error('Wall nodes not found');
  }

  const start = startNode.position;
  const end = endNode.position;

  // Вектор направления стены
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length === 0) {
    return { start, end };
  }

  // Нормализованный перпендикуляр (направлен внутрь комнаты)
  const perpX = -dy / length;
  const perpY = dx / length;

  // Проверяем направление перпендикуляра
  // Если скалярное произведение с insideDirection отрицательное, разворачиваем
  const dot = perpX * insideDirection.x + perpY * insideDirection.y;
  const finalPerpX = dot < 0 ? -perpX : perpX;
  const finalPerpY = dot < 0 ? -perpY : perpY;

  // Половина толщины стены
  const halfThickness = wall.thickness / 2;

  return {
    start: {
      x: start.x + finalPerpX * halfThickness,
      y: start.y + finalPerpY * halfThickness,
    },
    end: {
      x: end.x + finalPerpX * halfThickness,
      y: end.y + finalPerpY * halfThickness,
    },
  };
}

/**
 * Проверяет, находится ли точка внутри многоугольника (алгоритм ray casting)
 */
export function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Находит замкнутую область стен, содержащую указанную точку
 * Возвращает полигон комнаты и список стен периметра
 */
export function findEnclosedArea(
  point: Point,
  walls: Wall[],
  nodes: WallNode[]
): { polygon: Point[]; wallIds: string[] } | null {
  // Строим граф стен
  const wallGraph = new Map<string, string[]>(); // nodeId -> [wallId, wallId, ...]
  
  for (const wall of walls) {
    if (!wallGraph.has(wall.startNodeId)) {
      wallGraph.set(wall.startNodeId, []);
    }
    if (!wallGraph.has(wall.endNodeId)) {
      wallGraph.set(wall.endNodeId, []);
    }
    wallGraph.get(wall.startNodeId)!.push(wall.id);
    wallGraph.get(wall.endNodeId)!.push(wall.id);
  }

  // Находим ближайшую стену к точке
  let closestWall: Wall | null = null;
  let minDistance = Infinity;

  for (const wall of walls) {
    const startNode = nodes.find((n) => n.id === wall.startNodeId);
    const endNode = nodes.find((n) => n.id === wall.endNodeId);
    
    if (!startNode || !endNode) continue;

    // Расстояние от точки до отрезка стены
    const dx = endNode.position.x - startNode.position.x;
    const dy = endNode.position.y - startNode.position.y;
    const lengthSquared = dx * dx + dy * dy;
    
    if (lengthSquared === 0) continue;

    const t = Math.max(
      0,
      Math.min(
        1,
        ((point.x - startNode.position.x) * dx +
          (point.y - startNode.position.y) * dy) /
          lengthSquared
      )
    );

    const closestPoint = {
      x: startNode.position.x + t * dx,
      y: startNode.position.y + t * dy,
    };

    const dist = distance(point, closestPoint);
    if (dist < minDistance) {
      minDistance = dist;
      closestWall = wall;
    }
  }

  if (!closestWall) return null;

  // Определяем направление внутрь комнаты
  // Берём перпендикуляр к стене в сторону точки
  const startNode = nodes.find((n) => n.id === closestWall!.startNodeId)!;
  const endNode = nodes.find((n) => n.id === closestWall!.endNodeId)!;

  const wallDx = endNode.position.x - startNode.position.x;
  const wallDy = endNode.position.y - startNode.position.y;
  const wallLength = Math.sqrt(wallDx * wallDx + wallDy * wallDy);

  if (wallLength === 0) return null;

  const perpX = -wallDy / wallLength;
  const perpY = wallDx / wallLength;

  // Проверяем, в какую сторону от стены находится точка
  const midPoint = {
    x: (startNode.position.x + endNode.position.x) / 2,
    y: (startNode.position.y + endNode.position.y) / 2,
  };

  const toPoint = {
    x: point.x - midPoint.x,
    y: point.y - midPoint.y,
  };

  const dot = perpX * toPoint.x + perpY * toPoint.y;
  const insideDirection = {
    x: dot > 0 ? perpX : -perpX,
    y: dot > 0 ? perpY : -perpY,
  };

  // Обходим граф стен, строя замкнутый контур
  // Используем алгоритм обхода по часовой стрелке
  const visitedWalls = new Set<string>();
  const perimeterWalls: Wall[] = [];
  const perimeterNodes: WallNode[] = [];

  // Начинаем с ближайшей стены
  let currentWall = closestWall;
  let currentNodeId = closestWall.startNodeId;

  // Пробуем обойти контур
  const maxIterations = walls.length * 2;
  let iterations = 0;

  while (currentWall && iterations < maxIterations) {
    iterations++;
    
    if (visitedWalls.has(currentWall.id)) {
      // Проверяем, замкнулся ли контур
      if (perimeterWalls.length >= 3 && perimeterNodes[0]?.id === currentNodeId) {
        break;
      }
      // Зациклились, но контур не замкнулся - пробуем другой путь
      break;
    }

    visitedWalls.add(currentWall.id);
    perimeterWalls.push(currentWall);

    const currentNode = nodes.find((n) => n.id === currentNodeId);
    if (currentNode && !perimeterNodes.find((n) => n.id === currentNodeId)) {
      perimeterNodes.push(currentNode);
    }

    // Переходим к следующему узлу
    const nextNodeId =
      currentWall.startNodeId === currentNodeId
        ? currentWall.endNodeId
        : currentWall.startNodeId;

    // Находим следующую стену, которая не является текущей
    const connectedWalls = wallGraph.get(nextNodeId) || [];
    const nextWall = connectedWalls
      .map((wallId) => walls.find((w) => w.id === wallId))
      .filter((w): w is Wall => w !== undefined && w.id !== currentWall.id)[0];

    if (!nextWall) break;

    currentWall = nextWall;
    currentNodeId = nextNodeId;
  }

  // Если контур не замкнулся, возвращаем null
  if (perimeterWalls.length < 3) return null;

  // Проверяем, что точка находится внутри построенного контура
  const polygon = perimeterNodes.map((node) => node.position);
  
  // Если контур не замкнулся, замыкаем его
  if (polygon.length > 0 && polygon[0].x !== polygon[polygon.length - 1].x || 
      polygon[0].y !== polygon[polygon.length - 1].y) {
    polygon.push(polygon[0]);
  }

  if (!isPointInPolygon(point, polygon)) {
    return null;
  }

  // Строим полигон по внутренним граням стен
  const innerPolygon: Point[] = [];
  
  for (const wall of perimeterWalls) {
    try {
      const edge = getWallInnerEdge(wall, nodes, insideDirection);
      if (innerPolygon.length === 0) {
        innerPolygon.push(edge.start);
      }
      innerPolygon.push(edge.end);
    } catch (e) {
      // Если не удалось получить внутреннюю грань, используем узлы
      const startNode = nodes.find((n) => n.id === wall.startNodeId);
      const endNode = nodes.find((n) => n.id === wall.endNodeId);
      if (startNode && endNode) {
        if (innerPolygon.length === 0) {
          innerPolygon.push(startNode.position);
        }
        innerPolygon.push(endNode.position);
      }
    }
  }

  // Замыкаем полигон
  if (innerPolygon.length > 0 && 
      (innerPolygon[0].x !== innerPolygon[innerPolygon.length - 1].x ||
       innerPolygon[0].y !== innerPolygon[innerPolygon.length - 1].y)) {
    innerPolygon.push(innerPolygon[0]);
  }

  return {
    polygon: innerPolygon,
    wallIds: perimeterWalls.map((w) => w.id),
  };
}

/**
 * Вычисляет площадь многоугольника в м²
 * Предполагается, что координаты в пикселях, а pixelsPerMeter задаёт масштаб
 */
export function calculateRoomArea(
  polygon: Point[],
  pixelsPerMeter: number = 80
): number {
  // Площадь в пикселях
  const areaPixels = polygonArea(polygon);
  // Конвертируем в м²
  return areaPixels / (pixelsPerMeter * pixelsPerMeter);
}

/**
 * Вычисляет периметр многоугольника в м
 */
export function calculateRoomPerimeter(
  polygon: Point[],
  pixelsPerMeter: number = 80
): number {
  if (polygon.length < 2) return 0;

  let perimeter = 0;
  for (let i = 0; i < polygon.length - 1; i++) {
    const p1 = polygon[i];
    const p2 = polygon[i + 1];
    perimeter += distance(p1, p2);
  }

  // Конвертируем в метры
  return perimeter / pixelsPerMeter;
}

/**
 * Создаёт новую комнату
 */
export function createRoom(
  polygon: Point[],
  wallIds: string[],
  pixelsPerMeter: number = 80,
  layerId: string = 'layer-rooms'
): Room {
  const area = calculateRoomArea(polygon, pixelsPerMeter);
  const perimeter = calculateRoomPerimeter(polygon, pixelsPerMeter);

  return {
    id: nanoid(),
    name: `Комната ${nanoid().slice(0, 4)}`,
    polygon,
    wallIds,
    area,
    perimeter,
    roomType: 'other',
    floorLevel: 0,
    layerId,
    geometrySynced: true,
  };
}

/**
 * Вычисляет центроид многоугольника (для размещения подписи)
 */
export function getPolygonCentroid(polygon: Point[]): Point {
  if (polygon.length === 0) return { x: 0, y: 0 };
  
  // Убираем последнюю точку, если она дублирует первую
  const points = polygon.length > 1 && 
    polygon[0].x === polygon[polygon.length - 1].x &&
    polygon[0].y === polygon[polygon.length - 1].y
    ? polygon.slice(0, -1)
    : polygon;

  let sumX = 0;
  let sumY = 0;
  
  for (const point of points) {
    sumX += point.x;
    sumY += point.y;
  }

  return {
    x: sumX / points.length,
    y: sumY / points.length,
  };
}

