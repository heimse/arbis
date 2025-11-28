// Инструмент для рисования стен

import type { Point, EditorState, Node } from '@/types/editor'
import { generateNodeId } from '@/lib/editor/utils'
import { distance, angleBetween } from '@/lib/editor/geometry'

export class WallTool {
  // Текущий угол для изменения через Ctrl/колесико
  private static currentAngleOffset: number = 0
  
  /**
   * Обработка клика при рисовании стены
   */
  static handleClick(
    position: Point,
    state: EditorState,
    dispatch: any
  ) {
    const { wallDrawingState, nodes } = state

    // Если это первый клик - начинаем рисование
    if (!wallDrawingState.isDrawing) {
      // Создаём первый узел
      const nodeId = this.createOrReuseNode(position, nodes, dispatch)
      
      // Начинаем рисование
      dispatch({ type: 'START_WALL_DRAWING' })
      dispatch({ type: 'ADD_WALL_NODE', nodeId })
      
      // Сбрасываем угол
      this.currentAngleOffset = 0
      
      return
    }

    // Если уже рисуем - добавляем следующий узел
    const lastNodeId = wallDrawingState.nodes[wallDrawingState.nodes.length - 1]
    const lastNode = nodes.get(lastNodeId)

    if (!lastNode) return

    // Проверяем, не кликнули ли мы на тот же узел (слишком близко)
    if (distance(position, lastNode) < 0.1) {
      return
    }

    // Создаём или используем существующий узел
    const newNodeId = this.createOrReuseNode(position, nodes, dispatch)

    // Создаём стену между последним узлом и новым
    dispatch({
      type: 'ADD_WALL',
      wall: {
        id: `wall-${Date.now()}-${Math.random()}`,
        startNodeId: lastNodeId,
        endNodeId: newNodeId,
        type: 'partition',
        thickness: 100,
        layerId: 'layer-walls',
      },
    })

    // Добавляем новый узел в цепочку
    dispatch({ type: 'ADD_WALL_NODE', nodeId: newNodeId })
    
    // Сбрасываем угол для следующей стены
    this.currentAngleOffset = 0
  }

  /**
   * Вычисляет снапнутую позицию с ортогональным углом
   */
  static getSnappedPosition(
    currentPos: Point,
    state: EditorState,
    isCtrlPressed: boolean = false
  ): Point {
    const { wallDrawingState, nodes, snapMode } = state

    if (!wallDrawingState.isDrawing || wallDrawingState.nodes.length === 0) {
      return currentPos
    }

    const lastNodeId = wallDrawingState.nodes[wallDrawingState.nodes.length - 1]
    const lastNode = nodes.get(lastNodeId)

    if (!lastNode) return currentPos

    // Если не зажат Ctrl - применяем ортогональный snap (по умолчанию)
    if (!isCtrlPressed && snapMode.toOrthogonal) {
      return this.snapToOrthogonal(lastNode, currentPos, wallDrawingState.nodes, nodes)
    }

    // Если зажат Ctrl - свободное рисование с текущим углом
    return currentPos
  }

  /**
   * Привязка к ортогональному углу (0°, 90°, 180°, 270°)
   */
  private static snapToOrthogonal(
    fromNode: Point,
    toPos: Point,
    nodeIds: string[],
    nodes: Map<string, Node>
  ): Point {
    const dx = toPos.x - fromNode.x
    const dy = toPos.y - fromNode.y
    const length = Math.sqrt(dx * dx + dy * dy)

    if (length < 0.01) return toPos

    // Если есть предыдущая стена, используем её направление для определения перпендикуляра
    if (nodeIds.length >= 2) {
      const prevNodeId = nodeIds[nodeIds.length - 2]
      const prevNode = nodes.get(prevNodeId)
      
      if (prevNode) {
        // Угол предыдущей стены
        const prevAngle = angleBetween(prevNode, fromNode)
        
        // Определяем, какой угол ближе: продолжение или перпендикуляр
        const currentAngle = Math.atan2(dy, dx)
        
        // Возможные углы: продолжение или ±90° от предыдущего
        const possibleAngles = [
          prevAngle, // продолжение
          prevAngle + Math.PI / 2, // перпендикуляр вправо
          prevAngle - Math.PI / 2, // перпендикуляр влево
          prevAngle + Math.PI, // назад
        ]

        // Находим ближайший угол
        let closestAngle = possibleAngles[0]
        let minDiff = Math.abs(this.normalizeAngle(currentAngle - possibleAngles[0]))

        for (const angle of possibleAngles) {
          const diff = Math.abs(this.normalizeAngle(currentAngle - angle))
          if (diff < minDiff) {
            minDiff = diff
            closestAngle = angle
          }
        }

        // Применяем смещение угла от колесика/Ctrl
        closestAngle += this.currentAngleOffset

        return {
          x: fromNode.x + length * Math.cos(closestAngle),
          y: fromNode.y + length * Math.sin(closestAngle),
        }
      }
    }

    // Для первой стены - просто 4 основных направления
    const angle = Math.atan2(dy, dx)
    const baseAngles = [0, Math.PI / 2, Math.PI, -Math.PI / 2]
    
    let closestAngle = baseAngles[0]
    let minDiff = Math.abs(this.normalizeAngle(angle - baseAngles[0]))

    for (const baseAngle of baseAngles) {
      const diff = Math.abs(this.normalizeAngle(angle - baseAngle))
      if (diff < minDiff) {
        minDiff = diff
        closestAngle = baseAngle
      }
    }

    // Применяем смещение угла
    closestAngle += this.currentAngleOffset

    return {
      x: fromNode.x + length * Math.cos(closestAngle),
      y: fromNode.y + length * Math.sin(closestAngle),
    }
  }

  /**
   * Нормализует угол в диапазон [-π, π]
   */
  private static normalizeAngle(angle: number): number {
    while (angle > Math.PI) angle -= 2 * Math.PI
    while (angle < -Math.PI) angle += 2 * Math.PI
    return angle
  }

  /**
   * Изменяет угол через колесико (для использования с Ctrl)
   */
  static adjustAngle(delta: number) {
    // Изменяем угол с шагом 15° (π/12 радиан)
    const step = Math.PI / 12
    this.currentAngleOffset += delta > 0 ? step : -step
    
    // Ограничиваем диапазон ±45°
    const maxOffset = Math.PI / 4
    this.currentAngleOffset = Math.max(-maxOffset, Math.min(maxOffset, this.currentAngleOffset))
  }

  /**
   * Сбрасывает смещение угла
   */
  static resetAngle() {
    this.currentAngleOffset = 0
  }

  /**
   * Получает текущее смещение угла (для визуализации)
   */
  static getCurrentAngleOffset(): number {
    return this.currentAngleOffset
  }

  /**
   * Завершение рисования стены (двойной клик или ESC)
   */
  static finishDrawing(dispatch: any) {
    dispatch({ type: 'FINISH_WALL_DRAWING' })
    this.currentAngleOffset = 0
  }

  /**
   * Отмена рисования стены
   */
  static cancelDrawing(dispatch: any) {
    dispatch({ type: 'CANCEL_WALL_DRAWING' })
    this.currentAngleOffset = 0
  }

  /**
   * Создаёт новый узел или использует существующий, если он рядом
   */
  private static createOrReuseNode(
    position: Point,
    nodes: Map<string, Node>,
    dispatch: any
  ): string {
    // Ищем существующий узел рядом
    const threshold = 0.2 // 20см - увеличено для лучшего соединения

    for (const node of nodes.values()) {
      if (distance(position, node) < threshold) {
        return node.id
      }
    }

    // Создаём новый узел
    const nodeId = generateNodeId()
    const node: Node = {
      id: nodeId,
      x: position.x,
      y: position.y,
      connectedWalls: [],
    }

    dispatch({ type: 'ADD_NODE', node })
    return nodeId
  }
}

