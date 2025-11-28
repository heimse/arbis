// Геометрические утилиты для работы с 2D планами

import type { Point, Node, Wall, Camera } from '@/types/editor'
import type { MeasurementUnit } from '@/types/plan'

/**
 * Вычисляет расстояние между двумя точками
 */
export function distance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Вычисляет длину стены в метрах
 */
export function wallLength(
  wall: Wall,
  nodes: Map<string, Node>
): number {
  const startNode = nodes.get(wall.startNodeId)
  const endNode = nodes.get(wall.endNodeId)
  
  if (!startNode || !endNode) return 0
  
  return distance(startNode, endNode)
}

/**
 * Находит точку на стене по позиции (0..1)
 */
export function pointOnWall(
  wall: Wall,
  position: number,
  nodes: Map<string, Node>
): Point | null {
  const startNode = nodes.get(wall.startNodeId)
  const endNode = nodes.get(wall.endNodeId)
  
  if (!startNode || !endNode) return null
  
  const t = Math.max(0, Math.min(1, position))
  
  return {
    x: startNode.x + (endNode.x - startNode.x) * t,
    y: startNode.y + (endNode.y - startNode.y) * t,
  }
}

/**
 * Находит ближайшую точку на отрезке к заданной точке
 */
export function closestPointOnSegment(
  point: Point,
  segmentStart: Point,
  segmentEnd: Point
): { point: Point; t: number } {
  const dx = segmentEnd.x - segmentStart.x
  const dy = segmentEnd.y - segmentStart.y
  
  const lengthSquared = dx * dx + dy * dy
  
  if (lengthSquared === 0) {
    return { point: segmentStart, t: 0 }
  }
  
  let t = ((point.x - segmentStart.x) * dx + (point.y - segmentStart.y) * dy) / lengthSquared
  t = Math.max(0, Math.min(1, t))
  
  return {
    point: {
      x: segmentStart.x + t * dx,
      y: segmentStart.y + t * dy,
    },
    t,
  }
}

/**
 * Расстояние от точки до отрезка
 */
export function distanceToSegment(
  point: Point,
  segmentStart: Point,
  segmentEnd: Point
): number {
  const closest = closestPointOnSegment(point, segmentStart, segmentEnd)
  return distance(point, closest.point)
}

/**
 * Проверяет, находится ли точка рядом с отрезком (в пределах threshold)
 */
export function isPointNearSegment(
  point: Point,
  segmentStart: Point,
  segmentEnd: Point,
  threshold: number
): boolean {
  return distanceToSegment(point, segmentStart, segmentEnd) <= threshold
}

/**
 * Преобразует мировые координаты (метры) в экранные (пиксели)
 */
export function worldToScreen(
  worldPoint: Point,
  camera: Camera
): Point {
  return {
    x: (worldPoint.x - camera.x) * camera.zoom,
    y: (worldPoint.y - camera.y) * camera.zoom,
  }
}

/**
 * Преобразует экранные координаты (пиксели) в мировые (метры)
 */
export function screenToWorld(
  screenPoint: Point,
  camera: Camera
): Point {
  return {
    x: screenPoint.x / camera.zoom + camera.x,
    y: screenPoint.y / camera.zoom + camera.y,
  }
}

/**
 * Привязка к сетке
 */
export function snapToGrid(
  point: Point,
  gridSpacing: number
): Point {
  return {
    x: Math.round(point.x / gridSpacing) * gridSpacing,
    y: Math.round(point.y / gridSpacing) * gridSpacing,
  }
}

/**
 * Привязка к ближайшему узлу
 */
export function snapToNode(
  point: Point,
  nodes: Map<string, Node>,
  threshold: number
): { node: Node; snapped: boolean } | null {
  let closestNode: Node | null = null
  let closestDistance = threshold
  
  for (const node of nodes.values()) {
    const dist = distance(point, node)
    if (dist < closestDistance) {
      closestDistance = dist
      closestNode = node
    }
  }
  
  if (closestNode) {
    return { node: closestNode, snapped: true }
  }
  
  return null
}

/**
 * Привязка к ортогональному направлению (0°, 90°, 180°, 270°)
 */
export function snapToOrthogonal(
  from: Point,
  to: Point,
  threshold: number = 0.1 // радиан
): Point {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const angle = Math.atan2(dy, dx)
  
  // Определяем ближайшее ортогональное направление
  const orthogonalAngles = [0, Math.PI / 2, Math.PI, -Math.PI / 2]
  
  let closestAngle = angle
  let minDiff = Infinity
  
  for (const orthoAngle of orthogonalAngles) {
    const diff = Math.abs(angle - orthoAngle)
    if (diff < minDiff && diff < threshold) {
      minDiff = diff
      closestAngle = orthoAngle
    }
  }
  
  if (minDiff < Infinity) {
    const length = Math.sqrt(dx * dx + dy * dy)
    return {
      x: from.x + length * Math.cos(closestAngle),
      y: from.y + length * Math.sin(closestAngle),
    }
  }
  
  return to
}

/**
 * Вычисляет угол между двумя точками в радианах
 */
export function angleBetween(from: Point, to: Point): number {
  return Math.atan2(to.y - from.y, to.x - from.x)
}

/**
 * Вычисляет угол между двумя точками в градусах
 */
export function angleBetweenDegrees(from: Point, to: Point): number {
  return angleBetween(from, to) * (180 / Math.PI)
}

/**
 * Проверяет пересечение двух отрезков
 */
export function segmentsIntersect(
  a1: Point,
  a2: Point,
  b1: Point,
  b2: Point
): boolean {
  const det = (a2.x - a1.x) * (b2.y - b1.y) - (b2.x - b1.x) * (a2.y - a1.y)
  
  if (det === 0) return false // параллельны
  
  const lambda = ((b2.y - b1.y) * (b2.x - a1.x) + (b1.x - b2.x) * (b2.y - a1.y)) / det
  const gamma = ((a1.y - a2.y) * (b2.x - a1.x) + (a2.x - a1.x) * (b2.y - a1.y)) / det
  
  return lambda >= 0 && lambda <= 1 && gamma >= 0 && gamma <= 1
}

/**
 * Вычисляет площадь многоугольника
 */
export function polygonArea(points: Point[]): number {
  if (points.length < 3) return 0
  
  let area = 0
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length
    area += points[i].x * points[j].y
    area -= points[j].x * points[i].y
  }
  
  return Math.abs(area) / 2
}

/**
 * Форматирует число в метрах для отображения
 */
export function formatDistance(meters: number, precision: number = 2): string {
  return meters.toFixed(precision) + ' м'
}

/**
 * Форматирует площадь для отображения
 */
export function formatArea(squareMeters: number, precision: number = 2): string {
  return squareMeters.toFixed(precision) + ' м²'
}

/**
 * Преобразует пиксели в миллиметры
 */
export function pixelsToMm(pixels: number, pixelsPerMeter: number): number {
  // 1 метр = 1000 мм
  const meters = pixels / pixelsPerMeter;
  return meters * 1000;
}

/**
 * Преобразует миллиметры в пиксели
 */
export function mmToPixels(mm: number, pixelsPerMeter: number): number {
  // 1 метр = 1000 мм
  const meters = mm / 1000;
  return meters * pixelsPerMeter;
}

/**
 * Форматирует размер в зависимости от единиц измерения
 */
export function formatDimension(valueMm: number, unit: MeasurementUnit): string {
  switch (unit) {
    case 'mm':
      return `${Math.round(valueMm)} мм`;
    case 'cm':
      return `${(valueMm / 10).toFixed(1)} см`;
    case 'm':
      return `${(valueMm / 1000).toFixed(2)} м`;
    default:
      return `${valueMm.toFixed(1)} мм`;
  }
}