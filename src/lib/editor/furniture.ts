/**
 * Утилиты для работы с мебелью
 */

import { nanoid } from 'nanoid';
import type {
  Point,
  Room,
  FurnitureInstance,
  FurnitureCatalogItem,
} from '@/types/plan';
import { isPointInPolygon } from './rooms';

/**
 * Проверяет, находится ли точка внутри полигона комнаты
 */
function isPointInRoomPolygon(point: Point, room: Room): boolean {
  if (!room.polygon || room.polygon.length < 3) {
    return false;
  }
  return isPointInPolygon(point, room.polygon);
}

/**
 * Находит комнату, содержащую указанную точку
 */
export function findRoomContainingPoint(
  point: Point,
  rooms: Room[]
): Room | null {
  for (const room of rooms) {
    if (isPointInRoomPolygon(point, room)) {
      return room;
    }
  }
  return null;
}

/**
 * Создаёт экземпляр мебели из элемента каталога
 */
export function createFurnitureInstance(
  catalogItem: FurnitureCatalogItem,
  position: Point,
  roomId?: string,
  layerId: string = 'layer-furniture'
): FurnitureInstance {
  const pixelsPerMeter = 80; // TODO: получать из плана
  
  // Конвертируем размеры из мм в пиксели
  const widthPx = (catalogItem.defaultSize.width / 1000) * pixelsPerMeter;
  const depthPx = (catalogItem.defaultSize.depth / 1000) * pixelsPerMeter;
  
  // Определяем начальный угол поворота в зависимости от типа привязки
  let initialRotation = 0;
  if (catalogItem.positioning.anchorType === 'against-wall') {
    // По умолчанию привязываем к стене (можно будет настроить при размещении)
    initialRotation = 0;
  }

  return {
    id: nanoid(),
    catalogItemId: catalogItem.id,
    position,
    size: {
      width: catalogItem.defaultSize.width,
      depth: catalogItem.defaultSize.depth,
      height: catalogItem.defaultSize.height,
    },
    rotation: initialRotation,
    roomId,
    layerId,
    locked: false,
    hidden: false,
    articleCode: catalogItem.articleCode,
    manufacturer: catalogItem.manufacturer,
  };
}

/**
 * Вычисляет реальные размеры мебели в пикселях на основе размеров в мм
 */
export function furnitureSizeToPixels(
  sizeMm: { width: number; depth: number; height?: number },
  pixelsPerMeter: number = 80
): { width: number; depth: number; height?: number } {
  return {
    width: (sizeMm.width / 1000) * pixelsPerMeter,
    depth: (sizeMm.depth / 1000) * pixelsPerMeter,
    height: sizeMm.height
      ? (sizeMm.height / 1000) * pixelsPerMeter
      : undefined,
  };
}

/**
 * Вычисляет углы прямоугольника мебели с учётом поворота
 */
export function getFurnitureCorners(
  furniture: FurnitureInstance,
  pixelsPerMeter: number = 80
): Point[] {
  const sizePx = furnitureSizeToPixels(furniture.size, pixelsPerMeter);
  const halfWidth = sizePx.width / 2;
  const halfDepth = sizePx.depth / 2;

  // Углы прямоугольника до поворота (относительно центра)
  const corners = [
    { x: -halfWidth, y: -halfDepth },
    { x: halfWidth, y: -halfDepth },
    { x: halfWidth, y: halfDepth },
    { x: -halfWidth, y: halfDepth },
  ];

  // Применяем поворот
  const angleRad = (furniture.rotation * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);

  return corners.map((corner) => ({
    x: furniture.position.x + corner.x * cos - corner.y * sin,
    y: furniture.position.y + corner.x * sin + corner.y * cos,
  }));
}

/**
 * Проверяет, находится ли точка внутри мебели
 */
export function isPointInFurniture(
  point: Point,
  furniture: FurnitureInstance,
  pixelsPerMeter: number = 80
): boolean {
  const corners = getFurnitureCorners(furniture, pixelsPerMeter);
  return isPointInPolygon(point, corners);
}

/**
 * Вычисляет центр мебели (для отображения подписи)
 */
export function getFurnitureCenter(furniture: FurnitureInstance): Point {
  return furniture.position;
}

/**
 * Ограничивает размер мебели в соответствии с ограничениями каталога
 */
export function clampFurnitureSize(
  size: { width: number; depth: number },
  constraints?: FurnitureCatalogItem['sizeConstraints']
): { width: number; depth: number } {
  if (!constraints) return size;

  return {
    width: Math.max(
      constraints.minWidth || 0,
      Math.min(constraints.maxWidth || Infinity, size.width)
    ),
    depth: Math.max(
      constraints.minDepth || 0,
      Math.min(constraints.maxDepth || Infinity, size.depth)
    ),
  };
}

/**
 * Ограничивает угол поворота в соответствии с правилами каталога
 */
export function clampFurnitureRotation(
  rotation: number,
  allowedRotations: FurnitureCatalogItem['positioning']['allowedRotations']
): number {
  if (allowedRotations === 'any') {
    return rotation % 360;
  }

  if (allowedRotations === '90') {
    const normalized = ((rotation % 360) + 360) % 360;
    const snapped = Math.round(normalized / 90) * 90;
    return snapped % 360;
  }

  if (allowedRotations === '45') {
    const normalized = ((rotation % 360) + 360) % 360;
    const snapped = Math.round(normalized / 45) * 45;
    return snapped % 360;
  }

  return rotation;
}

