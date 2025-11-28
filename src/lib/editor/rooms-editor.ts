/**
 * Утилиты для работы с комнатами в editorStore
 */

import type { Point, Node, Wall } from '@/types/editor'
import { distance, closestPointOnSegment } from './geometry'

/**
 * Проверяет, находится ли точка внутри многоугольника
 */
function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  if (polygon.length < 3) return false

  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x
    const yi = polygon[i].y
    const xj = polygon[j].x
    const yj = polygon[j].y

    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi

    if (intersect) inside = !inside
  }

  return inside
}

/**
 * Находит замкнутую область стен, содержащую указанную точку
 * Возвращает полигон комнаты и список стен периметра
 */
export function findEnclosedAreaEditor(
  point: Point,
  walls: Map<string, Wall>,
  nodes: Map<string, Node>
): { polygon: Point[]; wallIds: string[] } | null {
  // Конвертируем Map в массивы для удобства
  const wallsArray = Array.from(walls.values())
  const nodesArray = Array.from(nodes.values())

  // Строим граф стен
  const wallGraph = new Map<string, string[]>() // nodeId -> [wallId, wallId, ...]

  for (const wall of wallsArray) {
    if (!wallGraph.has(wall.startNodeId)) {
      wallGraph.set(wall.startNodeId, [])
    }
    if (!wallGraph.has(wall.endNodeId)) {
      wallGraph.set(wall.endNodeId, [])
    }
    wallGraph.get(wall.startNodeId)!.push(wall.id)
    wallGraph.get(wall.endNodeId)!.push(wall.id)
  }

  // Находим ближайшую стену к точке
  let closestWall: Wall | null = null
  let minDistance = Infinity

  for (const wall of wallsArray) {
    const startNode = nodes.get(wall.startNodeId)
    const endNode = nodes.get(wall.endNodeId)

    if (!startNode || !endNode) continue

    const startPoint: Point = { x: startNode.x, y: startNode.y }
    const endPoint: Point = { x: endNode.x, y: endNode.y }

    const result = closestPointOnSegment(point, startPoint, endPoint)
    const dist = distance(point, result.point)

    if (dist < minDistance) {
      minDistance = dist
      closestWall = wall
    }
  }

  if (!closestWall) return null

  // Определяем направление внутрь комнаты на основе ближайшей стены
  const startNode = nodes.get(closestWall.startNodeId)!
  const endNode = nodes.get(closestWall.endNodeId)!

  const wallDx = endNode.x - startNode.x
  const wallDy = endNode.y - startNode.y
  const wallLength = Math.sqrt(wallDx * wallDx + wallDy * wallDy)

  if (wallLength === 0) return null

  const perpX = -wallDy / wallLength
  const perpY = wallDx / wallLength

  // Проверяем, в какую сторону от стены находится точка
  const midPoint: Point = {
    x: (startNode.x + endNode.x) / 2,
    y: (startNode.y + endNode.y) / 2,
  }

  const toPoint: Point = {
    x: point.x - midPoint.x,
    y: point.y - midPoint.y,
  }

  const dot = perpX * toPoint.x + perpY * toPoint.y
  // Направление внутрь комнаты (нормализованный вектор)
  const insideDirection = {
    x: dot > 0 ? perpX : -perpX,
    y: dot > 0 ? perpY : -perpY,
  }

  // Обходим граф стен, строя замкнутый контур
  const visitedWalls = new Set<string>()
  const perimeterWalls: Wall[] = []
  const perimeterNodes: Node[] = []

  // Начинаем с ближайшей стены
  let currentWall = closestWall
  let currentNodeId = closestWall.startNodeId

  // Пробуем обойти контур
  const maxIterations = wallsArray.length * 2
  let iterations = 0

  while (currentWall && iterations < maxIterations) {
    iterations++

    if (visitedWalls.has(currentWall.id)) {
      // Проверяем, замкнулся ли контур
      if (perimeterWalls.length >= 3 && perimeterNodes[0]?.id === currentNodeId) {
        break
      }
      // Зациклились, но контур не замкнулся
      break
    }

    visitedWalls.add(currentWall.id)
    perimeterWalls.push(currentWall)

    const currentNode = nodes.get(currentNodeId)
    if (currentNode && !perimeterNodes.find((n) => n.id === currentNodeId)) {
      perimeterNodes.push(currentNode)
    }

    // Переходим к следующему узлу
    const nextNodeId =
      currentWall.startNodeId === currentNodeId
        ? currentWall.endNodeId
        : currentWall.startNodeId

    // Находим следующую стену, которая не является текущей
    const connectedWalls = wallGraph.get(nextNodeId) || []
    const nextWall = connectedWalls
      .map((wallId) => walls.get(wallId))
      .filter((w): w is Wall => w !== undefined && w.id !== currentWall.id)[0]

    if (!nextWall) break

    currentWall = nextWall
    currentNodeId = nextNodeId
  }

  // Если контур не замкнулся, возвращаем null
  if (perimeterWalls.length < 3) return null

  // Проверяем, что точка находится внутри построенного контура
  const polygon = perimeterNodes.map((node) => ({ x: node.x, y: node.y }))

  // Если контур не замкнулся, замыкаем его
  if (
    polygon.length > 0 &&
    (polygon[0].x !== polygon[polygon.length - 1].x ||
      polygon[0].y !== polygon[polygon.length - 1].y)
  ) {
    polygon.push(polygon[0])
  }

  if (!isPointInPolygon(point, polygon)) {
    return null
  }

  // Строим полигон по внутренним граням стен (с учетом толщины)
  const innerPolygon: Point[] = []

  for (const wall of perimeterWalls) {
    const startNode = nodes.get(wall.startNodeId)!
    const endNode = nodes.get(wall.endNodeId)!

    const start: Point = { x: startNode.x, y: startNode.y }
    const end: Point = { x: endNode.x, y: endNode.y }

    // Вектор направления стены
    const dx = end.x - start.x
    const dy = end.y - start.y
    const length = Math.sqrt(dx * dx + dy * dy)

    if (length === 0) {
      if (innerPolygon.length === 0) {
        innerPolygon.push(start)
      }
      innerPolygon.push(end)
      continue
    }

    // Нормализованный перпендикуляр к стене
    const perpX = -dy / length
    const perpY = dx / length

    // Определяем направление внутрь для этой стены
    // Используем точку клика для определения направления
    const wallMidPoint: Point = {
      x: (start.x + end.x) / 2,
      y: (start.y + end.y) / 2,
    }
    const toPoint: Point = {
      x: point.x - wallMidPoint.x,
      y: point.y - wallMidPoint.y,
    }
    const dot = perpX * toPoint.x + perpY * toPoint.y
    const wallInsideDir = {
      x: dot > 0 ? perpX : -perpX,
      y: dot > 0 ? perpY : -perpY,
    }

    // Половина толщины стены в метрах (толщина в мм, делим на 1000)
    const halfThickness = (wall.thickness / 1000) / 2

    // Внутренние точки стены (смещенные внутрь)
    const innerStart: Point = {
      x: start.x + wallInsideDir.x * halfThickness,
      y: start.y + wallInsideDir.y * halfThickness,
    }

    const innerEnd: Point = {
      x: end.x + wallInsideDir.x * halfThickness,
      y: end.y + wallInsideDir.y * halfThickness,
    }

    if (innerPolygon.length === 0) {
      innerPolygon.push(innerStart)
    }
    innerPolygon.push(innerEnd)
  }

  // Замыкаем полигон
  if (
    innerPolygon.length > 0 &&
    (innerPolygon[0].x !== innerPolygon[innerPolygon.length - 1].x ||
      innerPolygon[0].y !== innerPolygon[innerPolygon.length - 1].y)
  ) {
    innerPolygon.push(innerPolygon[0])
  }

  return {
    polygon: innerPolygon,
    wallIds: perimeterWalls.map((w) => w.id),
  }
}

/**
 * Вычисляет площадь многоугольника в м²
 */
export function calculateRoomAreaEditor(polygon: Point[]): number {
  if (polygon.length < 3) return 0

  let area = 0
  for (let i = 0; i < polygon.length - 1; i++) {
    area += polygon[i].x * polygon[i + 1].y
    area -= polygon[i + 1].x * polygon[i].y
  }

  return Math.abs(area) / 2
}

/**
 * Вычисляет периметр многоугольника в м
 */
export function calculateRoomPerimeterEditor(polygon: Point[]): number {
  if (polygon.length < 2) return 0

  let perimeter = 0
  for (let i = 0; i < polygon.length - 1; i++) {
    perimeter += distance(polygon[i], polygon[i + 1])
  }

  return perimeter
}

/**
 * Вычисляет ограничивающий прямоугольник для полигона
 */
export function getPolygonBounds(polygon: Point[]): {
  minX: number
  minY: number
  maxX: number
  maxY: number
  width: number
  height: number
} {
  if (polygon.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 }
  }

  let minX = polygon[0].x
  let minY = polygon[0].y
  let maxX = polygon[0].x
  let maxY = polygon[0].y

  for (const point of polygon) {
    minX = Math.min(minX, point.x)
    minY = Math.min(minY, point.y)
    maxX = Math.max(maxX, point.x)
    maxY = Math.max(maxY, point.y)
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  }
}

