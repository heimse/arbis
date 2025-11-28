// Инструмент для добавления комнат (для editorStore)
// Комнаты создаются простым выделением области

import type { Point, EditorState } from '@/types/editor'
import { generateRoomId } from '@/lib/editor/utils'

export class RoomToolEditor {
  /**
   * Обработка завершения выделения области для создания комнаты
   */
  static handleSelectionFinish(
    startPoint: Point,
    endPoint: Point,
    state: EditorState,
    dispatch: any
  ): boolean {
    // Вычисляем границы выделенной области
    const minX = Math.min(startPoint.x, endPoint.x)
    const minY = Math.min(startPoint.y, endPoint.y)
    const maxX = Math.max(startPoint.x, endPoint.x)
    const maxY = Math.max(startPoint.y, endPoint.y)

    // Вычисляем размеры
    const width = maxX - minX
    const height = maxY - minY

    // Проверяем, что выделение достаточно большое
    if (width < 0.1 || height < 0.1) {
      // Слишком маленькое выделение - игнорируем
      return false
    }

    const roomId = generateRoomId()

    // Находим слой для комнат
    const roomLayer = state.layers.get('layer-rooms')
    const layerId = roomLayer?.id || 'layer-rooms'

    // Создаем полигон из прямоугольника
    const polygon: Point[] = [
      { x: minX, y: minY },
      { x: maxX, y: minY },
      { x: maxX, y: maxY },
      { x: minX, y: maxY },
      { x: minX, y: minY }, // Замыкаем полигон
    ]

    // Вычисляем площадь и периметр
    const area = width * height
    const perimeter = 2 * (width + height)

    // Создаем комнату на основе выделенной области
    dispatch({
      type: 'ADD_ROOM',
      room: {
        id: roomId,
        name: `Комната ${state.rooms.size + 1}`,
        position: {
          x: minX,
          y: minY,
        },
        size: {
          width: width,
          height: height,
        },
        rotation: 0,
        layerId: layerId,
        polygon: polygon, // Сохраняем полигон для правильного рендеринга
      },
    })

    // Выделяем добавленную комнату
    dispatch({
      type: 'SET_SELECTION',
      selection: { type: 'room', id: roomId },
    })

    console.log(
      `Комната создана: площадь ${area.toFixed(2)} м², периметр ${perimeter.toFixed(2)} м`
    )

    return true
  }

  /**
   * Обработка клика для добавления комнаты (старый способ, оставлен для совместимости)
   */
  static handleClick(
    position: Point,
    state: EditorState,
    dispatch: any
  ): boolean {
    // При простом клике создаем комнату с дефолтным размером
    const DEFAULT_SIZE = { width: 4, height: 3 }
    const startPoint: Point = {
      x: position.x - DEFAULT_SIZE.width / 2,
      y: position.y - DEFAULT_SIZE.height / 2,
    }
    const endPoint: Point = {
      x: position.x + DEFAULT_SIZE.width / 2,
      y: position.y + DEFAULT_SIZE.height / 2,
    }
    return this.handleSelectionFinish(startPoint, endPoint, state, dispatch)
  }
}

