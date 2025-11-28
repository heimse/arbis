// Инструмент выделения объектов

import type { Point, EditorState, Node, Wall, Door, Window, Furniture, Dimension, Room } from '@/types/editor'
import { distance, closestPointOnSegment, pointOnWall } from '@/lib/editor/geometry'

export class SelectTool {
  /**
   * Находит объект в точке (для начала drag)
   * Приоритет: узлы > двери > окна > стены > мебель > комнаты > размеры
   */
  static findObjectAtPoint(
    position: Point,
    state: EditorState
  ): { type: 'node' | 'wall' | 'door' | 'window' | 'furniture' | 'room' | 'dimension'; id: string } | null {
    const { nodes, doors, windows, walls } = state

    // 1. Проверяем узлы (высший приоритет)
    const node = this.findNodeAtPoint(position, nodes)
    if (node) {
      return { type: 'node', id: node.id }
    }

    // 2. Проверяем двери (приоритет над стенами)
    const door = this.findDoorAtPoint(position, doors, walls, nodes)
    if (door) {
      return { type: 'door', id: door.id }
    }

    // 3. Проверяем окна (приоритет над стенами)
    const window = this.findWindowAtPoint(position, windows, walls, nodes)
    if (window) {
      return { type: 'window', id: window.id }
    }

    // 4. Проверяем стены (низший приоритет - только если нет дверей/окон)
    const wall = this.findWallAtPoint(position, walls, nodes, doors, windows)
    if (wall) {
      return { type: 'wall', id: wall.id }
    }

    // TODO: Восстановить функционал инструмента мебель

    // 6. Проверяем комнаты
    const room = this.findRoomAtPoint(position, state.rooms)
    if (room) {
      return { type: 'room', id: room.id }
    }

    // 7. Проверяем размерные линии
    const dimension = this.findDimensionAtPoint(position, state.dimensions)
    if (dimension) {
      return { type: 'dimension', id: dimension.id }
    }

    return null
  }

  /**
   * Обработка клика для выделения объекта
   */
  static handleClick(
    position: Point,
    state: EditorState,
    dispatch: any
  ): boolean {
    const { nodes, walls, doors, windows, furniture, rooms, dimensions } = state

    // Сначала проверяем узлы (приоритет)
    const node = this.findNodeAtPoint(position, nodes)
    if (node) {
      dispatch({
        type: 'SET_SELECTION',
        selection: { type: 'node', id: node.id },
      })
      return true
    }

    // Проверяем двери
    const door = this.findDoorAtPoint(position, doors, walls, nodes)
    if (door) {
      dispatch({
        type: 'SET_SELECTION',
        selection: { type: 'door', id: door.id },
      })
      return true
    }

    // Проверяем окна
    const window = this.findWindowAtPoint(position, windows, walls, nodes)
    if (window) {
      dispatch({
        type: 'SET_SELECTION',
        selection: { type: 'window', id: window.id },
      })
      return true
    }

    // Проверяем стены (последними, чтобы не перекрывать двери/окна)
    const wall = this.findWallAtPoint(position, walls, nodes, doors, windows)
    if (wall) {
      dispatch({
        type: 'SET_SELECTION',
        selection: { type: 'wall', id: wall.id },
      })
      return true
    }

    // TODO: Восстановить функционал инструмента мебель

    // Проверяем комнаты
    const room = this.findRoomAtPoint(position, rooms)
    if (room) {
      dispatch({
        type: 'SET_SELECTION',
        selection: { type: 'room', id: room.id },
      })
      return true
    }

    // Проверяем размерные линии
    const dimension = this.findDimensionAtPoint(position, dimensions)
    if (dimension) {
      dispatch({
        type: 'SET_SELECTION',
        selection: { type: 'dimension', id: dimension.id },
      })
      return true
    }

    // Ничего не найдено - снимаем выделение
    dispatch({
      type: 'SET_SELECTION',
      selection: { type: null, id: null },
    })
    return false
  }

  /**
   * Обработка перетаскивания объекта
   */
  static handleDrag(
    object: { type: 'node' | 'wall' | 'door' | 'window' | 'furniture' | 'room' | 'dimension'; id: string },
    dx: number,
    dy: number,
    currentPos: Point,
    state: EditorState,
    dispatch: any
  ) {
    switch (object.type) {
      case 'node':
        this.dragNode(object.id, dx, dy, state, dispatch)
        break
      case 'wall':
        this.dragWall(object.id, dx, dy, state, dispatch)
        break
      case 'door':
        this.dragDoor(object.id, currentPos, state, dispatch)
        break
      case 'window':
        this.dragWindow(object.id, currentPos, state, dispatch)
        break
      // TODO: Восстановить функционал инструмента мебель
      case 'room':
        this.dragRoom(object.id, dx, dy, state, dispatch)
        break
      case 'dimension':
        this.dragDimension(object.id, dx, dy, state, dispatch)
        break
    }
  }

  /**
   * Перетаскивание узла
   */
  private static dragNode(
    nodeId: string,
    dx: number,
    dy: number,
    state: EditorState,
    dispatch: any
  ) {
    const node = state.nodes.get(nodeId)
    if (!node) return

    dispatch({
      type: 'UPDATE_NODE',
      id: nodeId,
      updates: {
        x: node.x + dx,
        y: node.y + dy,
      },
    })
  }

  /**
   * Перетаскивание стены целиком (перемещает оба узла, сохраняя угол)
   */
  private static dragWall(
    wallId: string,
    dx: number,
    dy: number,
    state: EditorState,
    dispatch: any
  ) {
    const wall = state.walls.get(wallId)
    if (!wall) return

    const startNode = state.nodes.get(wall.startNodeId)
    const endNode = state.nodes.get(wall.endNodeId)

    if (!startNode || !endNode) return

    // Вычисляем текущий угол и длину стены
    const currentDx = endNode.x - startNode.x
    const currentDy = endNode.y - startNode.y
    const currentLength = Math.sqrt(currentDx * currentDx + currentDy * currentDy)
    const currentAngle = Math.atan2(currentDy, currentDx)

    // Перемещаем оба узла параллельно, сохраняя угол и длину
    // Новые координаты начального узла
    const newStartX = startNode.x + dx
    const newStartY = startNode.y + dy

    // Новые координаты конечного узла (сохраняем угол и длину)
    const newEndX = newStartX + currentLength * Math.cos(currentAngle)
    const newEndY = newStartY + currentLength * Math.sin(currentAngle)

    dispatch({
      type: 'UPDATE_NODE',
      id: wall.startNodeId,
      updates: {
        x: newStartX,
        y: newStartY,
      },
    })

    dispatch({
      type: 'UPDATE_NODE',
      id: wall.endNodeId,
      updates: {
        x: newEndX,
        y: newEndY,
      },
    })
  }

  /**
   * Перетаскивание двери вдоль стены
   */
  private static dragDoor(
    doorId: string,
    currentPos: Point,
    state: EditorState,
    dispatch: any
  ) {
    const door = state.doors.get(doorId)
    if (!door) return

    const wall = state.walls.get(door.wallId)
    if (!wall) return

    const startNode = state.nodes.get(wall.startNodeId)
    const endNode = state.nodes.get(wall.endNodeId)
    if (!startNode || !endNode) return

    // Находим ближайшую точку на стене
    const result = closestPointOnSegment(currentPos, startNode, endNode)
    
    // Ограничиваем позицию от 0.1 до 0.9 (чтобы не было на краях)
    const clampedT = Math.max(0.1, Math.min(0.9, result.t))

    dispatch({
      type: 'UPDATE_DOOR',
      id: doorId,
      updates: {
        position: clampedT,
      },
    })
  }

  /**
   * Перетаскивание окна вдоль стены
   */
  private static dragWindow(
    windowId: string,
    currentPos: Point,
    state: EditorState,
    dispatch: any
  ) {
    const window = state.windows.get(windowId)
    if (!window) return

    const wall = state.walls.get(window.wallId)
    if (!wall) return

    const startNode = state.nodes.get(wall.startNodeId)
    const endNode = state.nodes.get(wall.endNodeId)
    if (!startNode || !endNode) return

    // Находим ближайшую точку на стене
    const result = closestPointOnSegment(currentPos, startNode, endNode)
    
    // Ограничиваем позицию от 0.1 до 0.9 (чтобы не было на краях)
    const clampedT = Math.max(0.1, Math.min(0.9, result.t))

    dispatch({
      type: 'UPDATE_WINDOW',
      id: windowId,
      updates: {
        position: clampedT,
      },
    })
  }

  /**
   * Находит узел в точке клика
   */
  private static findNodeAtPoint(
    point: Point,
    nodes: Map<string, Node>
  ): Node | null {
    const threshold = 0.15 // 15 см

    for (const node of nodes.values()) {
      if (distance(point, node) <= threshold) {
        return node
      }
    }

    return null
  }

  /**
   * Находит стену в точке клика
   * Исключает участки, где есть двери или окна
   */
  private static findWallAtPoint(
    point: Point,
    walls: Map<string, Wall>,
    nodes: Map<string, Node>,
    doors?: Map<string, Door>,
    windows?: Map<string, Window>
  ): Wall | null {
    const threshold = 0.2 // 20 см

    for (const wall of walls.values()) {
      const startNode = nodes.get(wall.startNodeId)
      const endNode = nodes.get(wall.endNodeId)

      if (!startNode || !endNode) continue

      const result = closestPointOnSegment(point, startNode, endNode)
      const dist = distance(point, result.point)

      if (dist <= threshold) {
        // Проверяем, нет ли на этом участке стены дверей или окон
        let hasDoorOrWindow = false
        
        if (doors || windows) {
          const t = result.t
          const doorWindowThreshold = 0.2 // 20% от длины стены (зона исключения)
          
          // Проверяем двери
          if (doors) {
            for (const door of doors.values()) {
              if (door.wallId === wall.id) {
                const doorT = door.position
                if (Math.abs(t - doorT) < doorWindowThreshold) {
                  // На этом участке есть дверь - пропускаем эту стену
                  hasDoorOrWindow = true
                  break
                }
              }
            }
          }
          
          // Проверяем окна
          if (!hasDoorOrWindow && windows) {
            for (const window of windows.values()) {
              if (window.wallId === wall.id) {
                const windowT = window.position
                if (Math.abs(t - windowT) < doorWindowThreshold) {
                  // На этом участке есть окно - пропускаем эту стену
                  hasDoorOrWindow = true
                  break
                }
              }
            }
          }
        }
        
        // Если на этом участке нет дверей/окон - возвращаем стену
        if (!hasDoorOrWindow) {
          return wall
        }
      }
    }

    return null
  }

  /**
   * Находит дверь в точке клика
   */
  private static findDoorAtPoint(
    point: Point,
    doors: Map<string, Door>,
    walls: Map<string, Wall>,
    nodes: Map<string, Node>
  ): Door | null {
    const threshold = 0.4 // 40 см - увеличен для лучшего выбора

    for (const door of doors.values()) {
      const wall = walls.get(door.wallId)
      if (!wall) continue

      const startNode = nodes.get(wall.startNodeId)
      const endNode = nodes.get(wall.endNodeId)
      if (!startNode || !endNode) continue

      // Вычисляем позицию двери
      const doorPos = {
        x: startNode.x + (endNode.x - startNode.x) * door.position,
        y: startNode.y + (endNode.y - startNode.y) * door.position,
      }

      // Также проверяем расстояние до стены в районе двери
      const wallResult = closestPointOnSegment(point, startNode, endNode)
      const wallDist = distance(point, wallResult.point)
      const doorDist = distance(point, doorPos)

      // Выбираем дверь, если клик близко к позиции двери ИЛИ близко к стене в районе двери
      if (doorDist <= threshold || (wallDist <= 0.25 && Math.abs(wallResult.t - door.position) < 0.2)) {
        return door
      }
    }

    return null
  }

  /**
   * Находит окно в точке клика
   */
  private static findWindowAtPoint(
    point: Point,
    windows: Map<string, Window>,
    walls: Map<string, Wall>,
    nodes: Map<string, Node>
  ): Window | null {
    const threshold = 0.4 // 40 см - увеличен для лучшего выбора

    for (const window of windows.values()) {
      const wall = walls.get(window.wallId)
      if (!wall) continue

      const startNode = nodes.get(wall.startNodeId)
      const endNode = nodes.get(wall.endNodeId)
      if (!startNode || !endNode) continue

      // Вычисляем позицию окна
      const windowPos = {
        x: startNode.x + (endNode.x - startNode.x) * window.position,
        y: startNode.y + (endNode.y - startNode.y) * window.position,
      }

      // Также проверяем расстояние до стены в районе окна
      const wallResult = closestPointOnSegment(point, startNode, endNode)
      const wallDist = distance(point, wallResult.point)
      const windowDist = distance(point, windowPos)

      // Выбираем окно, если клик близко к позиции окна ИЛИ близко к стене в районе окна
      if (windowDist <= threshold || (wallDist <= 0.25 && Math.abs(wallResult.t - window.position) < 0.2)) {
        return window
      }
    }

    return null
  }

  /**
   * Находит мебель в точке
   */
  private static findFurnitureAtPoint(
    point: Point,
    furniture: Map<string, Furniture>
  ): Furniture | null {
    for (const item of furniture.values()) {
      const left = item.position.x
      const right = item.position.x + item.size.width
      const top = item.position.y
      const bottom = item.position.y + item.size.height

      if (point.x >= left && point.x <= right && point.y >= top && point.y <= bottom) {
        return item
      }
    }
    return null
  }

  /**
   * Находит комнату в точке
   */
  private static findRoomAtPoint(
    point: Point,
    rooms: Map<string, Room>
  ): Room | null {
    for (const room of rooms.values()) {
      // Если есть полигон, проверяем точку внутри полигона
      if (room.polygon && room.polygon.length >= 3) {
        if (this.isPointInPolygon(point, room.polygon)) {
          return room
        }
      } else {
        // Иначе проверяем ограничивающий прямоугольник
        const left = room.position.x
        const right = room.position.x + room.size.width
        const top = room.position.y
        const bottom = room.position.y + room.size.height

        if (point.x >= left && point.x <= right && point.y >= top && point.y <= bottom) {
          return room
        }
      }
    }
    return null
  }

  /**
   * Проверяет, находится ли точка внутри многоугольника
   */
  private static isPointInPolygon(point: Point, polygon: Point[]): boolean {
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
   * Находит размерную линию в точке
   */
  private static findDimensionAtPoint(
    point: Point,
    dimensions: Map<string, Dimension>
  ): Dimension | null {
    const threshold = 0.2 // 20 см

    for (const dimension of dimensions.values()) {
      // Проверяем расстояние до линии
      const dx = dimension.endPoint.x - dimension.startPoint.x
      const dy = dimension.endPoint.y - dimension.startPoint.y
      const length = Math.sqrt(dx * dx + dy * dy)

      if (length < 0.01) continue // Пропускаем слишком короткие линии

      // Вычисляем расстояние от точки до отрезка
      const t = Math.max(0, Math.min(1, 
        ((point.x - dimension.startPoint.x) * dx + (point.y - dimension.startPoint.y) * dy) / (length * length)
      ))

      const closestPoint = {
        x: dimension.startPoint.x + t * dx,
        y: dimension.startPoint.y + t * dy,
      }

      const dist = distance(point, closestPoint)
      if (dist <= threshold) {
        return dimension
      }
    }
    return null
  }

  /**
   * Перетаскивание мебели
   */
  private static dragFurniture(
    furnitureId: string,
    dx: number,
    dy: number,
    state: EditorState,
    dispatch: any
  ) {
    const furniture = state.furniture.get(furnitureId)
    if (!furniture) return

    dispatch({
      type: 'UPDATE_FURNITURE',
      id: furnitureId,
      updates: {
        position: {
          x: furniture.position.x + dx,
          y: furniture.position.y + dy,
        },
      },
    })
  }

  /**
   * Перетаскивание комнаты
   */
  private static dragRoom(
    roomId: string,
    dx: number,
    dy: number,
    state: EditorState,
    dispatch: any
  ) {
    const room = state.rooms.get(roomId)
    if (!room) return

    // Обновляем позицию
    const newPosition = {
      x: room.position.x + dx,
      y: room.position.y + dy,
    }

    // Обновляем полигон, если он есть
    const updates: any = {
      position: newPosition,
    }

    if (room.polygon && room.polygon.length > 0) {
      updates.polygon = room.polygon.map((point) => ({
        x: point.x + dx,
        y: point.y + dy,
      }))
    }

    dispatch({
      type: 'UPDATE_ROOM',
      id: roomId,
      updates,
    })
  }

  /**
   * Перетаскивание размерной линии
   */
  private static dragDimension(
    dimensionId: string,
    dx: number,
    dy: number,
    state: EditorState,
    dispatch: any
  ) {
    const dimension = state.dimensions.get(dimensionId)
    if (!dimension) return

    dispatch({
      type: 'UPDATE_DIMENSION',
      id: dimensionId,
      updates: {
        startPoint: {
          x: dimension.startPoint.x + dx,
          y: dimension.startPoint.y + dy,
        },
        endPoint: {
          x: dimension.endPoint.x + dx,
          y: dimension.endPoint.y + dy,
        },
      },
    })
  }
}

