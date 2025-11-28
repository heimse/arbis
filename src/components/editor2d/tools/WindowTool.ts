// Инструмент для добавления окон

import type { Point, EditorState, Wall, Node } from '@/types/editor'
import { closestPointOnSegment } from '@/lib/editor/geometry'
import { generateWindowId, DEFAULT_WINDOW_SIZE } from '@/lib/editor/utils'

export class WindowTool {
  /**
   * Обработка клика для добавления окна на стену
   */
  static handleClick(
    position: Point,
    state: EditorState,
    dispatch: any
  ): boolean {
    const { walls, nodes } = state

    // Ищем стену, на которую кликнули
    const result = this.findWallAtPoint(position, walls, nodes)
    
    if (!result) {
      return false
    }

    const { wall, t } = result

    // Создаём окно
    const windowId = generateWindowId()
    dispatch({
      type: 'ADD_WINDOW',
      window: {
        id: windowId,
        wallId: wall.id,
        position: t, // позиция вдоль стены от 0 до 1
        width: DEFAULT_WINDOW_SIZE.width,
        height: DEFAULT_WINDOW_SIZE.height,
        sillHeight: DEFAULT_WINDOW_SIZE.sillHeight,
        layerId: 'layer-openings',
      },
    })

    // Выделяем добавленное окно
    dispatch({
      type: 'SET_SELECTION',
      selection: { type: 'window', id: windowId },
    })

    return true
  }

  /**
   * Находит стену в точке клика
   */
  private static findWallAtPoint(
    point: Point,
    walls: Map<string, Wall>,
    nodes: Map<string, Node>
  ): { wall: Wall; t: number } | null {
    const threshold = 0.2 // 20 см

    for (const wall of walls.values()) {
      const startNode = nodes.get(wall.startNodeId)
      const endNode = nodes.get(wall.endNodeId)

      if (!startNode || !endNode) continue

      const result = closestPointOnSegment(point, startNode, endNode)
      
      const dx = result.point.x - point.x
      const dy = result.point.y - point.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance <= threshold) {
        return { wall, t: result.t }
      }
    }

    return null
  }
}

